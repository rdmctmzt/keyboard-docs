# 参数类型

## 创建鼠标实例

构造选项与 HID 过滤。

| 类型 | 字段 | 说明 |
|---|---|---|
| `MouseOptions` | `configs` | `HidFilterConfig[]`，须含目标 VID/PID |
| | `packetSize?` | 分包长度；有线默认 `0x38`，2.4G 传 `0x18` |
| `HidFilterConfig` | `vendorId` / `productId` | USB VID / PID |
| | `usagePage?` / `usage?` | 常用 `0xff00` / `1` |

| 选项 | 何时用 |
|---|---|
| `packetSize: 0x38` | 有线（默认） |
| `packetSize: 0x18` | 2.4G 接收器 |

---

## 已授权的 HID 设备

`HidDeviceInfo`，来自 `getDevices()` / `init()`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | `vid:pid:productName` |
| `productName` | `string?` | 产品名 |
| `vendorId` | `number` | VID |
| `productId` | `number` | PID |
| `opened` | `boolean` | 是否已打开 |

---

## USB 插拔事件

`UsbChangePayload`，`on('usbChange')` 回调参数。

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | 接入 / 断开 |
| `device` | `HIDDevice?` | 浏览器 HID 对象 |

---

## 信息区（设备能力）

`DeviceInfo`，见 [基础的设备信息](./api/info)。

| 字段 | 类型 | 说明 |
|---|---|---|
| `vendorId` / `productId` | `number` | USB 身份 |
| `firmwareVer` | `number` | 固件版本 |
| `protocolVer` | `number` | 协议版本字段 |
| `profile` | `number` | 配置档 |
| `keyboardID` / `keyboardType` | `number` | 型号 / 类型 |
| `keyMatrixSize` | `number` | 按键矩阵规模 |
| `macroSize` | `number` | 宏空间单位（×256 字节） |
| `showLight` / `lightSize` / `lightMaxBrightness` / `lightMaxSpeed` / `lightKeySize` | — | 灯光能力 |
| `sensorModel` | `number` | 传感器型号 |
| `reportRateMax` | `number` | 回报率上限码 |
| `dpiGroupMax` | `number` | DPI 组上限 |

---

## 功能区（运行配置）

`MouseFuncInfo`，见 [全局设置](./api/globalSetting) / [性能 / DPI](./api/performance)。

| 字段 | 类型 | 说明 |
|---|---|---|
| `profile` | `number` | 配置档 |
| `light` | 灯光状态 | 开关 / 模式 / 亮度 / 速度 / RGB 等 |
| `reportRate` | `1000 \| 500 \| 250 \| 125` | 回报率 Hz |
| `dpiLevel` | `number` | 当前 DPI 档（0 起） |
| `lodHeight` | `1 \| 2` | LOD mm |
| `scanDelay` | `number` | 防抖 ms |
| `sleepTime` / `deepSleepTime` | `number` | 一二级休眠（秒） |
| `dpiGroups` | DPI 组数组 | 最多 8 组 |

### 灯光状态

| 字段 | 类型 | 说明 |
|---|---|---|
| `on` | `boolean` | 开关 |
| `mode` / `brightness` / `speed` | `number` | 模式 / 亮度 / 速度 |
| `mix` / `colour` / `define` | `number` | 混色 / 色盘 / 自定义索引 |
| `r` / `g` / `b` | `number` | RGB |

### DPI 组

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | `boolean` | 是否启用 |
| `xySeparate` | `boolean` | XY 独立 |
| `dpiX` / `dpiY` | `number` | X / Y DPI |
| `color` | `{ r, g, b }` | 指示色 |

### 写入 DPI

`setDpi` 入参：

| 字段 | 类型 | 说明 |
|---|---|---|
| `level` | `number` | 当前档 |
| `groups` | DPI 组数组 | 组列表 |

---

## 改键

| 类型 | 用途 |
|---|---|
| `KeyEntry` | `getKeymap` 返回项：`index` / `layer` / `type` / `code1` / `code2` |
| `SetKeyInput` | `setKey` 入参：`type` / `code1` / `code2` |

键值含义见 [键值表](./keycodes)。

---

## 宏

| 类型 | 用途 |
|---|---|
| `MacroProfile` | 宏槽：`key` / `name?` / `list`（`type` / `replayCnt` 为兼容字段，不写缓冲） |
| `MacroAction` | 动作：`keyboard`（`code`）或 `mouse`（`button`），另有 `down` / `delayMs` |

```ts
type MacroAction =
  | { type: 'keyboard'; code: number; down: boolean; delayMs: number }
  | { type: 'mouse'; button: number; down: boolean; delayMs: number }
```

---

## 电量状态

`BatteryStatus`，见 [全局设置 · 读取电量](./api/globalSetting#读取电量)。

| 字段 | 类型 | 说明 |
|---|---|---|
| `batteryPercent` | `number` | 0–100 |
| `chargeFlag` | `number` | 充电标志 |
| `online` | `boolean` | 读成功为 true |

---

## 2.4G / RF 状态

`RfStatus`，见 [全局设置 · 查询 2.4G 状态](./api/globalSetting#getrfstatus)。

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | `number` | 0 默认 / 1 空闲 / 2 配对 / 3 回连 / 4 连接成功 / 5 休眠 |
| `vendorId` | `number` | 无线设备 VID |
| `productId` | `number` | 无线设备 PID |
| `keyboardNum` | `number` | 连接设备数 |
| `connected` | `boolean` | `status === 4` |

---

## 在线升级

有线鼠标与键盘共用 `@rdmctmzt/sdk-keyboard` 里的类型，见 [在线升级](./api/upgrade)。

| 类型 | 说明 |
|---|---|
| `KeyboardFirmwareUpgradeOptions` | 构造升级对象：`vendorId`、`productId`、`firmware`、`onProgress` |
| `FirmwareUpgradeProgress` | 进度：`percent`、`message` |
