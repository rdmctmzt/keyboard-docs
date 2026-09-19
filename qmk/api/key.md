# 布局 / 改键

动态 keymap：按 **层 + 行 + 列** 读写 **16-bit QMK keycode**（线上大端）。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | 未连接会失败 |
| 先读协议版本 | `≥8` 用 buffer 快路径；`7` 逐键 |
| 行列来自布局 | `rows`/`cols` 与 VIA JSON `matrix` 一致，不是厂商 0–127 线性下标 |
| 键值含义 | 见 [键值表](../keycodes) |
| 清空 | `clearAllKeymaps()` 恢复固件默认 keymap |

---

## 读单个键

`ServiceQmk.getKey(layer, row, col)`

VIA `0x04`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层号 |
| `row` | `number` | 行 |
| `col` | `number` | 列 |

### 返回值

`Promise<number>` — 16-bit keycode

### 使用示例

```js
const kc = await ServiceQmk.getKey(0, 2, 3)
```

---

## 写单个键

`ServiceQmk.setKey(layer, row, col, keycode)`

VIA `0x05`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层号 |
| `row` | `number` | 行 |
| `col` | `number` | 列 |
| `keycode` | `number` | 16-bit QMK keycode，如 `0x0004` = `KC_A` |

### 返回值

`Promise<number>` — 设备回显的 keycode

### 使用示例

```js
await ServiceQmk.setKey(0, 2, 3, 0x0004) // KC_A
```

---

## 读一层 keymap

`ServiceQmk.getKeymap(matrix, layer)`

返回长度 `rows * cols` 的 keycode 数组（行优先：`index = row * cols + col`）。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `matrix.rows` | `number` | 行数 |
| `matrix.cols` | `number` | 列数 |
| `layer` | `number` | 层号 |

### 返回值

`Promise<number[]>`

### 使用示例

```js
const matrix = { rows: 5, cols: 15 }
const layer0 = await ServiceQmk.getKeymap(matrix, 0)
const keyAt23 = layer0[2 * 15 + 3]
```

---

## 写多层 keymap

`ServiceQmk.setKeymap(matrix, keymap)`

`keymap[layer][index]` 为 keycode；`index = row * cols + col`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `matrix` | `{ rows, cols }` | 矩阵尺寸 |
| `keymap` | `number[][]` | 多层；每层长度应为 `rows * cols` |

### 返回值

`Promise<void>`

### 使用示例

```js
const matrix = { rows: 5, cols: 15 }
const layer0 = await ServiceQmk.getKeymap(matrix, 0)
layer0[2 * 15 + 3] = 0x0004
await ServiceQmk.setKeymap(matrix, [layer0])
```

---

## 清空动态 keymap

`ServiceQmk.clearAllKeymaps()`

VIA `0x06`，恢复为固件默认 keymap。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.clearAllKeymaps()
```

---

## 底层 buffer（可选）

`getKeymapBuffer(offset, size)` / `setKeymapBuffer(offset, data)`

VIA `0x12` / `0x13`。单次 `size` 最大 **28**。一般优先用 `getKeymap` / `setKeymap`。
