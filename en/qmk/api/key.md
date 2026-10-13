# Layout and remapping

Dynamic keymap: read and write **16-bit QMK keycodes** by **layer + row + column** (big-endian on the wire).

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | Fails when not connected |
| Read protocol version first | `≥8` uses buffer fast path; `7` is per-key |
| Rows/cols from layout | `rows`/`cols` match VIA JSON `matrix`, not vendor 0–127 linear index |
| Keycode meaning | See [Keycode table](../keycodes) |
| Clear | `clearAllKeymaps()` restores firmware default keymap |

---

## Read a single key

`ServiceQmk.getKey(layer, row, col)`

VIA `0x04`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `layer` | `number` | Layer index |
| `row` | `number` | Row |
| `col` | `number` | Column |

### Returns

`Promise<number>` — 16-bit keycode

### Example

```js
const kc = await ServiceQmk.getKey(0, 2, 3)
```

---

## Write a single key

`ServiceQmk.setKey(layer, row, col, keycode)`

VIA `0x05`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `layer` | `number` | Layer index |
| `row` | `number` | Row |
| `col` | `number` | Column |
| `keycode` | `number` | 16-bit QMK keycode, e.g. `0x0004` = `KC_A` |

### Returns

`Promise<number>` — keycode echoed by device

### Example

```js
await ServiceQmk.setKey(0, 2, 3, 0x0004) // KC_A
```

---

## Read one layer keymap

`ServiceQmk.getKeymap(matrix, layer)`

Returns a keycode array of length `rows * cols` (row-major: `index = row * cols + col`).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `matrix.rows` | `number` | Row count |
| `matrix.cols` | `number` | Column count |
| `layer` | `number` | Layer index |

### Returns

`Promise<number[]>`

### Example

```js
const matrix = { rows: 5, cols: 15 }
const layer0 = await ServiceQmk.getKeymap(matrix, 0)
const keyAt23 = layer0[2 * 15 + 3]
```

---

## Process keycodes after read {#process-after-read}

`getKey` / `getKeymap` / `readRawMatrix` return **16-bit QMK keycodes** (or keycode arrays), not vendor 3-byte key values.

### 1. Array index

```js
const matrix = { rows: definition.matrix.rows, cols: definition.matrix.cols }
const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)

// Row-major
const index = row * matrix.cols + col
const keycode = layer0[index]
```

Row and column come from VIA JSON `matrix` and `"row,col"` in `layouts.keymap`; see [VIA JSON](../via-json).

### 2. Turn numbers into usable information

| Keycode range / shape | Usage |
|---|---|
| `0x0000` | Empty `KC_NO` |
| `0x0001` | Transparent `KC_TRNS` |
| `0x0004`–basic keys | See [Keycode table](../keycodes), e.g. `0x0004` = `KC_A` |
| `MACRO(n)` (VIA v12 ~ `0x7700+n`) | `n` is macro slot; content via `getMacros()` |
| `CUSTOM(n)` / `QK_KB` | Display names from VIA JSON `customKeycodes` |
| `LT` / `MO` / `MT` etc. | Split layer / mods per [Keycode table · advanced ranges](../keycodes) |

```js
function describeQmkKey(keycode, customKeycodes = []) {
  if (keycode === 0x0000) return { kind: 'empty' }
  if (keycode === 0x0001) return { kind: 'transparent', label: '▽' }

  // VIA v12 MACRO(n)
  if (keycode >= 0x7700 && keycode <= 0x777f) {
    return { kind: 'macro', slot: keycode - 0x7700 }
  }

  // VIA v12 CUSTOM(n)
  if (keycode >= 0x7e00 && keycode <= 0x7eff) {
    const n = keycode - 0x7e00
    const custom = customKeycodes[n]
    return {
      kind: 'custom',
      slot: n,
      name: custom?.name ?? `CUSTOM(${n})`,
    }
  }

  return { kind: 'keycode', keycode }
}

const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)
const ui = layer0.map((keycode, index) => ({
  row: Math.floor(index / matrix.cols),
  col: index % matrix.cols,
  ...describeQmkKey(keycode, definition.customKeycodes),
}))
```

Macro slot parsing: [Macros · Process macros after read](./macro#process-after-read). Write back still uses `setKey` / `setKeymap` with 16-bit numbers.

---

## Write multi-layer keymap

`ServiceQmk.setKeymap(matrix, keymap)`

`keymap[layer][index]` is the keycode; `index = row * cols + col`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `matrix` | `{ rows, cols }` | Matrix size |
| `keymap` | `number[][]` | Multiple layers; each layer length should be `rows * cols` |

### Returns

`Promise<void>`

### Example

```js
const matrix = { rows: 5, cols: 15 }
const layer0 = await ServiceQmk.getKeymap(matrix, 0)
layer0[2 * 15 + 3] = 0x0004
await ServiceQmk.setKeymap(matrix, [layer0])
```

---

## Clear dynamic keymap

`ServiceQmk.clearAllKeymaps()`

VIA `0x06`; restores firmware default keymap.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.clearAllKeymaps()
```

---

## Low-level buffer (optional)

`getKeymapBuffer(offset, size)` / `setKeymapBuffer(offset, data)`

VIA `0x12` / `0x13`. Max **28** bytes per call. Prefer `getKeymap` / `setKeymap` in application code.

---

## SDK API names (see Chinese docs for full detail)

- `readRawMatrix`
- `writeRawMatrix`
