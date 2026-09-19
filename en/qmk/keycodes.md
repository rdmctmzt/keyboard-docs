# Keycode table

QMK / VIA remapping uses **16-bit keycode** (**big-endian** two bytes on the wire), not the vendor keyboard `{ type, code1, code2 }`.

Values align with firmware `keyLabelUtils.CODE_TO_BYTE` / VIA v12 (`keyboard-demo`) dictionary.

## Notes

| Condition | Description |
|---|---|
| With remapping APIs | `setKey` / `getKeymap` read and write this value |
| Transparent key | `KC_TRNS` = `0x0001` |
| Advanced keycodes | `LT` / `MT` / `MO` etc.; see **Advanced keycode ranges** below |
| Macro binding | Write `MACRO(n)` in keymap; content in [Macros](./api/macro) |
| Protocol version | Macro / custom bases differ in v10/v11/v12; tables default to **v12** |

```js
await ServiceQmk.setKey(0, 2, 3, 0x0004) // KC_A
await ServiceQmk.setKey(0, 2, 4, 0x0001) // KC_TRNS
await ServiceQmk.setKey(0, 2, 5, 0x5101) // MO(1)
```

## Advanced keycode ranges

| Category | Range | Formula (summary) |
|---|---|---|
| Mods + basic keys | `0x0100`–`0x1FFF` | `modMask \| kc`, e.g. `S(kc)=0x0100\|kc` |
| Layer Tap `LT` | `0x4000`–`0x4FFF` | `0x4000 \| (layer << 8) \| kc` |
| `TO` | `0x5010`–`0x501F` | `0x5010 + n` |
| `MO` | `0x5100`–`0x511F` | `0x5100 + n` |
| `DF` | `0x5200`–`0x521F` | `0x5200 + n` |
| `TG` | `0x5300`–`0x531F` | `0x5300 + n` |
| `OSL` | `0x5400`–`0x541F` | `0x5400 + n` |
| `TT` | `0x5800`–`0x581F` | `0x5800 + n` |
| Layer Mod | `0x5900`–`0x59FF` | — |
| Mod Tap `MT` | `0x6000`–`0x7FFF`(overlaps MACRO range; MACRO takes precedence when parsing) | — |
| `MACRO(n)` v12 | `0x7700`–`0x777F` | `0x7700 + n` |
| `CUSTOM(n)` v12 | `0x7E00`–`0x7EFF` | `0x7E00 + n` |

| Macro / custom other versions | Base |
|---|---|
| MACRO v11 | `0x7702 + n` |
| CUSTOM v11 | `0x7F00 + n` |
| MACRO v10 | `0x5F12 + n` |
| CUSTOM v10 | `0x5F80 + n` |

---

## Empty / transparent keys

| keycode | Name | Description |
|---|---|---|
| `0x0000` | `KC_NO` | None |
| `0x0001` | `KC_TRNS` | Transparent ▽ |

## Letters

| keycode | Name | Description |
|---|---|---|
| `0x0004` | `KC_A` | A |
| `0x0005` | `KC_B` | B |
| `0x0006` | `KC_C` | C |
| `0x0007` | `KC_D` | D |
| `0x0008` | `KC_E` | E |
| `0x0009` | `KC_F` | F |
| `0x000A` | `KC_G` | G |
| `0x000B` | `KC_H` | H |
| `0x000C` | `KC_I` | I |
| `0x000D` | `KC_J` | J |
| `0x000E` | `KC_K` | K |
| `0x000F` | `KC_L` | L |
| `0x0010` | `KC_M` | M |
| `0x0011` | `KC_N` | N |
| `0x0012` | `KC_O` | O |
| `0x0013` | `KC_P` | P |
| `0x0014` | `KC_Q` | Q |
| `0x0015` | `KC_R` | R |
| `0x0016` | `KC_S` | S |
| `0x0017` | `KC_T` | T |
| `0x0018` | `KC_U` | U |
| `0x0019` | `KC_V` | V |
| `0x001A` | `KC_W` | W |
| `0x001B` | `KC_X` | X |
| `0x001C` | `KC_Y` | Y |
| `0x001D` | `KC_Z` | Z |

## Number row

| keycode | Name | Description |
|---|---|---|
| `0x001E` | `KC_1` | 1 |
| `0x001F` | `KC_2` | 2 |
| `0x0020` | `KC_3` | 3 |
| `0x0021` | `KC_4` | 4 |
| `0x0022` | `KC_5` | 5 |
| `0x0023` | `KC_6` | 6 |
| `0x0024` | `KC_7` | 7 |
| `0x0025` | `KC_8` | 8 |
| `0x0026` | `KC_9` | 9 |
| `0x0027` | `KC_0` | 0 |

## Symbols and editing

| keycode | Name | Description |
|---|---|---|
| `0x0028` | `KC_ENT` | Enter |
| `0x0029` | `KC_ESC` | Esc |
| `0x002A` | `KC_BSPC` | Backspace |
| `0x002B` | `KC_TAB` | Tab |
| `0x002C` | `KC_SPC` | Space |
| `0x002D` | `KC_MINS` | - |
| `0x002E` | `KC_EQL` | = |
| `0x002F` | `KC_LBRC` | [ |
| `0x0030` | `KC_RBRC` | ] |
| `0x0031` | `KC_BSLS` | Backslash `\\` |
| `0x0032` | `KC_NUHS` | Non-US # ~ |
| `0x0033` | `KC_SCLN` | `;` |
| `0x0034` | `KC_QUOT` | `'` |
| `0x0035` | `KC_GRV` | `` ` `` |
| `0x0036` | `KC_COMM` | , |
| `0x0037` | `KC_DOT` | . |
| `0x0038` | `KC_SLSH` | / |
| `0x0039` | `KC_CAPS` | Caps Lock |
| `0x0064` | `KC_NUBS` | Non-US \\ and &#124; |
| `0x0065` | `KC_APP` | Menu / App |

## Function keys F1–F24

| keycode | Name | Description |
|---|---|---|
| `0x003A` | `KC_F1` | F1 |
| `0x003B` | `KC_F2` | F2 |
| `0x003C` | `KC_F3` | F3 |
| `0x003D` | `KC_F4` | F4 |
| `0x003E` | `KC_F5` | F5 |
| `0x003F` | `KC_F6` | F6 |
| `0x0040` | `KC_F7` | F7 |
| `0x0041` | `KC_F8` | F8 |
| `0x0042` | `KC_F9` | F9 |
| `0x0043` | `KC_F10` | F10 |
| `0x0044` | `KC_F11` | F11 |
| `0x0045` | `KC_F12` | F12 |
| `0x0068` | `KC_F13` | F13 |
| `0x0069` | `KC_F14` | F14 |
| `0x006A` | `KC_F15` | F15 |
| `0x006B` | `KC_F16` | F16 |
| `0x006C` | `KC_F17` | F17 |
| `0x006D` | `KC_F18` | F18 |
| `0x006E` | `KC_F19` | F19 |
| `0x006F` | `KC_F20` | F20 |
| `0x0070` | `KC_F21` | F21 |
| `0x0071` | `KC_F22` | F22 |
| `0x0072` | `KC_F23` | F23 |
| `0x0073` | `KC_F24` | F24 |

## System / navigation

| keycode | Name | Description |
|---|---|---|
| `0x0046` | `KC_PSCR` | Print Screen |
| `0x0047` | `KC_SLCK` | Scroll Lock |
| `0x0048` | `KC_PAUS` | Pause |
| `0x0049` | `KC_INS` | Insert |
| `0x004A` | `KC_HOME` | Home |
| `0x004B` | `KC_PGUP` | Page Up |
| `0x004C` | `KC_DEL` | Delete |
| `0x004D` | `KC_END` | End |
| `0x004E` | `KC_PGDN` | Page Down |
| `0x004F` | `KC_RGHT` | → |
| `0x0050` | `KC_LEFT` | ← |
| `0x0051` | `KC_DOWN` | ↓ |
| `0x0052` | `KC_UP` | ↑ |

## Numpad

| keycode | Name | Description |
|---|---|---|
| `0x0053` | `KC_NLCK` | Num Lock |
| `0x0054` | `KC_PSLS` | Numpad ÷ |
| `0x0055` | `KC_PAST` | Numpad × |
| `0x0056` | `KC_PMNS` | Numpad - |
| `0x0057` | `KC_PPLS` | Numpad + |
| `0x0058` | `KC_PENT` | Numpad Enter |
| `0x0059` | `KC_P1` | Numpad 1 |
| `0x005A` | `KC_P2` | Numpad 2 |
| `0x005B` | `KC_P3` | Numpad 3 |
| `0x005C` | `KC_P4` | Numpad 4 |
| `0x005D` | `KC_P5` | Numpad 5 |
| `0x005E` | `KC_P6` | Numpad 6 |
| `0x005F` | `KC_P7` | Numpad 7 |
| `0x0060` | `KC_P8` | Numpad 8 |
| `0x0061` | `KC_P9` | Numpad 9 |
| `0x0062` | `KC_P0` | Numpad 0 |
| `0x0063` | `KC_PDOT` | Numpad . |
| `0x0067` | `KC_PEQL` | Numpad = |
| `0x0085` | `KC_PCMM` | Numpad , |

## Modifier keys

| keycode | Name | Description |
|---|---|---|
| `0x00E0` | `KC_LCTL` | Left Ctrl |
| `0x00E1` | `KC_LSFT` | Left Shift |
| `0x00E2` | `KC_LALT` | Left Alt |
| `0x00E3` | `KC_LGUI` | Left Win / GUI |
| `0x00E4` | `KC_RCTL` | Right Ctrl |
| `0x00E5` | `KC_RSFT` | Right Shift |
| `0x00E6` | `KC_RALT` | Right Alt |
| `0x00E7` | `KC_RGUI` | Right Win / GUI |

## Multimedia / consumer control

| keycode | Name | Description |
|---|---|---|
| `0x00A8` | `KC_MUTE` | Mute |
| `0x00A9` | `KC_VOLU` | Vol + |
| `0x00AA` | `KC_VOLD` | Vol - |
| `0x00AB` | `KC_MNXT` | Next |
| `0x00AC` | `KC_MPRV` | Previous |
| `0x00AD` | `KC_MSTP` | Stop |
| `0x00AE` | `KC_MPLY` | Play/Pause |
| `0x00AF` | `KC_MSEL` | Media Select |
| `0x00B0` | `KC_EJCT` | Eject |
| `0x00BB` | `KC_MFFD` | Fast Forward |
| `0x00BC` | `KC_MRWD` | Rewind |
| `0x00BD` | `KC_BRIU` | Screen Brightness + |
| `0x00BE` | `KC_BRID` | Screen Brightness - |
| `0x00B1` | `KC_MAIL` | Mail |
| `0x00B2` | `KC_CALC` | Calc |
| `0x00B3` | `KC_MYCM` | My Computer |
| `0x00B4` | `KC_WWW_SEARCH` | WWW Search |
| `0x00B5` | `KC_WWW_HOME` | WWW Home |
| `0x00B6` | `KC_WWW_BACK` | WWW Back |
| `0x00B7` | `KC_WWW_FORWARD` | WWW Forward |
| `0x00B8` | `KC_WWW_STOP` | WWW Stop |
| `0x00B9` | `KC_WWW_REFRESH` | WWW Refresh |
| `0x00BA` | `KC_WWW_FAVORITES` | WWW Favorites |

## Power / system

| keycode | Name | Description |
|---|---|---|
| `0x00A5` | `KC_PWR` | Power |
| `0x0066` | `KC_POWER` | Power (OSX) |
| `0x00A6` | `KC_SLEP` | Sleep |
| `0x00A7` | `KC_WAKE` | Wake |

## International / language keys

| keycode | Name | Description |
|---|---|---|
| `0x0087` | `KC_RO` | JIS Ro |
| `0x0088` | `KC_KANA` | かな |
| `0x0089` | `KC_JYEN` | ¥ |
| `0x008A` | `KC_HENK` | 変換 |
| `0x008B` | `KC_MHEN` | 無変換 |
| `0x0090` | `KC_HAEN` | 한영 |
| `0x0091` | `KC_HANJ` | 漢字 |
| `0x008C` | `KC_INT6` |  |
| `0x008D` | `KC_INT7` |  |
| `0x008E` | `KC_INT8` |  |
| `0x008F` | `KC_INT9` |  |
| `0x0092` | `KC_LANG3` |  |
| `0x0093` | `KC_LANG4` |  |
| `0x0094` | `KC_LANG5` |  |
| `0x0095` | `KC_LANG6` |  |
| `0x0096` | `KC_LANG7` |  |
| `0x0097` | `KC_LANG8` |  |
| `0x0098` | `KC_LANG9` |  |

## Application / editing extensions

| keycode | Name | Description |
|---|---|---|
| `0x0074` | `KC_EXECUTE` |  |
| `0x0075` | `KC_HELP` |  |
| `0x0076` | `KC_MENU` |  |
| `0x0077` | `KC_SELECT` |  |
| `0x0078` | `KC_STOP` |  |
| `0x0079` | `KC_AGAIN` |  |
| `0x007A` | `KC_UNDO` |  |
| `0x007B` | `KC_CUT` |  |
| `0x007C` | `KC_COPY` |  |
| `0x007D` | `KC_PASTE` |  |
| `0x007E` | `KC_FIND` |  |
| `0x0099` | `KC_ERAS` | Alt Erase |
| `0x009A` | `KC_SYSREQ` |  |
| `0x009B` | `KC_CANCEL` |  |
| `0x009C` | `KC_CLR` |  |
| `0x009C` | `KC_CLEAR` | Clear (same as KC_CLR) |
| `0x009D` | `KC_PRIOR` |  |
| `0x00A0` | `KC_OUT` |  |
| `0x00A1` | `KC_OPER` |  |
| `0x00A2` | `KC_CLEAR_AGAIN` |  |
| `0x00A3` | `KC_CRSEL` |  |
| `0x00A4` | `KC_EXSEL` |  |
| `0x0082` | `KC_LCAP` |  |
| `0x0083` | `KC_LNUM` |  |
| `0x0084` | `KC_LSCR` |  |
| `0x0086` | `KC_KP_EQUAL_AS400` |  |

## Mouse keys

| keycode | Name | Description |
|---|---|---|
| `0x00CD` | `KC_MS_UP` |  |
| `0x00CE` | `KC_MS_DOWN` |  |
| `0x00CF` | `KC_MS_LEFT` |  |
| `0x00D0` | `KC_MS_RIGHT` |  |
| `0x00D1` | `KC_MS_BTN1` |  |
| `0x00D2` | `KC_MS_BTN2` |  |
| `0x00D3` | `KC_MS_BTN3` |  |
| `0x00D4` | `KC_MS_BTN4` |  |
| `0x00D5` | `KC_MS_BTN5` |  |
| `0x00D6` | `KC_MS_BTN6` |  |
| `0x00D7` | `KC_MS_BTN7` |  |
| `0x00D8` | `KC_MS_BTN8` |  |
| `0x00D9` | `KC_MS_WH_UP` |  |
| `0x00DA` | `KC_MS_WH_DOWN` |  |
| `0x00DB` | `KC_MS_WH_LEFT` |  |
| `0x00DC` | `KC_MS_WH_RIGHT` |  |
| `0x00DD` | `KC_MS_ACCEL0` |  |
| `0x00DE` | `KC_MS_ACCEL1` |  |
| `0x00DF` | `KC_MS_ACCEL2` |  |

## Special keys (Mod-Tap / Grave Esc, etc.)

| keycode | Name | Description |
|---|---|---|
| `0x7C16` | `KC_GESC` | Grave Esc |
| `0x7C1A` | `KC_LSPO` | LSFT / ( |
| `0x7C1B` | `KC_RSPC` | RSFT / ) |
| `0x7C18` | `KC_LCPO` | LCTL / ( |
| `0x7C19` | `KC_RCPC` | RCTL / ) |
| `0x7C1C` | `KC_LAPO` | LALT / ( |
| `0x7C1D` | `KC_RAPC` | RALT / ) |
| `0x7C1E` | `KC_SFTENT` | RSFT / Enter |
| `0x7C00` | `RESET` | Reset / Bootloader |
| `0x7C02` | `DEBUG` | Debug |
| `0x7C03` | `QK_CLEAR_EEPROM` |  |
| `0x7013` | `MAGIC_TOGGLE_NKRO` | Toggle NKRO |
| `0x7017` | `MAGIC_SWAP_LCTL_LGUI` |  |
| `0x7018` | `MAGIC_UNSWAP_LCTL_LGUI` |  |
| `0x7019` | `MAGIC_SWAP_RCTL_RGUI` |  |
| `0x701A` | `MAGIC_UNSWAP_RCTL_RGUI` |  |
| `0x701B` | `MAGIC_SWAP_CTL_GUI` |  |
| `0x701C` | `MAGIC_UNSWAP_CTL_GUI` |  |
| `0x701D` | `MAGIC_TOGGLE_CTL_GUI` |  |
| `0x701E` | `MAGIC_EE_HANDS_LEFT` |  |
| `0x701F` | `MAGIC_EE_HANDS_RIGHT` |  |
| `0x7C17` | `VLK_TOG` |  |
| `0x7C20` | `OUT_AUTO` |  |
| `0x7C21` | `OUT_USB` |  |
| `0x7C11` | `KC_ASUP` |  |
| `0x7C10` | `KC_ASDN` |  |
| `0x7C12` | `KC_ASRP` |  |
| `0x7C15` | `KC_ASTG` |  |
| `0x7C13` | `KC_ASON` |  |
| `0x7C14` | `KC_ASOFF` |  |
| `0x7C77` | `FN_MO13` | Fn1(3) |
| `0x7C78` | `FN_MO23` | Fn2(3) |

## Backlight

| keycode | Name | Description |
|---|---|---|
| `0x7800` | `BL_ON` |  |
| `0x7801` | `BL_OFF` |  |
| `0x7802` | `BL_TOGG` |  |
| `0x7803` | `BL_DEC` |  |
| `0x7804` | `BL_INC` |  |
| `0x7805` | `BL_STEP` |  |
| `0x7806` | `BL_BRTG` |  |

## RGB

| keycode | Name | Description |
|---|---|---|
| `0x7820` | `RGB_TOG` |  |
| `0x7821` | `RGB_MOD` |  |
| `0x7822` | `RGB_RMOD` |  |
| `0x7823` | `RGB_HUI` |  |
| `0x7824` | `RGB_HUD` |  |
| `0x7825` | `RGB_SAI` |  |
| `0x7826` | `RGB_SAD` |  |
| `0x7827` | `RGB_VAI` |  |
| `0x7828` | `RGB_VAD` |  |
| `0x7829` | `RGB_SPI` |  |
| `0x782A` | `RGB_SPD` |  |
| `0x782B` | `RGB_M_P` |  |
| `0x782C` | `RGB_M_B` |  |
| `0x782D` | `RGB_M_R` |  |
| `0x782E` | `RGB_M_SW` |  |
| `0x782F` | `RGB_M_SN` |  |
| `0x7830` | `RGB_M_K` |  |
| `0x7831` | `RGB_M_X` |  |
| `0x7832` | `RGB_M_G` |  |
| `0x7833` | `RGB_MODE_RGBTEST` |  |

## WT Lighting

| keycode | Name | Description |
|---|---|---|
| `0x5F00` | `BR_INC` |  |
| `0x5F01` | `BR_DEC` |  |
| `0x5F02` | `EF_INC` |  |
| `0x5F03` | `EF_DEC` |  |
| `0x5F04` | `ES_INC` |  |
| `0x5F05` | `ES_DEC` |  |
| `0x5F06` | `H1_INC` |  |
| `0x5F07` | `H1_DEC` |  |
| `0x5F08` | `S1_INC` |  |
| `0x5F09` | `S1_DEC` |  |
| `0x5F0A` | `H2_INC` |  |
| `0x5F0B` | `H2_DEC` |  |
| `0x5F0C` | `S2_INC` |  |
| `0x5F0D` | `S2_DEC` |  |

## Audio / Clicky / Music

| keycode | Name | Description |
|---|---|---|
| `0x7480` | `AU_ON` |  |
| `0x7481` | `AU_OFF` |  |
| `0x7482` | `AU_TOG` |  |
| `0x748A` | `CLICKY_TOGGLE` |  |
| `0x748B` | `CLICKY_ENABLE` |  |
| `0x748C` | `CLICKY_DISABLE` |  |
| `0x748D` | `CLICKY_UP` |  |
| `0x748E` | `CLICKY_DOWN` |  |
| `0x748F` | `CLICKY_RESET` |  |
| `0x7490` | `MU_ON` |  |
| `0x7491` | `MU_OFF` |  |
| `0x7492` | `MU_TOG` |  |
| `0x7493` | `MU_MOD` |  |

## Haptic / Combo / Dynamic Macro

| keycode | Name | Description |
|---|---|---|
| `0x7C40` | `HPT_ON` |  |
| `0x7C41` | `HPT_OFF` |  |
| `0x7C42` | `HPT_TOG` |  |
| `0x7C43` | `HPT_RST` |  |
| `0x7C44` | `HPT_FBK` |  |
| `0x7C45` | `HPT_BUZ` |  |
| `0x7C46` | `HPT_MODI` |  |
| `0x7C47` | `HPT_MODD` |  |
| `0x7C48` | `HPT_CONT` |  |
| `0x7C49` | `HPT_CONI` |  |
| `0x7C4A` | `HPT_COND` |  |
| `0x7C4B` | `HPT_DWLI` |  |
| `0x7C4C` | `HPT_DWLD` |  |
| `0x7C50` | `CMB_ON` |  |
| `0x7C51` | `CMB_OFF` |  |
| `0x7C52` | `CMB_TOG` |  |
| `0x7C53` | `DYN_REC_START1` |  |
| `0x7C54` | `DYN_REC_START2` |  |
| `0x7C55` | `DYN_REC_STOP` |  |
| `0x7C56` | `DYN_MACRO_PLAY1` |  |
| `0x7C57` | `DYN_MACRO_PLAY2` |  |

## Layer keys (listed)

Encoding (common VIA / QMK v12):

| Formula | Base |
|---|---|
| `MO(n)` | `0x5100 + n` |
| `TG(n)` | `0x5300 + n` |
| `TT(n)` | `0x5800 + n` |
| `OSL(n)` | `0x5400 + n` |
| `TO(n)` | `0x5010 + n` |
| `DF(n)` | `0x5200 + n` |

| keycode | Name | Description |
|---|---|---|
| `0x5100` | `MO(0)` | Hold to activate layer 0 |
| `0x5101` | `MO(1)` | Hold to activate layer 1 |
| `0x5102` | `MO(2)` | Hold to activate layer 2 |
| `0x5103` | `MO(3)` | Hold to activate layer 3 |
| `0x5104` | `MO(4)` | Hold to activate layer 4 |
| `0x5105` | `MO(5)` | Hold to activate layer 5 |
| `0x5106` | `MO(6)` | Hold to activate layer 6 |
| `0x5107` | `MO(7)` | Hold to activate layer 7 |
| `0x5108` | `MO(8)` | Hold to activate layer 8 |
| `0x5109` | `MO(9)` | Hold to activate layer 9 |
| `0x510A` | `MO(10)` | Hold to activate layer 10 |
| `0x510B` | `MO(11)` | Hold to activate layer 11 |
| `0x510C` | `MO(12)` | Hold to activate layer 12 |
| `0x510D` | `MO(13)` | Hold to activate layer 13 |
| `0x510E` | `MO(14)` | Hold to activate layer 14 |
| `0x510F` | `MO(15)` | Hold to activate layer 15 |
| `0x5110` | `MO(16)` | Hold to activate layer 16 |
| `0x5111` | `MO(17)` | Hold to activate layer 17 |
| `0x5112` | `MO(18)` | Hold to activate layer 18 |
| `0x5113` | `MO(19)` | Hold to activate layer 19 |
| `0x5114` | `MO(20)` | Hold to activate layer 20 |
| `0x5115` | `MO(21)` | Hold to activate layer 21 |
| `0x5116` | `MO(22)` | Hold to activate layer 22 |
| `0x5117` | `MO(23)` | Hold to activate layer 23 |
| `0x5118` | `MO(24)` | Hold to activate layer 24 |
| `0x5119` | `MO(25)` | Hold to activate layer 25 |
| `0x511A` | `MO(26)` | Hold to activate layer 26 |
| `0x511B` | `MO(27)` | Hold to activate layer 27 |
| `0x511C` | `MO(28)` | Hold to activate layer 28 |
| `0x511D` | `MO(29)` | Hold to activate layer 29 |
| `0x511E` | `MO(30)` | Hold to activate layer 30 |
| `0x511F` | `MO(31)` | Hold to activate layer 31 |
| `0x5300` | `TG(0)` | Toggle layer 0 |
| `0x5301` | `TG(1)` | Toggle layer 1 |
| `0x5302` | `TG(2)` | Toggle layer 2 |
| `0x5303` | `TG(3)` | Toggle layer 3 |
| `0x5304` | `TG(4)` | Toggle layer 4 |
| `0x5305` | `TG(5)` | Toggle layer 5 |
| `0x5306` | `TG(6)` | Toggle layer 6 |
| `0x5307` | `TG(7)` | Toggle layer 7 |
| `0x5308` | `TG(8)` | Toggle layer 8 |
| `0x5309` | `TG(9)` | Toggle layer 9 |
| `0x530A` | `TG(10)` | Toggle layer 10 |
| `0x530B` | `TG(11)` | Toggle layer 11 |
| `0x530C` | `TG(12)` | Toggle layer 12 |
| `0x530D` | `TG(13)` | Toggle layer 13 |
| `0x530E` | `TG(14)` | Toggle layer 14 |
| `0x530F` | `TG(15)` | Toggle layer 15 |
| `0x5310` | `TG(16)` | Toggle layer 16 |
| `0x5311` | `TG(17)` | Toggle layer 17 |
| `0x5312` | `TG(18)` | Toggle layer 18 |
| `0x5313` | `TG(19)` | Toggle layer 19 |
| `0x5314` | `TG(20)` | Toggle layer 20 |
| `0x5315` | `TG(21)` | Toggle layer 21 |
| `0x5316` | `TG(22)` | Toggle layer 22 |
| `0x5317` | `TG(23)` | Toggle layer 23 |
| `0x5318` | `TG(24)` | Toggle layer 24 |
| `0x5319` | `TG(25)` | Toggle layer 25 |
| `0x531A` | `TG(26)` | Toggle layer 26 |
| `0x531B` | `TG(27)` | Toggle layer 27 |
| `0x531C` | `TG(28)` | Toggle layer 28 |
| `0x531D` | `TG(29)` | Toggle layer 29 |
| `0x531E` | `TG(30)` | Toggle layer 30 |
| `0x531F` | `TG(31)` | Toggle layer 31 |
| `0x5800` | `TT(0)` | Tap toggle / hold momentary layer 0 |
| `0x5801` | `TT(1)` | Tap toggle / hold momentary layer 1 |
| `0x5802` | `TT(2)` | Tap toggle / hold momentary layer 2 |
| `0x5803` | `TT(3)` | Tap toggle / hold momentary layer 3 |
| `0x5804` | `TT(4)` | Tap toggle / hold momentary layer 4 |
| `0x5805` | `TT(5)` | Tap toggle / hold momentary layer 5 |
| `0x5806` | `TT(6)` | Tap toggle / hold momentary layer 6 |
| `0x5807` | `TT(7)` | Tap toggle / hold momentary layer 7 |
| `0x5808` | `TT(8)` | Tap toggle / hold momentary layer 8 |
| `0x5809` | `TT(9)` | Tap toggle / hold momentary layer 9 |
| `0x580A` | `TT(10)` | Tap toggle / hold momentary layer 10 |
| `0x580B` | `TT(11)` | Tap toggle / hold momentary layer 11 |
| `0x580C` | `TT(12)` | Tap toggle / hold momentary layer 12 |
| `0x580D` | `TT(13)` | Tap toggle / hold momentary layer 13 |
| `0x580E` | `TT(14)` | Tap toggle / hold momentary layer 14 |
| `0x580F` | `TT(15)` | Tap toggle / hold momentary layer 15 |
| `0x5810` | `TT(16)` | Tap toggle / hold momentary layer 16 |
| `0x5811` | `TT(17)` | Tap toggle / hold momentary layer 17 |
| `0x5812` | `TT(18)` | Tap toggle / hold momentary layer 18 |
| `0x5813` | `TT(19)` | Tap toggle / hold momentary layer 19 |
| `0x5814` | `TT(20)` | Tap toggle / hold momentary layer 20 |
| `0x5815` | `TT(21)` | Tap toggle / hold momentary layer 21 |
| `0x5816` | `TT(22)` | Tap toggle / hold momentary layer 22 |
| `0x5817` | `TT(23)` | Tap toggle / hold momentary layer 23 |
| `0x5818` | `TT(24)` | Tap toggle / hold momentary layer 24 |
| `0x5819` | `TT(25)` | Tap toggle / hold momentary layer 25 |
| `0x581A` | `TT(26)` | Tap toggle / hold momentary layer 26 |
| `0x581B` | `TT(27)` | Tap toggle / hold momentary layer 27 |
| `0x581C` | `TT(28)` | Tap toggle / hold momentary layer 28 |
| `0x581D` | `TT(29)` | Tap toggle / hold momentary layer 29 |
| `0x581E` | `TT(30)` | Tap toggle / hold momentary layer 30 |
| `0x581F` | `TT(31)` | Tap toggle / hold momentary layer 31 |
| `0x5400` | `OSL(0)` | One-shot, revert after one key, layer 0 |
| `0x5401` | `OSL(1)` | One-shot, revert after one key, layer 1 |
| `0x5402` | `OSL(2)` | One-shot, revert after one key, layer 2 |
| `0x5403` | `OSL(3)` | One-shot, revert after one key, layer 3 |
| `0x5404` | `OSL(4)` | One-shot, revert after one key, layer 4 |
| `0x5405` | `OSL(5)` | One-shot, revert after one key, layer 5 |
| `0x5406` | `OSL(6)` | One-shot, revert after one key, layer 6 |
| `0x5407` | `OSL(7)` | One-shot, revert after one key, layer 7 |
| `0x5408` | `OSL(8)` | One-shot, revert after one key, layer 8 |
| `0x5409` | `OSL(9)` | One-shot, revert after one key, layer 9 |
| `0x540A` | `OSL(10)` | One-shot, revert after one key, layer 10 |
| `0x540B` | `OSL(11)` | One-shot, revert after one key, layer 11 |
| `0x540C` | `OSL(12)` | One-shot, revert after one key, layer 12 |
| `0x540D` | `OSL(13)` | One-shot, revert after one key, layer 13 |
| `0x540E` | `OSL(14)` | One-shot, revert after one key, layer 14 |
| `0x540F` | `OSL(15)` | One-shot, revert after one key, layer 15 |
| `0x5410` | `OSL(16)` | One-shot, revert after one key, layer 16 |
| `0x5411` | `OSL(17)` | One-shot, revert after one key, layer 17 |
| `0x5412` | `OSL(18)` | One-shot, revert after one key, layer 18 |
| `0x5413` | `OSL(19)` | One-shot, revert after one key, layer 19 |
| `0x5414` | `OSL(20)` | One-shot, revert after one key, layer 20 |
| `0x5415` | `OSL(21)` | One-shot, revert after one key, layer 21 |
| `0x5416` | `OSL(22)` | One-shot, revert after one key, layer 22 |
| `0x5417` | `OSL(23)` | One-shot, revert after one key, layer 23 |
| `0x5418` | `OSL(24)` | One-shot, revert after one key, layer 24 |
| `0x5419` | `OSL(25)` | One-shot, revert after one key, layer 25 |
| `0x541A` | `OSL(26)` | One-shot, revert after one key, layer 26 |
| `0x541B` | `OSL(27)` | One-shot, revert after one key, layer 27 |
| `0x541C` | `OSL(28)` | One-shot, revert after one key, layer 28 |
| `0x541D` | `OSL(29)` | One-shot, revert after one key, layer 29 |
| `0x541E` | `OSL(30)` | One-shot, revert after one key, layer 30 |
| `0x541F` | `OSL(31)` | One-shot, revert after one key, layer 31 |
| `0x5010` | `TO(0)` | Go to layer 0 |
| `0x5011` | `TO(1)` | Go to layer 1 |
| `0x5012` | `TO(2)` | Go to layer 2 |
| `0x5013` | `TO(3)` | Go to layer 3 |
| `0x5014` | `TO(4)` | Go to layer 4 |
| `0x5015` | `TO(5)` | Go to layer 5 |
| `0x5016` | `TO(6)` | Go to layer 6 |
| `0x5017` | `TO(7)` | Go to layer 7 |
| `0x5018` | `TO(8)` | Go to layer 8 |
| `0x5019` | `TO(9)` | Go to layer 9 |
| `0x501A` | `TO(10)` | Go to layer 10 |
| `0x501B` | `TO(11)` | Go to layer 11 |
| `0x501C` | `TO(12)` | Go to layer 12 |
| `0x501D` | `TO(13)` | Go to layer 13 |
| `0x501E` | `TO(14)` | Go to layer 14 |
| `0x501F` | `TO(15)` | Go to layer 15 |
| `0x5200` | `DF(0)` | Set default layer to 0 |
| `0x5201` | `DF(1)` | Set default layer to 1 |
| `0x5202` | `DF(2)` | Set default layer to 2 |
| `0x5203` | `DF(3)` | Set default layer to 3 |
| `0x5204` | `DF(4)` | Set default layer to 4 |
| `0x5205` | `DF(5)` | Set default layer to 5 |
| `0x5206` | `DF(6)` | Set default layer to 6 |
| `0x5207` | `DF(7)` | Set default layer to 7 |
| `0x5208` | `DF(8)` | Set default layer to 8 |
| `0x5209` | `DF(9)` | Set default layer to 9 |
| `0x520A` | `DF(10)` | Set default layer to 10 |
| `0x520B` | `DF(11)` | Set default layer to 11 |
| `0x520C` | `DF(12)` | Set default layer to 12 |
| `0x520D` | `DF(13)` | Set default layer to 13 |
| `0x520E` | `DF(14)` | Set default layer to 14 |
| `0x520F` | `DF(15)` | Set default layer to 15 |
| `0x5210` | `DF(16)` | Set default layer to 16 |
| `0x5211` | `DF(17)` | Set default layer to 17 |
| `0x5212` | `DF(18)` | Set default layer to 18 |
| `0x5213` | `DF(19)` | Set default layer to 19 |
| `0x5214` | `DF(20)` | Set default layer to 20 |
| `0x5215` | `DF(21)` | Set default layer to 21 |
| `0x5216` | `DF(22)` | Set default layer to 22 |
| `0x5217` | `DF(23)` | Set default layer to 23 |
| `0x5218` | `DF(24)` | Set default layer to 24 |
| `0x5219` | `DF(25)` | Set default layer to 25 |
| `0x521A` | `DF(26)` | Set default layer to 26 |
| `0x521B` | `DF(27)` | Set default layer to 27 |
| `0x521C` | `DF(28)` | Set default layer to 28 |
| `0x521D` | `DF(29)` | Set default layer to 29 |
| `0x521E` | `DF(30)` | Set default layer to 30 |
| `0x521F` | `DF(31)` | Set default layer to 31 |
| `0x412C` | `LT(1,KC_SPC)` | Hold layer 1, tap Space |
| `0x422C` | `LT(2,KC_SPC)` | Hold layer 2, tap Space |
| `0x432C` | `LT(3,KC_SPC)` | Hold layer 3, tap Space |

## Macro keys MACRO(n) (VIA v12)

Base `0x7700`: `MACRO(n) = 0x7700 + n` (`n = 0…127`). Macro content: [Macros](./api/macro).

| keycode | Name | Description |
|---|---|---|
| `0x7700` | `MACRO(0)` | Macro slot 0 |
| `0x7701` | `MACRO(1)` | Macro slot 1 |
| `0x7702` | `MACRO(2)` | Macro slot 2 |
| `0x7703` | `MACRO(3)` | Macro slot 3 |
| `0x7704` | `MACRO(4)` | Macro slot 4 |
| `0x7705` | `MACRO(5)` | Macro slot 5 |
| `0x7706` | `MACRO(6)` | Macro slot 6 |
| `0x7707` | `MACRO(7)` | Macro slot 7 |
| `0x7708` | `MACRO(8)` | Macro slot 8 |
| `0x7709` | `MACRO(9)` | Macro slot 9 |
| `0x770A` | `MACRO(10)` | Macro slot 10 |
| `0x770B` | `MACRO(11)` | Macro slot 11 |
| `0x770C` | `MACRO(12)` | Macro slot 12 |
| `0x770D` | `MACRO(13)` | Macro slot 13 |
| `0x770E` | `MACRO(14)` | Macro slot 14 |
| `0x770F` | `MACRO(15)` | Macro slot 15 |
| `0x7710` | `MACRO(16)` | Macro slot 16 |
| `0x7711` | `MACRO(17)` | Macro slot 17 |
| `0x7712` | `MACRO(18)` | Macro slot 18 |
| `0x7713` | `MACRO(19)` | Macro slot 19 |
| `0x7714` | `MACRO(20)` | Macro slot 20 |
| `0x7715` | `MACRO(21)` | Macro slot 21 |
| `0x7716` | `MACRO(22)` | Macro slot 22 |
| `0x7717` | `MACRO(23)` | Macro slot 23 |
| `0x7718` | `MACRO(24)` | Macro slot 24 |
| `0x7719` | `MACRO(25)` | Macro slot 25 |
| `0x771A` | `MACRO(26)` | Macro slot 26 |
| `0x771B` | `MACRO(27)` | Macro slot 27 |
| `0x771C` | `MACRO(28)` | Macro slot 28 |
| `0x771D` | `MACRO(29)` | Macro slot 29 |
| `0x771E` | `MACRO(30)` | Macro slot 30 |
| `0x771F` | `MACRO(31)` | Macro slot 31 |
| `0x7720` | `MACRO(32)` | Macro slot 32 |
| `0x7721` | `MACRO(33)` | Macro slot 33 |
| `0x7722` | `MACRO(34)` | Macro slot 34 |
| `0x7723` | `MACRO(35)` | Macro slot 35 |
| `0x7724` | `MACRO(36)` | Macro slot 36 |
| `0x7725` | `MACRO(37)` | Macro slot 37 |
| `0x7726` | `MACRO(38)` | Macro slot 38 |
| `0x7727` | `MACRO(39)` | Macro slot 39 |
| `0x7728` | `MACRO(40)` | Macro slot 40 |
| `0x7729` | `MACRO(41)` | Macro slot 41 |
| `0x772A` | `MACRO(42)` | Macro slot 42 |
| `0x772B` | `MACRO(43)` | Macro slot 43 |
| `0x772C` | `MACRO(44)` | Macro slot 44 |
| `0x772D` | `MACRO(45)` | Macro slot 45 |
| `0x772E` | `MACRO(46)` | Macro slot 46 |
| `0x772F` | `MACRO(47)` | Macro slot 47 |
| `0x7730` | `MACRO(48)` | Macro slot 48 |
| `0x7731` | `MACRO(49)` | Macro slot 49 |
| `0x7732` | `MACRO(50)` | Macro slot 50 |
| `0x7733` | `MACRO(51)` | Macro slot 51 |
| `0x7734` | `MACRO(52)` | Macro slot 52 |
| `0x7735` | `MACRO(53)` | Macro slot 53 |
| `0x7736` | `MACRO(54)` | Macro slot 54 |
| `0x7737` | `MACRO(55)` | Macro slot 55 |
| `0x7738` | `MACRO(56)` | Macro slot 56 |
| `0x7739` | `MACRO(57)` | Macro slot 57 |
| `0x773A` | `MACRO(58)` | Macro slot 58 |
| `0x773B` | `MACRO(59)` | Macro slot 59 |
| `0x773C` | `MACRO(60)` | Macro slot 60 |
| `0x773D` | `MACRO(61)` | Macro slot 61 |
| `0x773E` | `MACRO(62)` | Macro slot 62 |
| `0x773F` | `MACRO(63)` | Macro slot 63 |
| `0x7740` | `MACRO(64)` | Macro slot 64 |
| `0x7741` | `MACRO(65)` | Macro slot 65 |
| `0x7742` | `MACRO(66)` | Macro slot 66 |
| `0x7743` | `MACRO(67)` | Macro slot 67 |
| `0x7744` | `MACRO(68)` | Macro slot 68 |
| `0x7745` | `MACRO(69)` | Macro slot 69 |
| `0x7746` | `MACRO(70)` | Macro slot 70 |
| `0x7747` | `MACRO(71)` | Macro slot 71 |
| `0x7748` | `MACRO(72)` | Macro slot 72 |
| `0x7749` | `MACRO(73)` | Macro slot 73 |
| `0x774A` | `MACRO(74)` | Macro slot 74 |
| `0x774B` | `MACRO(75)` | Macro slot 75 |
| `0x774C` | `MACRO(76)` | Macro slot 76 |
| `0x774D` | `MACRO(77)` | Macro slot 77 |
| `0x774E` | `MACRO(78)` | Macro slot 78 |
| `0x774F` | `MACRO(79)` | Macro slot 79 |
| `0x7750` | `MACRO(80)` | Macro slot 80 |
| `0x7751` | `MACRO(81)` | Macro slot 81 |
| `0x7752` | `MACRO(82)` | Macro slot 82 |
| `0x7753` | `MACRO(83)` | Macro slot 83 |
| `0x7754` | `MACRO(84)` | Macro slot 84 |
| `0x7755` | `MACRO(85)` | Macro slot 85 |
| `0x7756` | `MACRO(86)` | Macro slot 86 |
| `0x7757` | `MACRO(87)` | Macro slot 87 |
| `0x7758` | `MACRO(88)` | Macro slot 88 |
| `0x7759` | `MACRO(89)` | Macro slot 89 |
| `0x775A` | `MACRO(90)` | Macro slot 90 |
| `0x775B` | `MACRO(91)` | Macro slot 91 |
| `0x775C` | `MACRO(92)` | Macro slot 92 |
| `0x775D` | `MACRO(93)` | Macro slot 93 |
| `0x775E` | `MACRO(94)` | Macro slot 94 |
| `0x775F` | `MACRO(95)` | Macro slot 95 |
| `0x7760` | `MACRO(96)` | Macro slot 96 |
| `0x7761` | `MACRO(97)` | Macro slot 97 |
| `0x7762` | `MACRO(98)` | Macro slot 98 |
| `0x7763` | `MACRO(99)` | Macro slot 99 |
| `0x7764` | `MACRO(100)` | Macro slot 100 |
| `0x7765` | `MACRO(101)` | Macro slot 101 |
| `0x7766` | `MACRO(102)` | Macro slot 102 |
| `0x7767` | `MACRO(103)` | Macro slot 103 |
| `0x7768` | `MACRO(104)` | Macro slot 104 |
| `0x7769` | `MACRO(105)` | Macro slot 105 |
| `0x776A` | `MACRO(106)` | Macro slot 106 |
| `0x776B` | `MACRO(107)` | Macro slot 107 |
| `0x776C` | `MACRO(108)` | Macro slot 108 |
| `0x776D` | `MACRO(109)` | Macro slot 109 |
| `0x776E` | `MACRO(110)` | Macro slot 110 |
| `0x776F` | `MACRO(111)` | Macro slot 111 |
| `0x7770` | `MACRO(112)` | Macro slot 112 |
| `0x7771` | `MACRO(113)` | Macro slot 113 |
| `0x7772` | `MACRO(114)` | Macro slot 114 |
| `0x7773` | `MACRO(115)` | Macro slot 115 |
| `0x7774` | `MACRO(116)` | Macro slot 116 |
| `0x7775` | `MACRO(117)` | Macro slot 117 |
| `0x7776` | `MACRO(118)` | Macro slot 118 |
| `0x7777` | `MACRO(119)` | Macro slot 119 |
| `0x7778` | `MACRO(120)` | Macro slot 120 |
| `0x7779` | `MACRO(121)` | Macro slot 121 |
| `0x777A` | `MACRO(122)` | Macro slot 122 |
| `0x777B` | `MACRO(123)` | Macro slot 123 |
| `0x777C` | `MACRO(124)` | Macro slot 124 |
| `0x777D` | `MACRO(125)` | Macro slot 125 |
| `0x777E` | `MACRO(126)` | Macro slot 126 |
| `0x777F` | `MACRO(127)` | Macro slot 127 |

## Custom keys CUSTOM(n) / QK_KB (VIA v12)

Base `0x7E00`: `CUSTOM(n) = 0x7E00 + n` (`n = 0…255`). Display names follow the keyboard VIA JSON `customKeycodes`.

| keycode | Name | Description |
|---|---|---|
| `0x7E00` | `CUSTOM(0)` | Custom key 0 |
| `0x7E01` | `CUSTOM(1)` | Custom key 1 |
| `0x7E02` | `CUSTOM(2)` | Custom key 2 |
| `0x7E03` | `CUSTOM(3)` | Custom key 3 |
| `0x7E04` | `CUSTOM(4)` | Custom key 4 |
| `0x7E05` | `CUSTOM(5)` | Custom key 5 |
| `0x7E06` | `CUSTOM(6)` | Custom key 6 |
| `0x7E07` | `CUSTOM(7)` | Custom key 7 |
| `0x7E08` | `CUSTOM(8)` | Custom key 8 |
| `0x7E09` | `CUSTOM(9)` | Custom key 9 |
| `0x7E0A` | `CUSTOM(10)` | Custom key 10 |
| `0x7E0B` | `CUSTOM(11)` | Custom key 11 |
| `0x7E0C` | `CUSTOM(12)` | Custom key 12 |
| `0x7E0D` | `CUSTOM(13)` | Custom key 13 |
| `0x7E0E` | `CUSTOM(14)` | Custom key 14 |
| `0x7E0F` | `CUSTOM(15)` | Custom key 15 |
| `0x7E10` | `CUSTOM(16)` | Custom key 16 |
| `0x7E11` | `CUSTOM(17)` | Custom key 17 |
| `0x7E12` | `CUSTOM(18)` | Custom key 18 |
| `0x7E13` | `CUSTOM(19)` | Custom key 19 |
| `0x7E14` | `CUSTOM(20)` | Custom key 20 |
| `0x7E15` | `CUSTOM(21)` | Custom key 21 |
| `0x7E16` | `CUSTOM(22)` | Custom key 22 |
| `0x7E17` | `CUSTOM(23)` | Custom key 23 |
| `0x7E18` | `CUSTOM(24)` | Custom key 24 |
| `0x7E19` | `CUSTOM(25)` | Custom key 25 |
| `0x7E1A` | `CUSTOM(26)` | Custom key 26 |
| `0x7E1B` | `CUSTOM(27)` | Custom key 27 |
| `0x7E1C` | `CUSTOM(28)` | Custom key 28 |
| `0x7E1D` | `CUSTOM(29)` | Custom key 29 |
| `0x7E1E` | `CUSTOM(30)` | Custom key 30 |
| `0x7E1F` | `CUSTOM(31)` | Custom key 31 |
| `0x7E20` | `CUSTOM(32)` | Custom key 32 |
| `0x7E21` | `CUSTOM(33)` | Custom key 33 |
| `0x7E22` | `CUSTOM(34)` | Custom key 34 |
| `0x7E23` | `CUSTOM(35)` | Custom key 35 |
| `0x7E24` | `CUSTOM(36)` | Custom key 36 |
| `0x7E25` | `CUSTOM(37)` | Custom key 37 |
| `0x7E26` | `CUSTOM(38)` | Custom key 38 |
| `0x7E27` | `CUSTOM(39)` | Custom key 39 |
| `0x7E28` | `CUSTOM(40)` | Custom key 40 |
| `0x7E29` | `CUSTOM(41)` | Custom key 41 |
| `0x7E2A` | `CUSTOM(42)` | Custom key 42 |
| `0x7E2B` | `CUSTOM(43)` | Custom key 43 |
| `0x7E2C` | `CUSTOM(44)` | Custom key 44 |
| `0x7E2D` | `CUSTOM(45)` | Custom key 45 |
| `0x7E2E` | `CUSTOM(46)` | Custom key 46 |
| `0x7E2F` | `CUSTOM(47)` | Custom key 47 |
| `0x7E30` | `CUSTOM(48)` | Custom key 48 |
| `0x7E31` | `CUSTOM(49)` | Custom key 49 |
| `0x7E32` | `CUSTOM(50)` | Custom key 50 |
| `0x7E33` | `CUSTOM(51)` | Custom key 51 |
| `0x7E34` | `CUSTOM(52)` | Custom key 52 |
| `0x7E35` | `CUSTOM(53)` | Custom key 53 |
| `0x7E36` | `CUSTOM(54)` | Custom key 54 |
| `0x7E37` | `CUSTOM(55)` | Custom key 55 |
| `0x7E38` | `CUSTOM(56)` | Custom key 56 |
| `0x7E39` | `CUSTOM(57)` | Custom key 57 |
| `0x7E3A` | `CUSTOM(58)` | Custom key 58 |
| `0x7E3B` | `CUSTOM(59)` | Custom key 59 |
| `0x7E3C` | `CUSTOM(60)` | Custom key 60 |
| `0x7E3D` | `CUSTOM(61)` | Custom key 61 |
| `0x7E3E` | `CUSTOM(62)` | Custom key 62 |
| `0x7E3F` | `CUSTOM(63)` | Custom key 63 |
| `0x7E40` | `CUSTOM(64)` | Custom key 64 |
| `0x7E41` | `CUSTOM(65)` | Custom key 65 |
| `0x7E42` | `CUSTOM(66)` | Custom key 66 |
| `0x7E43` | `CUSTOM(67)` | Custom key 67 |
| `0x7E44` | `CUSTOM(68)` | Custom key 68 |
| `0x7E45` | `CUSTOM(69)` | Custom key 69 |
| `0x7E46` | `CUSTOM(70)` | Custom key 70 |
| `0x7E47` | `CUSTOM(71)` | Custom key 71 |
| `0x7E48` | `CUSTOM(72)` | Custom key 72 |
| `0x7E49` | `CUSTOM(73)` | Custom key 73 |
| `0x7E4A` | `CUSTOM(74)` | Custom key 74 |
| `0x7E4B` | `CUSTOM(75)` | Custom key 75 |
| `0x7E4C` | `CUSTOM(76)` | Custom key 76 |
| `0x7E4D` | `CUSTOM(77)` | Custom key 77 |
| `0x7E4E` | `CUSTOM(78)` | Custom key 78 |
| `0x7E4F` | `CUSTOM(79)` | Custom key 79 |
| `0x7E50` | `CUSTOM(80)` | Custom key 80 |
| `0x7E51` | `CUSTOM(81)` | Custom key 81 |
| `0x7E52` | `CUSTOM(82)` | Custom key 82 |
| `0x7E53` | `CUSTOM(83)` | Custom key 83 |
| `0x7E54` | `CUSTOM(84)` | Custom key 84 |
| `0x7E55` | `CUSTOM(85)` | Custom key 85 |
| `0x7E56` | `CUSTOM(86)` | Custom key 86 |
| `0x7E57` | `CUSTOM(87)` | Custom key 87 |
| `0x7E58` | `CUSTOM(88)` | Custom key 88 |
| `0x7E59` | `CUSTOM(89)` | Custom key 89 |
| `0x7E5A` | `CUSTOM(90)` | Custom key 90 |
| `0x7E5B` | `CUSTOM(91)` | Custom key 91 |
| `0x7E5C` | `CUSTOM(92)` | Custom key 92 |
| `0x7E5D` | `CUSTOM(93)` | Custom key 93 |
| `0x7E5E` | `CUSTOM(94)` | Custom key 94 |
| `0x7E5F` | `CUSTOM(95)` | Custom key 95 |
| `0x7E60` | `CUSTOM(96)` | Custom key 96 |
| `0x7E61` | `CUSTOM(97)` | Custom key 97 |
| `0x7E62` | `CUSTOM(98)` | Custom key 98 |
| `0x7E63` | `CUSTOM(99)` | Custom key 99 |
| `0x7E64` | `CUSTOM(100)` | Custom key 100 |
| `0x7E65` | `CUSTOM(101)` | Custom key 101 |
| `0x7E66` | `CUSTOM(102)` | Custom key 102 |
| `0x7E67` | `CUSTOM(103)` | Custom key 103 |
| `0x7E68` | `CUSTOM(104)` | Custom key 104 |
| `0x7E69` | `CUSTOM(105)` | Custom key 105 |
| `0x7E6A` | `CUSTOM(106)` | Custom key 106 |
| `0x7E6B` | `CUSTOM(107)` | Custom key 107 |
| `0x7E6C` | `CUSTOM(108)` | Custom key 108 |
| `0x7E6D` | `CUSTOM(109)` | Custom key 109 |
| `0x7E6E` | `CUSTOM(110)` | Custom key 110 |
| `0x7E6F` | `CUSTOM(111)` | Custom key 111 |
| `0x7E70` | `CUSTOM(112)` | Custom key 112 |
| `0x7E71` | `CUSTOM(113)` | Custom key 113 |
| `0x7E72` | `CUSTOM(114)` | Custom key 114 |
| `0x7E73` | `CUSTOM(115)` | Custom key 115 |
| `0x7E74` | `CUSTOM(116)` | Custom key 116 |
| `0x7E75` | `CUSTOM(117)` | Custom key 117 |
| `0x7E76` | `CUSTOM(118)` | Custom key 118 |
| `0x7E77` | `CUSTOM(119)` | Custom key 119 |
| `0x7E78` | `CUSTOM(120)` | Custom key 120 |
| `0x7E79` | `CUSTOM(121)` | Custom key 121 |
| `0x7E7A` | `CUSTOM(122)` | Custom key 122 |
| `0x7E7B` | `CUSTOM(123)` | Custom key 123 |
| `0x7E7C` | `CUSTOM(124)` | Custom key 124 |
| `0x7E7D` | `CUSTOM(125)` | Custom key 125 |
| `0x7E7E` | `CUSTOM(126)` | Custom key 126 |
| `0x7E7F` | `CUSTOM(127)` | Custom key 127 |
| `0x7E80` | `CUSTOM(128)` | Custom key 128 |
| `0x7E81` | `CUSTOM(129)` | Custom key 129 |
| `0x7E82` | `CUSTOM(130)` | Custom key 130 |
| `0x7E83` | `CUSTOM(131)` | Custom key 131 |
| `0x7E84` | `CUSTOM(132)` | Custom key 132 |
| `0x7E85` | `CUSTOM(133)` | Custom key 133 |
| `0x7E86` | `CUSTOM(134)` | Custom key 134 |
| `0x7E87` | `CUSTOM(135)` | Custom key 135 |
| `0x7E88` | `CUSTOM(136)` | Custom key 136 |
| `0x7E89` | `CUSTOM(137)` | Custom key 137 |
| `0x7E8A` | `CUSTOM(138)` | Custom key 138 |
| `0x7E8B` | `CUSTOM(139)` | Custom key 139 |
| `0x7E8C` | `CUSTOM(140)` | Custom key 140 |
| `0x7E8D` | `CUSTOM(141)` | Custom key 141 |
| `0x7E8E` | `CUSTOM(142)` | Custom key 142 |
| `0x7E8F` | `CUSTOM(143)` | Custom key 143 |
| `0x7E90` | `CUSTOM(144)` | Custom key 144 |
| `0x7E91` | `CUSTOM(145)` | Custom key 145 |
| `0x7E92` | `CUSTOM(146)` | Custom key 146 |
| `0x7E93` | `CUSTOM(147)` | Custom key 147 |
| `0x7E94` | `CUSTOM(148)` | Custom key 148 |
| `0x7E95` | `CUSTOM(149)` | Custom key 149 |
| `0x7E96` | `CUSTOM(150)` | Custom key 150 |
| `0x7E97` | `CUSTOM(151)` | Custom key 151 |
| `0x7E98` | `CUSTOM(152)` | Custom key 152 |
| `0x7E99` | `CUSTOM(153)` | Custom key 153 |
| `0x7E9A` | `CUSTOM(154)` | Custom key 154 |
| `0x7E9B` | `CUSTOM(155)` | Custom key 155 |
| `0x7E9C` | `CUSTOM(156)` | Custom key 156 |
| `0x7E9D` | `CUSTOM(157)` | Custom key 157 |
| `0x7E9E` | `CUSTOM(158)` | Custom key 158 |
| `0x7E9F` | `CUSTOM(159)` | Custom key 159 |
| `0x7EA0` | `CUSTOM(160)` | Custom key 160 |
| `0x7EA1` | `CUSTOM(161)` | Custom key 161 |
| `0x7EA2` | `CUSTOM(162)` | Custom key 162 |
| `0x7EA3` | `CUSTOM(163)` | Custom key 163 |
| `0x7EA4` | `CUSTOM(164)` | Custom key 164 |
| `0x7EA5` | `CUSTOM(165)` | Custom key 165 |
| `0x7EA6` | `CUSTOM(166)` | Custom key 166 |
| `0x7EA7` | `CUSTOM(167)` | Custom key 167 |
| `0x7EA8` | `CUSTOM(168)` | Custom key 168 |
| `0x7EA9` | `CUSTOM(169)` | Custom key 169 |
| `0x7EAA` | `CUSTOM(170)` | Custom key 170 |
| `0x7EAB` | `CUSTOM(171)` | Custom key 171 |
| `0x7EAC` | `CUSTOM(172)` | Custom key 172 |
| `0x7EAD` | `CUSTOM(173)` | Custom key 173 |
| `0x7EAE` | `CUSTOM(174)` | Custom key 174 |
| `0x7EAF` | `CUSTOM(175)` | Custom key 175 |
| `0x7EB0` | `CUSTOM(176)` | Custom key 176 |
| `0x7EB1` | `CUSTOM(177)` | Custom key 177 |
| `0x7EB2` | `CUSTOM(178)` | Custom key 178 |
| `0x7EB3` | `CUSTOM(179)` | Custom key 179 |
| `0x7EB4` | `CUSTOM(180)` | Custom key 180 |
| `0x7EB5` | `CUSTOM(181)` | Custom key 181 |
| `0x7EB6` | `CUSTOM(182)` | Custom key 182 |
| `0x7EB7` | `CUSTOM(183)` | Custom key 183 |
| `0x7EB8` | `CUSTOM(184)` | Custom key 184 |
| `0x7EB9` | `CUSTOM(185)` | Custom key 185 |
| `0x7EBA` | `CUSTOM(186)` | Custom key 186 |
| `0x7EBB` | `CUSTOM(187)` | Custom key 187 |
| `0x7EBC` | `CUSTOM(188)` | Custom key 188 |
| `0x7EBD` | `CUSTOM(189)` | Custom key 189 |
| `0x7EBE` | `CUSTOM(190)` | Custom key 190 |
| `0x7EBF` | `CUSTOM(191)` | Custom key 191 |
| `0x7EC0` | `CUSTOM(192)` | Custom key 192 |
| `0x7EC1` | `CUSTOM(193)` | Custom key 193 |
| `0x7EC2` | `CUSTOM(194)` | Custom key 194 |
| `0x7EC3` | `CUSTOM(195)` | Custom key 195 |
| `0x7EC4` | `CUSTOM(196)` | Custom key 196 |
| `0x7EC5` | `CUSTOM(197)` | Custom key 197 |
| `0x7EC6` | `CUSTOM(198)` | Custom key 198 |
| `0x7EC7` | `CUSTOM(199)` | Custom key 199 |
| `0x7EC8` | `CUSTOM(200)` | Custom key 200 |
| `0x7EC9` | `CUSTOM(201)` | Custom key 201 |
| `0x7ECA` | `CUSTOM(202)` | Custom key 202 |
| `0x7ECB` | `CUSTOM(203)` | Custom key 203 |
| `0x7ECC` | `CUSTOM(204)` | Custom key 204 |
| `0x7ECD` | `CUSTOM(205)` | Custom key 205 |
| `0x7ECE` | `CUSTOM(206)` | Custom key 206 |
| `0x7ECF` | `CUSTOM(207)` | Custom key 207 |
| `0x7ED0` | `CUSTOM(208)` | Custom key 208 |
| `0x7ED1` | `CUSTOM(209)` | Custom key 209 |
| `0x7ED2` | `CUSTOM(210)` | Custom key 210 |
| `0x7ED3` | `CUSTOM(211)` | Custom key 211 |
| `0x7ED4` | `CUSTOM(212)` | Custom key 212 |
| `0x7ED5` | `CUSTOM(213)` | Custom key 213 |
| `0x7ED6` | `CUSTOM(214)` | Custom key 214 |
| `0x7ED7` | `CUSTOM(215)` | Custom key 215 |
| `0x7ED8` | `CUSTOM(216)` | Custom key 216 |
| `0x7ED9` | `CUSTOM(217)` | Custom key 217 |
| `0x7EDA` | `CUSTOM(218)` | Custom key 218 |
| `0x7EDB` | `CUSTOM(219)` | Custom key 219 |
| `0x7EDC` | `CUSTOM(220)` | Custom key 220 |
| `0x7EDD` | `CUSTOM(221)` | Custom key 221 |
| `0x7EDE` | `CUSTOM(222)` | Custom key 222 |
| `0x7EDF` | `CUSTOM(223)` | Custom key 223 |
| `0x7EE0` | `CUSTOM(224)` | Custom key 224 |
| `0x7EE1` | `CUSTOM(225)` | Custom key 225 |
| `0x7EE2` | `CUSTOM(226)` | Custom key 226 |
| `0x7EE3` | `CUSTOM(227)` | Custom key 227 |
| `0x7EE4` | `CUSTOM(228)` | Custom key 228 |
| `0x7EE5` | `CUSTOM(229)` | Custom key 229 |
| `0x7EE6` | `CUSTOM(230)` | Custom key 230 |
| `0x7EE7` | `CUSTOM(231)` | Custom key 231 |
| `0x7EE8` | `CUSTOM(232)` | Custom key 232 |
| `0x7EE9` | `CUSTOM(233)` | Custom key 233 |
| `0x7EEA` | `CUSTOM(234)` | Custom key 234 |
| `0x7EEB` | `CUSTOM(235)` | Custom key 235 |
| `0x7EEC` | `CUSTOM(236)` | Custom key 236 |
| `0x7EED` | `CUSTOM(237)` | Custom key 237 |
| `0x7EEE` | `CUSTOM(238)` | Custom key 238 |
| `0x7EEF` | `CUSTOM(239)` | Custom key 239 |
| `0x7EF0` | `CUSTOM(240)` | Custom key 240 |
| `0x7EF1` | `CUSTOM(241)` | Custom key 241 |
| `0x7EF2` | `CUSTOM(242)` | Custom key 242 |
| `0x7EF3` | `CUSTOM(243)` | Custom key 243 |
| `0x7EF4` | `CUSTOM(244)` | Custom key 244 |
| `0x7EF5` | `CUSTOM(245)` | Custom key 245 |
| `0x7EF6` | `CUSTOM(246)` | Custom key 246 |
| `0x7EF7` | `CUSTOM(247)` | Custom key 247 |
| `0x7EF8` | `CUSTOM(248)` | Custom key 248 |
| `0x7EF9` | `CUSTOM(249)` | Custom key 249 |
| `0x7EFA` | `CUSTOM(250)` | Custom key 250 |
| `0x7EFB` | `CUSTOM(251)` | Custom key 251 |
| `0x7EFC` | `CUSTOM(252)` | Custom key 252 |
| `0x7EFD` | `CUSTOM(253)` | Custom key 253 |
| `0x7EFE` | `CUSTOM(254)` | Custom key 254 |
| `0x7EFF` | `CUSTOM(255)` | Custom key 255 |

## Shift-modified basic keys (`S(kc)` / `LSFT(kc)`)

Formula: `0x0100 | basicKeycode` (left Shift). Other modifiers: see encoding ranges above.

| keycode | Name | Description |
|---|---|---|
| `0x0135` | `S(KC_GRV)` | ~ |
| `0x011E` | `S(KC_1)` | ! |
| `0x011F` | `S(KC_2)` | @ |
| `0x0120` | `S(KC_3)` | # |
| `0x0121` | `S(KC_4)` | $ |
| `0x0122` | `S(KC_5)` | % |
| `0x0123` | `S(KC_6)` | ^ |
| `0x0124` | `S(KC_7)` | & |
| `0x0125` | `S(KC_8)` | * |
| `0x0126` | `S(KC_9)` | ( |
| `0x0127` | `S(KC_0)` | ) |
| `0x012D` | `S(KC_MINS)` | _ |
| `0x012E` | `S(KC_EQL)` | + |
| `0x012F` | `S(KC_LBRC)` | { |
| `0x0130` | `S(KC_RBRC)` | } |
| `0x0131` | `S(KC_BSLS)` | &#124; |
| `0x0133` | `S(KC_SCLN)` | : |
| `0x0134` | `S(KC_QUOT)` | " |
| `0x0136` | `S(KC_COMM)` | < |
| `0x0137` | `S(KC_DOT)` | > |
| `0x0138` | `S(KC_SLSH)` | ? |

---

## Comparison with vendor keyboard key values

| | Vendor keyboard SDK | QMK SDK |
|---|---|---|
| Width | 3 bytes | 2 bytes |
| Letter A | `{ type:0x10, code1:0, code2:0x04 }` | `0x0004` |
| Transparent | `code2:0x01` | `0x0001` |
| Macro | `type:0x60/0x61` | keymap `MACRO(n)` + macro buffer |
