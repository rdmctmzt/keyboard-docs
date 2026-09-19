# 参数类型

## 创建 QMK 实例

构造选项与 HID 过滤。

| 类型 | 字段 | 说明 |
|---|---|---|
| `QmkOptions` | `configs` | `HidFilterConfig[]`，须含目标 VID/PID |
| | `packetLength?` | 含 reportId 整包长；默认 **33**（VIA 32 + 0） |
| `HidFilterConfig` | `vendorId` / `productId` | USB VID / PID |
| | `usagePage?` / `usage?` | VIA 常用 `0xff60` / `0x61` |

| 选项 | 何时用 |
|---|---|
| `packetLength: 33` | 标准 VIA（默认）；对齐驱动 `deviceMode=2` |
| `usagePage: 0xff60` | 过滤 RAW HID / VIA 接口，避免普通键盘集合 |

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

`UsbChangePayload`。`on('usbChange')` / `off` 没有返回值，设备在回调参数里。

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | 接入 / 拔出 |
| `device` | `HIDDevice?` | 这次插拔的设备 |
| `device.vendorId` | `number` | USB VID，用来对上自己那台键盘 |
| `device.productId` | `number` | USB PID |
| `device.productName` | `string?` | 产品名。和 VID、PID 拼成 `init` 的 `id` |

---

## 矩阵尺寸

`MatrixSize`，用于 `getKeymap` / `setKeymap`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `rows` | `number` | 行数 |
| `cols` | `number` | 列数 |

与 VIA JSON `matrix` 一致。

---

## 编码器绑定

`EncoderBinding`

| 字段 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层 |
| `id` | `number` | 编码器索引 |
| `clockwise` | `boolean` | 顺时针 / 逆时针 |
| `keycode` | `number` | 16-bit keycode |

---

## 宏事件与宏组

`ViaMacroEvent` / `ViaMacroProfile`，见 [宏](./api/macro)。

| 类型 | 字段 | 说明 |
|---|---|---|
| `ViaMacroEvent` | `type: 'tap'\|'down'\|'up'` | `keycode` 单字节 |
| | `type: 'delay'` | `ms` |
| | `type: 'ascii'` | `text` |
| `ViaMacroProfile` | `index` | 宏槽下标 |
| | `events` | 事件列表 |

---

## 命令与通道常量

| 导出 | 说明 |
|---|---|
| `CMD_VIA` | 父命令 `0x01`–`0x15` |
| `KeyboardValue` | `0x02`/`0x03` 子命令 |
| `CustomChannel` | 灯光/custom 通道 |
| `PROTOCOL_ALPHA` / `BETA` / `GAMMA` | `7` / `8` / `9` |
| `VIA_MAX_BUFFER_CHUNK` | 分块最大 28 |
