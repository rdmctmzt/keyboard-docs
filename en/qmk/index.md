# QMK SDK documentation

For keyboards using the **VIA / QMK** protocol. Call after WebHID authorization in a Chromium-based browser.

This is **not** the same protocol as the vendor keyboard SDK (`@rdmctmzt/sdk-keyboard`): no `0xaa` header, no `0x10` session open; key values are **16-bit QMK keycodes**, not 3-byte `{type,code1,code2}`.

## Requirements

| Item | Description |
|---|---|
| Browser | Chromium (Chrome, Edge, etc.); WebHID required |
| Page origin | **HTTPS** or `localhost` |
| Permission | Call `getDevices()` from a user gesture (e.g. click) |
| HID filter | VIA commonly uses `usagePage: 0xff60`, `usage: 0x61` |

## Installation

```bash
pnpm add @rdmctmzt/sdk-qmk
```

## Integration steps

### 1. Create an instance

```js
import QmkKeyboard from '@rdmctmzt/sdk-qmk'

// Replace with your VID/PID (examples use 0x0000)
const vendorId = 0x0000
const productId = 0x0000

const ServiceQmk = new QmkKeyboard({
  configs: [{ vendorId, productId, usagePage: 0xff60, usage: 0x61 }],
  // VIA: 32-byte payload + reportId=0 → default packetLength 33
})
```

#### Constructor options

| Scenario | Recommendation |
|---|---|
| Standard wired VIA | Defaults (`packetLength: 33`) |
| Interface filtering | Include `usagePage: 0xff60` (or the firmware’s RAW HID page) so you do not pick the normal keyboard interface |

Full types: [Parameter types · Create a QMK instance](./types#create-qmk-instance).

### 2. Authorize and initialize

```js
const devices = await ServiceQmk.getDevices()
const { id } = devices[0]
await ServiceQmk.init(id)
```

`init` reads and caches the protocol version when possible.

### 3. Recommended call order

```js
const ver = await ServiceQmk.getProtocolVersion() // commonly 7 / 8 / 9
const layers = await ServiceQmk.getLayerCount()
const fw = await ServiceQmk.getFirmwareVersion()

// Matrix rows/cols from VIA JSON (or your own layout)
const matrix = { rows: 5, cols: 15 }
const layer0 = await ServiceQmk.getKeymap(matrix, 0)
```

### 4. Listen for connect/disconnect

```js
const vendorId = 0x0000
const productId = 0x0000

ServiceQmk.on('usbChange', (data) => {
  const device = data.device
  if (!device) return
  if (device.vendorId !== vendorId || device.productId !== productId) return
  // data.type: 'connect' | 'disconnect'
  // Identity: device.vendorId / device.productId / device.productName
})
```

After disconnect, call `init()` again. Other authorized devices also trigger this callback; filter by VID / PID first.

## Capability overview

| Capability | Documentation |
|---|---|
| Protocol version / firmware version / layer count / keyboard value | [Basic device information](./api/info) |
| Single key / full layer keymap / clear | [Layout and remapping](./api/key) |
| Custom channel lighting read/write and save | [Lighting](./api/lighting) |
| Macro buffer read/write and encoding | [Macros](./api/macro) |
| Encoder clockwise/counter-clockwise keycodes | [Encoders](./api/encoder) |
| Lifecycle / EEPROM / Bootloader | [Other APIs](./api/misc) |
| VIA command table / packet format | [Command reference](./api/commands) |
| 16-bit keycode | [Keycode table](./keycodes) |
| Parameter types | [Parameter types](./types) |

## Protocol version notes

| Version | Description |
|---|---|
| `7` (Alpha) | Remap per key with `0x04`/`0x05`; layer count defaults to 4 without `0x11`/`0x12`/`0x13` fast path |
| `≥ 8` (Beta+) | `0x11` for layer count; `0x12`/`0x13` for chunked keymap read/write |

After connect, call `getProtocolVersion()` first, then choose read/write strategy; SDK `getKeymap` / `setKeymap` pick the path by version automatically.
