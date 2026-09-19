# 键盘 SDK 文档

由于浏览器安全机制，调用 SDK 需走 **WebHID**，**先完成浏览器授权**，再调用其它接口。

## 环境要求

| 项 | 说明 |
|---|---|
| 浏览器 | Chromium 系（Chrome / Edge 等）；需支持 WebHID |
| 页面来源 | **HTTPS** 或 `localhost`（否则无法调起授权） |
| 权限 | 须在点击等交互中调用 `getDevices()`；勿在页面加载时自动弹出 |

## 安装

```bash
pnpm add @rdmctmzt/sdk-keyboard
```

## 接入步骤

### 1. 创建实例

```js
import Keyboard from '@rdmctmzt/sdk-keyboard'

// 请替换为你的 VID/PID（文档示例一律使用 0x0000）
const vendorId = 0x0000
const productId = 0x0000

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
  // 有线默认 0x38；2.4G 接收器场景传 0x18
  // packetSize: 0x38,
})
```

#### 构造选项怎么选

| 场景 | 建议 |
|---|---|
| USB 有线 | 默认即可（`packetSize` 隐含 `0x38`） |
| 2.4G 接收器 | `packetSize: 0x18` |

完整类型见 [参数类型 · 创建键盘实例](./types#创建键盘实例)。

### 2. 授权并初始化

```js
const devices = await ServiceKeyboard.getDevices()
const { id } = devices[0]
await ServiceKeyboard.init(id)
```

### 3. 推荐调用顺序

```js
const info = await ServiceKeyboard.getDeviceInfo()   // 信息区
const func = await ServiceKeyboard.getFuncInfo()     // 功能区（灯光/性能等）
const keys = await ServiceKeyboard.getKeymap(0)      // 改键
```

修改功能区字段时，**先读后写**，避免覆盖其它配置：

```js
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.setFuncInfo({
  ...func,
  lightBrightness: 4,
  winLock: 1,
})
// 或局部更新
await ServiceKeyboard.patchFuncInfo({ lightBrightness: 4 })
```

### 4. 监听拔插

```js
const onUsb = (data) => {
  if (data.type === 'disconnect') {
    // 设备断开（SDK 已清缓存）
  }
  if (data.type === 'connect') {
    // 设备接入（仍需重新 init）
  }
}
ServiceKeyboard.on('usbChange', onUsb)
// 不再需要时：ServiceKeyboard.off('usbChange', onUsb)
```

更多生命周期 / 电量 / 出厂复位见 [其它 API](./api/misc)。

## 常见问题

| 现象 | 处理 |
|---|---|
| `navigator.hid` 不存在 | 换 Chromium 浏览器，或确认 HTTPS / localhost |
| `getDevices()` 无设备 | 检查 VID/PID、`usagePage`/`usage`；确认固件枚举了厂商 HID |
| `init` 返回 `success: false` | `id` 与授权列表不匹配；先重新 `getDevices()` |
| 读写超时 / 无应答 | 确认已 `init`；2.4G 试 `packetSize: 0x18`；先 `getDeviceInfo` 对齐 `protocolVer` |
| 升级弹窗选不到 Boot | 先 `close()` 日常口；切 Boot 后另一次点击里调 `authorizeBoot()`，选 PID `33FF` / `55FF` / `66FF` |
| `Macro data exceeds device buffer` | 缩短宏动作，或确认 `macroSize` 已读到 |

## API 目录

| 文档 | 说明 |
|---|---|
| [设备信息](./api/info) | `getDeviceInfo`；**各功能能力位判断** |
| [功能区](./api/func) | `getFuncInfo` / `setFuncInfo` / `patchFuncInfo` |
| [布局/改键](./api/key) | `getKeymap` / `setKey` |
| [灯光](./api/lighting) | 背光/LOGO/侧灯、自定义灯色、音乐律动 |
| [点阵屏](./api/matrix) | 需 `info.matrixScreen` |
| [LCD](./api/lcd) | 需 `info.isLed`；`uploadImage` 一站式下发 |
| [编码器](./api/encoder) | 需 `info.encoder` |
| [性能](./api/performance) | Win 锁、全键无冲、休眠等 |
| [宏](./api/macro) | `getMacros` / `setMacros` |
| [在线升级](./api/upgrade) | `KeyboardFirmwareUpgrade`：FF00 切 Boot，再写 IAP bin |
| [其它 API](./api/misc) | 生命周期、缓存、电量（V2+）、2.4G 状态（`0xD0`）、出厂复位 |
| [命令说明](./api/commands) | 协议 CMD 全表、包格式 |
| [键值表](./keycodes) | `type/code1/code2` |
| [参数类型](./types) | `DeviceInfo` / `FuncInfo` 等 |
