# 基础的设备信息

读取**信息区**（CMD `0x12`）。这是设备「能力表」：固件版本、按键/宏容量、灯光能力，以及鼠标特有的传感器型号、回报率上限、DPI 组上限。

功能区里的 DPI 组数、回报率档位，都依赖这里的上限字段做 UI 约束。

对齐协议文档《睿鼎荣鼠标软件驱动协议》**§03 设备信息格式**（预留 64 字节；鼠标有效字段到索引 27）。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 优先于其它业务 | 改功能区、宏、改键前建议先读 |
| 结果会缓存 | `getCachedDeviceInfo()`；`close` / 断开 / 重新 `init` 会清空 |
| **只读** | 协议明确：此区域写入无效且掉电不保留；SDK 不提供写接口 |
| 读取长度 | SDK 读 **32 字节**（覆盖到 DPI 组上限索引 27）。**不要**按键盘路径读 71 字节 |
| 有线一包即可 | `packetSize=0x38` 时：`size=0x20` **一包**读完 |
| 2.4G 两包 | 有效载荷上限 `0x18`（32B 帧 − 8B 头）：`0x18` + `0x08`，**禁止**单包 `size=0x20` |
| 字节布局 | 0–18 与键盘同结构；**19–24 为 LOGO 灯能力**；**25–27 为鼠标专用**（sensor / 回报率上限 / DPI 组上限） |

> 旧文档曾误写「19–21 为鼠标专用」。真机抓包与协议表均为 **25 / 26 / 27**；SDK `parseDeviceInfo` 已按此解析。

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

// DPI 组数不要超过固件上限（信息区索引 27）
const maxGroups = info.dpiGroupMax || 8

// 宏缓冲：macroSize × 256；为 0 时 SDK 回退 1096 字节
const macros = await ServiceMouse.getMacros()
```

### 发码示例（有线）

```
OUT: aa 12 00 00 20 00 00 00 …   // offset=0, size=0x20（32 字节）
IN : aa 12 00 00 20 00 00 55 aa bb … 10 04 08 …
```

`aa bb` 之后为信息区正文；末尾常见 `sensor / reportRateMax / dpiGroupMax`（索引 25–27）。

---

## 功能能力判断

多数高级能力依赖信息区上限与标志位。SDK **不会**因能力位为假而自动拦截调用；无硬件时可能超时或返回无效数据，业务侧应先判断再调用。

| 功能 | 判断条件 | 相关文档 |
|---|---|---|
| 灯光字段 | `info.showLight === true` | [性能 / DPI](./performance)（功能区 `light`） |
| LOGO 灯 | 信息区字节 19（协议）；当前 `DeviceInfo` 未单独暴露，见固件表 |
| 宏 | `info.macroSize` 决定缓冲；为 0 时 SDK 回退 1096 字节 | [宏](./macro) |
| DPI 组 | `info.dpiGroupMax` 为组数上限（Flash 固定 8，实际看 EN） | [性能 / DPI](./performance) |
| 回报率 | 以 `info.reportRateMax` 与固件枚举为准；功能区常用 125/250/500/1000 | [性能 / DPI](./performance) |
| 电量 | 鼠标命令表固定有 `0x28` | [全局设置](./globalSetting#getbatterystatus) |

---

## 信息区字节布局（协议 §03）

| 索引 | 含义 | SDK `DeviceInfo` |
|---|---|---|
| 0–1 | 魔数 `0xAA 0xBB` | （校验用） |
| 2–3 | USB VID（小端） | `vendorId` |
| 4–5 | USB PID（小端） | `productId` |
| 6–7 | 固件版本（小端） | `firmwareVer` |
| 8 | AP 协议版本 | `protocolVer` |
| 9 | Profile | `profile` |
| 10 | 键盘/型号 ID | `keyboardID` |
| 11 | 保留 / 类型 | `keyboardType` |
| 12 | 按键矩阵大小（键数，每键 3 字节） | `keyMatrixSize` |
| 13 | 宏空间（单位 256 字节） | `macroSize` |
| 14 | 是否带按键灯 | `showLight` |
| 15–17 | 灯模式数 / 最大亮度 / 最大速度 | `lightSize` / `lightMaxBrightness` / `lightMaxSpeed` |
| 18 | 自定义灯光组数 | `lightKeySize`（字段名沿用布局） |
| 19 | 是否带 LOGO 灯 | — |
| 20–24 | LOGO 模式数 / 灯珠数 / 亮度 / 速度 / 音乐律动 | — |
| **25** | **sensor 型号** | **`sensorModel`** |
| **26** | **回报率最大档位数** | **`reportRateMax`** |
| **27** | **DPI 最大可调组数** | **`dpiGroupMax`** |
| 28–63 | 预留（协议预留共 64 字节） | SDK **不读** |

### 接收器信息区（2.4G Dongle，另表）

协议另有「接收器设备信息格式（预留 **32** 字节）」，与鼠标本体信息区不同。读鼠标能力时仍用上面的 64 字节布局（有效读 32）；勿把接收器 32 字节表当成鼠标 `sensor/DPI` 字段来源。

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
| `keyMatrixSize` | `number` | 按键矩阵规模（协议默认 128 键 × 3 字节） |
| `macroSize` | `number` | 宏空间单位。**实际字节数 = `macroSize × 256`**。协议示例 12 → 3072。为 0 时 SDK 回退 1096 字节 |

### 灯光能力

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLight` | `boolean` | 是否具备灯效（索引 14） |
| `lightSize` | `number` | 灯效模式数量 |
| `lightMaxBrightness` | `number` | 亮度上限 |
| `lightMaxSpeed` | `number` | 速度上限 |
| `lightKeySize` | `number` | 自定义灯光组数（索引 18） |

### 鼠标专用（索引 25–27）

| 字段 | 类型 | 说明 |
|---|---|---|
| `sensorModel` | `number` | 传感器型号码（如 `0x10` = PAW3311） |
| `reportRateMax` | `number` | 回报率可切换档位数（如 `0x04` = 4 档） |
| `dpiGroupMax` | `number` | DPI 组上限（Flash 固定 8；步长 &lt;10000→50，≥10000→100） |

---

## 和功能区的关系

| 信息区字段 | 影响 |
|---|---|
| `macroSize` | `getMacros` / `setMacros` 缓冲长度 |
| `dpiGroupMax` | UI 可配置的 DPI 组数上限 |
| `reportRateMax` | UI 可选回报率档位上限 |
| `showLight` | 是否展示 / 写入功能区 `light` 字段 |
