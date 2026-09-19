# Command reference

VIA protocol over WebHID. Payload is **32 bytes**; **Byte0 = parent command** (no business Report ID). Multi-byte fields are **big-endian**.

WebHID writes are commonly: `reportId=0` + 32-byte payload (whole report padded to **33**, matching driver `deviceMode=2`).

**Do not** send the vendor protocol `0x10` session open on a VIA interface.

## Notes

| Condition | Description |
|---|---|
| Prefer wrapped APIs for daily use | This page is for debugging / custom transport |
| Unlike vendor keyboard | No `0xaa` header, no `status=0x55` success byte |
| Response | Byte0 (after optional reportId prefix) echoes the same parent command; leading bytes match request |
| Reserved fields | Unused bytes must be `0` |

## Packet format

### Outbound

```
[ reportId=0 ][ viaCmd ][ param… ][ 0×pad ]
```

| Item | Description |
|---|---|
| Payload | 32 bytes; `viaCmd` at payload Byte0 |
| Full report | SDK default `packetLength = 33` (includes reportId) |
| Byte order | 16/32-bit big-endian |

### Inbound

```
[ viaCmd ][ parameter prefix matching request ][ data… ]
```

Some environments prefix `reportId=0` or occasional `0xaa` wrapping; SDK uses `findViaCommandIndex` to locate the command byte.

---

## Full parent command table

| Protocol name | Value | Description | SDK |
|---|---|---|---|
| `id_get_protocol_version` | `0x01` | Protocol version | `getProtocolVersion()` |
| `id_get_keyboard_value` | `0x02` | Read keyboard value | `getKeyboardValue()` / `getFirmwareVersion()` |
| `id_set_keyboard_value` | `0x03` | Write keyboard value | `setKeyboardValue()` |
| `id_dynamic_keymap_get_keycode` | `0x04` | Read single key | `getKey()` |
| `id_dynamic_keymap_set_keycode` | `0x05` | Write single key | `setKey()` |
| `id_dynamic_keymap_reset` | `0x06` | Clear dynamic keymap | `clearAllKeymaps()` |
| `id_custom_set_value` | `0x07` | Write lighting/custom | `setCustomMenuValue()` / `setLightingValue()` |
| `id_custom_get_value` | `0x08` | Read lighting/custom | `getCustomMenuValue()` |
| `id_custom_save` | `0x09` | Save custom channel | `saveCustomMenu()` |
| `id_eeprom_reset` | `0x0A` | EEPROM reset | `resetEeprom()` |
| `id_bootloader_jump` | `0x0B` | Enter Bootloader | `jumpToBootloader()` |
| `id_dynamic_keymap_macro_get_count` | `0x0C` | Macro slot count | `getMacroCount()` |
| `id_dynamic_keymap_macro_get_buffer_size` | `0x0D` | Macro buffer size | `getMacroBufferSize()` |
| `id_dynamic_keymap_macro_get_buffer` | `0x0E` | Read macro buffer | `getMacroBytes()` |
| `id_dynamic_keymap_macro_set_buffer` | `0x0F` | Write macro buffer | `setMacroBytes()` |
| `id_dynamic_keymap_macro_reset` | `0x10` | Clear macros | `resetMacros()` |
| `id_dynamic_keymap_get_layer_count` | `0x11` | Layer count (≥ Beta) | `getLayerCount()` |
| `id_dynamic_keymap_get_buffer` | `0x12` | Read keymap buffer | `getKeymapBuffer()` / `getKeymap()` |
| `id_dynamic_keymap_set_buffer` | `0x13` | Write keymap buffer | `setKeymapBuffer()` / `setKeymap()` |
| `id_dynamic_keymap_get_encoder` | `0x14` | Read encoder | `getEncoder()` |
| `id_dynamic_keymap_set_encoder` | `0x15` | Write encoder | `setEncoder()` |

Exported constants: `CMD_VIA` (`@rdmctmzt/sdk-qmk`).

### `0x02` / `0x03` subcommands (Byte1)

| Sub ID | Read | Write | Description |
|---|---|---|---|
| `0x01` | ✓ | — | Uptime |
| `0x02` | ✓ | ✓ | `layout_options` |
| `0x03` | ✓ | — | Matrix scan state |
| `0x04` | ✓ | — | Firmware version |
| `0x05` | — | ✓ | Device indication |

Export: `KeyboardValue`.

### Custom channels (`0x07`–`0x09`, Byte1)

| channel | Meaning |
|---|---|
| `0` | custom |
| `1` | backlight |
| `2` | rgb light |
| `3` | rgb matrix |
| `4` | audio |

Export: `CustomChannel`. value_id is defined by firmware / VIA JSON (brightness, mode, speed, color, etc.).

### keymap / macro chunking

| Item | Description |
|---|---|
| Max payload per call | **28** bytes (excluding cmd/offset/size) |
| offset | **Big-endian** 16-bit |
| keymap unit | 2-byte big-endian keycode per key |
