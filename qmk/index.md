# QMK SDK 文档

用于 **VIA / QMK** 协议键盘。需在 Chromium 浏览器中通过 WebHID 授权后调用。

## 开始

### 引入

```bash
pnpm add @your-org/sdk-qmk
```

> 包名以正式发布为准。

## 搭建项目

### 项目引用

1. 引入

```js
import QmkKeyboard from '@your-org/sdk-qmk'

const vendorId = 0x0000 // 替换为你的 VID
const productId = 0x0000 // 替换为你的 PID

const ServiceQmk = new QmkKeyboard({
  configs: [{ vendorId, productId, usagePage: 0xff60, usage: 1 }],
})
```

2. 获取授权

```js
const devices = await ServiceQmk.getDevices()
```

3. 初始化设备

```js
const { id } = devices[0]
const result = await ServiceQmk.init(id)
```

4. 监听 HID 拔插

```js
ServiceQmk.on('usbChange', (data) => {
  // connect / disconnect
})
```
