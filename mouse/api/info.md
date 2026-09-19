# 基础的设备信息

读取**信息区**（CMD `0x12`）。这是设备「能力表」：固件版本、按键/宏容量、灯光能力，以及鼠标特有的传感器型号、回报率上限、DPI 组上限。

功能区里的 DPI 组数、回报率档位，都依赖这里的上限字段做 UI 约束。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 优先于其它业务 | 改功能区、宏、改键前建议先读 |
| 结果会缓存 | `getCachedDeviceInfo()`；`close` / 断开 / 重新 `init` 会清空 |
| 布局与键盘不同 | 字节 0–18 与键盘同结构；**19–21** 为鼠标专用（sensor / 回报率上限 / DPI 组上限） |

---

## 读取设备信息

`ServiceMouse.getDeviceInfo()`

读取信息区并缓存。未缓存时 `getFuncInfo` / 宏等接口会自动再读一次。

### 参数

无。

### 返回值

`Promise<DeviceInfo>` — 字段见下方 [字段总表](#字段总表)。

### 使用示例

```js
const info = await ServiceMouse.getDeviceInfo()

// DPI 组数不要超过固件上限
const maxGroups = info.dpiGroupMax || 8

// 宏缓冲：macroSize × 256；为 0 时 SDK 回退 1096 字节
const macros = await ServiceMouse.getMacros()
```

---

## 功能能力判断

多数高级能力依赖信息区上限与标志位。SDK **不会**因能力位为假而自动拦截调用；无硬件时可能超时或返回无效数据，业务侧应先判断再调用。

| 功能 | 判断条件 | 相关文档 |
|---|---|---|
| 灯光字段 | `info.showLight === true` | [性能 / DPI](./performance)（功能区 `light`） |
| 宏 | `info.macroSize` 决定缓冲；为 0 时 SDK 回退 1096 字节 | [宏](./macro) |
| DPI 组 | `info.dpiGroupMax` 为组数上限（常见 ≤ 8） | [性能 / DPI](./performance) |
| 回报率 | 以 `info.reportRateMax` 与固件枚举为准；功能区常用 125/250/500/1000 | [性能 / DPI](./performance) |
| 电量 | 鼠标命令表固定有 `0x28` | [全局设置](./globalSetting#getbatterystatus) |

---

## 字段总表

### 基础身份

| 字段 | 类型 | 说明 |
|---|---|---|
| `vendorId` | `number` | USB VID（小端拼成 16bit） |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | 固件版本号 |
| `protocolVer` | `number` | 协议版本字段（鼠标走固定 `CMD_MOUSE`，不按键盘 V1–V4 切表） |
| `profile` | `number` | 当前板载配置档位 |
| `keyboardID` | `number` | 型号 ID（字段名沿用信息区布局） |
| `keyboardType` | `number` | 类型字段 |

### 键位 / 宏容量

| 字段 | 类型 | 说明 |
|---|---|---|
| `keyMatrixSize` | `number` | 按键矩阵规模 |
| `macroSize` | `number` | 宏空间单位。**实际字节数 = `macroSize × 256`**。为 0 时 SDK 回退 1096 字节 |

### 灯光能力

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLight` | `boolean` | 是否具备灯效 |
| `lightSize` | `number` | 灯效模式数量 |
| `lightMaxBrightness` | `number` | 亮度上限 |
| `lightMaxSpeed` | `number` | 速度上限 |
| `lightKeySize` | `number` | 可独立控色灯位数量 |

### 鼠标专用

| 字段 | 类型 | 说明 |
|---|---|---|
| `sensorModel` | `number` | 传感器型号码（固件定义） |
| `reportRateMax` | `number` | 回报率上限码（固件定义） |
| `dpiGroupMax` | `number` | DPI 组上限（常见 1–8） |

---

## 和功能区的关系

| 信息区字段 | 影响 |
|---|---|
| `macroSize` | `getMacros` / `setMacros` 缓冲长度 |
| `dpiGroupMax` | UI 可配置的 DPI 组数上限 |
| `reportRateMax` | UI 可选回报率档位上限 |
| `showLight` | 是否展示 / 写入功能区 `light` 字段 |
