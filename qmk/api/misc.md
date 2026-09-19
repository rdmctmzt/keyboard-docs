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

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `listener` | `(data: UsbChangePayload) => void` | `type`: `connect` \| `disconnect` |

### 返回值

无。

### 使用示例

```js
const onUsb = (data) => {
  if (data.type === 'disconnect') {
    // 已释放传输；插回后重新 init
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
