# 基础的设备信息

读取**信息区**（CMD `0x12`）。这是设备「能力表」：协议版本、是否有灯/屏/编码器、亮度速度上限、宏空间等。功能区速度换算、宏缓冲大小都依赖这里的字段。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 优先于其它业务 | 改功能区、宏、灯、屏前建议先读，拿 `protocolVer` 与能力位 |
| 结果会缓存 | `getCachedDeviceInfo()`；`close` / 断开 / 重新 `init` 会清空 |
| 机型差异大 | 无侧灯 / 点阵 / LCD / 编码器时对应字段为假或 0，勿硬调对应 API |

---

## 读取设备信息

`ServiceKeyboard.getDeviceInfo()`

读取信息区并缓存。未缓存时 `getFuncInfo` / 宏等接口会自动再读一次。

### 参数

无。

### 返回值

`Promise<DeviceInfo>` — 字段见下方 [字段总表](#字段总表)。

### 使用示例

```js
const info = await ServiceKeyboard.getDeviceInfo()

if (info.matrixScreen) {
  const colors = await ServiceKeyboard.getMatrixPixelColors()
}
if (info.isLed) {
  await ServiceKeyboard.lightOn()
}
if (info.protocolVer >= 2) {
  const battery = await ServiceKeyboard.getBatteryStatus()
}
```

---

## 功能能力判断

多数高级能力是**特定机型 / 协议版本**才有。先读信息区，再按能力位决定是否调用对应 API。

SDK **不会**因能力位为假而自动拦截调用；无硬件时可能超时或返回无效数据，业务侧应先判断再调用。

| 功能 | 判断条件 | 相关文档 |
|---|---|---|
| 背光 | `info.showLight === true` | [灯光](./lighting) |
| LOGO 灯 | `info.showLogoLight === true` | [灯光](./lighting) |
| 侧灯 | `info.showLightSideLight === true` | [灯光](./lighting) |
| 音乐律动 | `info.logoLightSupportMusic` 或 `info.sideLightSupportMusic`，且 `protocolVer ≥ 2` | [灯光 · 律动](./lighting#setmusicrhythmcolors) |
| 自定义每键灯色 | `info.showLight` 且 `info.lightKeySize > 0` | [灯光](./lighting) |
| 点阵屏 | `info.matrixScreen === true`（通常还需 `protocolVer ≥ 2`） | [点阵屏](./matrix) |
| 点阵 GIF | `info.matrixScreen` 且 `info.matrixScreenHasGif`（多为 V4） | [点阵屏](./matrix) |
| LCD | `info.isLed === true`；屏内容下发还需独立屏 HID | [LCD](./lcd) |
| 编码器 | `info.encoder === true` | [编码器](./encoder) |
| 电量 | `protocolVer ≥ 2`（V1 无 `0x30`） | [其它 API](./misc#getbatterystatus) |
| 宏 | `info.macroSize` 决定缓冲；为 0 时 SDK 回退 1096 字节 | [宏](./macro) |
| 灯同步 / 灯总开关等 | `protocolVer ≥ 2` | [点阵屏](./matrix) / [LCD](./lcd) |
| `syncLcdGif` | `protocolVer ≥ 4` | [LCD](./lcd) |

---

## 字段总表

### 基础身份

| 字段 | 类型 | 说明 |
|---|---|---|
| `vendorId` | `number` | USB VID（小端拼成 16bit） |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | 固件版本号 |
| `protocolVer` | `number` | 协议版本 **1–4**。决定命令表（V1/V2/V3/V4）以及功能区是否走扩展布局 |
| `profile` | `number` | 当前板载配置档位 |
| `keyboardID` | `number` | 键盘型号 ID（驱动里还会用来判断 8K 等能力） |
| `keyboardType` | `number` | 键盘类型 |

### 键位 / 宏容量

| 字段 | 类型 | 说明 |
|---|---|---|
| `keyMatrixSize` | `number` | 按键矩阵规模 |
| `macroSize` | `number` | 宏空间单位。**实际字节数 = `macroSize × 256`**。为 0 时 SDK 回退 1096 字节（与驱动一致） |

### 背光能力

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLight` | `boolean` | 是否具备背光 |
| `lightSize` | `number` | 背光灯效模式数量 |
| `lightMaxBrightness` | `number` | 背光亮度上限（功能区 `lightBrightness` 取值上界参考） |
| `lightMaxSpeed` | `number` | 背光速度上限。功能区读写时：`用户速度 = max - 固件原始值` |
| `lightKeySize` | `number` | 可独立控色的灯位/按键灯数量 |

### LOGO 灯能力

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLogoLight` | `boolean` | 是否有 LOGO 灯 |
| `logoLightModeSize` | `number` | LOGO 灯效模式数量 |
| `logoLigthSize` | `number` | LOGO 灯珠数量（字段名沿用驱动拼写） |
| `logoLightMaxBrightness` | `number` | LOGO 亮度上限 |
| `logoLightMaxSpeed` | `number` | LOGO 速度上限（同上换算规则） |
| `logoLightSupportMusic` | `boolean` | LOGO 是否支持音乐律动 |

### 侧灯能力

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLightSideLight` | `boolean` | 是否有侧灯 |
| `sideLightModeSize` | `number` | 侧灯模式数量 |
| `sideLightSize` | `number` | 侧灯灯珠数量 |
| `sideLightMaxBrightness` | `number` | 侧灯亮度上限 |
| `sideLightMaxSpeed` | `number` | 侧灯速度上限 |
| `sideLightSupportMusic` | `boolean` | 侧灯是否支持音乐律动 |

### 点阵屏 / LCD / 编码器（扩展区）

索引 **0～36** 在 V2/V3/V4 相同。自 **37** 起 V4 插入 GIF 能力位，编码器 / LCD 下标后移：

| 字段 | V2 / V3 下标 | V4 下标 | 说明 |
|---|---|---|---|
| `matrixScreen` | `31` | `31` | 是否带点阵屏 |
| `matrixScreenLightSize` | `32` | `32` | 点阵灯效模式个数 |
| `matrixScreenLightRows` / `Columns` | `33` / `34` | `33` / `34` | 行列 |
| `matrixScreenLightMaxBrightness` / `MaxSpeed` | `35` / `36` | `35` / `36` | 亮度 / 速度上限 |
| `matrixScreenHasGif` | — | `37` | V4：是否支持点阵 GIF |
| `matrixScreenGifMaxFrames` | — | `38` | V4：GIF 最大张数 |
| `matrixScreenLightMaxFrames` | `39`（非 V4 常见） | 常与 GIF 上限同源 | 动态自定义最大帧数 |
| `encoder` | `37` | `39` | 是否带编码器 |
| `isLed` | `38` | `40` | 是否带 LCD |

> V4 信息区相对 V3 的主要变化：在编码器前插入「是否带 GIF / GIF 最大张数」。SDK 已按 `protocolVer` 解析，业务侧读 `DeviceInfo` 字段即可，不必手算下标。

---

## 和功能区的关系

| 信息区字段 | 影响 |
|---|---|
| `protocolVer` | 选命令表；功能区 V1 单包 vs V2/V3 vs V4 尾部布局；信息区扩展下标 |
| `lightMaxSpeed` / `logoLightMaxSpeed` / `sideLightMaxSpeed` | 功能区速度字段换算 |
| `macroSize` | `getMacros` / `setMacros` 缓冲长度 |
| `show*` 能力位 | UI 是否展示对应灯光/屏功能（SDK 不强制拦截） |
