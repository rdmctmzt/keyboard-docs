# 功能区

功能区对应驱动 `getFuncInfo` / `setFuncInfo`（CMD `0x14` / `0x15`），是键盘**当前运行配置**的统一读写入口：背光 / LOGO / 侧灯、全键无冲、Win 锁、休眠、LCD 等。

灯光、性能等便捷 API，底层都是改这些字段后再整包写回。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 建议先 `getDeviceInfo()` | 用 `protocolVer` / 速度上限做换算与分包 |
| **先读后写** | `setFuncInfo` 须带完整对象；只改几项用 `patchFuncInfo` |
| 机型差异 | 侧灯 / 点阵 / LCD / 编码器等字段无硬件时可能无意义，以信息区能力位为准 |
| 速度字段 | API 传换算后的用户值，勿再自己算 `max - x` |

```js
await ServiceKeyboard.getDeviceInfo()
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.patchFuncInfo({ lightBrightness: 4 })
```

---

## 读取功能区

`ServiceKeyboard.getFuncInfo()`

从设备读取整包功能区配置（CMD `0x14`）。

### 参数

无。

### 返回值

`Promise<FuncInfo>`，字段见下方 [字段总表](#字段总表)。

### 使用示例

```js
await ServiceKeyboard.getDeviceInfo()
const func = await ServiceKeyboard.getFuncInfo()
```

---

## 整包写入功能区

`ServiceKeyboard.setFuncInfo(data)`

用完整对象覆盖写入功能区（CMD `0x15`）；未改动的字段也必须带上，须先读后写。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `data` | `FuncInfo` | 完整功能区对象；未改字段也须带上（先读后写） |

### 返回值

`Promise<FuncInfo>`，写回后的完整对象。

### 使用示例

```js
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.setFuncInfo({
  ...func,
  lightBrightness: 4,
  winLock: 1,
})
```

---

## 按字段改写功能区

`ServiceKeyboard.patchFuncInfo(patch)`

只传要改的字段，SDK 内部与当前缓存合并后再整包写回；推荐日常使用。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch` | `Partial<FuncInfo>` | 只传要改的字段 |

### 返回值

`Promise<FuncInfo>`，写回后的完整 `FuncInfo`。

### 使用示例

```js
await ServiceKeyboard.patchFuncInfo({
  lightBrightness: 4,
  winLock: 1,
})

// 背光（等价 setBacklight）
await ServiceKeyboard.patchFuncInfo({
  lightSwitch: 1,
  lightMode: 2,
  lightBrightness: 4,
  lightSpeed: 3,
  lightMixColor: 1,
  lightColorIndex: 0,
  lightRValue: 255,
  lightGValue: 0,
  lightBValue: 0,
})

// LOGO / 侧灯
await ServiceKeyboard.setLogoLight({
  logoLightSwitch: 1,
  logoLightMode: 1,
  logoLightBrightness: 3,
  logoLightSpeed: 2,
})
await ServiceKeyboard.setSideLight({
  sideLightSwitch: 1,
  sideLightMode: 1,
  sideLightBrightness: 3,
})

// 性能 / 系统
await ServiceKeyboard.setPerformance({
  sixKeysOrAllKeys: 1,
  maxOrWin: 0,
  winLock: 1,
  keyWasd: 0,
  scanDelay: 0,
  layerDefault: 0,
  fSwitch: false,
  wheelDefaultMode: 0,
  sleepTime: 300,
  deepSleepTime: 1800,
  snapTap: true,
})

// 点阵屏 / LCD（功能区字段）
await ServiceKeyboard.setMatrixScreen({
  matrixScreenLightSwitch: true,
  matrixScreenLightMode: 2,
  matrixScreenLightBrightness: 4,
})
await ServiceKeyboard.setLcd({
  lcdScreenLightSwitch: true,
  lcdScreenLightMode: 1,
  lcdScreenLightBrightness: 3,
  lcdScreenMaxGif: 4,
  lcdScreenLanguage: 0,
  lcdScreenUsbEnum: true,
})

// 一次改多类字段
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.setFuncInfo({
  ...func,
  lightSwitch: 1,
  lightBrightness: 4,
  logoLightSwitch: 1,
  sixKeysOrAllKeys: 1,
  winLock: 0,
  sleepTime: 600,
  lcdScreenLightSwitch: true,
})
```

---

## 读取缓存的功能区

`ServiceKeyboard.getCachedFuncInfo()`

返回 SDK 内存中上次读/写后的功能区缓存，不发设备命令。

### 参数

无。

### 返回值

`FuncInfo | null`；尚未读过时为 `null`。

### 使用示例

```js
import Keyboard from '@rdmctmzt/sdk-keyboard'

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId: 0x0000, productId: 0x0000, usagePage: 0xff00, usage: 1 }],
})

const devices = await ServiceKeyboard.getDevices()
await ServiceKeyboard.init(devices[0].id)
await ServiceKeyboard.getDeviceInfo()

await ServiceKeyboard.getFuncInfo()
const cached = ServiceKeyboard.getCachedFuncInfo()
```

### 注意事项

自定义灯需先 `applyUserLightSlot(id)`，再写每键颜色；见 [灯光 · 切换到自定义灯槽](./lighting#切换到自定义灯槽)。

---

## 布局如何选择

| 条件 | 布局 |
|---|---|
| `protocolVer === 1` | V1 单包（约 41 字节） |
| `protocolVer === 2` 或 `3` | 标准功能区 64 字节；索引 **0～51** 与 V4 相同，**52 起**为 V2/V3 LCD 区（见下） |
| `protocolVer ≥ 4` | 同样 64 字节分包读写；**0～51** 同 V2/V3，**52 起**为 V4 LCD / Snap / 点阵 GIF 尾部（与 V2/V3 **不同**） |

> V2、V3 与 V4 的功能区协议在 **LCD 及之后字段**上不一致（对齐《睿鼎荣软件驱动协议》V3.0 / V4.0）。SDK 对外仍是统一的 `FuncInfo`，按 `protocolVer` 编解码尾部；先 `getDeviceInfo()` 再读写。

### 索引对照（协议表 · 功能信息格式）

| 索引 | V2 / V3 | V4 |
|---|---|---|
| `0～51` | 情景 / 背光 / LOGO / 侧灯 / 点阵灯效 / 性能 / 休眠（三协议相同） | 同左 |
| `52` | LCD 电源 | LCD 电源 |
| `53` | LCD 模式 | LCD 模式 |
| `54` | LCD 动图索引 | LCD 动图索引 |
| `55` | LCD 语言 | **LCD 最大 GIF 张数** |
| `56` | LCD USB 枚举 | **LCD 语言** |
| `57` | 预留 | **LCD USB 枚举** |
| `58` | 预留 | **Snap Tap** |
| `59` | 预留 / 扩展（驱动侧常作点阵动态数量） | **点阵矩阵 GIF 数量** |
| `60～63` | 预留 / 扩展 | 预留 / 扩展 |

SDK 字段映射（统一 `FuncInfo`，与驱动一致）：

| SDK 字段 | 典型缓冲下标 | 说明 |
|---|---|---|
| `lcdScreenLightSwitch` / `Mode` / `Brightness` | `52` / `53` / `54` | Brightness 在部分机型表示 LCD GIF 索引 |
| `lcdScreenLanguage` | `55` | — |
| `lcdScreenUsbEnum` | `56` | — |
| `snapTap` | `57` | V4 协议表在 `58`；驱动/SDK 按 `57` 读写 |
| `lcdScreenMaxGif` | `58` | V4 协议表在 `55`；驱动/SDK 按 `58` |
| `initDynamicSum` / `initMeetingSum` | `59` / `60` | **V2/V3**：点阵动态 / 迎宾数量 |
| `matrixLtGifCount` | `59` | **V4**：点阵 GIF 数量（与 `initDynamicSum` 共用该字节语义） |

---

## 速度换算（与驱动一致）

读：`换算值 = lightMaxSpeed - 固件原始值`  
写：SDK 再换算回固件值。  
对 `lightSpeed` / `logoLightSpeed` / `sideLightSpeed` 均如此。传给 API 的是换算后的值，不必再算 `max - x`。

---

## 字段总表

### 配置档

| 字段 | 类型 | 说明 |
|---|---|---|
| `profile` | `number` | 当前板载配置档 |

### 背光（主灯）

| 字段 | 类型 | 说明 |
|---|---|---|
| `lightSwitch` | `number` | 背光开关。`0` 关，`1` 开（以固件为准） |
| `lightMode` | `number` | 灯效模式索引。特殊值 **`0xfd` = 自定义灯**，此时看 `lightCustomIndex` |
| `lightBrightness` | `number` | 亮度，通常 `0 … lightMaxBrightness` |
| `lightSpeed` | `number` | 速度（已换算），通常 `0 … lightMaxSpeed` |
| `lightMixColor` | `number` | 混色/彩色开关类标志（`0`/`1`，具体语义随灯效） |
| `lightColorIndex` | `number` | 预设颜色索引 |
| `lightRValue` | `number` | 自定义颜色 R，`0–255` |
| `lightGValue` | `number` | 自定义颜色 G，`0–255` |
| `lightBValue` | `number` | 自定义颜色 B，`0–255` |
| `lightCustomIndex` | `number` | 自定义灯槽 id（常与 `lightMode === 0xfd` 联用，一般 `0–4`） |

### LOGO 灯

| 字段 | 类型 | 说明 |
|---|---|---|
| `logoLightSwitch` | `number` | LOGO 开关 |
| `logoLightMode` | `number` | LOGO 灯效模式 |
| `logoLightBrightness` | `number` | LOGO 亮度 |
| `logoLightSpeed` | `number` | LOGO 速度（已换算） |
| `logoLightMixColor` | `number` | LOGO 混色标志 |
| `logoLightColorIndex` | `number` | LOGO 预设色索引 |
| `logoLightRValue` / `logoLightGValue` / `logoLightBValue` | `number` | LOGO RGB |

### 侧灯

| 字段 | 类型 | 说明 |
|---|---|---|
| `sideLightSwitch` | `number` | 侧灯开关 |
| `sideLightMode` | `number` | 侧灯模式 |
| `sideLightBrightness` | `number` | 侧灯亮度 |
| `sideLightSpeed` | `number` | 侧灯速度（已换算） |
| `sideLightMixColor` | `number` | 侧灯混色标志 |
| `sideLightColorIndex` | `number` | 侧灯预设色索引 |
| `sideLightRValue` / `sideLightGValue` / `sideLightBValue` | `number` | 侧灯 RGB |

### 点阵屏灯光（标准布局）

| 字段 | 类型 | 说明 |
|---|---|---|
| `matrixScreenLightSwitch` | `boolean` | 点阵灯开关。协议里固件字节常为「开=0 / 关=1」，SDK 已转成 boolean |
| `matrixScreenLightMode` | `number` | 点阵灯效模式 |
| `matrixScreenLightBrightness` | `number` | 点阵亮度 |
| `matrixScreenLightSpeed` | `number` | 点阵速度 |
| `matrixScreenLightMixColor` | `number` | 点阵混色标志 |
| `matrixScreenLightColorIndex` | `number` | 点阵预设色索引 |
| `matrixScreenLightRValue` / `G` / `B` | `number` | 点阵 RGB |

### 性能 / 系统

| 字段 | 类型 | 取值 / 说明 |
|---|---|---|
| `sixKeysOrAllKeys` | `number` | `0` = 六键；`1` = 全键无冲（NKRO） |
| `maxOrWin` | `number` | `0` = Win 布局；`1` = Mac 布局 |
| `winLock` | `number` | `0` = 不锁 Win；`1` = 锁定 Win 键 |
| `keyWasd` | `number` | `0` = 正常；`1` = WASD 与方向键互换 |
| `scanDelay` | `number` | 回报率档位索引。普通：`0→1000Hz` `1→500` `2→250` `3→125`；8K：`0→8K` `1→4K` `2→2K` `3→1K`（以机型为准） |
| `layerDefault` | `number` | 上电默认层，`0–3` |
| `fSwitch` | `boolean` | F 区切换 |
| `wheelDefaultMode` | `number` | 编码器默认模式 `0` / `1` |
| `sleepTime` | `number` | 浅睡，**秒** |
| `deepSleepTime` | `number` | 深睡，**秒** |
| `numLockMode` | `number?` | NumLock 相关；`0` 正常；`1` 反转等（部分机型） |
| `hourType` | `number?` | 时钟制式；`0` / `1` 对应 12/24 小时（以固件为准） |

### LCD / Snap / 尾部（随 `protocolVer` 变化）

| 字段 | 类型 | 说明 |
|---|---|---|
| `lcdScreenLightSwitch` | `boolean` | LCD 开关；SDK 已统一 `true=开` |
| `lcdScreenLightMode` | `number` | 显示模式 |
| `lcdScreenLightBrightness` | `number` | 多为亮度；部分布局表示 LCD GIF 索引（协议 `User_Info_Lcd_Gif`） |
| `lcdScreenLanguage` | `number` | 语言索引 |
| `lcdScreenUsbEnum` | `boolean` | 是否枚举为独立 USB 设备 |
| `snapTap` | `boolean?` | Snap Tap / SOCD（**V4** 协议新增；驱动缓冲见上表） |
| `lcdScreenMaxGif` | `number` | LCD 最大 GIF 张数（**V4** 协议明确；V2/V3 协议表曾与动图索引冲突） |
| `initDynamicSum` | `number?` | **V2/V3**：点阵动态相关数量 |
| `initMeetingSum` | `number?` | 迎宾/会议相关数量 |
| `matrixLtGifCount` | `number?` | **V4**：点阵矩阵 GIF 数量（协议 `User Lt Gif Count`） |

> 不要把 V2/V3 与 V4 的尾部字段当成同一套下标硬写原始缓冲；用 `getFuncInfo` / `setFuncInfo` / `patchFuncInfo`，由 SDK 按 `protocolVer` 处理。

---

## 写回注意

1. **先读后写**：只改需要的字段，其余用 `...func` 保留，或用 `patchFuncInfo`。  
2. **速度**：传换算后的值，不要自己再做 `max - x`。  
3. **休眠**：传**秒**，不是毫秒。例如 5 分钟 → `sleepTime: 300`。  
4. **自定义灯**：先 `applyUserLightSlot(id)`，再写灯色数据。
