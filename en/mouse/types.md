# Parameter types

## Create mouse instance {#create-mouse-instance}

Constructor options and HID filters.

| Type | Field | Description |
|---|---|---|
| `MouseOptions` | `configs` | `HidFilterConfig[]`; must include target VID/PID |
| | `packetSize?` | Chunk size; wired default `0x38`, 2.4G use `0x18` |
| `HidFilterConfig` | `vendorId` / `productId` | USB VID / PID |
| | `usagePage?` / `usage?` | Commonly `0xff00` / `1` |

| Option | When to use |
|---|---|
| `packetSize: 0x38` | Wired (default) |
| `packetSize: 0x18` | 2.4G dongle |

---

## Authorized HID devices

`HidDeviceInfo`, from `getDevices()` / `init()`.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `vid:pid:productName` |
| `productName` | `string?` | Product name |
| `vendorId` | `number` | VID |
| `productId` | `number` | PID |
| `opened` | `boolean` | Whether the device is open |

---

## USB connect/disconnect events

`UsbChangePayload`, callback argument for `on('usbChange')`.

| Field | Type | Description |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | Connected / disconnected |
| `device` | `HIDDevice?` | Browser HID object |

---

## Information area (device capabilities)

`DeviceInfo`, see [Basic device information](./api/info).

| Field | Type | Description |
|---|---|---|
| `vendorId` / `productId` | `number` | USB identity |
| `firmwareVer` | `number` | Firmware version |
| `protocolVer` | `number` | Protocol version field |
| `profile` | `number` | Profile slot |
| `keyboardID` / `keyboardType` | `number` | Model / type |
| `keyMatrixSize` | `number` | Key matrix size |
| `macroSize` | `number` | Macro space units (×256 bytes) |
| `showLight` / `lightSize` / `lightMaxBrightness` / `lightMaxSpeed` / `lightKeySize` | — | Lighting capabilities |
| `sensorModel` | `number` | Sensor model |
| `reportRateMax` | `number` | Report rate limit code |
| `dpiGroupMax` | `number` | DPI group limit |

---

## Function area (runtime configuration) {#mousefuncinfo}

`MouseFuncInfo`, see [Global settings](./api/globalSetting) / [Performance / DPI](./api/performance).

| Field | Type | Description |
|---|---|---|
| `profile` | `number` | Profile slot |
| `light` | Lighting state | On/off, mode, brightness, speed, RGB, etc. |
| `reportRate` | `1000 \| 500 \| 250 \| 125` | Report rate in Hz |
| `dpiLevel` | `number` | Current DPI step (0-based) |
| `lodHeight` | `1 \| 2` | LOD in mm |
| `scanDelay` | `number` | Debounce in ms |
| `sleepTime` / `deepSleepTime` | `number` | Primary / secondary sleep (seconds) |
| `dpiGroups` | DPI group array | Up to 8 groups |

### Lighting state

| Field | Type | Description |
|---|---|---|
| `on` | `boolean` | On/off |
| `mode` / `brightness` / `speed` | `number` | Mode / brightness / speed |
| `mix` / `colour` / `define` | `number` | Mix / palette / custom index |
| `r` / `g` / `b` | `number` | RGB |

### DPI group

| Field | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Whether enabled |
| `xySeparate` | `boolean` | Separate X/Y |
| `dpiX` / `dpiY` | `number` | X / Y DPI |
| `color` | `{ r, g, b }` | Indicator color |

### Writing DPI

`setDpi` input:

| Field | Type | Description |
|---|---|---|
| `level` | `number` | Current step |
| `groups` | DPI group array | Group list |

---

## Key remapping

| Type | Purpose |
|---|---|
| `KeyEntry` | `getKeymap` item: `index` / `layer` / `type` / `code1` / `code2` |
| `SetKeyInput` | `setKey` input: `type` / `code1` / `code2` |

Keycode meanings: [Keycodes](./keycodes).

---

## Macros

| Type | Purpose |
|---|---|
| `MacroProfile` | Macro slot: `key` / `name?` / `list` (`type` / `replayCnt` are compatibility fields; not written to buffer) |
| `MacroAction` | Action: `keyboard` (`code`) or `mouse` (`button`), plus `down` / `delayMs` |

```ts
type MacroAction =
  | { type: 'keyboard'; code: number; down: boolean; delayMs: number }
  | { type: 'mouse'; button: number; down: boolean; delayMs: number }
```

---

## Battery status

`BatteryStatus`, see [Global settings · Read battery status](./api/globalSetting#getbatterystatus).

| Field | Type | Description |
|---|---|---|
| `batteryPercent` | `number` | 0–100 |
| `chargeFlag` | `number` | Charge flag |
| `online` | `boolean` | `true` when read succeeded |

---

## 2.4G / RF status

`RfStatus`, see [Global settings · Query 2.4G status](./api/globalSetting#getrfstatus).

| Field | Type | Description |
|---|---|---|
| `status` | `number` | 0 default / 1 idle / 2 pairing / 3 reconnecting / 4 connected / 5 sleep |
| `vendorId` | `number` | Wireless device VID |
| `productId` | `number` | Wireless device PID |
| `keyboardNum` | `number` | Number of connected devices |
| `connected` | `boolean` | `status === 4` |

---

## Firmware upgrade {#firmware-upgrade}

Wired mouse shares types from `@rdmctmzt/sdk-keyboard` with the keyboard; see [Firmware upgrade](./api/upgrade).

| Type | Description |
|---|---|
| `KeyboardFirmwareUpgradeOptions` | Upgrade constructor: `vendorId`, `productId`, `firmware`, `onProgress` |
| `FirmwareUpgradeProgress` | Progress: `percent`, `message` |
