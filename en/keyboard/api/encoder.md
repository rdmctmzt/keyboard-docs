# Encoder

## Notes

| Condition | Description |
|---|---|
| `info.encoder === true` | Information area indicates encoder / knob |
| `CMD_GET_WHEEL_DATA` | Command id varies with `protocolVer`; returns `null` when missing |
| `wheelDefaultMode` | Function-area field; some layouts omit it |

---

## Read knob key indices

`ServiceKeyboard.getEncoderWheel()`

Reads key indices for left / center / right (`CMD_GET_WHEEL_DATA`, id varies with `protocolVer`). Remap those keys with [Layout / remapping](./key) `setKey`.

### Parameters

None.

### Returns

`Promise<EncoderWheelData | null>` — `null` on failure or when command is unavailable.

| Field | Type | Description |
|---|---|---|
| `left` | `number` | Key index for counter-clockwise turn |
| `center` | `number` | Key index for press |
| `right` | `number` | Key index for clockwise turn |

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (info.encoder) {
  const wheel = await ServiceKeyboard.getEncoderWheel()
}
```

---

## Set wheel default mode

`ServiceKeyboard.setEncoder(patch)`

Sets encoder default mode (writes function area `wheelDefaultMode`).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.wheelDefaultMode` | `number?` | `0` / `1`, enable second mode |

### Returns

`Promise<FuncInfo>` — full function area after write. Same as `patchFuncInfo({ wheelDefaultMode })`.

### Example

```js
await ServiceKeyboard.setEncoder({ wheelDefaultMode: 1 })
```
