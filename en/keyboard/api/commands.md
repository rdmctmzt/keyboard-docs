# Command reference

Vendor keyboard AP protocol over WebHID. Report ID is fixed at **`0xaa`**. Command table switches with `protocolVer` (aligned with driver `cmdVersions.ts`).

SDK side: `CMD_V1` / `CMD_V2` / `CMD_V3` / `CMD_V4`, selected by `resolveProtocolCmdTable(protocolVer)`.

## Notes

| Condition | Description |
|---|---|
| Prefer packaged APIs for daily use | This page is for protocol debugging / custom transport; usually no manual packet assembly |
| Session must be open | Firmware expects `0x10` before business commands; SDK transport sends it automatically |
| Read `protocolVer` first | Command numbers change per table; wrong table causes corrupt reads/writes |
| Wired / 2.4G | Different chunk sizes: default `0x38`, 2.4G often `0x18` (`packetSize`) |
| Success | Response `status === 0x55` |

## Packet format

### Outbound

```
[ reportId=0 ][ 0xaa ][ cmd ][ offsetLo ][ offsetHi ][ size ][ …reserved/CRC ][ payload… ]
```

| Item | Description |
|---|---|
| Wired full packet | Often padded to **65** bytes (including reportId) |
| Chunk size | Default **`0x38` (56)**; 2.4G often **`0x18` (24)** → SDK `packetSize` |
| Session | Firmware needs **`0x10` open session** before business commands (SDK auto) |

### Inbound

```
[ 0xaa ][ cmd ][ … ][ status@+7 ][ data… ]
```

| Item | Description |
|---|---|
| Success | `status === 0x55` |
| Prefix | Occasionally one extra leading byte; SDK locates `0xaa` header |
| Notifications | `0xd0` etc. are proactive notifications, not normal business responses |

### offset / size

When reading/writing information area, function area, keymap, macros, light colors:

| Parameter | Meaning |
|---|---|
| `offset` | Buffer start offset (little-endian 16-bit) |
| `size` | Bytes read/written this packet (≤ `packetSize`) |

Single key write: `offset = keyIndex * 3`, `size = 3`, payload `type, code1, code2`.

---

## V1 full command table (`protocolVer === 1`)

| Command | Value | Description | SDK |
|---|---|---|---|
| `REPORT_ID` | `0xaa` | HID report ID | Transport |
| `CMD_START_COMM` | `0x10` | Open session | Auto |
| `CMD_STOP_COMM` | `0x11` | Close session | After function area / keys / macros, etc. |
| `CMD_GET_DEVICEINFO` | `0x12` | Read information area | `getDeviceInfo()` |
| `CMD_SET_DEVICEINFO` | `0x13` | Write information area (rare) | — |
| `CMD_GET_FUNCINFO` | `0x14` | Read function area | `getFuncInfo()` |
| `CMD_SET_FUNCINFO` | `0x15` | Write function area | `setFuncInfo()` / `patchFuncInfo()` |
| `CMD_GET_DEFAULT_0` | `0x16` | Read default layer 0 | `getDefaultKeymap(0)` |
| `CMD_GET_DEFAULT_1` | `0x17` | Read default layer 1 | `getDefaultKeymap(1)` |
| `CMD_GET_DEFAULT_2` | `0x18` | Read default layer 2 | `getDefaultKeymap(2)` |
| `CMD_GET_DEFAULT_3` | `0x19` | Read default layer 3 | `getDefaultKeymap(3)` |
| `CMD_GET_USERKEY_0` | `0x1a` | Read user layer 0 | `getKeymap(0)` |
| `CMD_SET_USERKEY_0` | `0x1b` | Write user layer 0 | `setKey(0, …)` |
| `CMD_GET_USERKEY_1` | `0x1c` | Read user layer 1 | `getKeymap(1)` |
| `CMD_SET_USERKEY_1` | `0x1d` | Write user layer 1 | `setKey(1, …)` |
| `CMD_GET_USERKEY_2` | `0x1e` | Read user layer 2 | `getKeymap(2)` |
| `CMD_SET_USERKEY_2` | `0x1f` | Write user layer 2 | `setKey(2, …)` |
| `CMD_GET_USERKEY_3` | `0x20` | Read user layer 3 | `getKeymap(3)` |
| `CMD_SET_USERKEY_3` | `0x21` | Write user layer 3 | `setKey(3, …)` |
| `CMD_GET_USERLIGHT_1` | `0x22` | Read user light slot 0 | `getUserKeyColors(0)` |
| `CMD_SET_USERLIGHT_1` | `0x23` | Write user light slot 0 | `setUserKeyColor` / `setUserAllKeyColors` |
| `CMD_GET_USERLIGHT_2` | `0x24` | Read user light slot 1 | `getUserKeyColors(1)` |
| `CMD_SET_USERLIGHT_2` | `0x25` | Write user light slot 1 | same |
| `CMD_GET_USERLIGHT_3` | `0x26` | Read user light slot 2 | `getUserKeyColors(2)` |
| `CMD_SET_USERLIGHT_3` | `0x27` | Write user light slot 2 | same |
| `CMD_GET_USERLIGHT_4` | `0x28` | Read user light slot 3 | `getUserKeyColors(3)` |
| `CMD_SET_USERLIGHT_4` | `0x29` | Write user light slot 3 | same |
| `CMD_GET_USERLIGHT_5` | `0x2a` | Read user light slot 4 | `getUserKeyColors(4)` |
| `CMD_SET_USERLIGHT_5` | `0x2b` | Write user light slot 4 | same |
| `CMD_GET_MACRODATA` | `0x2c` | Read macro area | `getMacros()` |
| `CMD_SET_MACRODATA` | `0x2d` | Write macro area | `setMacros()` |
| `CMD_RESTORE_FACTORYSETTINGS` | `0x31` | Factory reset | `restoreFactorySettings()` |
| `CMD_GET_LIGHT_MATRIX` | `0x32` | Key → LED index map | `getLightMatrix()` |
| `CMD_GET_BL_MODE` | `0x33` | Backlight mode table | `getBackLightModes()` |
| `CMD_GET_LG_MODE` | `0x34` | LOGO mode table | `getLogoLightModes()` |
| `CMD_GET_SD_MODE` | `0x35` | Side light mode table | `getSideLightModes()` |
| `CMD_GET_LIGHT_MODE_DATA` | `0x36` | Current effect color data | — |
| `CMD_GET_WHEEL_DATA` | `0x37` | Wheel data | — |

Keymap: **3 bytes** per key: `type` + `code1` + `code2`, **128 keys = 384 bytes** per layer (driver aligns to 512-byte buffer). See [Keycode table](../keycodes).

---

## V2 deltas and overrides (`protocolVer === 2`)

V2 **extends V1**. New or renumbered commands below (final values after object spread override).

| Command | Value | vs V1 | Description | SDK |
|---|---|---|---|---|
| `CMD_SET_LIGHT` | `0x2e` | New | Light sync related | — |
| `CMD_CLOSE_LIGHT` | `0x2f` | New | Light sync related | — |
| `CMD_GET_BATTERY_STATUS` | `0x30` | New | Battery | `getBatteryStatus()` |
| `CMD_GET_LIGHT_MODE_DATA` | `0x34` | **Renumbered** (was V1 LOGO) | Current effect color data | — |
| `CMD_GET_LG_MODE` | `0x35` | **Renumbered** | LOGO mode table | `getLogoLightModes()` |
| `CMD_GET_SD_MODE` | `0x36` | **Renumbered** | Side mode table | `getSideLightModes()` |
| `CMD_GET_LOGO_LIGHT_MATRIX` | `0x37` | New (reuses old wheel id) | LOGO light matrix | — |
| `CMD_GET_SIDE_LIGHT_MATRIX` | `0x38` | New | Side light matrix | — |
| `CMD_GET_LIGHT_MODE` | `0x39` | New | Light mode | — |
| `CMD_GET_USER_LIGHT_DATA` | `0x3a` | New | Read user light data | — |
| `CMD_SET_USER_LIGHT_DATA` | `0x3b` | New | Write user light data | — |
| `CMD_SET_LIGHT_SYNC` | `0x3c` | New | Enable light sync | — |
| `CMD_CLOSE_LIGHT_SYNC` | `0x3d` | New | Disable light sync | — |
| `CMD_GET_WHEEL_DATA` | `0x3e` | **Renumbered** | Wheel data | — |
| `CMD_GET_MATRIX_DYNAMIC_DATA` | `0x3f` | New | Read matrix mono dynamic | — |
| `CMD_SET_MATRIX_DYNAMIC_DATA` | `0x40` | New | Write matrix mono dynamic | — |
| `CMD_GET_MATRIX_MODE` | `0x41` | New | Read matrix mode | — |
| `CMD_SET_MATRIX_MODE` | `0x42` | New | Write matrix mode | — |
| `CMD_SET_LIGHT_ON` | `0xe0` | New | Master light on | — |
| `CMD_SET_LIGHT_OFF` | `0xe1` | New | Master light off | — |
| `CMD_CHECK_LIGHT_STATUS` | `0xe2` | New | Query light status | — |

> Driver source once had `CMD_GET_MATRIX_POSITION: 0x40`, later overridden by `CMD_SET_MATRIX_DYNAMIC_DATA: 0x40`; **effective value is `0x40` = write matrix dynamic**.

V2 still inherits unchanged V1 commands: `0x10`–`0x2d`, `0x31`–`0x33` (session / info / function / keymap / user colors / macros / reset / backlight matrix and modes).

---

## V3 delta (`protocolVer === 3`)

Extends V2, adds only:

| Command | Value | Description | SDK |
|---|---|---|---|
| `CMD_Get_Keyboard` | `0xd0` | 2.4G connection query / proactive notify | `getRfStatus()` / `on('rfStatus')` |

---

## V4 deltas and renumbers (`protocolVer === 4`)

Extends V3; GIF / wheel id adjustments:

| Command | Value | vs V2/V3 | Description | SDK |
|---|---|---|---|---|
| `CMD_GET_LT_GIF` | `0x3e` | **Renumbered** (was wheel) | Read matrix GIF | — |
| `CMD_SET_LT_GIF` | `0x3f` | **Renumbered** (was matrix dynamic read) | Write matrix GIF | — |
| `CMD_GET_WHEEL_DATA` | `0x40` | **Renumbered** | Wheel data | — |
| `CMD_GET_MATRIX_DYNAMIC_DATA` | `0x3e` | Same as GIF read | Matrix dynamic read (alias) | — |
| `CMD_SET_MATRIX_DYNAMIC_DATA` | `0x3f` | Same as GIF write | Matrix dynamic write (alias) | — |
| `CMD_GET_MATRIX_MODE` | `0x41` | Kept | Read matrix mode (welcome, etc.) | — |
| `CMD_SET_MATRIX_MODE` | `0x42` | Kept | Write matrix mode | — |
| `CMD_LCD_GIF_SYNCHRONIZA` | `0xe3` | New | LCD GIF sync | — |

---

## Feature index

| Feature | Main commands | API doc |
|---|---|---|
| Device capabilities | `0x12` | [Device information](./info) |
| Runtime config | `0x14` / `0x15` | [Function area](./func) |
| Remapping | `0x16`–`0x21` | [Layout / remapping](./key) |
| Lighting / rhythm | Function area + `0x22`–`0x2b`, `0x2e`, `0x32`–`0x36` | [Lighting](./lighting) |
| Matrix screen | `0x3a`–`0x42`, V4 GIF | [Matrix screen](./matrix) |
| LCD | Function area + `0xe0`–`0xe3`; screen HID `0x12`/`0x15`–`0x1a` | [LCD](./lcd) |
| Encoder | `CMD_GET_WHEEL_DATA` + function area | [Encoder](./encoder) |
| Performance | Function area fields | [Performance](./performance) |
| Macros | `0x2c` / `0x2d` | [Macros](./macro) |
| Battery | `0x30` (V2+) | [Other APIs · getBatteryStatus](./misc#getbatterystatus) |
| 2.4G status | `0xd0` (V3+) | [Other APIs · getRfStatus](./misc#getrfstatus) |
| Factory reset | `0x31` | [Other APIs · restoreFactorySettings](./misc#restorefactorysettings) |
| Lifecycle / cache | Session `0x10`/`0x11`, etc. | [Other APIs](./misc) |
