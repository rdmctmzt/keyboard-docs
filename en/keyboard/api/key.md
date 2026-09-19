# Layout / remapping

User-remappable layers and default keymaps: 128 keys per layer, 3 bytes per key `{ type, code1, code2 }`.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | Read/write fails when not connected |
| Prefer `getDeviceInfo()` first | Confirm `protocolVer`; some key values / special keys depend on protocol |
| Layer `0–3` | Behavior undefined outside this range |
| Key slot `0–127` | Firmware slot, not layout JSON array index, not `row * 21 + col` |
| Correct index | Match layout `code` using the [factory keymap](#key-index) |
| Key value meaning | See [Keycode table](../keycodes); macro binding uses `0x60` / `0x61` |

---

## Read user keymap {#read-keymap}

`ServiceKeyboard.getKeymap(layer?)`

Reads the current user-layer keymap.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `layer` | `number` | `0` | Layer `0–3` |

### Returns

`Promise<KeyEntry[]>`

| Field | Type | Description |
|---|---|---|
| `index` | `number` | Key slot `0–127` |
| `layer` | `number` | Layer |
| `type` | `number` | Key value type |
| `code1` | `number` | See [Keycode table](../keycodes) |
| `code2` | `number` | See keycode table |

### Example

```js
await ServiceKeyboard.getDeviceInfo()
const keys = await ServiceKeyboard.getKeymap(0)
```

---

## Read factory keymap

`ServiceKeyboard.getDefaultKeymap(layer?)`

Reads the factory default keymap (read-only).

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `layer` | `number` | `0` | Layer `0–3` |

### Returns

Same as [Read user keymap](#read-keymap).

### Example

```js
const defaults = await ServiceKeyboard.getDefaultKeymap(0)
```

---

## Remap a single key

`ServiceKeyboard.setKey(layer, index, key)`

Writes one key on the user layer.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `layer` | `number` | Layer `0–3` |
| `index` | `number` | Key slot `0–127` |
| `key.type` | `number` | Key value type |
| `key.code1` | `number` | First data byte |
| `key.code2` | `number` | Second data byte |

### Returns

`Promise<void>`

### Example

```js
await ServiceKeyboard.setKey(0, 12, {
  type: 0x10,
  code1: 0,
  code2: 0x04, // A
})
```

Protocol commands: [Commands](./commands). Custom per-key lighting uses the same key slot index; for LED position see [Lighting · key to LED](./lighting#led-index).

---

## How to get the correct key index {#key-index}

The `index` for `setKey` / `getKeymap` is the index in the firmware’s 128 slots (3 bytes each). Layout JSON order, `x`/`y`, or a computed `row * 21 + col` **must not** be used as this index.

After the driver connects (`updateDefaultKeys`):

1. Each layout key has a `code` (HID usage, e.g. Esc=`41`, F1=`58`). JSON `index` is only a placeholder.
2. Read layer 0 factory keymap.
3. Find the first factory entry matching layout `code`; that index is the remap index.

For normal keys: when `type === 0x10` and `code1 === 0`, the value is `code2`; modifier-only keys map `code1` to `0xE0`–`0xE7` (same as driver `getKeyCode`).

```js
function layoutCodeOf(key) {
  if (key.type === 0x10 && key.code1 !== 0) {
    const mod = {
      0x01: 0xe0, 0x02: 0xe1, 0x04: 0xe2, 0x08: 0xe3,
      0x10: 0xe4, 0x20: 0xe5, 0x40: 0xe6, 0x80: 0xe7,
    }
    return mod[key.code1] ?? key.code2
  }
  return key.code2
}

const defaults = await ServiceKeyboard.getDefaultKeymap(0)
// layoutCode from this model’s layout JSON key.code, e.g. Esc = 41
const index = defaults.findIndex((k) => layoutCodeOf(k) === 41)
await ServiceKeyboard.setKey(0, index, { type: 0x10, code1: 0, code2: 0x04 })
```

When the same `code` appears multiple times, take the **first** matching slot like the driver. Knob left/center/right slots use [Encoder](./encoder) `getEncoderWheel()` — do not guess.
