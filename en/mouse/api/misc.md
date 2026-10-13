# Other APIs

Lifecycle and HID connect/disconnect.

## Notes

| Condition | Detail |
|---|---|
| Call business APIs after `init()` / `initDevice()` | Except `getDevices` / `on('usbChange')` |
| Filters | Vendor interface usually `usagePage: 0xff00`, `usage: 1` or `2` (**not** VIA `0xff60`) |
| Packet size | Wired default `packetSize: 0x38`; 2.4G / dongle often `0x18` |

---

## List devices

`ServiceMouse.getDevices()`

### Returns

`Promise<HidDeviceInfo[]>`

---

## Open device

`ServiceMouse.init(id)` — wraps `initDevice`.

---

## Bind an existing HIDDevice

`ServiceMouse.initDevice(device)`

Use when the host app already opened the physical device (e.g. a home-screen card).

```js
await ServiceMouse.initDevice(hostHidDevice)
```

---

## Current device

`ServiceMouse.getCurrentDevice()` → `HidDeviceInfo | null`

`ServiceMouse.getNativeDevice()` → `HIDDevice | null`

---

## Close

`ServiceMouse.close()` → `Promise<void>`

---

## USB change

`ServiceMouse.on('usbChange', listener)` / `off`  
Also `on('rfStatus', listener)` for 2.4G status reports.

## Light helper / cache

- `setLight(patch)` — convenience wrapper around `patchFuncInfo`
- `getCachedFuncInfo()` — last cached func area (no HID)
