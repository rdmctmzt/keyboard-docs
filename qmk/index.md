# QMK SDK 文档

用于 **VIA / QMK** 协议键盘。需在 Chromium 浏览器中通过 WebHID 授权后调用。

与厂商键盘 SDK（`@rdmctmzt/sdk-keyboard`）**不是同一套协议**：无 `0xaa` 头、不发 `0x10` 开通讯；键值为 **16-bit QMK keycode**，不是 3 字节 `{type,code1,code2}`。

## 环境要求

| 项 | 说明 |
|---|---|
| 浏览器 | Chromium 系（Chrome / Edge 等）；需支持 WebHID |
| 页面来源 | **HTTPS** 或 `localhost` |
| 权限 | 须在点击等交互中调用 `getDevices()` |
| HID 过滤 | VIA 常用 `usagePage: 0xff60`，`usage: 0x61` |

## 安装

```bash
pnpm add @rdmctmzt/sdk-qmk
```

## 接入步骤

### 1. 创建实例

```js
import QmkKeyboard from '@rdmctmzt/sdk-qmk'

// 请替换为你的 VID/PID（文档示例一律使用 0x0000）
const vendorId = 0x0000
const productId = 0x0000

const ServiceQmk = new QmkKeyboard({
  configs: [{ vendorId, productId, usagePage: 0xff60, usage: 0x61 }],
  // VIA：32 字节正文 + reportId=0 → 默认 packetLength 33
})
```

#### 构造选项怎么选

| 场景 | 建议 |
|---|---|
| 标准 VIA 有线 | 默认即可（`packetLength: 33`） |
| 过滤接口 | 务必带 `usagePage: 0xff60`（或固件实际 RAW HID 页），避免选到普通键盘接口 |

完整类型见 [参数类型 · 创建 QMK 实例](./types#创建-qmk-实例)。

### 2. 授权并初始化

```js
const devices = await ServiceQmk.getDevices()
const { id } = devices[0]
await ServiceQmk.init(id)
```

`init` 会尝试读取协议版本并缓存。

### 3. 推荐调用顺序

```js
const ver = await ServiceQmk.getProtocolVersion() // 常见 7 / 8 / 9
const layers = await ServiceQmk.getLayerCount()
const fw = await ServiceQmk.getFirmwareVersion()

// 矩阵行列来自 VIA JSON（或自有布局定义）
const matrix = { rows: 5, cols: 15 }
const layer0 = await ServiceQmk.getKeymap(matrix, 0)
```

### 4. 监听拔插

```js
const vendorId = 0x0000
const productId = 0x0000

ServiceQmk.on('usbChange', (data) => {
  const device = data.device
  if (!device) return
  if (device.vendorId !== vendorId || device.productId !== productId) return
  // data.type: 'connect' | 'disconnect'
  // 身份：device.vendorId / device.productId / device.productName
})
```

断开后须重新 `init()`。别的已授权设备插拔也会进这个回调，先对 VID / PID。

## 能力一览

| 能力 | 文档 |
|---|---|
| 协议版本 / 固件版本 / 层数 / keyboard value | [基础的设备信息](./api/info) |
| 单键 / 整层 keymap / 清空 | [布局/改键](./api/key) |
| Custom 通道灯光读写与保存 | [灯光](./api/lighting) |
| 宏缓冲读写与编码 | [宏](./api/macro) |
| 编码器顺/逆时针键码 | [编码器](./api/encoder) |
| 生命周期 / EEPROM / Bootloader | [其它 API](./api/misc) |
| VIA 命令表 / 包格式 | [命令说明](./api/commands) |
| 16-bit keycode | [键值表](./keycodes) |
| 参数类型 | [参数类型](./types) |

## 协议版本提示

| 版本 | 说明 |
|---|---|
| `7`（Alpha） | 改键逐键 `0x04`/`0x05`；无 `0x11`/`0x12`/`0x13` 快路径时层数默认 4 |
| `≥ 8`（Beta+） | 可用 `0x11` 读层数、`0x12`/`0x13` 分块读写 keymap |

接入后先 `getProtocolVersion()`，再决定读写方式；SDK 的 `getKeymap` / `setKeymap` 会按版本自动选择。
