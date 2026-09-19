# Parameter types

## Create keyboard instance {#create-keyboard-instance}

`KeyboardOptions` / `HidFilterConfig`

```ts
type KeyboardOptions = {
  configs: HidFilterConfig[]
  /** Chunk size: wired 0x38, 2.4G 0x18 */
  packetSize?: number
}

type HidFilterConfig = {
  vendorId: number
  productId: number
  usagePage?: number
  usage?: number
}
```

| Option | When to use |
|---|---|
| `packetSize: 0x38` | Wired (default) |
| `packetSize: 0x18` | 2.4G receiver / wireless dongle |

---

## Authorized HID devices

`HidDeviceInfo`. `getDevices()` returns an array; on successful `init()` the device is in `device`; `getCurrentDevice()` is `null` when not open.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `vid:pid:productName`, passed to `init(id)` |
| `productName` | `string?` | Product name |
| `vendorId` | `number` | USB VID |
| `productId` | `number` | USB PID |
| `opened` | `boolean` | Whether currently open |

`init()` returns `{ success: boolean, device: HidDeviceInfo \| null }`, not a standalone device object.

---

## USB connect/disconnect events

`UsbChangePayload`. `on('usbChange', listener)` / `off('usbChange', listener)` have no return value. The `listener` receives the object below.

| Field | Type | Description |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | `connect` attached, `disconnect` removed |
| `device` | `HIDDevice?` | Browser HID device; may be absent on disconnect |

After `disconnect`, cache is cleared; call `getDevices()` / `init()` again.

---

## Information area (device capabilities)

`DeviceInfo`. `getDeviceInfo()` returns `Promise<DeviceInfo>`, CMD `0x12`. Without a prior read, `getCachedDeviceInfo()` returns `null`.

When hardware is absent, capability bits are `false` and counts/limits are `0`. See [Device information](./api/info) for usage.

### Identity

| Field | Type | Description |
|---|---|---|
| `vendorId` | `number` | USB VID |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | Firmware version |
| `protocolVer` | `number` | Protocol version `1–4`. Drives command table and how function/information extensions are parsed |
| `profile` | `number` | Current onboard profile slot |
| `keyboardID` | `number` | Keyboard model ID |
| `keyboardType` | `number` | Keyboard type |

### Capacity

| Field | Type | Description |
|---|---|---|
| `keyMatrixSize` | `number` | Key matrix size |
| `macroSize` | `number` | Macro space units. Byte size is `macroSize × 256`. When `0`, SDK uses 1096 bytes |

### Backlight

| Field | Type | Description |
|---|---|---|
| `showLight` | `boolean` | Has backlight |
| `lightSize` | `number` | Number of backlight effect modes |
| `lightMaxBrightness` | `number` | Backlight brightness cap |
| `lightMaxSpeed` | `number` | Backlight speed cap. Function-area speed is `cap - raw firmware value` |
| `lightKeySize` | `number` | Keys with per-key color control. Custom colors need this > `0` |

### LOGO light

| Field | Type | Description |
|---|---|---|
| `showLogoLight` | `boolean` | Has LOGO light |
| `logoLightModeSize` | `number` | LOGO effect mode count |
| `logoLigthSize` | `number` | LOGO LED count. Field name matches firmware spelling, not `Light` |
| `logoLightMaxBrightness` | `number` | LOGO brightness cap |
| `logoLightMaxSpeed` | `number` | LOGO speed cap; same conversion as backlight |
| `logoLightSupportMusic` | `boolean` | LOGO supports music rhythm |

### Side light

| Field | Type | Description |
|---|---|---|
| `showLightSideLight` | `boolean` | Has side light |
| `sideLightModeSize` | `number` | Side light mode count |
| `sideLightSize` | `number` | Side LED count |
| `sideLightMaxBrightness` | `number` | Side brightness cap |
| `sideLightMaxSpeed` | `number` | Side speed cap; same conversion as backlight |
| `sideLightSupportMusic` | `boolean` | Side light supports music rhythm |

### Matrix screen / encoder / LCD

| Field | Type | Description |
|---|---|---|
| `matrixScreen` | `boolean` | Has matrix screen |
| `matrixScreenLightSize` | `number` | Matrix effect mode count |
| `matrixScreenLightRows` | `number` | Matrix rows |
| `matrixScreenLightColumns` | `number` | Matrix columns |
| `matrixScreenLightMaxBrightness` | `number` | Matrix brightness cap |
| `matrixScreenLightMaxSpeed` | `number` | Matrix speed cap |
| `matrixScreenLightMaxFrames` | `number?` | Max frames for dynamic custom. Omitted when not supported |
| `matrixScreenHasGif` | `boolean?` | Matrix GIF support, often protocol 4. Omitted when not supported |
| `matrixScreenGifMaxFrames` | `number?` | Max GIF frames. Omitted when not supported |
| `encoder` | `boolean` | Has encoder |
| `isLed` | `boolean` | Has LCD |

---

## Function area (runtime configuration)

`FuncInfo`

Current runtime config from CMD `0x14`/`0x15`. Full field list: [Function area](./api/func).

| Group | Fields |
|---|---|
| Profile | `profile` |
| Backlight | `lightSwitch` `lightMode` `lightBrightness` `lightSpeed` `lightMixColor` `lightColorIndex` `lightRValue` `lightGValue` `lightBValue` `lightCustomIndex` |
| LOGO | `logoLight*` |
| Side | `sideLight*` |
| Matrix | `matrixScreenLight*` |
| Performance | `sixKeysOrAllKeys` `maxOrWin` `winLock` `keyWasd` `scanDelay` `layerDefault` `fSwitch` `wheelDefaultMode` `sleepTime` `deepSleepTime` `snapTap` `numLockMode` `hourType` |
| LCD | `lcdScreenLightSwitch` `lcdScreenLightMode` `lcdScreenLightBrightness` `lcdScreenMaxGif` `lcdScreenLanguage` `lcdScreenUsbEnum` |
| Extended | `initDynamicSum` `initMeetingSum` `matrixLtGifCount` |

**Units**

- Speed fields: SDK exposes user values (`maxSpeed - raw`)
- `sleepTime` / `deepSleepTime`: **seconds**
- RGB colors: `0–255`

---

## Key table entry / remap input

`KeyEntry` / `SetKeyInput`

```ts
type KeyEntry = {
  index: number  // key index 0–127
  layer: number  // layer 0–3
  type: number
  code1: number
  code2: number
}

/** setKey write needs only the three key bytes */
type SetKeyInput = {
  type: number
  code1: number
  code2: number
}
```

Key meanings: [Keycode table](./keycodes).

---

## Macro slots and actions

`MacroProfile` / `MacroAction`

```ts
type MacroAction =
  | { type: 'keyboard'; code: number; down: boolean; delayMs: number }
  | { type: 'mouse'; button: number; down: boolean; delayMs: number }

type MacroProfile = {
  key: number          // slot 0–15
  name?: string        // display name; not stored on device; SDK fills M0/M1… on read
  type?: number        // compatibility; default 0 on read, not written to macro buffer
  replayCnt?: number   // compatibility; default 1 on read, not written to macro buffer
  list: MacroAction[]
}
```

| Field | Description |
|---|---|
| `key` | Macro slot. Remap binding uses `code1` for this slot |
| `list` | Action sequence; `MacroAction.type` is `'keyboard'` / `'mouse'` |
| `type` / `replayCnt` | Compatibility fields, **not in macro buffer**. Loop/count on remap side: `0x60` (`code2`=0/1/3) or `0x61` (`code2`=count) |

Mouse `button`: `1` left / `2` right / `4` middle / `8` back / `16` forward. Playback types: [Macros](./api/macro#macro-type-remap).

---

## Lighting speed caps

`SpeedCaps`

```ts
type SpeedCaps = Pick<
  DeviceInfo,
  'lightMaxSpeed' | 'logoLightMaxSpeed' | 'sideLightMaxSpeed'
>
```

Used internally for function-area speed conversion; rarely needed directly.

---

## Battery status

`BatteryStatus`

```ts
type BatteryStatus = {
  batteryPercent: number // 0–100
  chargeFlag: number
  online: boolean
}
```

See [Other APIs · Read battery](./api/misc#getbatterystatus).

---

## 2.4G / RF status

`RfStatus`

```ts
type RfStatus = {
  status: number // 0–5; 4 = connected
  vendorId: number // wireless keyboard VID
  productId: number // wireless keyboard PID
  keyboardNum: number
  connected: boolean
}
```

See [Other APIs · getRfStatus](./api/misc#getrfstatus).

---

## Encoder key indices

`EncoderWheelData`

```ts
type EncoderWheelData = {
  left: number
  center: number
  right: number
}
```

See [Encoder](./api/encoder).

---

## Rhythm / matrix color options

`MusicRhythmOptions` / `MatrixColorOptions`

```ts
type MusicRhythmOptions = {
  ledCount?: number
  startOffset?: number
  keepSession?: boolean
}

type MatrixColorOptions = {
  rgb?: boolean       // default true
  frameCount?: number // default 1
}
```

---

## LCD-related types

See [LCD](./api/lcd). Common exports:

| Type | Description |
|---|---|
| `LcdScreenOptions` | Construct `LcdScreen`: `configs` / `chunkSize` / `qgifBaseUrl` |
| `LcdScreenHidInfo` | Screen HID device info (same shape as keyboard side) |
| `LcdScreenSize` | `getScreenSize()`: width/height, `maxScreen`, firmware version |
| `LcdScreenFuncInfo` | `getScreenFuncInfo()` |
| `LcdConnectStatus` | `getConnectStatus()` / heartbeat: `connectStatus`, `ok` |
| `LcdTransferProgress` | Upload progress: `phase`, `percentage`, etc. |
| `LcdUploadImageOptions` | `uploadImage` options: dimensions, fps, `onProgress` |
| `ImageInput` | `File` / `Blob` / `ArrayBuffer` / `Uint8Array` / URL string |
| `ConvertImageOptions` | `convertImage` / `convertImageToQgif` options |

Advanced: `convertImageToQgif` / `loadQgifModule` (usually use `LcdScreen.uploadImage`).

---

## Firmware upgrade {#firmware-upgrade}

See [Firmware upgrade](./api/upgrade).

| Type | Description |
|---|---|
| `KeyboardFirmwareUpgradeOptions` | Construct upgrader: `vendorId`, `productId`, `firmware`, `onProgress` |
| `FirmwareUpgradeProgress` | Progress: `percent`, `message` |
