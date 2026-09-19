# Firmware upgrade {#firmware-upgrade}

Keyboard firmware uses USB-IAP. Daily traffic uses Usage Page `FF60`; Boot switch and firmware write require Usage Page `FF00`. Upgrades use `KeyboardFirmwareUpgrade`, not methods on `Keyboard`.

Wired mice use the same class with daily port already on `FF00`. See [Mouse firmware upgrade](../../mouse/api/upgrade).

## Notes

| Condition | Description |
|---|---|
| Browser | Chrome / Edge; page must be HTTPS or `localhost` |
| Release daily port first | Before upgrade, `close()` the connected `Keyboard`. FF00 cannot open while FF60 is held |
| Firmware | IAP bin. Length at least 130 bytes; little-endian `uint16` at offset 66 is block size; values below 16 are invalid |
| Do not unplug | Keyboard reboots and re-enumerates during write |
| Two authorizations | `start()` picks current keyboard FF00. After Boot, PID becomes `33FF` / `55FF` / `66FF`; if not yet authorized, click again with `authorizeBoot()` |
| User gesture | `requestDevice` must run inside a click. After `BootAuthRequired` you cannot chain another dialog in the same click; use a separate button |

Response `ErrCode`:

| Value | Meaning |
|---|---|
| `0x00` | Success |
| `0xE1` | Length error |
| `0xE2` | CRC error |
| `0xE3` | Block number error (SDK restarts header and full retransmit, up to 3 rounds) |
| `0xE4` | Block size error (same, full retransmit) |
| `0xE5` | Write offset error (same) |
| `0xE8` | FLASH operation failed |
| `0xE9` | Invalid state (same) |
| `0xF0` | Upgrade marker mismatch |
| `0xF1` | Chip ID error |
| `0xF2` | Project ID error |

`0xF0`–`0xF8` fail immediately, no retransmit.

---

## Start upgrade

`upgrade.start()`

Authorization filter: current VID / PID, Usage Page `0xFF00`, Usage `1`. After selection, sends Boot switch (command `0xC0`) and waits for re-enumeration.

If Boot port was already authorized, firmware write continues. Otherwise throws `Error` with `name` `BootAuthRequired`.

### Parameters

Construct with `new KeyboardFirmwareUpgrade(options)`:

| Parameter | Type | Description |
|---|---|---|
| `options.vendorId` | `number` | Keyboard VID |
| `options.productId` | `number` | Application PID, not Boot PID |
| `options.firmware` | `Uint8Array` | Full IAP bin |
| `options.onProgress` | `function?` | `(state: FirmwareUpgradeProgress) => void` |

`start()` has no parameters.

### Returns

`Promise<void>`. Completion means return to application mode; keyboard re-enumerates; call `getDevices()` / `init()` again.

### Example

```js
import Keyboard, { KeyboardFirmwareUpgrade } from '@rdmctmzt/sdk-keyboard'

const vendorId = 0x0000
const productId = 0x0000
const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId, productId, usagePage: 0xff60, usage: 0x61 }],
})

document.querySelector('#upgrade').onclick = async () => {
  const file = document.querySelector('#bin').files[0]
  const firmware = new Uint8Array(await file.arrayBuffer())
  await ServiceKeyboard.close()

  const upgrade = new KeyboardFirmwareUpgrade({
    vendorId,
    productId,
    firmware,
    onProgress({ percent, message }) {
      console.log(percent, message)
    },
  })
  window.__kbUpgrade = upgrade

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

Call in a separate click. Filter: Boot PID `0x33FF` / `0x55FF` / `0x66FF` (when VID is not `0x36B0`, also include `0x36B0`). After Boot port is selected, writes firmware.

Write sequence:

1. `0xA0` upgrade header: first 128 bytes of firmware, CRC16-Modbus
2. `0xA1` data blocks per block size in firmware header (bytes after header). Last block number `0xFFFF`
3. `0xA4` switch back to application

HID report ID is `0x3F`. Business header is `0xAA`; max 56 bytes payload per packet.

### Parameters

None. Use VID and firmware from construction; do not swap files mid-flight.

### Returns

`Promise<void>`. On success progress reaches 100 with message “Upgrade complete; keyboard will re-enumerate”.

### Example

```js
document.querySelector('#boot').onclick = async () => {
  await window.__kbUpgrade.authorizeBoot()
}
```

---

## Progress

`onProgress` receives `FirmwareUpgradeProgress`:

| Field | Type | Description |
|---|---|---|
| `percent` | `number` | `0–100`. Auth ~2, Boot switch ~6, blocks 20–90, app switch 94, done 100 |
| `message` | `string` | Current step, e.g. `Writing 3/40` |

On block mismatch, `message` is “Block number out of sync; restarting full retransmit”, percent returns to 15, then write from the start.
