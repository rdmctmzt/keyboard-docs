# Global settings

Covers **LOD / key debounce / sleep** in the function area, plus battery, factory reset, and related APIs.

Lighting on/off and mode are in the function area `light` field; see [Write lighting (function area light)](#write-light).

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer `getDeviceInfo()` first | Confirm model capabilities |
| **Read before write** | `setFuncInfo` requires a full object; for partial changes use `patchFuncInfo` or `setParams` |
| Sleep units | `sleepTime` / `deepSleepTime` are in **seconds** (24-bit) |

```js
await ServiceMouse.getDeviceInfo()
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.setParams({ lodHeight: 2, scanDelay: 8, sleepTime: 60 })
```

---

## Read function area {#read-func}

`ServiceMouse.getFuncInfo()`

Reads the full function area (CMD `0x14`).

### Parameters

None.

### Returns

`Promise<MouseFuncInfo>` — see [Parameter types](../types#mousefuncinfo).

### Example

```js
const func = await ServiceMouse.getFuncInfo()
```

---

## Write full function area

`ServiceMouse.setFuncInfo(data)`

Overwrites the function area with a complete object (CMD `0x15`); unchanged fields must still be included (read first, then write).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `data` | `MouseFuncInfo` | Full function area |

### Returns

`Promise<MouseFuncInfo>`

### Example

```js
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.setFuncInfo({ ...func, reportRate: 1000 })
```

---

## Patch function area fields

`ServiceMouse.patchFuncInfo(patch)`

Pass only fields to change; the SDK merges with the current function area and writes the full packet back.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch` | `Partial<MouseFuncInfo>` | Partial fields |

### Returns

`Promise<MouseFuncInfo>` — complete object after write.

### Example

```js
await ServiceMouse.patchFuncInfo({ lodHeight: 1, scanDelay: 8 })
```

---

## Set LOD / debounce / sleep

`ServiceMouse.setParams(patch)`

Equivalent to `patchFuncInfo` for global-parameter fields only.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `scanDelay` | `number?` | Key debounce / scan delay (ms), commonly 1 / 2 / 4 / 8 / 15 / 20 |
| `lodHeight` | `1 \| 2?` | LOD lift-off distance (mm) |
| `sleepTime` | `number?` | Primary sleep (seconds) |
| `deepSleepTime` | `number?` | Secondary sleep (seconds) |

### Returns

`Promise<MouseFuncInfo>`

### Example

```js
await ServiceMouse.setParams({
  lodHeight: 1,
  scanDelay: 8,
  sleepTime: 30,
  deepSleepTime: 300,
})
```

---

## Write lighting (function area light) {#write-light}

Write the embedded `light` object via `patchFuncInfo` (on/off, mode, brightness, speed, RGB).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.light` | `object` | Merge with existing `func.light`, then change target fields |
| `patch.light.on` | `boolean?` | Lighting on/off |
| `patch.light.mode` | `number?` | Mode |
| `patch.light.brightness` | `number?` | Brightness |
| `patch.light.speed` | `number?` | Speed |
| `patch.light.r` / `g` / `b` | `number?` | RGB `0–255` |

### Returns

`Promise<MouseFuncInfo>`

### Example

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

### Notes

On models without lighting (`info.showLight === false`), writes may have no effect.

---

## Read battery status {#getbatterystatus}

`ServiceMouse.getBatteryStatus()`

Queries battery level (CMD `0x28`).

### Parameters

None.

### Returns

`Promise<BatteryStatus | null>` — `null` if parsing fails.

| Field | Type | Description |
|---|---|---|
| `batteryPercent` | `number` | 0–100 |
| `chargeFlag` | `number` | Charge flag (firmware-defined) |
| `online` | `boolean` | `true` when read succeeded |

### Example

```js
const battery = await ServiceMouse.getBatteryStatus()
if (battery) {
  console.log(battery.batteryPercent, battery.chargeFlag)
}
```

---

## Query 2.4G status {#getrfstatus}

`ServiceMouse.getRfStatus()`

Queries 2.4G / RF connection state (CMD `0xD0`). Returns status code and **wireless device** VID / PID (not the dongle itself).

### Parameters

None.

### Returns

`Promise<RfStatus | null>` — `null` if parsing fails.

| Field | Type | Description |
|---|---|---|
| `status` | `number` | `0` default / `1` idle / `2` pairing / `3` reconnecting / `4` connected / `5` sleep |
| `vendorId` | `number` | Wireless device VID |
| `productId` | `number` | Wireless device PID |
| `keyboardNum` | `number` | Number of connected devices |
| `connected` | `boolean` | `status === 4` |

### Example

```js
const rf = await ServiceMouse.getRfStatus()
if (rf) {
  console.log(rf.status, rf.vendorId, rf.productId, rf.connected)
}
```

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Mostly 2.4G dongles; do not rely on this without RF capability |
| Only `status === 4` | Treat as wireless device online; other states usually mean clear wireless identity |

---

## Listen for 2.4G reports

`ServiceMouse.on('rfStatus', listener)` / `ServiceMouse.off('rfStatus', listener)`

Receives dongle **proactive** `0xAA 0xD0` packets; fields match [Query 2.4G status](#getrfstatus).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `event` | `'rfStatus'` | Fixed |
| `listener` | `(rf: RfStatus) => void` | Same reference required for `off` |

### Returns

None. Callback receives `RfStatus` (see [Query 2.4G status · Returns](#getrfstatus)).

### Example

```js
ServiceMouse.on('rfStatus', (rf) => {
  if (rf.connected) {
    console.log(rf.vendorId, rf.productId)
  }
})
```

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Same as `getRfStatus` |
| Only `status === 4` | Treat as connection success |

---

## Restore factory settings {#restorefactorysettings}

`ServiceMouse.restoreFactorySettings()`

Sends CMD `0x29` to restore factory configuration.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceMouse.restoreFactorySettings()
await ServiceMouse.getDeviceInfo()
await ServiceMouse.getFuncInfo()
await ServiceMouse.getKeymap()
```
