# 其它 API

生命周期、缓存、电量、2.4G 状态与出厂复位。

## 注意事项

| 条件 | 说明 |
|---|---|
| 业务命令须先 `init()` | `getDevices` / `on('usbChange')` / `on('rfStatus')` 例外 |
| Chromium + 安全上下文 | 需 HTTPS 或 `localhost`；无 `navigator.hid` 则不可用 |
| 拔插后 | `disconnect` 会清缓存；再次使用须重新 `init()` |
| 电量 | `protocolVer < 2` 无此命令 |
| 恢复出厂 | 清空设备侧配置；调用后应重新读信息区 / 功能区 / 键表 |

---

## 获取设备列表

`ServiceKeyboard.getDevices()`

弹出 WebHID 授权框，获取用户授权的设备列表。须在用户点击等交互中调用。

### 参数

无。

### 返回值

`Promise<HidDeviceInfo[]>`

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `id` | `string` | 设备标识（`vid:pid:productName`） | `"13968:24579:…"` |
| `productName` | `string?` | 产品名 | `"ET65 HE"` |
| `vendorId` | `number` | VID | `0x3690` |
| `productId` | `number` | PID | `0x0603` |
| `opened` | `boolean` | 是否已打开 | `false` |

### 使用示例

```js
const devices = await ServiceKeyboard.getDevices()
const { id, vendorId, productId, productName } = devices[0]
```

---

## 打开设备

`ServiceKeyboard.init(id)`

按 `id` 打开已授权设备，建立传输层并清空信息区 / 功能区缓存。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | `getDevices()` 返回的 `id`，或 `vendorId:productId` |

### 返回值

`Promise<{ success: boolean, device: HidDeviceInfo | null }>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | `boolean` | 是否打开成功 |
| `device` | `HidDeviceInfo \| null` | 成功时为当前设备信息 |

### 使用示例

```js
const devices = await ServiceKeyboard.getDevices()
const { success, device } = await ServiceKeyboard.init(devices[0].id)
if (!success) {
  throw new Error('init failed')
}
```

---

## 当前已连接设备

`ServiceKeyboard.getCurrentDevice()`

读取当前已 `init` 的设备信息。

### 参数

无。

### 返回值

`HidDeviceInfo | null` — 未连接为 `null`。字段同 [获取设备列表](#获取设备列表)。

### 使用示例

```js
const cur = ServiceKeyboard.getCurrentDevice()
if (cur) console.log(cur.vendorId, cur.productId)
```

---

## 关闭连接

`ServiceKeyboard.close()`

关通讯、释放传输、关闭 HID，并清空缓存。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceKeyboard.close()
```

---

## 监听设备插拔

`ServiceKeyboard.on('usbChange', listener)` / `off('usbChange', listener)`

监听 HID 设备接入 / 断开。`disconnect` 时 SDK 会清缓存；再次使用须重新 `init()`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `event` | `'usbChange'` | 固定 |
| `listener` | `(data) => void` | `off` 须传入同一函数引用 |

事件数据：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | 接入 / 断开 |
| `device` | `HIDDevice?` | 浏览器设备对象 |

### 返回值

无。

### 使用示例

```js
const onUsb = (data) => {
  if (data.type === 'disconnect') {
    // 设备断开
  }
  if (data.type === 'connect') {
    // 仍需重新 init
  }
}
ServiceKeyboard.on('usbChange', onUsb)
ServiceKeyboard.off('usbChange', onUsb)
```

---

## 读取缓存

`ServiceKeyboard.getCachedDeviceInfo()` / `getCachedFuncInfo()`

读取内存中上次信息区 / 功能区结果，不发 HID 命令。

### 参数

无。

### 返回值

| 方法 | 返回 |
|---|---|
| `getCachedDeviceInfo()` | 上次 `getDeviceInfo()`；未读过为 `null` |
| `getCachedFuncInfo()` | 上次功能区；未读过为 `null` |

`close()`、断开、重新 `init()` 会清空。

### 使用示例

```js
const info = ServiceKeyboard.getCachedDeviceInfo()
const func = ServiceKeyboard.getCachedFuncInfo()
```

---

## 恢复出厂

`ServiceKeyboard.restoreFactorySettings()`

发送 CMD `0x31`，恢复设备出厂配置。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceKeyboard.restoreFactorySettings()
await ServiceKeyboard.getDeviceInfo()
await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.getKeymap(0)
```

---

## 读取电量 {#getbatterystatus}

`ServiceKeyboard.getBatteryStatus()`

读取电量与充电标志（CMD `0x30`）。

### 参数

无。

### 返回值

`Promise<BatteryStatus | null>` — 失败或无命令时为 `null`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `batteryPercent` | `number` | `0–100`（协议十六进制百分值，`0x64`=100%） |
| `chargeFlag` | `number` | 非 `0` 通常表示充电中 |
| `online` | `boolean` | 本次是否读成功 |

### 使用示例

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (info.protocolVer >= 2) {
  const status = await ServiceKeyboard.getBatteryStatus()
  if (status) {
    console.log(status.batteryPercent, status.chargeFlag)
  }
}
```

### 注意事项

| 条件 | 说明 |
|---|---|
| `protocolVer ≥ 2` | V1 无电量命令，返回 `null` |
| 部分单模机型 | 驱动侧可能不展示电量；读失败同样为 `null` |

---

## 查询 2.4G 状态 {#getrfstatus}

`ServiceKeyboard.getRfStatus()`

主动查询 2.4G / RF 连接状态（CMD `0xD0`）。返回状态码与**无线端键盘**的 VID / PID（不是接收器本身）。

### 参数

无。

### 返回值

`Promise<RfStatus | null>` — 解析失败为 `null`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | `number` | `0` 默认 / `1` 空闲 / `2` 配对 / `3` 回连 / `4` 连接成功 / `5` 休眠 |
| `vendorId` | `number` | 无线键盘 VID |
| `productId` | `number` | 无线键盘 PID |
| `keyboardNum` | `number` | 连接设备数 |
| `connected` | `boolean` | `status === 4` |

### 使用示例

```js
const rf = await ServiceKeyboard.getRfStatus()
if (rf) {
  console.log(rf.status, rf.vendorId, rf.productId, rf.connected)
}
```

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 多为 2.4G 接收器 / V3+；无 RF 能力时勿依赖 |
| 仅 `status === 4` | 视为无线键盘在线；其它状态通常应清空无线身份 |

---

## 监听 2.4G 上报

`ServiceKeyboard.on('rfStatus', listener)` / `off('rfStatus', listener)`

接收接收器**主动上报**的 `0xAA 0xD0` 包，字段同 [查询 2.4G 状态](#getrfstatus)。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `event` | `'rfStatus'` | 固定 |
| `listener` | `(rf: RfStatus) => void` | `off` 须同一引用 |

### 返回值

无。回调入参为 `RfStatus`（见 [查询 2.4G 状态 · 返回值](#getrfstatus)）。

### 使用示例

```js
ServiceKeyboard.on('rfStatus', (rf) => {
  if (rf.connected) {
    console.log(rf.vendorId, rf.productId)
  }
})
```

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 同 `getRfStatus` |
| 仅 `status === 4` | 视为连接成功 |
