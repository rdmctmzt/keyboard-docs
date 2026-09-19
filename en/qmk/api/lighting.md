# Lighting

VIA Custom menu channels: `0x07` write, `0x08` read, `0x09` save. Specific `channel` / `value_id` depend on firmware and VIA JSON (Lighting menu).

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Firmware-defined | No universal brightness step table; follow VIA JSON `content: [id, channel, valueId]` |
| Save after write | `setLightingValue` calls `saveCustomMenu(channel)` automatically |
| Channel convention | `0` custom · `1` backlight · `2` rgblight · `3` rgb matrix · `4` audio |

---

## Read custom menu value

`ServiceQmk.getCustomMenuValue(commandBytes)`

VIA `0x08`. Common form: `commandBytes = [channel, valueId]`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `commandBytes` | `number[]` | Usually `[channel, id]` |

### Returns

`Promise<number[]>` — value bytes (color often `[hue, sat]`)

### Example

```js
import { CustomChannel } from '@rdmctmzt/sdk-qmk'

// Example: read rgb matrix valueId (firmware-specific)
const [brightness] = await ServiceQmk.getCustomMenuValue([
  CustomChannel.RGB_MATRIX,
  0, // value_id: brightness etc., per VIA JSON
])
```

---

## Write custom menu value

`ServiceQmk.setCustomMenuValue(...args)`

VIA `0x07`. Write only; does not save.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `...args` | `number[]` | Usually `channel, id, ...values` |

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.setCustomMenuValue(3, 0, 128)
await ServiceQmk.saveCustomMenu(3)
```

---

## Save custom channel

`ServiceQmk.saveCustomMenu(channel)`

VIA `0x09`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `channel` | `number` | Channel number |

### Returns

`Promise<void>`

---

## Write and save lighting value

`ServiceQmk.setLightingValue(channel, id, ...values)`

Wraps `setCustomMenuValue` + `saveCustomMenu`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `channel` | `number` | Channel |
| `id` | `number` | value_id |
| `...values` | `number[]` | One value for range/dropdown; color as `hue, sat` |

### Returns

`Promise<void>`

### Example

```js
import { CustomChannel } from '@rdmctmzt/sdk-qmk'

await ServiceQmk.setLightingValue(CustomChannel.RGB_MATRIX, 0, 200)
// Color example
await ServiceQmk.setLightingValue(CustomChannel.RGB_MATRIX, 3, 128, 255)
```
