# Other APIs

Lifecycle, cache, battery, 2.4G status, and factory reset.

## Notes

| Condition | Description |
|---|---|
| Business commands need `init()` first | Except `getDevices` / `on('usbChange')` / `on('rfStatus')` |
| Chromium + secure context | HTTPS or `localhost`; without `navigator.hid` it is unavailable |
| After unplug | `disconnect` clears cache; call `init()` again before use |
| Battery | No command when `protocolVer < 2` |
| Factory reset | Clears device-side config; re-read information area / function area / keymap afterward |

---

## Get device list {#get-devices}

`ServiceKeyboard.getDevices()`

Shows the WebHID authorization dialog and returns the user-authorized device list. Must be called from a user gesture (e.g. click).

### Parameters

None.

### Returns

`Promise<HidDeviceInfo[]>`

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | `string` | Device id (`vid:pid:productName`) | `"13968:24579:…"` |
| `productName` | `string?` | Product name | `"ET65 HE"` |
| `vendorId` | `number` | VID | `0x3690` |
| `productId` | `number` | PID | `0x0603` |
| `opened` | `boolean` | Whether open | `false` |

### Example

```js
const devices = await ServiceKeyboard.getDevices()
const { id, vendorId, productId, productName } = devices[0]
```

---

## Open device

`ServiceKeyboard.init(id)`

Opens an authorized device by `id`, sets up transport, and clears information / function area cache.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `string` | `id` from `getDevices()`, or `vendorId:productId` |

### Returns

`Promise<{ success: boolean, device: HidDeviceInfo | null }>`

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether open succeeded |
| `device` | `HidDeviceInfo \| null` | Current device info when successful |

### Example

```js
const devices = await ServiceKeyboard.getDevices()
const { success, device } = await ServiceKeyboard.init(devices[0].id)
if (!success) {
  throw new Error('init failed')
}
```

---

## Current connected device

`ServiceKeyboard.getCurrentDevice()`

Returns the device after `init`.

### Parameters

None.

### Returns

`HidDeviceInfo | null` — `null` when not connected. Same fields as [Get device list](#get-devices).

### Example

```js
const cur = ServiceKeyboard.getCurrentDevice()
if (cur) console.log(cur.vendorId, cur.productId)
```

---

## Close connection

`ServiceKeyboard.close()`

Closes session, releases transport, closes HID, and clears cache.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceKeyboard.close()
```

---

## Listen for connect/disconnect

`ServiceKeyboard.on('usbChange', listener)` / `off('usbChange', listener)`

HID attach / detach. On `disconnect` the SDK clears cache; call `init()` again before use.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `event` | `'usbChange'` | Fixed |
| `listener` | `(data) => void` | `off` must use the same function reference |

Event payload:

| Field | Type | Description |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | Attached / removed |
| `device` | `HIDDevice?` | Browser device object |

### Returns

None.

### Example

```js
const onUsb = (data) => {
  if (data.type === 'disconnect') {
    // Device disconnected
  }
  if (data.type === 'connect') {
    // Still need to init again
  }
}
ServiceKeyboard.on('usbChange', onUsb)
ServiceKeyboard.off('usbChange', onUsb)
```

---

## Read cache

`ServiceKeyboard.getCachedDeviceInfo()` / `getCachedFuncInfo()`

Last in-memory information / function area result; no HID command.

### Parameters

None.

### Returns

| Method | Returns |
|---|---|
| `getCachedDeviceInfo()` | Last `getDeviceInfo()`; `null` if never read |
| `getCachedFuncInfo()` | Last function area; `null` if never read |

Cleared by `close()`, disconnect, or new `init()`.

### Example

```js
const info = ServiceKeyboard.getCachedDeviceInfo()
const func = ServiceKeyboard.getCachedFuncInfo()
```

---

## Factory reset

`ServiceKeyboard.restoreFactorySettings()`

Sends CMD `0x31` to restore factory configuration.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceKeyboard.restoreFactorySettings()
await ServiceKeyboard.getDeviceInfo()
await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.getKeymap(0)
```

---

## Read battery {#getbatterystatus}

`ServiceKeyboard.getBatteryStatus()`

Reads battery level and charge flag (CMD `0x30`).

### Parameters

None.

### Returns

`Promise<BatteryStatus | null>` — `null` on failure or when command is unavailable.

| Field | Type | Description |
|---|---|---|
| `batteryPercent` | `number` | `0–100` (protocol hex percent; `0x64`=100%) |
| `chargeFlag` | `number` | Non-`0` usually means charging |
| `online` | `boolean` | Whether this read succeeded |

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (info.protocolVer >= 2) {
  const status = await ServiceKeyboard.getBatteryStatus()
  if (status) {
    console.log(status.batteryPercent, status.chargeFlag)
  }
}
```

### Notes

| Condition | Description |
|---|---|
| `protocolVer ≥ 2` | V1 has no battery command; returns `null` |
| Some single-mode models | Driver may hide battery; failed read is also `null` |

---

## Query 2.4G status {#getrfstatus}

`ServiceKeyboard.getRfStatus()`

Active query of 2.4G / RF link (CMD `0xD0`). Returns status and **wireless keyboard** VID / PID (not the dongle).

### Parameters

None.

### Returns

`Promise<RfStatus | null>` — `null` when parse fails.

| Field | Type | Description |
|---|---|---|
| `status` | `number` | `0` default / `1` idle / `2` pairing / `3` reconnecting / `4` connected / `5` sleep |
| `vendorId` | `number` | Wireless keyboard VID |
| `productId` | `number` | Wireless keyboard PID |
| `keyboardNum` | `number` | Connected device count |
| `connected` | `boolean` | `status === 4` |

### Example

```js
const rf = await ServiceKeyboard.getRfStatus()
if (rf) {
  console.log(rf.status, rf.vendorId, rf.productId, rf.connected)
}
```

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Often 2.4G dongle / V3+; do not rely on this without RF capability |
| Only `status === 4` | Treat as wireless keyboard online; other states usually clear wireless identity |

---

## Listen for 2.4G reports

`ServiceKeyboard.on('rfStatus', listener)` / `off('rfStatus', listener)`

Receiver **proactive** `0xAA 0xD0` packets; same fields as [Query 2.4G status](#getrfstatus).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `event` | `'rfStatus'` | Fixed |
| `listener` | `(rf: RfStatus) => void` | Same reference for `off` |

### Returns

None. Callback argument is `RfStatus` (see [Query 2.4G status · Returns](#getrfstatus)).

### Example

```js
ServiceKeyboard.on('rfStatus', (rf) => {
  if (rf.connected) {
    console.log(rf.vendorId, rf.productId)
  }
})
```

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Same as `getRfStatus` |
| Only `status === 4` | Treat as connected |
