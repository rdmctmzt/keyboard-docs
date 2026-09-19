# Macros

## Notes

| Condition | Description |
|---|---|
| Commands | Mouse macro read/write is `0x24` / `0x25` (keyboard uses `0x2c`/`0x2d`) |
| `info.macroSize` | Buffer bytes = `macroSize × 256`; when `0` the SDK falls back to **1096** bytes |
| Slots | Recommended `0–15` |

```js
const info = await ServiceMouse.getDeviceInfo()
const macros = await ServiceMouse.getMacros()
```

Macro content (`list`) and playback behavior are separate:

| Part | Where it lives | Role |
|---|---|---|
| `MacroProfile.list` | Macro buffer (`getMacros` / `setMacros`) | Sequence and timing of key actions |
| Remap `type=0x60` / `0x61` | Key matrix (`setKey` / `getKeymap`) | Which slot to trigger and loop / repeat behavior |

---

## Macro types (key remapping side) {#macro-type-remap}

Playback mode is **not stored in the macro buffer**; bind it on a physical key with keycode types:

| `type` | `code1` | `code2` | Meaning |
|---|---|---|---|
| `0x60` | Macro slot `0–15` | Loop type (see table below) | Standard macro binding |
| `0x61` | Macro slot `0–15` | Repeat count `2–255` | Fixed play count (run N times where N>1) |

### Loop types

| `code2` | Meaning |
|---|---|
| `0` | Run **once** (default) |
| `1` | Loop while held |
| `3` | Press to start, press again to stop |

### Example

```js
// Slot 0: play once
await ServiceMouse.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })

// Slot 0: loop while held
await ServiceMouse.setKey(0, 3, { type: 0x60, code1: 0, code2: 1 })

// Slot 0: play 5 times
await ServiceMouse.setKey(0, 3, { type: 0x61, code1: 0, code2: 5 })
```

Full keycode details: [Keycodes · 0x60 / 0x61 macro keys](../keycodes#macro-keys).

---

## Read macros

`ServiceMouse.getMacros()`

Reads macro slots from the device.

### Parameters

None.

### Returns

`Promise<MacroProfile[]>`

#### Macro slot structure

| Field | Type | Description |
|---|---|---|
| `key` | `number` | Slot `0–15`; remap `code1` when binding macro |
| `name` | `string?` | Display name; not stored on device; SDK fills `M0`/`M1`… on read |
| `type` | `number?` | **Compatibility field**; defaults to `0` on read, **not written** to macro buffer |
| `replayCnt` | `number?` | **Compatibility field**; defaults to `1` on read, **not written** to macro buffer |
| `list` | `MacroAction[]` | Action sequence (actual buffer content) |

#### Action sequence

| Field | Type | Description |
|---|---|---|
| `type` | `'keyboard' \| 'mouse'` | Keyboard HID / mouse button |
| `code` | `number` | `keyboard`: HID usage |
| `button` | `number` | `mouse`: button code (1 left / 2 right / 4 middle …) |
| `down` | `boolean` | `true` press, `false` release |
| `delayMs` | `number` | Delay after previous step; SDK clamps to 10–10000 when encoding; first step fixed at 10 |

### Example

```js
const macros = await ServiceMouse.getMacros()
```

---

## Write macros

`ServiceMouse.setMacros(profiles)`

Overwrites the device macro area; writes by `key` slot.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `profiles` | `MacroProfile[]` | Write by `key` slot; empty `list` clears that slot |

### Returns

`Promise<void>`

### Example

```js
await ServiceMouse.setMacros([
  {
    key: 0,
    name: 'Double-click left',
    list: [
      { type: 'mouse', button: 1, down: true, delayMs: 10 },
      { type: 'mouse', button: 1, down: false, delayMs: 30 },
      { type: 'mouse', button: 1, down: true, delayMs: 30 },
      { type: 'mouse', button: 1, down: false, delayMs: 30 },
    ],
  },
])

// Bind to a side button
await ServiceMouse.setKey(0, 0, { type: 0x60, code1: 0, code2: 0 })
```
