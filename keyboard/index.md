# 键盘 SDK 文档

由于浏览器安全机制，调用 SDK 需走 HID 协议，**先完成浏览器授权**，再调用其它接口。

## 开始

### 引入

```bash
pnpm add @your-org/sdk-keyboard
```

> 包名以正式发布为准。

## 搭建项目

### 项目引用

1. 引入

```js
import Keyboard from '@your-org/sdk-keyboard'

const vendorId = 0x0000 // 替换为你的 VID
const productId = 0x0000 // 替换为你的 PID

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
  usage: 1,
  usagePage: 0xff00,
})
```

2. 获取授权

```js
const devices = await ServiceKeyboard.getDevices()
```

3. 初始化设备

```js
const { id } = devices[0]
const result = await ServiceKeyboard.init(id)
```

4. 监听 HID 拔插

```js
ServiceKeyboard.on('usbChange', (data) => {
  if (data.type === 'disconnect') {
    // 断开
  }
  if (data.type === 'connect') {
    // 接入
  }
})
```
