# Key remapping

User layers and default layers: 128 keys per layer, 3 bytes each `{ type, code1, code2 }`.

Physical buttons are far fewer than 128; use `getDefaultKeymap` plus layout JSON `index` to map left/right buttons, side buttons, DPI key, etc.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | Read/write fails when not connected |
| Prefer `getDeviceInfo()` first | — |
| Layer `0–3` | Behavior undefined if out of range |
| Key index `0–127` | Matrix index, not physical position number |
| Keycode meaning | See [Keycodes](../keycodes); mouse function keys `0x50`, rapid-fire `0x70`, macros `0x60`/`0x61` |

```js
await ServiceMouse.getDeviceInfo()
const keys = await ServiceMouse.getKeymap(0)
const defaults = await ServiceMouse.getDefaultKeymap(0)
```

---

## Read user keymap {#read-keymap}

`ServiceMouse.getKeymap(layer?)`

Reads the user keymap for the given layer.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `layer` | `number` | `0` | Layer `0–3` |

### Returns

`Promise<KeyEntry[]>`

| Field | Type | Description |
|---|---|---|
| `index` | `number` | Key index `0–127` |
| `layer` | `number` | Layer |
| `type` | `number` | Keycode type |
| `code1` | `number` | See [Keycodes](../keycodes) |
| `code2` | `number` | See keycode table |

### Example

```js
const keys = await ServiceMouse.getKeymap(0)
```

---

## Process key values after read {#process-after-read}

`getKeymap` / `getDefaultKeymap` already return `KeyEntry[]`; branch on `type`.

### 1. Valid slots and physical buttons

The mouse has far fewer physical buttons than 128 slots. Read `getDefaultKeymap(0)` first to identify left / right / middle / side / DPI slots, then read the same `index` on the user layer for the current binding.

| Case | Condition |
|---|---|
| Empty | `type`, `code1`, and `code2` all `0` |
| Transparent | `type === 0x10` (or `0`) and `code2 === 0x01` and `code1 === 0` |

### 2. Read usable data by `type`

| `type` | Fields | Notes |
|---|---|---|
| `0x10` / `0x12` | `code1` modifiers, `code2` HID usage | Keyboard keys |
| `0x40` | `code2` mouse button bits | `1` left / `2` right / `4` middle / `8` back / `16` forward |
| `0x50` | `code1` function id | e.g. `0x14` DPI / parameter switch |
| `0x60` / `0x61` | `code1` macro slot; `code2` loop or count | Content in `getMacros()` |
| `0x70` | `code1` interval step; `code2` count | Rapid-fire key |

```js
const defaults = await ServiceMouse.getDefaultKeymap(0)
const keys = await ServiceMouse.getKeymap(0)

function isLeftButton(key) {
  return key.type === 0x40 && key.code2 === 1
}

const leftIndex = defaults.find((k) => isLeftButton(k))?.index
const leftNow = keys.find((k) => k.index === leftIndex)
```

Macro binding assembly matches the keyboard SDK; see [Macros · Process macros after read](./macro#process-after-read). Key value details: [Keycodes](../keycodes).

---

## Read factory default keymap

`ServiceMouse.getDefaultKeymap(layer?)`

Reads factory default keymap (read-only); same structure as `getKeymap`.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `layer` | `number` | `0` | Layer `0–3` |

### Returns

`Promise<KeyEntry[]>` — same as `getKeymap`.

### Example

```js
const defaults = await ServiceMouse.getDefaultKeymap(0)
```

Commonly used to map default `type=0x40` mouse keys to UI slots (left / right / middle / back / forward / DPI).

---

## Remap a single key

`ServiceMouse.setKey(layer, index, key)`

Writes 3-byte keycode for one key on one layer.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `layer` | `number` | Layer `0–3` |
| `index` | `number` | Key index `0–127` |
| `key.type` | `number` | Keycode type |
| `key.code1` | `number` | First data byte |
| `key.code2` | `number` | Second data byte |

### Returns

`Promise<void>`

### Example

```js
// Remap a key to right mouse button
await ServiceMouse.setKey(0, 4, {
  type: 0x40,
  code1: 0,
  code2: 2,
})

// Parameter switch (mouse function KEY_CPI_SET)
await ServiceMouse.setKey(0, 6, {
  type: 0x50,
  code1: 0x14,
  code2: 0,
})

// Rapid-fire: 8ms interval, repeat while held
await ServiceMouse.setKey(0, 1, {
  type: 0x70,
  code1: 4, // 4×2ms = 8ms; 0 means default 2ms
  code2: 0, // 0 = repeat while held; >0 = click count
})
```

---

## Common physical keys → default matrix

Example for a 1K mouse layout (exact index from `getDefaultKeymap`):

| UI | Default type / code2 (mouse button) |
|---|---|
| Left | `0x40` / `1` |
| Right | `0x40` / `2` |
| Middle | `0x40` / `4` |
| Back | `0x40` / `8` |
| Forward | `0x40` / `16` |
| DPI / parameter switch | Often `0x50` / `code1=0x14` |
