# 基础的设备信息

协议版本、固件版本、层数，以及 VIA `GET/SET_KEYBOARD_VALUE`。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | 未连接时读写会失败 |
| 先读协议版本 | 层数、keymap 快路径依赖版本 |
| 固件版本 | 固件未定义 `VIA_FIRMWARE_VERSION` 时常回 `0` |
| 与厂商信息区不同 | 无 `getDeviceInfo()` 式信息区；能力以 VIA JSON + 本页命令为准 |

---

## 读取协议版本

`ServiceQmk.getProtocolVersion()`

VIA `0x01`。返回大端 uint16。

### 参数

无。

### 返回值

`Promise<number>`

| 常见值 | 说明 |
|---|---|
| `7` | Alpha |
| `8` | Beta |
| `9` | Gamma |

### 使用示例

```js
const ver = await ServiceQmk.getProtocolVersion()
```

---

## 读取固件版本

`ServiceQmk.getFirmwareVersion()`

`GET_KEYBOARD_VALUE` + `id_firmware_version`（4 字节大端 uint32）。

### 参数

无。

### 返回值

`Promise<number>`

### 使用示例

```js
const fw = await ServiceQmk.getFirmwareVersion()
```

---

## 读取层数

`ServiceQmk.getLayerCount()`

`protocol >= 8` 发 `0x11`；否则返回 `4`。

### 参数

无。

### 返回值

`Promise<number>`

### 使用示例

```js
const layers = await ServiceQmk.getLayerCount()
```

---

## 读取键盘值

`ServiceQmk.getKeyboardValue(valueId, parameters?, resultLength?)`

VIA `0x02`。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `valueId` | `number` | — | 见下表 / `KeyboardValue` |
| `parameters` | `number[]` | `[]` | 子命令附加参数 |
| `resultLength` | `number` | `1` | 期望结果字节数 |

| valueId | 常量 | 说明 |
|---|---|---|
| `0x01` | `UPTIME` | 运行时间（4 字节） |
| `0x02` | `LAYOUT_OPTIONS` | 布局选项（4 字节） |
| `0x03` | `SWITCH_MATRIX_STATE` | 矩阵扫描状态 |
| `0x04` | `FIRMWARE_VERSION` | 固件版本（4 字节） |

### 返回值

`Promise<number[]>`

### 使用示例

```js
import { KeyboardValue } from '@rdmctmzt/sdk-qmk'

const uptime = await ServiceQmk.getKeyboardValue(KeyboardValue.UPTIME, [], 4)
const layout = await ServiceQmk.getKeyboardValue(KeyboardValue.LAYOUT_OPTIONS, [], 4)
```

---

## 设置键盘值

`ServiceQmk.setKeyboardValue(valueId, ...rest)`

VIA `0x03`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `valueId` | `number` | 如 `LAYOUT_OPTIONS=0x02`、`DEVICE_INDICATION=0x05` |
| `...rest` | `number[]` | 子命令数据 |

### 返回值

`Promise<void>`

### 使用示例

```js
import { KeyboardValue } from '@rdmctmzt/sdk-qmk'

// 识别设备（指示）
await ServiceQmk.setKeyboardValue(KeyboardValue.DEVICE_INDICATION)
```
