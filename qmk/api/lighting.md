# 灯光

VIA Custom 菜单通道：`0x07` 写、`0x08` 读、`0x09` 保存。具体 `channel` / `value_id` 由固件与 VIA JSON（Lighting 菜单）决定。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 依赖固件定义 | 无统一「亮度档位」表；以 VIA JSON `content: [id, channel, valueId]` 为准 |
| 写后需保存 | `setLightingValue` 会自动 `saveCustomMenu(channel)` |
| 通道约定 | `0` custom · `1` backlight · `2` rgblight · `3` rgb matrix · `4` audio |

---

## 读取自定义项

`ServiceQmk.getCustomMenuValue(commandBytes)`

VIA `0x08`。常见 `commandBytes = [channel, valueId]`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `commandBytes` | `number[]` | 通常 `[channel, id]` |

### 返回值

`Promise<number[]>` — value 字节（color 常为 `[hue, sat]`）

### 使用示例

```js
import { CustomChannel } from '@rdmctmzt/sdk-qmk'

// 示例：读 rgb matrix 某 valueId（以固件为准）
const [brightness] = await ServiceQmk.getCustomMenuValue([
  CustomChannel.RGB_MATRIX,
  0, // value_id：亮度等，以 VIA JSON 为准
])
```

---

## 写入自定义项

`ServiceQmk.setCustomMenuValue(...args)`

VIA `0x07`。只写不保存。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `...args` | `number[]` | 通常 `channel, id, ...values` |

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.setCustomMenuValue(3, 0, 128)
await ServiceQmk.saveCustomMenu(3)
```

---

## 保存自定义通道

`ServiceQmk.saveCustomMenu(channel)`

VIA `0x09`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `channel` | `number` | 通道号 |

### 返回值

`Promise<void>`

---

## 写入并保存灯光值

`ServiceQmk.setLightingValue(channel, id, ...values)`

封装：`setCustomMenuValue` + `saveCustomMenu`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `channel` | `number` | 通道 |
| `id` | `number` | value_id |
| `...values` | `number[]` | range/dropdown 一个值；color 为 `hue, sat` |

### 返回值

`Promise<void>`

### 使用示例

```js
import { CustomChannel } from '@rdmctmzt/sdk-qmk'

await ServiceQmk.setLightingValue(CustomChannel.RGB_MATRIX, 0, 200)
// 颜色示例
await ServiceQmk.setLightingValue(CustomChannel.RGB_MATRIX, 3, 128, 255)
```
