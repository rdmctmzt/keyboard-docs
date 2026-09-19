# Keycode table

Remappable keys and default keys use **3 bytes** in the protocol:

```
{ type, code1, code2 }
```

Mouse remapping shares most `type` definitions with the keyboard; it also has a **mouse function key table** (`0x50` numbering differs from keyboard) and **rapid-fire keys** (`0x70`).

## Notes

| Condition | Description |
|---|---|
| With remapping APIs | `setKey` / `getKeymap` read and write these three bytes |
| Macros are not played by editing `list` | Bind a physical key with `type=0x60` / `0x61` |
| `0x50` numbering | **Do not use the keyboard special-function table**; see mouse function keys below |
| HID usage | For normal keys, `code2` is keyboard HID usage, not `KeyboardEvent.code` |

```js
await ServiceMouse.setKey(0, 4, { type: 0x40, code1: 0, code2: 2 }) // right button
```

---

## type overview

| type | Decimal | Category | code1 / code2 meaning |
|---|---|---|---|
| `0x10` | 16 | Normal keyboard key | `code1`=modifier bitmask; `code2`=HID Usage |
| `0x12` | 18 | Shortcut combination | Same as `0x10` |
| `0x20` | 32 | System power | `code1`=`0x81/0x82/0x83`; `code2` often 0 |
| `0x30` | 48 | Multimedia / consumer control | `code1`=Usage; `code2`=page/extra |
| `0x40` | 64 | Mouse button | See mouse table below |
| `0x50` | 80 | Mouse special function | `code1`=function id (**mouse table**); `code2` often 0 |
| `0x60` | 96 | Macro | `code1`=macro slot; `code2`=loop type |
| `0x61` | 97 | Macro (fixed repeat count) | `code1`=macro slot; `code2`=count 2–255 |
| `0x70` | 112 | Rapid-fire key | `code1`=interval unit; `code2`=count / hold behavior |

---

## 0x10 / 0x12 normal and combo keys

### Modifier bitmask (code1)

| bit | Value | Modifier |
|---|---|---|
| 0 | `0x01` | LCtrl |
| 1 | `0x02` | LShift |
| 2 | `0x04` | LAlt |
| 3 | `0x08` | LGUI / Win |
| 4 | `0x10` | RCtrl |
| 5 | `0x20` | RShift |
| 6 | `0x40` | RAlt |
| 7 | `0x80` | RGUI |

### Common HID Usage (code2)

| code2 | Key | code2 | Key |
|---|---|---|---|
| `0x04`–`0x1d` | A–Z | `0x1e`–`0x27` | 1–0 |
| `0x28` | Enter | `0x29` | Esc |
| `0x2a` | Backspace | `0x2b` | Tab |
| `0x2c` | Space | `0x3a`–`0x45` | F1–F12 |

```js
// Ctrl+C
{ type: 0x12, code1: 0x01, code2: 0x06 }
```

---

## 0x20 system keys

| Name | type | code1 | code2 |
|---|---|---|---|
| Power | `0x20` | `0x81` | 0 |
| Sleep | `0x20` | `0x82` | 0 |
| WakeUp | `0x20` | `0x83` | 0 |

---

## 0x30 multimedia keys (common)

| Name | code1 | code2 |
|---|---|---|
| Volume + | 233 | 0 |
| Volume - | 234 | 0 |
| Mute | 226 | 0 |
| Play/Pause | 205 | 0 |
| Prev Track | 182 | 0 |
| Next Track | 181 | 0 |

---

## 0x40 mouse buttons

| Name | code1 | code2 |
|---|---|---|
| Left | 0 | 1 |
| Right | 0 | 2 |
| Middle | 0 | 4 |
| Back | 0 | 8 |
| Forward | 0 | 16 |
| Scroll up | 5 | 1 |
| Scroll down | 6 | 1 |

---

## 0x50 mouse special function keys (code1)

`type=0x50`, `code2` is usually 0. IDs align with firmware `Keyboard_Function_Type` (**not the keyboard table**):

| code1 | Function | code |
|---|---|---|
| `0x01` | Fn0 | `KEY_MO0` |
| `0x02` | Key lighting toggle | `BL_TOG` |
| `0x03` / `0x04` | Lighting mode + / − | `BL_MOD` / `BL_RMOD` |
| `0x05` / `0x06` | Lighting color + / − | `BL_HUI` / `BL_HUD` |
| `0x07` / `0x08` | Lighting brightness + / − | `BL_VAI` / `BL_VAD` |
| `0x09` / `0x0a` | Lighting speed + / − | `BL_SPI` / `BL_SPD` |
| `0x0b` | Custom lighting 1 | `BL_DEFINE1` |
| `0x0c` | Reset | `KYE_RESET` |
| `0x0d`–`0x0f` | Bluetooth channel 1–3 | `MODE_BLE1`… |
| `0x10` | 2.4G mode | `MODE_2P4G` |
| `0x11` | USB mode | `MODE_USB` |
| `0x12` | Battery display | `BATT_STATUS` |
| `0x13` | Scan delay | `KYE_SCAK_DELAY_SET` |
| `0x14` | Parameter switch (short press CPI, long press 3s switches report rate) | `KEY_CPI_SET` |
| `0x15` | Mode switch (short press BT channel, long press 3s pairing) | `KEY_MODE_SET` |

```js
// Parameter switch key
{ type: 0x50, code1: 0x14, code2: 0 }
```

---

## 0x60 / 0x61 macro keys {#macro-keys}

| type | code1 | code2 |
|---|---|---|
| `0x60` | Macro slot `0–15` | `0` play once / `1` loop while held / `3` toggle play |
| `0x61` | Macro slot `0–15` | Repeat count `2–255` |

See [Macros](./api/macro).

---

## 0x70 rapid-fire key

By default emits **left click**.

| Field | Meaning |
|---|---|
| `code1` | Interval unit: `0` = default 2ms; otherwise `N × 2` ms (max 255×2) |
| `code2` | `0` = repeat at interval while held; `1–255` = number of clicks |

```js
// 8ms interval, repeat while held
{ type: 0x70, code1: 4, code2: 0 }

// 4ms interval, 5 clicks
{ type: 0x70, code1: 2, code2: 5 }
```
