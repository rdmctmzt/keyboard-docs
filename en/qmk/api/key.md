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
