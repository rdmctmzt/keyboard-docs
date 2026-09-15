# 鼠标 SDK 文档

用于鼠标设备的 WebHID 接入。需在 Chromium 浏览器中授权后调用。

## 开始

### 引入

```bash
pnpm add @your-org/sdk-mouse
```

> 包名以正式发布为准。

## 搭建项目

### 项目引用

1. 引入

```js
import Mouse from '@your-org/sdk-mouse'

const vendorId = 0x0000 // 替换为你的 VID
const productId = 0x0000 // 替换为你的 PID

const ServiceMouse = new Mouse({
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
})
```

2. 获取授权

```js
const devices = await ServiceMouse.getDevices()
```

3. 初始化设备

```js
const { id } = devices[0]
const result = await ServiceMouse.init(id)
```

4. 监听 HID 拔插

```js
ServiceMouse.on('usbChange', (data) => {
  // connect / disconnect
})
```
