# Commands

The vendor mouse AP protocol is sent and received over WebHID. Report ID is fixed at **`0xaa`**. The command table is fixed as **`CMD_MOUSE`**, aligned with *RDR Mouse Software Driver Protocol* `Ap_Function_Comd_Type`, **not** switched by keyboard `protocolVer` V1–V4.


## Notes

| Condition | Description |
|---|---|
| Prefer packaged APIs for daily use | This page is for protocol debugging / custom transport; you usually do not hand-build packets |
| Session must be open | Firmware expects `0x10` before business commands; the SDK transport sends it automatically |
| Numbering vs keyboard | `0x10`–`0x21` match keyboard; **from `0x22` onward numbers differ** (macros / battery / reset, etc.) |
| Wired / 2.4G | Different chunk sizes: default `0x38`, 2.4G commonly `0x18` (`packetSize`) |
| Success | Response `status === 0x55` |
| Without `0x10` | Byte 8 of the response may be `0x0F`; after ~5s without valid traffic, open session again |

## Packet format

### Outbound

```
[ reportId=0 ][ 0xaa ][ cmd ][ offsetLo ][ offsetHi ][ size ][ …reserved/checksum ][ payload… ]
```

| Item | Description |
|---|---|
| Wired full packet | Often padded to **65** bytes (including reportId) |
| Chunk size | Default **`0x38` (56)**; 2.4G commonly **`0x18` (24)** → SDK `packetSize` |
| Session | Firmware needs **`0x10` open session** before business commands (SDK transport sends automatically) |

### Response

```
[ 0xaa ][ cmd ][ … ][ status@+7 ][ data… ]
```

| Item | Description |
|---|---|
| Success | `status === 0x55` |
| Prefix | Occasionally one extra leading byte; SDK locates `0xaa` header |
| Notifications | `0xd0` and similar are proactive notifications, not ordinary business responses |

### offset / size

When reading/writing info area, function area, keymap, or macros:

| Parameter | Meaning |
|---|---|
| `offset` | Start offset in target buffer (little-endian 16-bit) |
| `size` | Read/write length for this packet (not greater than `packetSize`) |

Single-key write: `offset = keyIndex * 3`, `size = 3`, payload is `type, code1, code2`.

Function area is **102** bytes valid (`0..101`); read/write buffer aligned to **128** bytes.

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
