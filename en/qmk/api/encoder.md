# Encoders

Dynamic encoder keycodes: each encoder on each layer binds one 16-bit keycode for clockwise and counter-clockwise rotation.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Firmware-dependent | Keyboards without encoders may not support these calls |
| `id` | Encoder index from 0, matching VIA JSON |

---

## Read encoder keycode

`ServiceQmk.getEncoder(layer, id, clockwise)`

VIA `0x14`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `layer` | `number` | Layer |
| `id` | `number` | Encoder index |
| `clockwise` | `boolean` | `true` clockwise, `false` counter-clockwise |

### Returns

`Promise<number>` — 16-bit keycode

### Example

```js
const cw = await ServiceQmk.getEncoder(0, 0, true)
const ccw = await ServiceQmk.getEncoder(0, 0, false)
```

---

## Set encoder keycode

`ServiceQmk.setEncoder(layer, id, clockwise, keycode)`

VIA `0x15`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `layer` | `number` | Layer |
| `id` | `number` | Encoder index |
| `clockwise` | `boolean` | Direction |
| `keycode` | `number` | 16-bit QMK keycode |

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.setEncoder(0, 0, true, 0x00ea)  // Example: volume up
await ServiceQmk.setEncoder(0, 0, false, 0x00e9) // Example: volume down
```

---

## Read binding object

`ServiceQmk.getEncoderBinding(layer, id, clockwise)`

Same as `getEncoder`, returns an object.

### Returns

`Promise<EncoderBinding>`

| Field | Type | Description |
|---|---|---|
| `layer` | `number` | Layer |
| `id` | `number` | Encoder index |
| `clockwise` | `boolean` | Direction |
| `keycode` | `number` | Keycode |
