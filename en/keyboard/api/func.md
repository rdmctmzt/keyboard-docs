# Function area

The function area maps to driver `getFuncInfo` / `setFuncInfo` (CMD `0x14` / `0x15`). It is the unified read/write entry for the keyboard’s **current runtime configuration**: backlight / LOGO / side light, NKRO, Win lock, sleep, LCD, and more.

Convenience APIs for lighting, performance, etc. all change these fields and then write the full packet back.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer `getDeviceInfo()` first | Use `protocolVer` / speed limits for conversion and packet layout |
| **Read before write** | `setFuncInfo` / `patchFuncInfo` only change fields you pass; other bytes stay as last read from `getFuncInfo` — switches at `0` are not rewritten to `1` |
| Model differences | Side light / matrix / LCD / encoder fields may be meaningless without hardware; follow information-area capability bits |
| Speed fields | APIs take converted user values; do not compute `max - x` yourself |

```js
await ServiceKeyboard.getDeviceInfo()
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.patchFuncInfo({ lightBrightness: 4 })
```

---

## Read function area

`ServiceKeyboard.getFuncInfo()`

Reads the full function-area configuration from the device (CMD `0x14`).

### Parameters

None.

### Returns

`Promise<FuncInfo>` — fields in [Field reference](#field-reference) below.

### Example

```js
await ServiceKeyboard.getDeviceInfo()
const func = await ServiceKeyboard.getFuncInfo()
```

---

## Write full function area

`ServiceKeyboard.setFuncInfo(data)`

Uses the last read function area as base and overwrites only fields that changed vs the last read (CMD `0x15`). Reads first if never read. Unchanged bytes (including switches at `0`) are written back as-is.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `data` | `FuncInfo` | Fields to write. Fields equal to last read do not change device bytes |

### Returns

`Promise<FuncInfo>` — complete object after write.

### Example

```js
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.setFuncInfo({
  ...func,
  lightBrightness: 4,
  winLock: 1,
})
```

---

## Patch function area fields

`ServiceKeyboard.patchFuncInfo(patch)`

Pass only fields to change; SDK merges with current cache then writes the full packet — recommended for daily use.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch` | `Partial<FuncInfo>` | Only fields to change |

### Returns

`Promise<FuncInfo>` — complete `FuncInfo` after write.

### Example

```js
await ServiceKeyboard.patchFuncInfo({
  lightBrightness: 4,
  winLock: 1,
})

// Backlight (equivalent to setBacklight)
await ServiceKeyboard.patchFuncInfo({
  lightSwitch: 1,
  lightMode: 2,
  lightBrightness: 4,
  lightSpeed: 3,
  lightMixColor: 1,
  lightColorIndex: 0,
  lightRValue: 255,
  lightGValue: 0,
  lightBValue: 0,
})

// LOGO / side light
await ServiceKeyboard.setLogoLight({
  logoLightSwitch: 1,
  logoLightMode: 1,
  logoLightBrightness: 3,
  logoLightSpeed: 2,
})
await ServiceKeyboard.setSideLight({
  sideLightSwitch: 1,
  sideLightMode: 1,
  sideLightBrightness: 3,
})

// Performance / system
await ServiceKeyboard.setPerformance({
  sixKeysOrAllKeys: 1,
  maxOrWin: 0,
  winLock: 1,
  keyWasd: 0,
  scanDelay: 0,
  layerDefault: 0,
  fSwitch: false,
  wheelDefaultMode: 0,
  sleepTime: 300,
  deepSleepTime: 1800,
  snapTap: true,
})

// Matrix screen / LCD (function-area fields)
await ServiceKeyboard.setMatrixScreen({
  matrixScreenLightSwitch: true,
  matrixScreenLightMode: 2,
  matrixScreenLightBrightness: 4,
})
await ServiceKeyboard.setLcd({
  lcdScreenLightSwitch: true,
  lcdScreenLightMode: 1,
  lcdScreenLightBrightness: 3,
  lcdScreenMaxGif: 4,
  lcdScreenLanguage: 0,
  lcdScreenUsbEnum: true,
})

// Change multiple categories at once
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.setFuncInfo({
  ...func,
  lightSwitch: 1,
  lightBrightness: 4,
  logoLightSwitch: 1,
  sixKeysOrAllKeys: 1,
  winLock: 0,
  sleepTime: 600,
  lcdScreenLightSwitch: true,
})
```

---

## Read cached function area

`ServiceKeyboard.getCachedFuncInfo()`

Returns the SDK in-memory function-area cache from the last read/write; no device command.

### Parameters

None.

### Returns

`FuncInfo | null`; `null` if never read.

### Example

```js
import Keyboard from '@rdmctmzt/sdk-keyboard'

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId: 0x0000, productId: 0x0000, usagePage: 0xff00, usage: 1 }],
})

const devices = await ServiceKeyboard.getDevices()
await ServiceKeyboard.init(devices[0].id)
await ServiceKeyboard.getDeviceInfo()

await ServiceKeyboard.getFuncInfo()
const cached = ServiceKeyboard.getCachedFuncInfo()
```

### Notes

Custom lighting requires `applyUserLightSlot(id)` first, then per-key colors; see [Lighting · switch to custom light slot](./lighting#custom-light-slot).

---

## Layout selection

| Condition | Layout |
|---|---|
| `protocolVer === 1` | V1 single packet (~41 bytes) |
| `protocolVer === 2` or `3` | Standard 64-byte function area; indices **0–51** match V4, **52+** is V2/V3 LCD region (below) |
| `protocolVer ≥ 4` | Same 64-byte packet read/write; **0–51** same as V2/V3, **52+** is V4 LCD / Snap / matrix GIF tail (**different** from V2/V3) |

> V2, V3, and V4 function-area protocols differ on **LCD and following fields** (per RDMCTMZT driver protocol V3.0 / V4.0). The SDK still exposes unified `FuncInfo` and encodes/decodes the tail by `protocolVer`; call `getDeviceInfo()` before read/write.

### Index reference (protocol · function info format)

| Index | V2 / V3 | V4 |
|---|---|---|
| `0–51` | Profile / backlight / LOGO / side / matrix effects / performance / sleep (same on all three) | Same |
| `52` | LCD power | LCD power |
| `53` | LCD mode | LCD mode |
| `54` | LCD animation index | LCD animation index |
| `55` | LCD language | **LCD max GIF frames** |
| `56` | LCD USB enumeration | **LCD language** |
| `57` | Reserved | **LCD USB enumeration** |
| `58` | Reserved | **Snap Tap** |
| `59` | Reserved / extension (driver often matrix dynamic count) | **Matrix GIF count** |
| `60–63` | Reserved / extension | Reserved / extension |

SDK field mapping (unified `FuncInfo`, matches driver):

| SDK field | Typical buffer index | Description |
|---|---|---|
| `lcdScreenLightSwitch` / `Mode` / `Brightness` | `52` / `53` / `54` | Brightness on some models means LCD GIF index |
| `lcdScreenLanguage` | `55` | — |
| `lcdScreenUsbEnum` | `56` | — |
| `snapTap` | `57` | V4 protocol table at `58`; driver/SDK read/write at `57` |
| `lcdScreenMaxGif` | `58` | V4 protocol table at `55`; driver/SDK at `58` |
| `initDynamicSum` / `initMeetingSum` | `59` / `60` | **V2/V3**: matrix dynamic / welcome counts |
| `matrixLtGifCount` | `59` | **V4**: matrix GIF count (shares byte semantics with `initDynamicSum`) |

---

## Speed conversion (matches driver)

Read: `converted = lightMaxSpeed - firmware raw`  
Write: SDK converts back to firmware value.  
Same for `lightSpeed` / `logoLightSpeed` / `sideLightSpeed`. Pass converted values to APIs; do not compute `max - x` again.

---

## Field reference {#field-reference}

### Profile

| Field | Type | Description |
|---|---|---|
| `profile` | `number` | Current onboard profile slot |

### Backlight (main)

| Field | Type | Description |
|---|---|---|
| `lightSwitch` | `number` | Backlight switch. `0` off, `1` on (firmware-defined) |
| `lightMode` | `number` | Effect mode index. Special **`0xfd` = custom lighting**, then use `lightCustomIndex` |
| `lightBrightness` | `number` | Brightness, usually `0 … lightMaxBrightness` |
| `lightSpeed` | `number` | Speed (converted), usually `0 … lightMaxSpeed` |
| `lightMixColor` | `number` | Mix/color flag (`0`/`1`, semantics vary by effect) |
| `lightColorIndex` | `number` | Preset color index |
| `lightRValue` | `number` | Custom R, `0–255` |
| `lightGValue` | `number` | Custom G, `0–255` |
| `lightBValue` | `number` | Custom B, `0–255` |
| `lightCustomIndex` | `number` | Custom light slot id (often with `lightMode === 0xfd`, usually `0–4`) |

### LOGO light

| Field | Type | Description |
|---|---|---|
| `logoLightSwitch` | `number` | LOGO switch |
| `logoLightMode` | `number` | LOGO effect mode |
| `logoLightBrightness` | `number` | LOGO brightness |
| `logoLightSpeed` | `number` | LOGO speed (converted) |
| `logoLightMixColor` | `number` | LOGO mix flag |
| `logoLightColorIndex` | `number` | LOGO preset color index |
| `logoLightRValue` / `logoLightGValue` / `logoLightBValue` | `number` | LOGO RGB |

### Side light

| Field | Type | Description |
|---|---|---|
| `sideLightSwitch` | `number` | Side light switch |
| `sideLightMode` | `number` | Side light mode |
| `sideLightBrightness` | `number` | Side brightness |
| `sideLightSpeed` | `number` | Side speed (converted) |
| `sideLightMixColor` | `number` | Side mix flag |
| `sideLightColorIndex` | `number` | Side preset color index |
| `sideLightRValue` / `sideLightGValue` / `sideLightBValue` | `number` | Side RGB |

### Matrix screen lighting (standard layout) {#matrix-light-standard}

| Field | Type | Description |
|---|---|---|
| `matrixScreenLightSwitch` | `boolean` | Matrix light switch. Firmware bytes are often on=0 / off=1; SDK exposes boolean |
| `matrixScreenLightMode` | `number` | Matrix effect mode |
| `matrixScreenLightBrightness` | `number` | Matrix brightness |
| `matrixScreenLightSpeed` | `number` | Matrix speed |
| `matrixScreenLightMixColor` | `number` | Matrix mix flag |
| `matrixScreenLightColorIndex` | `number` | Matrix preset color index |
| `matrixScreenLightRValue` / `G` / `B` | `number` | Matrix RGB |

### Performance / system {#performance-system}

| Field | Type | Values / description |
|---|---|---|
| `sixKeysOrAllKeys` | `number` | `0` = 6-key rollover; `1` = NKRO |
| `maxOrWin` | `number` | `0` = Win layout; `1` = Mac layout |
| `winLock` | `number` | `0` = Win unlocked; `1` = Win key locked |
| `keyWasd` | `number` | `0` = normal; `1` = swap WASD and arrow keys |
| `scanDelay` | `number` | Polling rate index. Normal: `0→1000Hz` `1→500` `2→250` `3→125`; 8K: `0→8K` `1→4K` `2→2K` `3→1K` (model-dependent) |
| `layerDefault` | `number` | Default layer on power-up, `0–3` |
| `fSwitch` | `boolean` | F-row toggle |
| `wheelDefaultMode` | `number` | Encoder default mode `0` / `1` |
| `sleepTime` | `number` | Light sleep, **seconds** |
| `deepSleepTime` | `number` | Deep sleep, **seconds** |
| `numLockMode` | `number?` | NumLock behavior; `0` normal; `1` inverted, etc. (some models) |
| `hourType` | `number?` | Clock format; `0` / `1` for 12/24 hour (firmware-defined) |

### LCD / Snap / tail (varies by `protocolVer`)

| Field | Type | Description |
|---|---|---|
| `lcdScreenLightSwitch` | `boolean` | LCD switch; SDK uses `true` = on |
| `lcdScreenLightMode` | `number` | Display mode |
| `lcdScreenLightBrightness` | `number` | Usually brightness; some layouts use LCD GIF index (protocol `User_Info_Lcd_Gif`) |
| `lcdScreenLanguage` | `number` | Language index |
| `lcdScreenUsbEnum` | `boolean` | Enumerate as separate USB device |
| `snapTap` | `boolean?` | Snap Tap / SOCD (**V4** protocol; driver buffer see table above) |
| `lcdScreenMaxGif` | `number` | LCD max GIF frames (**V4** explicit; V2/V3 table conflicted with animation index) |
| `initDynamicSum` | `number?` | **V2/V3**: matrix dynamic-related count |
| `initMeetingSum` | `number?` | Welcome/meeting-related count |
| `matrixLtGifCount` | `number?` | **V4**: matrix GIF count (protocol `User Lt Gif Count`) |

> Do not hard-write raw buffer indices treating V2/V3 and V4 tails as identical; use `getFuncInfo` / `setFuncInfo` / `patchFuncInfo` and let the SDK handle `protocolVer`.

---

## Write-back notes

1. **Only named fields**: Writes use raw bytes from the last `getFuncInfo` as base; bytes not in this change are sent unchanged. Do not assemble a full packet yourself — e.g. matrix switch read as `0` (on) could be rewritten to `1` (off).  
2. **Speed**: Pass converted values; do not apply `max - x` again.  
3. **Sleep**: Values are **seconds**, not milliseconds. Example: 5 minutes → `sleepTime: 300`.  
4. **Custom lighting**: Call `applyUserLightSlot(id)` first, then write color data.
