# Basic device information

Reads the **information area** (CMD `0x12`). This is the device “capability table”: protocol version, whether it has lighting, screen, encoders, brightness/speed limits, macro space, and more. Function-area speed conversion and macro buffer size depend on fields here.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer before other features | Before changing the function area, macros, lighting, or screen, read this first for `protocolVer` and capability bits |
| Results are cached | `getCachedDeviceInfo()`; cleared on `close`, disconnect, or a new `init` |
| Models differ widely | Without side lighting, matrix, LCD, or encoders, the corresponding fields are false or 0; do not call those APIs blindly |

---

## Read device information

`ServiceKeyboard.getDeviceInfo()`

Reads the information area and caches it. When not cached, `getFuncInfo`, macros, and similar APIs will read it again automatically.

### Parameters

None.

### Returns

`Promise<DeviceInfo>` — see [Field reference](#field-reference) below.

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()

if (info.matrixScreen) {
  const colors = await ServiceKeyboard.getMatrixPixelColors()
}
if (info.isLed) {
  await ServiceKeyboard.lightOn()
}
if (info.protocolVer >= 2) {
  const battery = await ServiceKeyboard.getBatteryStatus()
}
```

---

## Feature capability checks

Most advanced features exist only on **specific models / protocol versions**. Read the information area first, then decide whether to call the matching API from capability bits.

The SDK **does not** block calls when a capability bit is false; without hardware you may get timeouts or invalid data — check on the app side before calling.

| Feature | Condition | Related docs |
|---|---|---|
| Backlight | `info.showLight === true` | [Lighting](./lighting) |
| LOGO light | `info.showLogoLight === true` | [Lighting](./lighting) |
| Side light | `info.showLightSideLight === true` | [Lighting](./lighting) |
| Music rhythm | `info.logoLightSupportMusic` or `info.sideLightSupportMusic`, and `protocolVer ≥ 2` | [Lighting · rhythm](./lighting#setmusicrhythmcolors) |
| Custom per-key colors | `info.showLight` and `info.lightKeySize > 0` | [Lighting](./lighting) |
| Matrix screen | `info.matrixScreen === true` (usually also `protocolVer ≥ 2`) | [Matrix screen](./matrix) |
| Matrix GIF | `info.matrixScreen` and `info.matrixScreenHasGif` (often V4) | [Matrix screen](./matrix) |
| LCD | `info.isLed === true`; screen content still needs a separate screen HID | [LCD](./lcd) |
| Encoder | `info.encoder === true` | [Encoder](./encoder) |
| Battery | `protocolVer ≥ 2` (V1 has no `0x30`) | [Other APIs](./misc#getbatterystatus) |
| Macros | `info.macroSize` defines the buffer; when 0 the SDK falls back to 1096 bytes | [Macros](./macro) |
| Light sync / master light switch, etc. | `protocolVer ≥ 2` | [Matrix screen](./matrix) / [LCD](./lcd) |
| `syncLcdGif` | `protocolVer ≥ 4` | [LCD](./lcd) |

---

## Field reference {#field-reference}

### Basic identity

| Field | Type | Description |
|---|---|---|
| `vendorId` | `number` | USB VID (little-endian 16-bit) |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | Firmware version |
| `protocolVer` | `number` | Protocol version **1–4**. Selects command tables (V1/V2/V3/V4) and whether the function area uses the extended layout |
| `profile` | `number` | Current onboard profile slot |
| `keyboardID` | `number` | Keyboard model ID (driver also uses this for 8K and similar) |
| `keyboardType` | `number` | Keyboard type |

### Key / macro capacity

| Field | Type | Description |
|---|---|---|
| `keyMatrixSize` | `number` | Key matrix size |
| `macroSize` | `number` | Macro space units. **Actual bytes = `macroSize × 256`**. When 0 the SDK falls back to 1096 bytes (same as driver) |

### Backlight capability

| Field | Type | Description |
|---|---|---|
| `showLight` | `boolean` | Whether backlight is present |
| `lightSize` | `number` | Number of backlight effect modes |
| `lightMaxBrightness` | `number` | Backlight brightness upper bound (reference for function-area `lightBrightness`) |
| `lightMaxSpeed` | `number` | Backlight speed upper bound. On function-area read/write: `user speed = max - firmware raw value` |
| `lightKeySize` | `number` | Count of LED/key positions with independent color control |

### LOGO light capability

| Field | Type | Description |
|---|---|---|
| `showLogoLight` | `boolean` | Whether LOGO lighting exists |
| `logoLightModeSize` | `number` | Number of LOGO effect modes |
| `logoLigthSize` | `number` | LOGO LED count (field name matches driver spelling) |
| `logoLightMaxBrightness` | `number` | LOGO brightness upper bound |
| `logoLightMaxSpeed` | `number` | LOGO speed upper bound (same conversion rule) |
| `logoLightSupportMusic` | `boolean` | Whether LOGO supports music rhythm |

### Side light capability

| Field | Type | Description |
|---|---|---|
| `showLightSideLight` | `boolean` | Whether side lighting exists |
| `sideLightModeSize` | `number` | Number of side light modes |
| `sideLightSize` | `number` | Side LED count |
| `sideLightMaxBrightness` | `number` | Side brightness upper bound |
| `sideLightMaxSpeed` | `number` | Side speed upper bound |
| `sideLightSupportMusic` | `boolean` | Whether side light supports music rhythm |

### Matrix screen / LCD / encoder (extended area)

Indices **0–36** are the same on V2/V3/V4. From **37** onward, V4 inserts GIF capability bits and encoder / LCD indices shift:

| Field | V2 / V3 index | V4 index | Description |
|---|---|---|---|
| `matrixScreen` | `31` | `31` | Whether a matrix screen is present |
| `matrixScreenLightSize` | `32` | `32` | Number of matrix lighting effect modes |
| `matrixScreenLightRows` / `Columns` | `33` / `34` | `33` / `34` | Rows / columns |
| `matrixScreenLightMaxBrightness` / `MaxSpeed` | `35` / `36` | `35` / `36` | Brightness / speed limits |
| `matrixScreenHasGif` | — | `37` | V4: matrix GIF support |
| `matrixScreenGifMaxFrames` | — | `38` | V4: max GIF frames |
| `matrixScreenLightMaxFrames` | `39` (common on non-V4) | Often same source as GIF limit | Max frames for dynamic custom content |
| `encoder` | `37` | `39` | Whether an encoder is present |
| `isLed` | `38` | `40` | Whether an LCD is present |

> Main V4 information-area change vs V3: inserts “has GIF / max GIF frames” before the encoder. The SDK parses by `protocolVer`; read `DeviceInfo` fields in app code — do not compute indices by hand.

---

## Relationship to the function area

| Information field | Effect |
|---|---|
| `protocolVer` | Command table; function area V1 single packet vs V2/V3 vs V4 tail layout; extended information indices |
| `lightMaxSpeed` / `logoLightMaxSpeed` / `sideLightMaxSpeed` | Function-area speed field conversion |
| `macroSize` | `getMacros` / `setMacros` buffer length |
| `show*` capability bits | Whether UI shows matching light/screen features (SDK does not enforce) |
