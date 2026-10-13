# 其它 API

生命周期与 HID 拔插。

## 注意事项

| 条件 | 说明 |
|---|---|
| 业务命令须先 `init()` / `initDevice()` | `getDevices` / `on('usbChange')` 例外 |
| 过滤接口 | 厂商口常用 `usagePage: 0xff00`，`usage: 1` 或 `2`（**不是** VIA 的 `0xff60`） |
| 分包 | 有线默认 `packetSize: 0x38`；2.4G / 接收器侧常 `0x18` |

---

## 获取设备列表

`ServiceMouse.getDevices()`

弹出 WebHID 授权框。须在用户点击等交互中调用。

### 返回值

`Promise<HidDeviceInfo[]>`

---

## 打开设备

`ServiceMouse.init(id)`

按 `id` 打开已授权设备；内部调用 `initDevice`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | `getDevices()` 的 `id`，或 `vendorId:productId` |

### 返回值

`Promise<{ success: boolean, device: HidDeviceInfo | null }>`

```js
const devices = await ServiceMouse.getDevices()
await ServiceMouse.init(devices[0].id)
```

---

## 绑定已有 HIDDevice

`ServiceMouse.initDevice(device)`

驱动 / 宿主已打开物理口时使用。同 VID/PID 多接口时优先选厂商通讯口。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `device` | `HIDDevice` | 原生 WebHID 设备 |

### 返回值

`Promise<{ success: boolean, device: HidDeviceInfo | null }>`

```js
await ServiceMouse.initDevice(hostHidDevice)
```

---

## 当前已连接设备

`ServiceMouse.getCurrentDevice()`

### 返回值

`HidDeviceInfo | null`

---

## 原生 HIDDevice

`ServiceMouse.getNativeDevice()`

### 返回值

`HIDDevice | null`

---

## 关闭连接

`ServiceMouse.close()`

关通讯、释放传输、关闭 HID，并清空缓存。

### 返回值

`Promise<void>`

```js
await ServiceMouse.close()
```

---

## 监听 HID 拔插

`ServiceMouse.on('usbChange', listener)` / `ServiceMouse.off('usbChange', listener)`

另有 `on('rfStatus', listener)`（2.4G 状态报告，见协议说明）。

```js
ServiceMouse.on('usbChange', (data) => {
  // data.type: 'connect' | 'disconnect'
  // data.device?.vendorId / productId
})
```

---

## 灯光便捷写入

`ServiceMouse.setLight(patch)`

封装 `patchFuncInfo`，只传灯光相关字段即可。

```js
await ServiceMouse.setLight({ lightSwitch: 1, lightMode: 2 })
```

---

## 读取缓存的功能区

`ServiceMouse.getCachedFuncInfo()`

返回内存中上次读/写后的功能区，不发 HID。未读过为 `null`。

