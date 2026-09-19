# Firmware upgrade {#firmware-upgrade}

Wired mouse firmware uses the same USB-IAP as 1K keyboards. The upgrade class is `KeyboardFirmwareUpgrade`, imported from `@rdmctmzt/sdk-keyboard`, not attached to `Mouse`. `@rdmctmzt/sdk-mouse` has no separate upgrade class.

The mouse’s daily communication interface is already Usage Page `FF00`, Usage `1` — the same interface used to enter Boot. The keyboard daily interface is `FF60`; upgrade switches to `FF00`.

## Notes

| Condition | Description |
|---|---|
| Browser | Chrome / Edge; page must be HTTPS or `localhost` |
| Wired mouse only | Do not upgrade the mouse body when connected via 2.4G dongle. Dongle firmware is not covered here |
| Release daily interface first | Before upgrade, `close()` the connected `Mouse`. Boot mode cannot open while this FF00 interface is still claimed |
| Firmware | IAP bin. Length at least 130 bytes; little-endian `uint16` at offset 66 is block size; values below 16 are invalid |
| Do not unplug | The mouse reboots and re-enumerates during writes |
| Two authorizations | `start()` selects the mouse’s current FF00. After Boot, PID becomes `33FF` / `55FF` / `66FF`; if the browser has not authorized Boot yet, call `authorizeBoot()` again |
| User gesture | `requestDevice` must run inside a click. After `BootAuthRequired` you cannot show another picker in the same click — use a separate button |

Response `ErrCode`:

| Value | Meaning |
|---|---|
| `0x00` | Success |
| `0xE1` | Length error |
| `0xE2` | CRC error |
| `0xE3` | Block number error (SDK resends header and retries full transfer, up to 3 rounds) |
| `0xE4` | Block size error (same, full retry) |
| `0xE5` | Write offset error (same) |
| `0xE8` | FLASH operation failed |
| `0xE9` | Invalid state (same) |
| `0xF0` | Upgrade marker mismatch |
| `0xF1` | Chip ID error |
| `0xF2` | Project ID error |

`0xF0`–`0xF8` fail immediately with no retry.

---

## Start upgrade

`upgrade.start()`

Shows the authorization picker with filter for current VID / PID, Usage Page `0xFF00`, Usage `1`. After selection, sends enter Boot (command `0xC0`) and waits for re-enumeration.

If Boot was already authorized, firmware write continues. Otherwise throws `Error` with `name` `BootAuthRequired`. The message text refers to keyboard; treat mouse the same via this `name`.

### Parameters

Construct `new KeyboardFirmwareUpgrade(options)`:

| Parameter | Type | Description |
|---|---|---|
| `options.vendorId` | `number` | Mouse VID |
| `options.productId` | `number` | Mouse application PID, not Boot PID |
| `options.firmware` | `Uint8Array` | Full IAP bin |
| `options.onProgress` | `function?` | `(state: FirmwareUpgradeProgress) => void` |

`start()` itself has no parameters.

### Returns

`Promise<void>`. Completion means back in application mode; the mouse re-enumerates — call `getDevices()` / `init()` again.

### Example

```js
import Mouse from '@rdmctmzt/sdk-mouse'
import { KeyboardFirmwareUpgrade } from '@rdmctmzt/sdk-keyboard'

const vendorId = 0x0000
const productId = 0x0000
const ServiceMouse = new Mouse({
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
})

document.querySelector('#upgrade').onclick = async () => {
  const file = document.querySelector('#bin').files[0]
  const firmware = new Uint8Array(await file.arrayBuffer())
  await ServiceMouse.close()

  const upgrade = new KeyboardFirmwareUpgrade({
    vendorId,
    productId,
    firmware,
    onProgress({ percent, message }) {
      console.log(percent, message)
    },
  })
  window.__mouseUpgrade = upgrade

  try {
    await upgrade.start()
  } catch (error) {
    if (error.name !== 'BootAuthRequired') throw error
    document.querySelector('#boot').hidden = false
  }
}
```

---

## Authorize Boot and continue

`upgrade.authorizeBoot()`

Call on a separate click. Picker filter is Boot PID `0x33FF` / `0x55FF` / `0x66FF` (when VID is not `0x36B0`, also include `0x36B0`). After selecting Boot, writes firmware.

Write sequence:

1. `0xA0` upgrade header: first 128 bytes of firmware, CRC16-Modbus
2. `0xA1` data blocks using block size from firmware header (bytes after header). Last block number is `0xFFFF`
3. `0xA4` return to application

HID report ID is `0x3F`. Business packet header is `0xAA`; max payload 56 bytes per packet.

### Parameters

None. Firmware and VID from construction; do not swap files mid-flight.

### Returns

`Promise<void>`. On success progress reaches 100. Completion message says upgrade finished and keyboard will re-enumerate; mouse re-enumerates the same way.

### Example

```js
document.querySelector('#boot').onclick = async () => {
  await window.__mouseUpgrade.authorizeBoot()
}
```

---

## Progress

`onProgress` receives `FirmwareUpgradeProgress`:

| Field | Type | Description |
|---|---|---|
| `percent` | `number` | `0–100`. Authorization ~2, enter Boot ~6, block writes 20–90, return to app 94, complete 100 |
| `message` | `string` | Current step, e.g. writing block 3 of 40 |

On block number mismatch, the message indicates a restart and full retransmit; percent returns to 15, then writing starts from the beginning.

Type definitions are in `@rdmctmzt/sdk-keyboard`; see [Parameter types · Firmware upgrade](../types#firmware-upgrade).
