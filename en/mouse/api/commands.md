# Commands

The vendor mouse AP protocol is sent and received over WebHID. Report ID is fixed at **`0xaa`**. The command table is fixed as **`CMD_MOUSE`**, aligned with *RDR Mouse Software Driver Protocol* `Ap_Function_Comd_Type`, **not** switched by keyboard `protocolVer` V1–V4.


## Notes

| Condition | Description |
|---|---|
| Prefer packaged APIs for daily use | This page is for protocol debugging / custom transport; you usually do not hand-build packets |
| Session must be open | Firmware expects `0x10` before business commands; the SDK transport sends it automatically |
| Numbering vs keyboard | `0x10`–`0x21` match keyboard; **from `0x22` onward numbers differ** (macros / battery / reset, etc.) |
| Wired / 2.4G | **Effective payload** differs: wired `0x38`, 2.4G `0x18` (do **not** use frame size `0x20` as `size`) |
| Success | Response `status === 0x55` (protocol byte 8) |
| Without `0x10` | Byte 8 may be `0x0F`; after ~5s idle, open session again |
| `0xD0` | **2.4G only** RF status; do not send on wired business paths |

## Packet format

### 8-byte header + data

| Byte | Meaning |
|---|---|
| 0 | `0xAA` |
| 1 | Command |
| 2–3 | ADDR (LE offset) |
| 4 | **Length = effective data length** (excluding this 8-byte header) |
| 5–6 | CRC16 (unused, send 0) |
| 7 | Result: `0x55` ok / `0x0F` fail |
| 8… | Data |

WebHID (SDK):

```
sendReport(hidReportId, [0xaa, cmd, offsetLo, offsetHi, size, 0, 0, …payload])
```

The leading `0` in logical `[0, 0xaa, …]` is **not** the HID report ID; real report ID comes from the descriptor.

### Effective payload (`packetSize` / command `size`)

| Link | Frame | Header | **Max effective** | SDK `packetSize` |
|---|---|---|---|---|
| USB wired | ~64B data | 8B | **`0x38` (56)** | `0x38` (default) |
| 2.4G | **32B** | 8B | **`0x18` (24)** | `0x18` |

| Wrong usage | Why |
|---|---|
| 2.4G `packetSize: 0x20` | `0x20` is full frame size, not effective payload |
| Info read wired `size=0x38` then `0x0f` | Mouse info only needs **32** bytes → one packet `size=0x20` |

### Response

```
[ 0xaa ][ cmd ][ … ][ status@+7 ][ data… ]
```

### offset / size

| Area | Suggested read | Wired | 2.4G |
|---|---|---|---|
| Info `0x12` | **32** bytes (through index 27) | one packet `0x20` | `0x18` + `0x08` |
| Func `0x14` | **102** valid / **128** buffer | chunk by `0x38` | chunk by `0x18` |
| Keymap layer | **384** bytes | chunk by `0x38` | chunk by `0x18` |

Single-key write: `offset = keyIndex * 3`, `size = 3`.

---

## Full command table (protocol `Ap_Function_Comd_Type`)

| Protocol name | Value | Description | SDK |
|---|---|---|---|
| `AP_FUNC_START` | `0x10` | Start session | Automatic |
| `AP_FUNC_STOP` | `0x11` | End session | Sent after writing function area / keys / macros, etc. |
| `AP_READ_INFO` | `0x12` | Read basic device info | `getDeviceInfo()` |
| `AP_WRITE_INFO` | `0x13` | Write basic device info | — (reserved) |
| `AP_READ_FUNC` | `0x14` | Read function area | `getFuncInfo()` |
| `AP_WRITE_FUNC` | `0x15` | Write function area | `setFuncInfo()` / `patchFuncInfo()` / `setDpi` / `setParams` |
| `AP_READ_DEFAULT_MATRIX1` | `0x16` | Read default key matrix 1 | `getDefaultKeymap(0)` |
| `AP_READ_DEFAULT_MATRIX2` | `0x17` | Read default key matrix 2 | `getDefaultKeymap(1)` |
| `AP_READ_DEFAULT_MATRIX3` | `0x18` | Read default key matrix 3 | `getDefaultKeymap(2)` |
| `AP_READ_DEFAULT_MATRIX4` | `0x19` | Read default key matrix 4 | `getDefaultKeymap(3)` |
| `AP_READ_MATRIX1` | `0x1A` | Read key matrix 1 | `getKeymap(0)` |
| `AP_WRITE_MATRIX1` | `0x1B` | Write key matrix 1 | `setKey(0, …)` |
| `AP_READ_MATRIX2` | `0x1C` | Read key matrix 2 | `getKeymap(1)` |
| `AP_WRITE_MATRIX2` | `0x1D` | Write key matrix 2 | `setKey(1, …)` |
| `AP_READ_MATRIX3` | `0x1E` | Read key matrix 3 | `getKeymap(2)` |
| `AP_WRITE_MATRIX3` | `0x1F` | Write key matrix 3 | `setKey(2, …)` |
| `AP_READ_MATRIX4` | `0x20` | Read key matrix 4 | `getKeymap(3)` |
| `AP_WRITE_MATRIX4` | `0x21` | Write key matrix 4 | `setKey(3, …)` |
| `AP_READ_DEFINE1_LED` | `0x22` | Read custom lighting data 1 | — |
| `AP_WRITE_DEFINE1_LED` | `0x23` | Write custom lighting data 1 | — |
| `AP_READ_MACRO` | `0x24` | Read macro data | `getMacros()` |
| `AP_WRITE_MACRO` | `0x25` | Write macro data | `setMacros()` |
| `AP_CONTROL_LED_START` | `0x26` | Sync lighting control (music rhythm) | — |
| `AP_CONTROL_LED_STOP` | `0x27` | Stop sync lighting control | — |
| `AP_READ_BATT` | `0x28` | Read battery status (when battery present) | `getBatteryStatus()` |
| `AP_FUNC_RESET` | `0x29` | Reset | `restoreFactorySettings()` |
| `AP_READ_LED_MATRIX` | `0x2A` | Read lighting matrix | — |
| `AP_READ_BL_MODE` | `0x2B` | Read backlight mode in use | — |
| `AP_READ_LED_DATA` | `0x2C` | Read lighting mode color data (music rhythm) | — |
| `AP_READ_LOGO_INDEX` | `0x2D` | Read LOGO lighting matrix | — |
| `AP_READ_LG_MODE` | `0x2E` | Read LOGO lighting mode in use | — |
| `AP_2P4G_STATUS` | `0xD0` | Get 2.4G status (fixed value) | `getRfStatus()` / `on('rfStatus')` |

Keymap: **3 bytes** per key: `type` + `code1` + `code2`, **128 keys = 384 bytes** per layer. See [Keycodes](../keycodes).

Lighting matrix: `actual light position = AP_BUFF[actual key position]`; index `0xFF` means no matching light for that key.

---

## Comparison with keyboard commands (easy to confuse)

| Feature | Mouse | Keyboard V2 typical |
|---|---|---|
| Read/write macros | `0x24` / `0x25` | `0x2c` / `0x2d` |
| Battery | `0x28` | `0x30` |
| Factory reset | `0x29` | `0x31` |
| Light sync on/off | `0x26` / `0x27` | `0x3c` / `0x3d` |
| User light slots | Only `0x22` / `0x23` | `0x22`–`0x2b` multiple slots |

`0x10`–`0x21` (session / info / function area / keymap) are the same on both sides.

---

## Index by feature

| Feature | Main commands | API docs |
|---|---|---|
| Device capabilities | `0x12` | [Device information](./info) |
| Runtime config (DPI / report rate / LOD / sleep / lighting) | `0x14` / `0x15` | [Global settings](./globalSetting) · [Performance / DPI](./performance) |
| Key remapping | `0x16`–`0x21` | [Key remapping](./keyRemapping) |
| Macros | `0x24` / `0x25` | [Macros](./macro) |
| Battery | `0x28` | [Global settings · getBatteryStatus](./globalSetting#getbatterystatus) |
| Factory reset | `0x29` | [Global settings · restoreFactorySettings](./globalSetting#restorefactorysettings) |
| 2.4G status | `0xD0` | [Global settings · getRfStatus](./globalSetting#getrfstatus) |
