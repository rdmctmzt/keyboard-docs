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

`HidDeviceInfo`

```ts
type HidDeviceInfo = {
  id: string           // 如 "vid:pid:productName"
  productName?: string
  vendorId: number
  productId: number
  opened: boolean
}
```

来自 `getDevices()` / `init()` / `getCurrentDevice()`。

---

## USB 插拔事件

`UsbChangePayload`

```ts
type UsbChangePayload = {
  type: 'connect' | 'disconnect'
  device?: HIDDevice
}
```

`on('usbChange', …)` / `off('usbChange', …)` 的回调参数。

---

## 信息区（设备能力）

`DeviceInfo`

设备能力表，来自 CMD `0x12`。完整字段说明见 [设备信息](./api/info)。

| 分组 | 字段 |
|---|---|
| 身份 | `vendorId` `productId` `firmwareVer` `protocolVer` `profile` `keyboardID` `keyboardType` |
| 容量 | `keyMatrixSize` `macroSize`（×256 字节） |
| 背光能力 | `showLight` `lightSize` `lightMaxBrightness` `lightMaxSpeed` `lightKeySize` |
| LOGO 能力 | `showLogoLight` `logoLightModeSize` `logoLigthSize` `logoLightMaxBrightness` `logoLightMaxSpeed` `logoLightSupportMusic` |
| 侧灯能力 | `showLightSideLight` `sideLightModeSize` `sideLightSize` `sideLightMaxBrightness` `sideLightMaxSpeed` `sideLightSupportMusic` |
| 扩展 | `matrixScreen` `matrixScreenLightSize` `matrixScreenLightRows` `matrixScreenLightColumns` `matrixScreenLightMaxBrightness` `matrixScreenLightMaxSpeed` `matrixScreenLightMaxFrames?` `matrixScreenHasGif?` `matrixScreenGifMaxFrames?` `encoder` `isLed` |

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
