# Basic device information

Protocol version, firmware version, layer count, and VIA `GET/SET_KEYBOARD_VALUE`.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | Read/write fails when not connected |
| Read protocol version first | Layer count and keymap fast path depend on version |
| Firmware version | Often returns `0` if firmware does not define `VIA_FIRMWARE_VERSION` |
| Unlike vendor info area | No `getDeviceInfo()`-style block; capabilities follow VIA JSON and commands on this page |

---

## Read protocol version

`ServiceQmk.getProtocolVersion()`

VIA `0x01`. Returns big-endian uint16.

### Parameters

None.

### Returns

`Promise<number>`

| Common value | Description |
|---|---|
| `7` | Alpha |
| `8` | Beta |
| `9` | Gamma |

### Example

```js
const ver = await ServiceQmk.getProtocolVersion()
```

---

## Read firmware version

`ServiceQmk.getFirmwareVersion()`

`GET_KEYBOARD_VALUE` + `id_firmware_version` (4-byte big-endian uint32).

### Parameters

None.

### Returns

`Promise<number>`

### Example

```js
const fw = await ServiceQmk.getFirmwareVersion()
```

---

## Read layer count

`ServiceQmk.getLayerCount()`

Sends `0x11` when `protocol >= 8`; otherwise returns `4`.

### Parameters

None.

### Returns

`Promise<number>`

### Example

```js
const layers = await ServiceQmk.getLayerCount()
```

---

## Read keyboard value

`ServiceQmk.getKeyboardValue(valueId, parameters?, resultLength?)`

VIA `0x02`.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `valueId` | `number` | — | See table below / `KeyboardValue` |
| `parameters` | `number[]` | `[]` | Subcommand extra parameters |
| `resultLength` | `number` | `1` | Expected result byte count |

| valueId | Constant | Description |
|---|---|---|
| `0x01` | `UPTIME` | Uptime (4 bytes) |
| `0x02` | `LAYOUT_OPTIONS` | Layout options (4 bytes) |
| `0x03` | `SWITCH_MATRIX_STATE` | Matrix scan state |
| `0x04` | `FIRMWARE_VERSION` | Firmware version (4 bytes) |

### Returns

`Promise<number[]>`

### Example

```js
import { KeyboardValue } from '@rdmctmzt/sdk-qmk'

const uptime = await ServiceQmk.getKeyboardValue(KeyboardValue.UPTIME, [], 4)
const layout = await ServiceQmk.getKeyboardValue(KeyboardValue.LAYOUT_OPTIONS, [], 4)
```

---

## Set keyboard value

`ServiceQmk.setKeyboardValue(valueId, ...rest)`

VIA `0x03`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `valueId` | `number` | e.g. `LAYOUT_OPTIONS=0x02`, `DEVICE_INDICATION=0x05` |
| `...rest` | `number[]` | Subcommand payload |

### Returns

`Promise<void>`

### Example

```js
import { KeyboardValue } from '@rdmctmzt/sdk-qmk'

// Identify device (indication)
await ServiceQmk.setKeyboardValue(KeyboardValue.DEVICE_INDICATION)
```
