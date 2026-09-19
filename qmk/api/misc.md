# 其它 API

生命周期、EEPROM 复位与进入 Bootloader。

## 注意事项

| 条件 | 说明 |
|---|---|
| 业务命令须先 `init()` | `getDevices` / `on('usbChange')` 例外 |
| Chromium + 安全上下文 | HTTPS 或 `localhost` |
| 拔插后 | `disconnect` 会释放传输；须重新 `init()` |
| EEPROM 复位 | 恢复 VIA 相关参数为默认，慎用 |
| Bootloader | 设备会断开并进入 DFU，页面需重新授权连接 |

---

## 获取设备列表

`ServiceQmk.getDevices()`

弹出 WebHID 授权框。须在用户点击等交互中调用。

### 参数

无。

### 返回值

`Promise<HidDeviceInfo[]>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | `vid:pid:productName` |
| `productName` | `string?` | 产品名 |
| `vendorId` | `number` | VID |
| `productId` | `number` | PID |
| `opened` | `boolean` | 是否已打开 |

### 使用示例

```js
const devices = await ServiceQmk.getDevices()
const { id } = devices[0]
```

---

## 打开设备

`ServiceQmk.init(id)`

按 `id` 打开已授权设备，建立 VIA 传输，并尝试缓存协议版本。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | `getDevices()` 的 `id`，或 `vendorId:productId` |

### 返回值

`Promise<{ success: boolean, device: HidDeviceInfo | null }>`

### 使用示例

```js
const { success, device } = await ServiceQmk.init(devices[0].id)
if (!success) throw new Error('init failed')
```

---

## 监听 HID 拔插

`ServiceQmk.on('usbChange', listener)` / `ServiceQmk.off('usbChange', listener)`

`on` / `off` 没有返回值。是哪台键盘，看回调参数 `data.device`，不要看这两个方法的返回值。

浏览器只通知已经授权过的 HID。别的键盘插拔也会进同一个回调，用 VID、PID、产品名对上自己那台。同一台键盘有多个接口时，可能连着收到几次，这三项相同。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `listener` | `(data: UsbChangePayload) => void` | `off` 必须传入同一个函数 |

`data` 的字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | 接入 / 拔出 |
| `device` | `HIDDevice?` | 这次插拔的设备。断开时偶尔没有 |
| `device.vendorId` | `number` | USB VID。和构造时的 `vendorId` 用数字比较，不是十六进制字符串 |
| `device.productId` | `number` | USB PID |
| `device.productName` | `string?` | 产品名。`init` 用的 `id` 是 `` `${vendorId}:${productId}:${productName ?? ''}` `` |

### 返回值

无。设备身份在回调的 `data.device` 里。

### 使用示例

```js
const vendorId = 0x0000
const productId = 0x0000

const onUsb = (data) => {

  if (data.type === 'disconnect') {
    // id 就是这台键盘。传输已释放，插回后重新 init
  }
  if (data.type === 'connect') {
    // 这台键盘插入了，用 id 重新 init
  }
}
ServiceQmk.on('usbChange', onUsb)
// ServiceQmk.off('usbChange', onUsb)
```

---

## EEPROM 复位

`ServiceQmk.resetEeprom()`

VIA `0x0A`。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.resetEeprom()
```

---

## 进入 Bootloader

`ServiceQmk.jumpToBootloader()`

VIA `0x0B`。调用后设备通常断开。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.jumpToBootloader()
```

---

## 读取已缓存的协议版本

`ServiceQmk.cachedProtocolVersion`

`init()` / `getProtocolVersion()` 成功后缓存的数值；未读过为 `0`。同步属性，不是 Promise。

### 参数

无。

### 返回值

`number`

### 使用示例

```js
const ver = ServiceQmk.cachedProtocolVersion
```
