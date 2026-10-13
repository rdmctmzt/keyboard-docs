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

## Process key values after read {#process-after-read}

`getKeymap` / `getDefaultKeymap` already return `KeyEntry[]`; you do not need to unpack binary. Each element is a usable 3-byte key value — branch on `type`.

### 1. Check whether the slot is valid

| Case | Condition | Suggestion |
|---|---|---|
| Empty / unused | `type === 0` and `code1 === 0` and `code2 === 0` | UI may hide or label as “empty” |
| Transparent | `type === 0x10` (or `0`) and `code1 === 0` and `code2 === 0x01` | Show `▽` (pass-through to lower layer) |
| Valid key | Other | Parse using the branches below |

Physical keys use only part of the `0–127` slots. Layout mapping: [How to get the correct key index](#key-index).

### 2. Split by `type` into business data

| `type` | How to read fields | Typical use |
|---|---|---|
| `0x10` / `0x12` | `code1` = modifier mask; `code2` = keyboard HID usage | Normal keys, shortcuts. Labels from [Keycode table](../keycodes) |
| `0x20` | `code1` = system function (e.g. power) | System keys |
| `0x30` | `code1` = media usage | Volume, playback, etc. |
| `0x40` | `code2` = mouse button bits (`1` left / `2` right / `4` middle / `8` back / `16` forward) | Mouse buttons |
| `0x50` | `code1` = special function id | Fn, layer switch, lighting toggle, etc. |
| `0x60` | `code1` = macro slot; `code2` = loop type `0/1/3` | Macro bind; content in `getMacros()` |
| `0x61` | `code1` = macro slot; `code2` = play count `2–255` | Macro bind with fixed repeat count |

```js
function describeKey(key) {
  const { type, code1, code2 } = key
  if (type === 0 && code1 === 0 && code2 === 0) return { kind: 'empty' }
  if ((type === 0x10 || type === 0) && code1 === 0 && code2 === 0x01) {
    return { kind: 'transparent', label: '▽' }
  }
  if (type === 0x10 || type === 0x12) {
    return { kind: 'keyboard', mods: code1, usage: code2 }
  }
  if (type === 0x40) {
    return { kind: 'mouse', button: code2 }
  }
  if (type === 0x60) {
    return { kind: 'macro', slot: code1, loop: code2 }
  }
  if (type === 0x61) {
    return { kind: 'macro', slot: code1, times: code2 }
  }
  if (type === 0x50) {
    return { kind: 'special', fn: code1 }
  }
  return { kind: 'other', type, code1, code2 }
}

const keys = await ServiceKeyboard.getKeymap(0)
const uiKeys = keys.map((key) => ({
  index: key.index,
  layer: key.layer,
  ...describeKey(key),
}))
```

### 3. Match macro keys to the macro buffer

When `type === 0x60` / `0x61`:

1. `code1` is the macro slot number.
2. Use `getMacros()` and `profiles.find(p => p.key === code1)`.
3. Actions are in `profile.list`; playback mode comes only from the key’s `code2`, not `profile.replayCnt`.

Full action parsing: [Macros · Process macros after read](./macro#process-after-read).

### 4. Write back after editing

UI / editing uses the fields above. Writing to the device still assembles `{ type, code1, code2 }` and calls `setKey`. Do not write display names or macro `list` into the keymap.

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
