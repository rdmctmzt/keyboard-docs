# Keycode table

Remapped keys and default keys use **3 bytes** in the protocol:

```
{ type, code1, code2 }
```

Aligned with driver `customkeys` + `getKeyName` / `setKeyMatrixData`.

## Notes

| Condition | Description |
|---|---|
| With remap APIs | `setKey` / `getKeymap` read and write these three bytes |
| Macros are not played by editing `list` alone | Bind a physical key with `type=0x60` / `0x61`; see macro keys below |
| Pass-through key | `type=0x10` (or 0), `code1=0`, `code2=0x01`, shown as `▽` |
| HID usage | Normal keys use keyboard HID usage in `code2`, not `KeyboardEvent.code` |

```js
await ServiceKeyboard.setKey(0, 12, { type: 0x10, code1: 0, code2: 0x04 }) // A
```

---

## type overview

| type | Decimal | Category | code1 / code2 meaning |
|---|---|---|---|
| `0x10` | 16 | Normal keyboard key | `code1`=modifier bitmask; `code2`=HID Usage |
| `0x12` | 18 | Shortcut combo | Same as `0x10` (driver UI “Shortcut”) |
| `0x20` | 32 | System power | `code1`=`0x81/0x82/0x83`; `code2` usually 0 |
| `0x30` | 48 | Multimedia / consumer control | `code1`=Usage; `code2`=page/extra (often 0/1/2) |
| `0x40` | 64 | Mouse button | See mouse table below |
| `0x50` | 80 | Special (Fn/light/mode, etc.) | `code1`=function id; `code2` usually 0 |
| `0x60` | 96 | Macro | `code1`=macro slot; `code2`=0 play once / 1 hold loop / 3 toggle |
| `0x61` | 97 | Macro (fixed count) | `code1`=macro slot; `code2`=count 2–255 |

Pass-through (transparent): `type=0x10` (or 0), `code1=0`, `code2=0x01`, shown as `▽`.

---

## 0x10 / 0x12 normal and combo keys

### Modifier bitmask (code1)

Bitwise OR (left/right modifiers share high/low nibble rules, same as driver):

| bit | Value | Modifier |
|---|---|---|
| 0 | `0x01` | LCtrl (alone may map to `0xE0`) |
| 1 | `0x02` | LShift |
| 2 | `0x04` | LAlt |
| 3 | `0x08` | LGUI / Win |
| 4 | `0x10` | RCtrl |
| 5 | `0x20` | RShift |
| 6 | `0x40` | RAlt |
| 7 | `0x80` | RGUI |

Modifier only, no main key: `code2=0`, `code1` from the table above.

### Common HID Usage (code2)

| code2 | Key | code2 | Key |
|---|---|---|---|
| `0x04`–`0x1d` | A–Z | `0x1e`–`0x27` | 1–0 |
| `0x28` | Enter | `0x29` | Esc |
| `0x2a` | Backspace | `0x2b` | Tab |
| `0x2c` | Space | `0x2d` | `-` |
| `0x2e` | `=` | `0x2f` / `0x30` | `[` / `]` |
| `0x31` | `\` | `0x33` / `0x34` | `;` / `'` |
| `0x35` | `` ` `` | `0x36`–`0x38` | `,` `.` `/` |
| `0x39` | Caps | `0x3a`–`0x45` | F1–F12 |
| `0x46` | PrtSc | `0x47` | Scroll |
| `0x48` | Pause | `0x49` | Insert |
| `0x4a` | Home | `0x4b` | PageUp |
| `0x4c` | Delete | `0x4d` | End |
| `0x4e` | PageDown | `0x4f`–`0x52` | → ← ↓ ↑ |
| `0x53`–`0x63` | Numpad | `0x65` | Menu / App |

### Examples

```js
// A
{ type: 0x10, code1: 0, code2: 0x04 }

// Ctrl+C (Shortcut; 0x10 also works)
{ type: 0x12, code1: 0x01, code2: 0x06 }

// LCtrl alone
{ type: 0x10, code1: 0x01, code2: 0 }
```

---

## 0x20 system keys

| Name | type | code1 | code2 |
|---|---|---|---|
| Power | `0x20` | `0x81` (129) | 0 |
| Sleep | `0x20` | `0x82` (130) | 0 |
| WakeUp | `0x20` | `0x83` (131) | 0 |

---

## 0x30 multimedia keys (common)

`code1` is Usage; `code2` is extra page (0/1/2).

| Name | code1 | code2 |
|---|---|---|
| Volume + | 233 | 0 |
| Volume - | 234 | 0 |
| Mute | 226 | 0 |
| Play/Pause | 205 | 0 |
| Stop | 183 | 0 |
| Prev Track | 182 | 0 |
| Next Track | 181 | 0 |
| Multimedia | 131 | 1 |
| Screen Bright + | 111 | 0 |
| Screen Bright - | 112 | 0 |
| Homepage | 35 | 2 |
| Web Search | 33 | 2 |
| Web Favorites | 42 | 2 |
| Calculator | 146 | 1 |
| Mail | 138 | 1 |
| My Computer | 148 | 1 |

Full list: driver `customkeys` → Media group.

---

## 0x40 mouse keys

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

## 0x50 special function keys (code1)

`type=0x50`, `code2` usually 0. `code1` is function id (aligned with driver `customKeys`):

| code1 | Function |
|---|---|
| 1–4 | Fn0–Fn3 |
| 5–8 | To0–To3 (switch to layer) |
| 9 | Backlight toggle |
| 10 / 11 | Backlight mode + / − |
| 12 / 13 | Backlight hue + / − |
| 14 / 15 | Backlight brightness + / − |
| 16 / 17 | Backlight speed + / − |
| 18 | Color board |
| 19–23 | Custom light 1–5 |
| 24 | LOGO light toggle |
| 25–32 | LOGO mode/hue/brightness/speed ± |
| 33 | Side light toggle |
| 34–41 | Side mode/hue/brightness/speed ± |
| 42 | Matrix light toggle |
| 43–50 | Matrix mode/hue/brightness/speed ± |
| 51 | Reset |
| 52–54 | BLE mode 1–3 |
| 55 | 2.4G mode |
| 56 | USB mode |
| 57 | Battery display |
| 58 | 6-key / NKRO toggle |
| 59 | Mac/Win toggle |
| 60 | Win lock toggle |
| 61 | WASD toggle |
| 62 | Polling rate / latency step |
| 63 | F-row mode toggle |
| 64 | Wheel function toggle |
| 65 | System power related toggle |
| 66–69 | LCD power/mode/GIF/USB |
| 70–72 | Wheel left/right/confirm |
| 74 | LED Test |

---

## 0x60 / 0x61 macro keys {#macro-keys}

| type | code1 | code2 | Meaning |
|---|---|---|---|
| `0x60` | Macro slot index | Loop type (see table) | Standard macro bind |
| `0x61` | Macro slot index | Repeat count `2–255` | Play N times |

### Loop types

| `code2` | Meaning |
|---|---|
| `0` | Play once (default) |
| `1` | Loop while held |
| `3` | Press to start, press again to stop |

For N>1 plays use `0x61` (`code2`=count). Macro content: `getMacros` / `setMacros`; playback mode is only on the remap side. See [Macros · Macro type](./api/macro#macro-type-remap).

---

## Remap examples

```js
// Normal key
await ServiceKeyboard.setKey(0, 0, { type: 0x10, code1: 0, code2: 0x29 }) // Esc

// Multimedia
await ServiceKeyboard.setKey(0, 1, { type: 0x30, code1: 233, code2: 0 }) // Vol+

// Special: backlight toggle
await ServiceKeyboard.setKey(0, 2, { type: 0x50, code1: 9, code2: 0 })

// Macro slot 0: play once
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })

// Macro slot 0: hold loop / toggle / play 5 times
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 1 })
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 3 })
await ServiceKeyboard.setKey(0, 3, { type: 0x61, code1: 0, code2: 5 })
```

Related: [Layout / remapping](./api/key) · [Command reference](./api/commands) · [Macros](./api/macro)
