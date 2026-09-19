# 参数类型

## 创建键盘实例

`KeyboardOptions` / `HidFilterConfig`

```ts
type KeyboardOptions = {
  configs: HidFilterConfig[]
  /** 分包长度：有线 0x38，2.4G 0x18 */
  packetSize?: number
}

type HidFilterConfig = {
  vendorId: number
  productId: number
  usagePage?: number
  usage?: number
}
```

| 选项 | 何时用 |
|---|---|
| `packetSize: 0x38` | 有线（默认） |
| `packetSize: 0x18` | 2.4G 接收器 / 无线 dongle |

---

## 已授权的 HID 设备

`HidDeviceInfo`。`getDevices()` 返回数组；`init()` 成功时在 `device` 里；`getCurrentDevice()` 未打开时为 `null`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | `vid:pid:productName`，传给 `init(id)` |
| `productName` | `string?` | 产品名 |
| `vendorId` | `number` | USB VID |
| `productId` | `number` | USB PID |
| `opened` | `boolean` | 当前是否已打开 |

`init()` 的返回值是 `{ success: boolean, device: HidDeviceInfo \| null }`，不是单独一个设备对象。

---

## USB 插拔事件

`UsbChangePayload`。`on('usbChange', listener)` / `off('usbChange', listener)` 本身没有返回值。`listener` 收到的就是下面这个对象。

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | `connect` 接入，`disconnect` 拔出 |
| `device` | `HIDDevice?` | 浏览器里的 HID 设备。断开时可能没有 |

`disconnect` 之后缓存会清空，要重新 `getDevices()` / `init()`。

---

## 信息区（设备能力）

`DeviceInfo`。`getDeviceInfo()` 返回 `Promise<DeviceInfo>`，读的是 CMD `0x12`。没有这个对象时，`getCachedDeviceInfo()` 返回 `null`。

无对应硬件时，能力位为 `false`，数量和上限为 `0`。能力怎么用见 [设备信息](./api/info)。

### 身份

| 字段 | 类型 | 说明 |
|---|---|---|
| `vendorId` | `number` | USB VID |
| `productId` | `number` | USB PID |
| `firmwareVer` | `number` | 固件版本号 |
| `protocolVer` | `number` | 协议版本 `1–4`。决定命令表，以及功能区、信息区扩展字段怎么解析 |
| `profile` | `number` | 当前板载配置档 |
| `keyboardID` | `number` | 键盘型号 ID |
| `keyboardType` | `number` | 键盘类型 |

### 容量

| 字段 | 类型 | 说明 |
|---|---|---|
| `keyMatrixSize` | `number` | 按键矩阵规模 |
| `macroSize` | `number` | 宏空间单位。实际字节数是 `macroSize × 256`。为 `0` 时 SDK 按 1096 字节处理 |

### 背光

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLight` | `boolean` | 是否有背光 |
| `lightSize` | `number` | 背光灯效模式数量 |
| `lightMaxBrightness` | `number` | 背光亮度上限 |
| `lightMaxSpeed` | `number` | 背光速度上限。功能区里的速度是 `上限 - 固件原始值` |
| `lightKeySize` | `number` | 可单独控色的灯位数。自定义灯要这个值大于 `0` |

### LOGO 灯

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLogoLight` | `boolean` | 是否有 LOGO 灯 |
| `logoLightModeSize` | `number` | LOGO 灯效模式数量 |
| `logoLigthSize` | `number` | LOGO 灯珠数量。字段名沿用固件拼写，不是 `Light` |
| `logoLightMaxBrightness` | `number` | LOGO 亮度上限 |
| `logoLightMaxSpeed` | `number` | LOGO 速度上限，换算规则同背光 |
| `logoLightSupportMusic` | `boolean` | LOGO 是否支持音乐律动 |

### 侧灯

| 字段 | 类型 | 说明 |
|---|---|---|
| `showLightSideLight` | `boolean` | 是否有侧灯 |
| `sideLightModeSize` | `number` | 侧灯模式数量 |
| `sideLightSize` | `number` | 侧灯灯珠数量 |
| `sideLightMaxBrightness` | `number` | 侧灯亮度上限 |
| `sideLightMaxSpeed` | `number` | 侧灯速度上限，换算规则同背光 |
| `sideLightSupportMusic` | `boolean` | 侧灯是否支持音乐律动 |

### 点阵屏 / 编码器 / LCD

| 字段 | 类型 | 说明 |
|---|---|---|
| `matrixScreen` | `boolean` | 是否带点阵屏 |
| `matrixScreenLightSize` | `number` | 点阵灯效模式数量 |
| `matrixScreenLightRows` | `number` | 点阵行数 |
| `matrixScreenLightColumns` | `number` | 点阵列数 |
| `matrixScreenLightMaxBrightness` | `number` | 点阵亮度上限 |
| `matrixScreenLightMaxSpeed` | `number` | 点阵速度上限 |
| `matrixScreenLightMaxFrames` | `number?` | 动态自定义最大帧数。没有这一项时字段不出现 |
| `matrixScreenHasGif` | `boolean?` | 是否支持点阵 GIF，多为协议 4。没有这一项时字段不出现 |
| `matrixScreenGifMaxFrames` | `number?` | GIF 最大张数。没有这一项时字段不出现 |
| `encoder` | `boolean` | 是否带编码器 |
| `isLed` | `boolean` | 是否带 LCD |

---

## 功能区（运行配置）

`FuncInfo`

当前运行配置，来自 CMD `0x14`/`0x15`。完整字段说明见 [功能区](./api/func)。

| 分组 | 字段 |
|---|---|
| 档位 | `profile` |
| 背光 | `lightSwitch` `lightMode` `lightBrightness` `lightSpeed` `lightMixColor` `lightColorIndex` `lightRValue` `lightGValue` `lightBValue` `lightCustomIndex` |
| LOGO | `logoLight*` |
| 侧灯 | `sideLight*` |
| 点阵灯 | `matrixScreenLight*` |
| 性能 | `sixKeysOrAllKeys` `maxOrWin` `winLock` `keyWasd` `scanDelay` `layerDefault` `fSwitch` `wheelDefaultMode` `sleepTime` `deepSleepTime` `snapTap` `numLockMode` `hourType` |
| LCD | `lcdScreenLightSwitch` `lcdScreenLightMode` `lcdScreenLightBrightness` `lcdScreenMaxGif` `lcdScreenLanguage` `lcdScreenUsbEnum` |
| 扩展 | `initDynamicSum` `initMeetingSum` `matrixLtGifCount` |

**单位提醒**

- 速度类：SDK 已换算为用户值（`maxSpeed - raw`）
- `sleepTime` / `deepSleepTime`：**秒**
- 颜色 RGB：`0–255`

---

## 键表项 / 改键入参

`KeyEntry` / `SetKeyInput`

```ts
type KeyEntry = {
  index: number  // 键位 0–127
  layer: number  // 层 0–3
  type: number
  code1: number
  code2: number
}

/** setKey 写入时只需三字节键值 */
type SetKeyInput = {
  type: number
  code1: number
  code2: number
}
```

键值含义见 [键值表](./keycodes)。

---

## 宏槽与宏动作

`MacroProfile` / `MacroAction`

```ts
type MacroAction =
  | { type: 'keyboard'; code: number; down: boolean; delayMs: number }
  | { type: 'mouse'; button: number; down: boolean; delayMs: number }

type MacroProfile = {
  key: number          // 槽位 0–15
  name?: string        // 展示名；设备缓冲不存，读回时 SDK 填 M0/M1…
  type?: number        // 兼容字段；读回默认 0，不写入宏缓冲
  replayCnt?: number   // 兼容字段；读回默认 1，不写入宏缓冲
  list: MacroAction[]
}
```

| 字段 | 说明 |
|---|---|
| `key` | 宏槽位。改键绑宏时 `code1` 对应该槽 |
| `list` | 动作序列；`MacroAction.type` 为 `'keyboard'` / `'mouse'` |
| `type` / `replayCnt` | 兼容字段，**不进宏缓冲**。循环/次数在改键：`0x60`（`code2`=0/1/3）或 `0x61`（`code2`=次数） |

鼠标 `button`：`1` 左 / `2` 右 / `4` 中 / `8` 后退 / `16` 前进。播放类型详见 [宏](./api/macro#宏类型改键侧)。

---

## 灯效速度上限

`SpeedCaps`

```ts
type SpeedCaps = Pick<
  DeviceInfo,
  'lightMaxSpeed' | 'logoLightMaxSpeed' | 'sideLightMaxSpeed'
>
```

内部用于功能区速度换算，一般无需直接使用。

---

## 电量状态

`BatteryStatus`

```ts
type BatteryStatus = {
  batteryPercent: number // 0–100
  chargeFlag: number
  online: boolean
}
```

见 [其它 API · 读取电量](./api/misc#getbatterystatus)。

---

## 2.4G / RF 状态

`RfStatus`

```ts
type RfStatus = {
  status: number // 0–5；4=连接成功
  vendorId: number // 无线键盘 VID
  productId: number // 无线键盘 PID
  keyboardNum: number
  connected: boolean
}
```

见 [其它 API · getRfStatus](./api/misc#getrfstatus)。

---

## 编码器键位

`EncoderWheelData`

```ts
type EncoderWheelData = {
  left: number
  center: number
  right: number
}
```

见 [编码器](./api/encoder)。

---

## 律动 / 点阵颜色选项

`MusicRhythmOptions` / `MatrixColorOptions`

```ts
type MusicRhythmOptions = {
  ledCount?: number
  startOffset?: number
  keepSession?: boolean
}

type MatrixColorOptions = {
  rgb?: boolean       // 默认 true
  frameCount?: number // 默认 1
}
```

---

## LCD 屏相关类型

详见 [LCD](./api/lcd)。常用导出：

| 类型 | 说明 |
|---|---|
| `LcdScreenOptions` | 构造 `LcdScreen`：`configs` / `chunkSize` / `qgifBaseUrl` |
| `LcdScreenHidInfo` | 屏 HID 设备信息（同键盘侧结构） |
| `LcdScreenSize` | `getScreenSize()`：宽高、`maxScreen`、固件版本 |
| `LcdScreenFuncInfo` | `getScreenFuncInfo()` |
| `LcdConnectStatus` | `getConnectStatus()` / 心跳：`connectStatus`、`ok` |
| `LcdTransferProgress` | 上传进度：`phase`、`percentage` 等 |
| `LcdUploadImageOptions` | `uploadImage` 选项：宽高、fps、`onProgress` |
| `ImageInput` | `File` / `Blob` / `ArrayBuffer` / `Uint8Array` / URL 字符串 |
| `ConvertImageOptions` | `convertImage` / `convertImageToQgif` 选项 |

高级：可直接用 `convertImageToQgif` / `loadQgifModule`（一般走 `LcdScreen.uploadImage` 即可）。

---

## 在线升级

详见 [在线升级](./api/upgrade)。

| 类型 | 说明 |
|---|---|
| `KeyboardFirmwareUpgradeOptions` | 构造升级对象：`vendorId`、`productId`、`firmware`、`onProgress` |
| `FirmwareUpgradeProgress` | 进度：`percent`、`message` |

