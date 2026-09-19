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
