# 编码器

动态编码器键码：每层、每个编码器的顺时针 / 逆时针各绑定一个 16-bit keycode。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 依赖固件 | 无编码器的键盘调用可能无意义或失败 |
| `id` | 编码器索引，从 0 起，与 VIA JSON 一致 |

---

## 读取编码器键码

`ServiceQmk.getEncoder(layer, id, clockwise)`

VIA `0x14`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层 |
| `id` | `number` | 编码器索引 |
| `clockwise` | `boolean` | `true` 顺时针，`false` 逆时针 |

### 返回值

`Promise<number>` — 16-bit keycode

### 使用示例

```js
const cw = await ServiceQmk.getEncoder(0, 0, true)
const ccw = await ServiceQmk.getEncoder(0, 0, false)
```

---

## 设置编码器键码

`ServiceQmk.setEncoder(layer, id, clockwise, keycode)`

VIA `0x15`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层 |
| `id` | `number` | 编码器索引 |
| `clockwise` | `boolean` | 方向 |
| `keycode` | `number` | 16-bit QMK keycode |

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.setEncoder(0, 0, true, 0x00ea)  // 示例：音量+
await ServiceQmk.setEncoder(0, 0, false, 0x00e9) // 示例：音量-
```

---

## 读取绑定结构

`ServiceQmk.getEncoderBinding(layer, id, clockwise)`

同 `getEncoder`，返回对象。

### 返回值

`Promise<EncoderBinding>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层 |
| `id` | `number` | 编码器索引 |
| `clockwise` | `boolean` | 方向 |
| `keycode` | `number` | 键码 |
