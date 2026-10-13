# VIA JSON：获取、校验与处理

VIA JSON（keyboard definition）描述 QMK 键盘的 **矩阵尺寸**、**UI 布局**、**灯光 menus**、**customKeycodes** 等。

接入 `@rdmctmzt/sdk-qmk` 时：JSON 提供 **布局与 UI 语义**；**键值真源**仍是设备经 VIA 读回的 **16-bit keycode**。

## 与三套 SDK 的关系

| 产品形态 | 是否需要 VIA JSON | 键位读写 |
|---|---|---|
| QMK / VIA 键盘 | **需要** | [布局/改键](./api/key) |
| 厂商键盘 `@rdmctmzt/sdk-keyboard` | 不需要 | [键盘 SDK · 改键](/keyboard/api/key) |
| 鼠标 `@rdmctmzt/sdk-mouse` | 不需要 | [鼠标 SDK · 按键映射](/mouse/api/keyRemapping) |

---

## 一、JSON 从哪来

业务侧自己准备定义文件，常见来源：

| 来源 | 说明 |
|---|---|
| QMK / VIA 工程导出 | 与固件矩阵、VIA 定义一致的 keyboard definition |
| 产品内置资源 | 按型号随应用分发；按 USB VID/PID 匹配当前设备 |
| 用户导入 | 选择本地 `.json`；校验通过后再用于当前会话 |
| 2.4G 接收器 | 单独一份定义时，**VID/PID 写接收器 APP 口**，不是无线键本体的身份 PID |

不要把 JSON 里的 `KC_*` 字符串当成设备当前键值。当前键值以 SDK 读回为准。

---

## 二、必填字段与校验

`JSON.parse` 之后至少校验：

| 字段 | 类型 / 示例 | 用途 |
|---|---|---|
| `name` | 字符串 | 显示名 |
| `vendorId` | 字符串，如 `"0x0000"` | 与当前 HID APP 口 VID 一致（`parseInt(..., 16)`）。按实际设备填写，不要写死某一款 |
| `productId` | 字符串，如 `"0x0000"` | 与当前 HID APP 口 PID 一致。按实际设备填写，不要写死某一款 |
| `matrix.rows` / `matrix.cols` | 正整数 | `readRawMatrix(matrix, layer)` 的长度与索引 |
| `layouts.keymap` | VIA / KLE 数组 | 每个键的 `"row,col"` 与键帽几何 |

校验失败应拒绝使用，并提示缺字段或非法 JSON（标准 JSON **不允许注释**）。

### 常用可选字段

| 字段 | 用途 |
|---|---|
| `menus` | 交给 `PARSE_MENUS_TO_LIGHTING_EFFECTS` / `getLightingState`，见 [灯光](./api/lighting) |
| `customKeycodes` | 自定义键显示名，见 [键值表 · CUSTOM](./keycodes) |
| `keycodes` | 如 `["qmk_lighting"]`，声明固件 VIA 能力 |
| `layouts.keys` | 少数布局直接给出 UI 键数组 |

---

## 三、推荐处理流程

连接设备后按这个顺序使用 SDK：

```
加载并校验 JSON → init → 读协议/层数 → 逐层 readRawMatrix
  → 用 keymap 把 raw 映射到 UI →（可选）解析 menus → 展示/编辑
  → setKey / setKeymap / 灯光 Custom 写回
```

### 1. 加载定义

1. 读取 JSON 文本并 `JSON.parse`。
2. 用上一节规则校验必填字段。
3. 把 `vendorId` / `productId` 与当前 HID 设备比对；不一致不要应用到这台设备。
4. 2.4G 场景比对 **接收器** 的 VID/PID。

### 2. 初始化 QMK 会话

见 [开始 · 授权并初始化](./index#_2-授权并初始化)。

```js
import QmkKeyboard from '@rdmctmzt/sdk-qmk'

const vendorId = 0x0000
const productId = 0x0000
const ServiceQmk = new QmkKeyboard({
  configs: [{ vendorId, productId, usagePage: 0xff60, usage: 0x61 }],
})

const devices = await ServiceQmk.getDevices()
await ServiceQmk.init(devices[0].id)
```

### 3. 读固件键值

```js
const definition = /* 已校验的 VIA JSON 对象 */
const ver = await ServiceQmk.getProtocolVersion()
const layerCount = await ServiceQmk.getLayerCount()
const matrix = {
  rows: definition.matrix.rows,
  cols: definition.matrix.cols,
}

const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)
// layer0.length === rows * cols，每项为 uint16 QMK keycode
```

- JSON 里的 `"row,col"` 只用于把 raw 下标映射到 UI。
- 当前键值以 `readRawMatrix` / `getKeymap` 读回为准。

### 4. 把 raw 合并到 UI

对每一层 raw 数组：

1. 遍历 `layouts.keymap` 中的 `"row,col"`。
2. 用 `index = row * cols + col` 取 `layer0[index]`。
3. 得到每个键帽的 keycode、显示名、几何位置。

物理预览坐标若与 VIA 坐标不一致，再用自有布局数据修正预览，不要改设备读回的 keycode。

### 5. 灯光与 customKeycodes

```js
if (definition.customKeycodes?.length) {
  // 业务侧用这些条目解析自定义键显示名
}

const parsed = ServiceQmk.PARSE_MENUS_TO_LIGHTING_EFFECTS(definition.menus)
const state = await ServiceQmk.getLightingState(definition.menus)
// 写回：setCustomValue / commitCustomMenu，见灯光文档
```

`channel` / `value_id` 以 JSON `menus` 与固件为准，没有全局统一亮度表。

### 6. 改键写回

编辑完成后写设备，例如：

- 单键：`setKey(layer, row, col, keycode)`
- 整层 / 多层：`setKeymap(matrix, keymap)` / `writeRawMatrix`

改键不需要再导入 JSON。只有 `menus`、`matrix`、`keymap` 结构变化时，才换新 JSON 并重新读层。

---

## 四、keymap 结构说明

`layouts.keymap` 是 VIA / KLE 风格的二维数组：

- 元数据对象：`{ w, h, x, y, c, … }`
- 字符串 `"row,col"` 表示矩阵坐标
- 末尾可跟 QMK 键码字符串，**只作默认标签**

`matrix.rows` / `cols` 必须与固件 VIA 定义一致，否则键位错位，或读层长度错误。

---

## 五、常见问题

| 现象 | 处理 |
|---|---|
| 定义无法应用到当前设备 | JSON 的 VID/PID 与当前 HID 不一致；2.4G 误用了无线键 PID |
| 键位全乱 | `matrix` 或 keymap 的 `row,col` 与固件不一致 |
| 灯效列表空 | 缺 `menus`，或固件未声明 `qmk_lighting` |
| 校验失败 | 缺必填字段；JSON 含注释；编码不是 UTF-8 |
| SDK 读键正常但 UI 不对 | 没有用 `layouts.keymap` 把 raw 映射到 UI |

---

## 相关文档

| 主题 | 链接 |
|---|---|
| QMK 接入 | [开始](./index) |
| 矩阵读写 | [布局/改键](./api/key) |
| menus / 灯光 | [灯光](./api/lighting) |
| `matrix` / `ViaMenu` 类型 | [参数类型](./types) |
| VIA 命令字 | [命令说明](./api/commands) |
