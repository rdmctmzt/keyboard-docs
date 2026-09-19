# LCD

LCD has two layers — do not mix device endpoints:

| Layer | Device | SDK | Role |
|---|---|---|---|
| Keyboard AP | Keyboard HID | `ServiceKeyboard` | Function-area LCD fields, screen USB enum on/off, sync notifications |
| Screen HID | Separate screen port (often `0x1919`) | `LcdScreen` | Read size, sync time, convert and upload images |

Recommended order: `lightOn()` → `LcdScreen.init()` → `startHeartbeat()` → `uploadImage(file)`.

## Notes

| Condition | Description |
|---|---|
| `info.isLed === true` | Do not follow this page on models without LCD |
| Two HIDs | Keyboard and screen are **different devices**; screen content cannot use keyboard AP |
| Call `lightOn()` first | After screen USB enumeration is on, `LcdScreen.getDevices()` / `init()` work |
| **Heartbeat required** | After `init`, call `startHeartbeat()` (~10s, CMD `0x1c`); long idle may drop screen session |
| During upload | SDK auto `suspendHeartbeat` / `resumeHeartbeat`; do not flood other screen commands in parallel |
| `protocolVer ≥ 2` | Keyboard-side `lightOn` / `lightOff` / `syncLcdGif` depend on protocol version |

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.isLed) throw new Error('This model has no LCD')
```

---

## Full workflow

```js
import Keyboard, { LcdScreen } from '@rdmctmzt/sdk-keyboard'

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId: 0x0000, productId: 0x0000, usagePage: 0xff00, usage: 1 }],
})

// 1. Connect keyboard
const kbDevices = await ServiceKeyboard.getDevices()
await ServiceKeyboard.init(kbDevices[0].id)
await ServiceKeyboard.getDeviceInfo()

// 2. Enable screen USB enumeration (keyboard side)
await ServiceKeyboard.lightOn()

// 3. Connect separate screen port
const lcd = new LcdScreen({
  // Optional: when site hosts WASM
  // qgifBaseUrl: '/vendor/qgif/',
})
const lcdDevices = await lcd.getDevices()
await lcd.init(lcdDevices[0].id)

// 4. Heartbeat (keep screen session)
lcd.startHeartbeat({
  intervalMs: 10000,
  onFail: (err) => console.warn('lcd heartbeat', err),
})

// 5. Read screen info / sync time
const size = await lcd.getScreenSize()
console.log(size.width, size.height, size.maxScreen)
await lcd.syncTime()

// 6. Upload image — SDK converts to QGIF and writes
await lcd.uploadImage(fileInput.files[0], {
  onProgress: (p) => console.log(p.phase, p.percentage),
})

// 7. Teardown
lcd.stopHeartbeat()
await lcd.close()
await ServiceKeyboard.lightOff()
```

Keyboard side must call `ServiceKeyboard.init()` first.

---

## Write function-area LCD fields

`ServiceKeyboard.setLcd(patch)`

Merges LCD-related function-area fields; equivalent to `patchFuncInfo` on the same fields.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.lcdScreenLightSwitch` | `boolean?` | Switch; `true` = on |
| `patch.lcdScreenLightMode` | `number?` | Display mode |
| `patch.lcdScreenLightBrightness` | `number?` | Usually brightness; some layouts use GIF index |
| `patch.lcdScreenMaxGif` | `number?` | GIF frame count / capacity |
| `patch.lcdScreenLanguage` | `number?` | Language index |
| `patch.lcdScreenUsbEnum` | `boolean?` | Enumerate as separate USB device |

### Returns

`Promise<FuncInfo>`

### Example

```js
await ServiceKeyboard.setLcd({
  lcdScreenLightSwitch: true,
  lcdScreenLightMode: 1,
  lcdScreenLightBrightness: 3,
  lcdScreenMaxGif: 4,
  lcdScreenLanguage: 0,
  lcdScreenUsbEnum: true,
})

// Equivalent
await ServiceKeyboard.patchFuncInfo({
  lcdScreenLightSwitch: true,
  lcdScreenLightMode: 1,
})
```

---

## Enable screen USB enumeration

`ServiceKeyboard.lightOn()`

Sends CMD `0xe0` (V2+) so the screen enumerates as a separate USB device for `LcdScreen`.

### Parameters

None.

### Returns

`Promise<boolean>`

### Example

```js
const ok = await ServiceKeyboard.lightOn()
```

---

## Disable screen USB enumeration

`ServiceKeyboard.lightOff()`

Sends CMD `0xe1` (V2+) to disable separate screen USB enumeration.

### Parameters

None.

### Returns

`Promise<boolean>`

### Example

```js
await ServiceKeyboard.lightOff()
```

---

## Query screen online status

`ServiceKeyboard.checkLcdStatus()`

Queries keyboard-side LCD online state.

### Parameters

None.

### Returns

`Promise<{ online: boolean }>`

### Example

```js
const { online } = await ServiceKeyboard.checkLcdStatus()
if (!online) {
  await ServiceKeyboard.lightOn()
}
```

---

## Sync GIF notification

`ServiceKeyboard.syncLcdGif()`

Sends CMD `0xe3` on keyboard side only; **does not** write image data to the screen.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceKeyboard.syncLcdGif()
```

### Notes

Throws when protocol version is insufficient; full upload still requires `LcdScreen.uploadImage` and other screen-side APIs.

---

## Create screen client

`new LcdScreen(options?)`

Constructs separate screen HID client; upload depends on bundled or site-hosted QGIF WASM.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.configs` | `{ vendorId, productId, usagePage?, usage? }[]` | `0x1919` / MSI `0x0db0` | Screen HID filter |
| `options.chunkSize` | `number` | `56` | Flash write chunk size |
| `options.qgifBaseUrl` | `string` | Package `assets/` | Directory URL for `qgif.js` / `qgif.wasm` |

### Returns

`LcdScreen` instance.

### Example

```js
const lcd = new LcdScreen()

const lcd2 = new LcdScreen({
  configs: [{ vendorId: 0x1919, productId: 0x1919 }],
  chunkSize: 56,
  qgifBaseUrl: '/vendor/qgif/',
})
```

---

## List screen HID devices

`lcd.getDevices()`

Filters WebHID device list by constructor `configs`.

### Parameters

None.

### Returns

`Promise<{ id, productName?, vendorId, productId, opened }[]>`

### Example

```js
const devices = await lcd.getDevices()
```

---

## Connect screen port

`lcd.init(id?)`

Opens the given screen HID; omit `id` to use the first from `getDevices()`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `string?` | WebHID device id |

### Returns

`Promise<{ success, device }>`

### Example

```js
const devices = await lcd.getDevices()
const { success, device } = await lcd.init(devices[0].id)
if (!success) throw new Error('lcd init failed')
```

---

## Disconnect screen port

`lcd.close()`

Closes the screen HID session.

### Parameters

None.

### Returns

`void`

### Example

```js
await lcd.close()
```

---

## Start heartbeat

`lcd.startHeartbeat(options?)`

Periodically sends screen CMD `0x1c` (`getConnectStatus`) to keep session; **required** when holding the screen port for a long time.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.intervalMs` | `number?` | `10000` | Interval; ~10s matches driver |
| `options.maxFails` | `number?` | `2` | Consecutive failures before `onFail` |
| `options.onFail` | `(error) => void` | — | Callback on consecutive failure |

### Returns

`void`

### Example

```js
lcd.startHeartbeat({
  intervalMs: 10000,
  onFail: (err) => console.warn(err),
})
```

### Notes

Avoid other screen commands competing with the heartbeat interval.

---

## Stop heartbeat

`lcd.stopHeartbeat()`

Stops the timer started by `startHeartbeat`.

### Parameters

None.

### Returns

`void`

### Example

```js
lcd.stopHeartbeat()
```

---

## Suspend heartbeat

`lcd.suspendHeartbeat()`

Pauses heartbeat timer; SDK calls this automatically during large erase/write.

### Parameters

None.

### Returns

`void`

### Example

```js
lcd.suspendHeartbeat()
```

---

## Resume heartbeat

`lcd.resumeHeartbeat()`

Resumes paused heartbeat; SDK calls this after upload completes.

### Parameters

None.

### Returns

`void`

### Example

```js
lcd.resumeHeartbeat()
```

---

## Upload one image

`lcd.uploadImage(input, options?)`

Accepts PNG / JPG / GIF (`File` | `Blob` | `ArrayBuffer` | `Uint8Array` | URL string); SDK scales, encodes QGIF, writes Flash.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `input` | `File \| Blob \| ArrayBuffer \| Uint8Array \| string` | Image or GIF; string is fetchable URL |
| `options.width` | `number?` | Target width; default `getScreenSize().width` |
| `options.height` | `number?` | Target height; default `getScreenSize().height` |
| `options.fps` | `number?` | Static frame rate, default `20`; GIF uses delay estimate |
| `options.onProgress` | `(p) => void` | Progress callback |

Common `p.phase` values: `converting` → `initializing` → `preparing` → `erasing` → `transferring` → `finalizing` → `completed`; also `currentScreen`, `totalScreens`, `bytesTransferred`, `totalBytes`, `percentage`.

### Returns

`Promise<void>`

### Example

```js
await lcd.uploadImage(fileInput.files[0], {
  onProgress: (p) => {
    console.log(p.phase, p.percentage, p.currentScreen, p.totalScreens)
  },
})

await lcd.uploadImage(file, {
  width: 240,
  height: 320,
  fps: 20,
})

await lcd.uploadImage('https://example.com/cover.png')
```

---

## Upload multiple slots

`lcd.uploadImages(inputs, options?)`

Uploads slots in order; `null` / `undefined` slots are skipped.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `inputs` | `(ImageInput \| null \| undefined)[]` | Images per slot |
| `options` | Same as `uploadImage` | Width, height, fps, progress |

### Returns

`Promise<void>`

### Example

```js
await lcd.uploadImages([file0, null, file2], {
  onProgress: (p) => console.log(p.phase, p.percentage),
})
```

---

## Convert only (no device write)

`lcd.convertImage(input, options?)`

Converts image to QGIF binary locally without writing Flash.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `input` | Same as `uploadImage` | Image or GIF |
| `options.width` / `height` / `fps` | `number?` | Same as `uploadImage` |

### Returns

`Promise<Uint8Array>` (QGIF)

### Example

```js
const qgif = await lcd.convertImage(file, { width: 240, height: 320 })
await lcd.downloadQgif([qgif])
```

---

## Read screen size

`lcd.getScreenSize()`

Reads firmware version, resolution, max screens, etc.

### Parameters

None.

### Returns

`Promise<{ firmwareVersion: number, width: number, height: number, maxScreen: number }>`

### Example

```js
const size = await lcd.getScreenSize()
```

---

## Read screen capabilities

`lcd.getScreenFuncInfo()`

Reads screen-side function state (e.g. upgrade status).

### Parameters

None.

### Returns

`Promise<{ upgradeStatus: number }>`

### Example

```js
const info = await lcd.getScreenFuncInfo()
```

---

## Sync time

`lcd.syncTime(date?)`

Writes system time to the screen clock.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `date` | `Date?` | Default `new Date()` |

### Returns

`Promise<void>`

### Example

```js
await lcd.syncTime()
await lcd.syncTime(new Date('2026-09-16T12:00:00'))
```

---

## Query connection status

`lcd.getConnectStatus()`

Queries screen HID connection; heartbeat also uses CMD `0x1c`.

### Parameters

None.

### Returns

`Promise<{ connectStatus: number, ok: boolean }>`

### Example

```js
const status = await lcd.getConnectStatus()
```

---

## Download existing QGIF

`lcd.downloadQgif(bins, onProgress?)`

When QGIF binary already exists, erase/write Flash directly, skipping `convertImage`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `bins` | `(Uint8Array \| number[])[]` | One QGIF per slot |
| `onProgress` | `(p) => void` | Optional; same fields as `uploadImage` progress |

### Returns

`Promise<void>`

### Example

```js
const bin0 = await lcd.convertImage(file0)
const bin1 = await lcd.convertImage(file1)
await lcd.downloadQgif([bin0, bin1], (p) => {
  console.log(p.phase, p.percentage)
})
```

---

## qgif WASM

Package includes `assets/qgif.js` + `assets/qgif.wasm`. Default resolution uses `import.meta.url`.

If bundling fails to load, copy `assets` to your site and set the path:

```js
const lcd = new LcdScreen({
  qgifBaseUrl: '/vendor/qgif/', // directory must contain qgif.js, qgif.wasm
})
```
