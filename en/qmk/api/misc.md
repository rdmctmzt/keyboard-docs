# Other APIs

Lifecycle, EEPROM reset, and entering Bootloader.

## Notes

| Condition | Description |
|---|---|
| Business commands need `init()` first | Except `getDevices` / `on('usbChange')` |
| Chromium + secure context | HTTPS or `localhost` |
| After unplug | `disconnect` releases the transport; call `init()` again |
| EEPROM reset | Restores VIA-related settings to defaults; use with care |
| Bootloader | Device disconnects and enters DFU; re-authorize in the page |

---

## Get device list

`ServiceQmk.getDevices()`

Shows the WebHID permission picker. Must be called from a user gesture.

### Parameters

None.

### Returns

`Promise<HidDeviceInfo[]>`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `vid:pid:productName` |
| `productName` | `string?` | Product name |
| `vendorId` | `number` | VID |
| `productId` | `number` | PID |
| `opened` | `boolean` | Whether open |

### Example

```js
const devices = await ServiceQmk.getDevices()
const { id } = devices[0]
```

---

## Open device

`ServiceQmk.init(id)`

Opens an authorized device by `id`, establishes VIA transport, and caches protocol version when possible.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `string` | `id` from `getDevices()`, or `vendorId:productId` |

### Returns

`Promise<{ success: boolean, device: HidDeviceInfo | null }>`

### Example

```js
const { success, device } = await ServiceQmk.init(devices[0].id)
if (!success) throw new Error('init failed')
```

---

## Listen for HID connect/disconnect

`ServiceQmk.on('usbChange', listener)` / `ServiceQmk.off('usbChange', listener)`

`on` / `off` return nothing. Identify the keyboard from callback `data.device`, not from the return value of these methods.

The browser only notifies for HID devices already granted. Other keyboards also hit the same callback; match VID, PID, and product name. One physical keyboard with multiple interfaces may fire several events with the same VID/PID/name.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `listener` | `(data: UsbChangePayload) => void` | Pass the same function reference to `off` |

`data` fields:

| Field | Type | Description |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | Connected / disconnected |
| `device` | `HIDDevice?` | Device for this event; sometimes missing on disconnect |
| `device.vendorId` | `number` | USB VID; compare as number to constructor `vendorId`, not hex string |
| `device.productId` | `number` | USB PID |
| `device.productName` | `string?` | Product name; `init` `id` is `` `${vendorId}:${productId}:${productName ?? ''}` `` |

### Returns

None. Device identity is in `data.device`.

### Example

```js
const vendorId = 0x0000
const productId = 0x0000

const onUsb = (data) => {

  if (data.type === 'disconnect') {
    // id identifies this keyboard. Transport released; call init again after replug
  }
  if (data.type === 'connect') {
    // This keyboard connected; init again with id
  }
}
ServiceQmk.on('usbChange', onUsb)
// ServiceQmk.off('usbChange', onUsb)
```

---

## EEPROM reset

`ServiceQmk.resetEeprom()`

VIA `0x0A`.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.resetEeprom()
```

---

## Enter Bootloader

`ServiceQmk.jumpToBootloader()`

VIA `0x0B`. Device usually disconnects after the call.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.jumpToBootloader()
```

---

## Cached protocol version

`ServiceQmk.cachedProtocolVersion`

Value cached after successful `init()` / `getProtocolVersion()`; `0` if never read. Synchronous property, not a Promise.

### Parameters

None.

### Returns

`number`

### Example

```js
const ver = ServiceQmk.cachedProtocolVersion
```
