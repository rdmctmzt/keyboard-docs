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
别名（对齐驱动）：`ServiceQmk.readRawMatrix(matrix, layer)`

返回长度 `rows * cols` 的 keycode 数组（行优先：`index = row * cols + col`）。  
`protocol ≥ 8` 走 buffer（`0x12`）；`== 7` 逐键（`0x04`）。

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
// 或：await ServiceQmk.readRawMatrix(matrix, 0)
const keyAt23 = layer0[2 * 15 + 3]
```

---

## 读回后如何处理 keycode {#process-after-read}

`getKey` / `getKeymap` / `readRawMatrix` 返回的已经是 **16-bit QMK keycode**（或 keycode 数组），不是厂商三字节键值。

### 1. 数组下标

```js
const matrix = { rows: definition.matrix.rows, cols: definition.matrix.cols }
const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)

// 行优先
const index = row * matrix.cols + col
const keycode = layer0[index]
```

行列来自 VIA JSON 的 `matrix` 与 `layouts.keymap` 里的 `"row,col"`，见 [VIA JSON](../via-json)。

### 2. 把数字变成可用信息

| keycode 范围 / 形态 | 怎么用 |
|---|---|
| `0x0000` | 空键 `KC_NO` |
| `0x0001` | 穿透 `KC_TRNS` |
| `0x0004`–基本键 | 查 [键值表](../keycodes)，如 `0x0004` = `KC_A` |
| `MACRO(n)`（VIA v12 约 `0x7700+n`） | `n` 为宏槽；内容用 `getMacros()` |
| `CUSTOM(n)` / `QK_KB` | 显示名用 VIA JSON `customKeycodes` |
| `LT` / `MO` / `MT` 等 | 按 [键值表 · 高级键编码范围](../keycodes) 拆 layer / mods |

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

宏槽内容的解析见 [宏 · 读回后如何处理](./macro#process-after-read)。写回仍用 `setKey` / `setKeymap`，参数是 16-bit 数字。

---

## 写多层 keymap

`ServiceQmk.setKeymap(matrix, keymap)`  
别名（对齐驱动）：`ServiceQmk.writeRawMatrix(matrix, keymap)`

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
