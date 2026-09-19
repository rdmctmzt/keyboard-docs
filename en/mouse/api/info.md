# Basic device information

Reads the **information area** (CMD `0x12`). This is the device “capability table”: firmware version, key/macro capacity, lighting capabilities, and mouse-specific sensor model, report rate limit, and DPI group limit.

DPI group count and report rate options in the function area should respect the limit fields here for UI constraints.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer before other features | Read before changing function area, macros, or keymap |
| Results are cached | `getCachedDeviceInfo()`; cleared on `close`, disconnect, or new `init` |
| Layout differs from keyboard | Bytes 0–18 match keyboard structure; **19–21** are mouse-specific (sensor / report rate limit / DPI group limit) |

---

## Read device information

`ServiceMouse.getDeviceInfo()`

Reads the information area and caches it. When not cached, `getFuncInfo`, macros, and similar APIs read it again automatically.

### Parameters

None.

### Returns

`Promise<DeviceInfo>` — fields in [Field reference](#field-reference) below.

### Example

```js
const info = await ServiceMouse.getDeviceInfo()

// Do not exceed firmware DPI group limit
const maxGroups = info.dpiGroupMax || 8

// Macro buffer: macroSize × 256; when 0 the SDK falls back to 1096 bytes
const macros = await ServiceMouse.getMacros()
```

---

## Feature capability checks

Most advanced features depend on information-area limits and flags. The SDK **does not** block calls when a capability bit is false; without hardware you may get timeouts or invalid data — check on the app side before calling.

| Feature | Condition | Related docs |
|---|---|---|
| Lighting fields | `info.showLight === true` | [Performance / DPI](./performance) (function area `light`) |
| Macros | `info.macroSize` defines buffer; when 0 SDK falls back to 1096 bytes | [Macros](./macro) |
| DPI groups | `info.dpiGroupMax` is group count limit (commonly ≤ 8) | [Performance / DPI](./performance) |
| Report rate | Use `info.reportRateMax` and firmware enum; function area commonly 125/250/500/1000 | [Performance / DPI](./performance) |
| Battery | Mouse command table always has `0x28` | [Global settings](./globalSetting#getbatterystatus) |

---

## Field reference {#field-reference}

### Basic identity

| Field | Type | Description |
|---|---|---|
| `vendorId` | `number` | USB VID (little-endian 16-bit) |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | Firmware version |
| `protocolVer` | `number` | Protocol version field (mouse uses fixed `CMD_MOUSE`, not keyboard V1–V4 table switch) |
| `profile` | `number` | Current onboard profile slot |
| `keyboardID` | `number` | Model ID (field name follows info-area layout) |
| `keyboardType` | `number` | Type field |

### Key / macro capacity

| Field | Type | Description |
|---|---|---|
| `keyMatrixSize` | `number` | Key matrix size |
| `macroSize` | `number` | Macro space units. **Actual bytes = `macroSize × 256`**. When 0 the SDK falls back to 1096 bytes |

### Lighting capabilities

| Field | Type | Description |
|---|---|---|
| `showLight` | `boolean` | Whether lighting is supported |
| `lightSize` | `number` | Number of lighting modes |
| `lightMaxBrightness` | `number` | Brightness limit |
| `lightMaxSpeed` | `number` | Speed limit |
| `lightKeySize` | `number` | Number of independently colored light positions |

### Mouse-specific

| Field | Type | Description |
|---|---|---|
| `sensorModel` | `number` | Sensor model code (firmware-defined) |
| `reportRateMax` | `number` | Report rate limit code (firmware-defined) |
| `dpiGroupMax` | `number` | DPI group limit (commonly 1–8) |

---

## Relationship to the function area

| Info area field | Effect |
|---|---|
| `macroSize` | `getMacros` / `setMacros` buffer length |
| `dpiGroupMax` | Upper bound on configurable DPI groups in UI |
| `reportRateMax` | Upper bound on selectable report rates in UI |
| `showLight` | Whether to show / write function area `light` fields |
