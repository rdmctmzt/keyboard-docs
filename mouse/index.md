# 鼠标 SDK 文档

由于浏览器安全机制，调用 SDK 需走 **WebHID**，**先完成浏览器授权**，再调用其它接口。

## 环境要求

| 项 | 说明 |
|---|---|
| 浏览器 | Chromium 系（Chrome / Edge 等）；需支持 WebHID |
| 页面来源 | **HTTPS** 或 `localhost`（否则无法调起授权） |
| 权限 | 须在点击等交互中调用 `getDevices()`；勿在页面加载时自动弹出 |

## 安装

```bash
pnpm add @rdmctmzt/sdk-mouse
```

## 接入步骤

### 1. 创建实例

```js
import Mouse from '@rdmctmzt/sdk-mouse'

// 请替换为你的 VID/PID（文档示例一律使用 0x0000）
const vendorId = 0x0000
const productId = 0x0000

const ServiceMouse = new Mouse({
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

完整类型见 [参数类型 · 创建鼠标实例](./types#创建鼠标实例)。

### 2. 授权并初始化

```js
const devices = await ServiceMouse.getDevices()
const { id } = devices[0]
await ServiceMouse.init(id)
```

### 3. 先读信息区，再改配置

```js
const info = await ServiceMouse.getDeviceInfo()
const func = await ServiceMouse.getFuncInfo()

await ServiceMouse.patchFuncInfo({ reportRate: 500 })
```

### 4. 监听 HID 拔插

```js
ServiceMouse.on('usbChange', (data) => {
  // data.type: 'connect' | 'disconnect'
})
```

断开后缓存会清空；重新插入后需再次 `init()`。

## 能力一览

| 能力 | 文档 |
|---|---|
| 设备信息（传感器 / DPI 组上限 / 回报率上限） | [基础的设备信息](./api/info) |
| LOD / 防抖 / 休眠 / 电量 / 恢复出厂 / 2.4G 状态 | [全局设置](./api/globalSetting) |
| 回报率 / DPI 组 | [性能 / DPI](./api/performance) |
| 按键映射 | [按键映射](./api/keyRemapping) |
| 宏 | [宏](./api/macro) |
| 命令表 / 包格式 | [命令说明](./api/commands) |
| 键值表 | [键值表](./keycodes) |
| 参数类型 | [参数类型](./types) |

鼠标协议命令表固定为 `CMD_MOUSE`（宏 `0x24/0x25`、电量 `0x28`、复位 `0x29`），与键盘 V1–V4 命令编号不同。详见 [命令说明](./api/commands)。
