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
别名（对齐驱动）：`ServiceQmk.commitCustomMenu(channel)`

VIA `0x09`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `channel` | `number` | 通道号 |

### 返回值

`Promise<void>`

---

## 解析 VIA menus 灯效列表

`parseMenusToLightingEffects(menus, rule?)`  
实例方法：`ServiceQmk.parseMenusToLightingEffects(menus, rule?)`  
驱动风格别名：`ServiceQmk.PARSE_MENUS_TO_LIGHTING_EFFECTS(menus, rule?)`

纯解析，不发 HID。从 VIA JSON `menus` 里找出 `label === 'Lighting'` 的菜单，按 contentId 前缀分组：

| contentId 前缀 | 分组 key |
|---|---|
| `id_qmk_rgb_matrix_` | `backlight` |
| `id_qmk_rgblight_` | `logo` |
| `id_qmk_audio_` | `side` |
| `id_qmk_Lattice_` | `lattice` |

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `menus` | `ViaMenu[]` | VIA 定义里的 `menus` |
| `rule` | `LightingParseRule?` | 默认 `DEFAULT_LIGHTING_PARSE_RULE` |

### 返回值

`ParsedLightingResult`：`effects` / `maxBrightness` / `maxSpeed`

### 使用示例

```js
import {
  parseMenusToLightingEffects,
  DEFAULT_LIGHTING_PARSE_RULE,
} from '@rdmctmzt/sdk-qmk'

const parsed = parseMenusToLightingEffects(viaDefinition.menus)
// 或 ServiceQmk.PARSE_MENUS_TO_LIGHTING_EFFECTS(viaDefinition.menus)
console.log(parsed.effects.backlight, parsed.maxBrightness.backlight)
```

相关：`parseLightingGroup`、`evaluateViaShowIf`（`showIf` 含 `!= N` 时按当前 effect 值判断控件可见）。

---

## 读取当前灯光状态

`ServiceQmk.getLightingState(menus)`

按 Lighting 菜单遍历 `range` / `dropdown` / `color`，对每项发 `CUSTOM_MENU_GET_VALUE`。  
`color` 写入 `${contentId}_hue` / `${contentId}_sat`，并保留 `contentId = hue`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `menus` | `ViaMenu[]` | 同 VIA JSON `menus` |

### 返回值

`Promise<Record<string, number>>`

### 使用示例

```js
const state = await ServiceQmk.getLightingState(viaDefinition.menus)
const brightness = state['id_qmk_rgb_matrix_brightness']
```

独立函数：`readLightingStateFromMenus(menus, getCustomMenuValue)`。

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
