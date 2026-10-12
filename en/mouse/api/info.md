# Basic device information

Reads the **information area** (CMD `0x12`). This is the device capability table: firmware version, key/macro capacity, lighting capabilities, and mouse-specific sensor model, report-rate limit, and DPI group limit.

DPI group count and report-rate options in the function area should respect these limits in the UI.

Aligned with *RDR Mouse Software Driver Protocol* **§03 Device information** (64 bytes reserved; mouse-valid fields through index 27).

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer before other features | Read before changing function area, macros, or keymap |
| Results are cached | `getCachedDeviceInfo()`; cleared on `close`, disconnect, or new `init` |
| **Read-only** | Protocol: writes have no effect and are not retained across power loss; SDK has no write API |
| Read length | SDK reads **32 bytes** (covers DPI group limit at index 27). **Do not** read 71 bytes like the keyboard path |
| Wired: one packet | With `packetSize=0x38`: one packet `size=0x20` |
| 2.4G: two packets | Max effective payload `0x18` (32B frame − 8B header): `0x18` + `0x08`. **Never** send a single packet with `size=0x20` |
| Byte layout | 0–18 match keyboard; **19–24 are LOGO light capabilities**; **25–27 are mouse-specific** (sensor / report-rate limit / DPI group limit) |

> Older docs incorrectly said “19–21 are mouse-specific”. Captures and the protocol table use **25 / 26 / 27**. SDK `parseDeviceInfo` follows that.

---

## Read device information

`ServiceMouse.getDeviceInfo()`

Reads the information area and caches it. When not cached, `getFuncInfo`, macros, and similar APIs read it again automatically.

### Parameters

None.

### Returns

`Promise<DeviceInfo>` — see [Field reference](#field-reference).

### Example

```js
const info = await ServiceMouse.getDeviceInfo()

const maxGroups = info.dpiGroupMax || 8
const macros = await ServiceMouse.getMacros()
```

### Wire capture example

```
OUT: aa 12 00 00 20 00 00 00 …   // offset=0, size=0x20 (32 bytes)
IN : aa 12 00 00 20 00 00 55 aa bb … 10 04 08 …
```

---

## Feature capability checks

The SDK **does not** block calls when a capability bit is false; check on the app side first.

| Feature | Condition | Related docs |
|---|---|---|
| Lighting fields | `info.showLight === true` | [Performance / DPI](./performance) |
| Macros | `info.macroSize` sets buffer; `0` → SDK falls back to 1096 bytes | [Macros](./macro) |
| DPI groups | `info.dpiGroupMax` | [Performance / DPI](./performance) |
| Report rate | `info.reportRateMax` + firmware enums | [Performance / DPI](./performance) |
| Battery | Fixed mouse CMD `0x28` | [Global settings](./globalSetting#getbatterystatus) |

---

## Information-area layout (protocol §03)

| Index | Meaning | SDK `DeviceInfo` |
|---|---|---|
| 0–1 | Magic `0xAA 0xBB` | (validation) |
| 2–3 | USB VID (LE) | `vendorId` |
| 4–5 | USB PID (LE) | `productId` |
| 6–7 | Firmware version (LE) | `firmwareVer` |
| 8 | AP protocol version | `protocolVer` |
| 9 | Profile | `profile` |
| 10 | Model ID | `keyboardID` |
| 11 | Reserved / type | `keyboardType` |
| 12 | Key matrix size | `keyMatrixSize` |
| 13 | Macro space (×256 bytes) | `macroSize` |
| 14 | Has key lighting | `showLight` |
| 15–17 | Light modes / max brightness / max speed | `lightSize` / `lightMaxBrightness` / `lightMaxSpeed` |
| 18 | Custom light group count | `lightKeySize` |
| 19–24 | LOGO light capabilities | — |
| **25** | **Sensor model** | **`sensorModel`** |
| **26** | **Report-rate max steps** | **`reportRateMax`** |
| **27** | **DPI group max** | **`dpiGroupMax`** |
| 28–63 | Reserved | SDK does **not** read |

There is a separate **receiver** info format (32 bytes) for 2.4G dongles — do not confuse it with the mouse body table above.

---

## Field reference

### Identity

| Field | Type | Description |
|---|---|---|
| `vendorId` | `number` | USB VID |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | Firmware version |
| `protocolVer` | `number` | Protocol version field |
| `profile` | `number` | Profile index |
| `keyboardID` | `number` | Model ID |
| `keyboardType` | `number` | Type field |

### Key / macro capacity

| Field | Type | Description |
|---|---|---|
| `keyMatrixSize` | `number` | Key matrix size |
| `macroSize` | `number` | Macro units; **bytes = macroSize × 256** |

### Lighting

| Field | Type | Description |
|---|---|---|
| `showLight` | `boolean` | Key lighting present |
| `lightSize` | `number` | Mode count |
| `lightMaxBrightness` | `number` | Brightness max |
| `lightMaxSpeed` | `number` | Speed max |
| `lightKeySize` | `number` | Custom light groups (index 18) |

### Mouse-specific (indices 25–27)

| Field | Type | Description |
|---|---|---|
| `sensorModel` | `number` | Sensor model code |
| `reportRateMax` | `number` | Report-rate step count |
| `dpiGroupMax` | `number` | DPI group limit |

---

## Relation to function area

| Info field | Effect |
|---|---|
| `macroSize` | `getMacros` / `setMacros` buffer length |
| `dpiGroupMax` | Max DPI groups in UI |
| `reportRateMax` | Max report-rate options in UI |
| `showLight` | Whether to show / write function-area `light` |
