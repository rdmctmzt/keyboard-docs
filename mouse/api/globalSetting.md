# 全局设置

对应功能区里的 **LOD / 按键防抖 / 休眠**，以及电量、恢复出厂等杂项接口。

灯光开关与模式也在功能区 `light` 字段，见 [改写灯光（功能区 light）](#改写灯光功能区-light)。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 建议先 `getDeviceInfo()` | 确认机型能力 |
| **先读后写** | `setFuncInfo` 须带完整对象；只改几项用 `patchFuncInfo` 或 `setParams` |
| 休眠单位 | `sleepTime` / `deepSleepTime` 为**秒**（24bit） |

```js
await ServiceMouse.getDeviceInfo()
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.setParams({ lodHeight: 2, scanDelay: 8, sleepTime: 60 })
```

---

## 读取功能区

`ServiceMouse.getFuncInfo()`

读取整包功能区（CMD `0x14`）。

### 参数

无。

### 返回值

`Promise<MouseFuncInfo>` — 见 [参数类型](../types#mousefuncinfo)。

### 使用示例

```js
const func = await ServiceMouse.getFuncInfo()
```

---

## 整包覆盖写入功能区

`ServiceMouse.setFuncInfo(data)`

用完整对象覆盖功能区（CMD `0x15`）；未改字段也须带上（先读后写）。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `data` | `MouseFuncInfo` | 完整功能区 |

### 返回值

`Promise<MouseFuncInfo>`

### 使用示例

```js
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.setFuncInfo({ ...func, reportRate: 1000 })
```

---

## 按字段改写功能区

`ServiceMouse.patchFuncInfo(patch)`

只传要改的字段；SDK 内部与当前功能区合并后再整包写回。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch` | `Partial<MouseFuncInfo>` | 局部字段 |

### 返回值

`Promise<MouseFuncInfo>` — 写回后的完整对象。

### 使用示例

```js
await ServiceMouse.patchFuncInfo({ lodHeight: 1, scanDelay: 8 })
```

---

## 设置 LOD / 防抖 / 休眠

`ServiceMouse.setParams(patch)`

等价于只改全局参数相关字段的 `patchFuncInfo`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `scanDelay` | `number?` | 按键防抖 / 扫描延迟（ms），常见 1 / 2 / 4 / 8 / 15 / 20 |
| `lodHeight` | `1 \| 2?` | LOD 静默高度（mm） |
| `sleepTime` | `number?` | 一级休眠（秒） |
| `deepSleepTime` | `number?` | 二级休眠（秒） |

### 返回值

`Promise<MouseFuncInfo>`

### 使用示例

```js
await ServiceMouse.setParams({
  lodHeight: 1,
  scanDelay: 8,
  sleepTime: 30,
  deepSleepTime: 300,
})
```

---

## 改写灯光（功能区 light）

通过 `patchFuncInfo` 写入内嵌 `light` 对象（开关 / 模式 / 亮度 / 速度 / RGB）。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.light` | `object` | 须合并现有 `func.light`，再改目标字段 |
| `patch.light.on` | `boolean?` | 灯效开关 |
| `patch.light.mode` | `number?` | 模式 |
| `patch.light.brightness` | `number?` | 亮度 |
| `patch.light.speed` | `number?` | 速度 |
| `patch.light.r` / `g` / `b` | `number?` | RGB `0–255` |

### 返回值

`Promise<MouseFuncInfo>`

### 使用示例

```js
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.patchFuncInfo({
  light: {
    ...func.light,
    on: true,
    mode: 1,
    brightness: 3,
    speed: 2,
    r: 255,
    g: 0,
    b: 0,
  },
})
```

### 注意事项

无灯机型（`info.showLight === false`）写入可能无效。

---

## 读取电量

`ServiceMouse.getBatteryStatus()`

主动查询电量（CMD `0x28`）。

### 参数

无。

### 返回值

`Promise<BatteryStatus | null>` — 解析失败为 `null`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `batteryPercent` | `number` | 0–100 |
| `chargeFlag` | `number` | 充电标志（固件定义） |
| `online` | `boolean` | 读成功时为 `true` |

### 使用示例

```js
const battery = await ServiceMouse.getBatteryStatus()
if (battery) {
  console.log(battery.batteryPercent, battery.chargeFlag)
}
```

---

## 查询 2.4G 状态 {#getrfstatus}

`ServiceMouse.getRfStatus()`

主动查询 2.4G / RF 连接状态（CMD `0xD0`）。返回状态码与**无线端设备**的 VID / PID（不是接收器本身）。

### 参数

无。

### 返回值

`Promise<RfStatus | null>` — 解析失败为 `null`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | `number` | `0` 默认 / `1` 空闲 / `2` 配对 / `3` 回连 / `4` 连接成功 / `5` 休眠 |
| `vendorId` | `number` | 无线设备 VID |
| `productId` | `number` | 无线设备 PID |
| `keyboardNum` | `number` | 连接设备数 |
| `connected` | `boolean` | `status === 4` |

### 使用示例

```js
const rf = await ServiceMouse.getRfStatus()
if (rf) {
  console.log(rf.status, rf.vendorId, rf.productId, rf.connected)
}
```

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 多为 2.4G 接收器；无 RF 能力时勿依赖 |
| 仅 `status === 4` | 视为无线设备在线；其它状态通常应清空无线身份 |

---

## 监听 2.4G 上报

`ServiceMouse.on('rfStatus', listener)` / `ServiceMouse.off('rfStatus', listener)`

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
ServiceMouse.on('rfStatus', (rf) => {
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

---

## 恢复出厂设置

`ServiceMouse.restoreFactorySettings()`

发送 CMD `0x29`，恢复设备出厂配置。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceMouse.restoreFactorySettings()
await ServiceMouse.getDeviceInfo()
await ServiceMouse.getFuncInfo()
await ServiceMouse.getKeymap()
```
