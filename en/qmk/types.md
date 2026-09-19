# Parameter types

## Create a QMK instance {#create-qmk-instance}

Constructor options and HID filtering.

| Type | Field | Description |
|---|---|---|
| `QmkOptions` | `configs` | `HidFilterConfig[]`; must include target VID/PID |
| | `packetLength?` | Full packet length including reportId; default **33** (VIA 32 + 0) |
| `HidFilterConfig` | `vendorId` / `productId` | USB VID / PID |
| | `usagePage?` / `usage?` | VIA commonly `0xff60` / `0x61` |

| Option | When to use |
|---|---|
| `packetLength: 33` | Standard VIA (default); aligns with driver `deviceMode=2` |
| `usagePage: 0xff60` | Filter RAW HID / VIA interface, not the normal keyboard collection |

---

## Authorized HID devices

`HidDeviceInfo`, from `getDevices()` / `init()`.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `vid:pid:productName` |
| `productName` | `string?` | Product name |
| `vendorId` | `number` | VID |
| `productId` | `number` | PID |
| `opened` | `boolean` | Whether the device is open |

---

## USB connect/disconnect events

`UsbChangePayload`. `on('usbChange')` / `off` return nothing; the device is in the callback argument.

| Field | Type | Description |
|---|---|---|
| `type` | `'connect' \| 'disconnect'` | Connected / disconnected |
| `device` | `HIDDevice?` | Device for this event |
| `device.vendorId` | `number` | USB VID; match your keyboard |
| `device.productId` | `number` | USB PID |
| `device.productName` | `string?` | Product name; with VID/PID forms `init` `id` |

---

## Matrix size

`MatrixSize`, used by `getKeymap` / `setKeymap`.

| Field | Type | Description |
|---|---|---|
| `rows` | `number` | Row count |
| `cols` | `number` | Column count |

Matches VIA JSON `matrix`.

---

## Encoder binding

`EncoderBinding`

| Field | Type | Description |
|---|---|---|
| `layer` | `number` | Layer |
| `id` | `number` | Encoder index |
| `clockwise` | `boolean` | Clockwise / counter-clockwise |
| `keycode` | `number` | 16-bit keycode |

---

## Macro events and macro profiles

`ViaMacroEvent` / `ViaMacroProfile`; see [Macros](./api/macro).

| Type | Field | Description |
|---|---|---|
| `ViaMacroEvent` | `type: 'tap'\|'down'\|'up'` | `keycode` single byte |
| | `type: 'delay'` | `ms` |
| | `type: 'ascii'` | `text` |
| `ViaMacroProfile` | `index` | Macro slot index |
| | `events` | Event list |

---

## Command and channel constants

| Export | Description |
|---|---|
| `CMD_VIA` | Parent commands `0x01`–`0x15` |
| `KeyboardValue` | `0x02`/`0x03` subcommands |
| `CustomChannel` | Lighting / custom channels |
| `PROTOCOL_ALPHA` / `BETA` / `GAMMA` | `7` / `8` / `9` |
| `VIA_MAX_BUFFER_CHUNK` | Max chunk size 28 |
