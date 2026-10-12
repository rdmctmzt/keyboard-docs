# Mouse SDK documentation

Because of browser security restrictions, the SDK uses **WebHID**. **Complete browser authorization first**, then call other APIs.

## Requirements

| Item | Description |
|---|---|
| Browser | Chromium-based (Chrome / Edge, etc.); WebHID support required |
| Page origin | **HTTPS** or `localhost` (otherwise authorization cannot be shown) |
| Permission | Call `getDevices()` from a user gesture (e.g. click); do not auto-prompt on page load |

## Installation

```bash
pnpm add @rdmctmzt/sdk-mouse
```

## Integration steps

### 1. Create an instance

```js
import Mouse from '@rdmctmzt/sdk-mouse'

// Replace with your VID/PID (examples use 0x0000)
const vendorId = 0x0000
const productId = 0x0000

const ServiceMouse = new Mouse({
  // usagePage=0xFF00 vendor iface; usage is often 1 or 2
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
  // packetSize = effective payload (excludes 8B header): wired 0x38; 2.4G 0x18 (not 0x20)
  // packetSize: 0x38,
})
```

#### Constructor options

| Scenario | Recommendation |
|---|---|
| USB wired | Defaults (`packetSize` **`0x38`** = 64−8) |
| 2.4G dongle | `packetSize: **0x18**` (32−8). **Do not** pass `0x20` |
| HID filter | Prefer `usagePage: 0xff00`; if usage=1 fails, try usage=2 |

Info area (`0x12`) only needs **32** bytes: wired one packet `size=0x20`; 2.4G two packets `0x18+0x08`. See [Commands](./api/commands) / [Device info](./api/info).

Full types: [Parameter types · Create mouse instance](./types#create-mouse-instance).

### 2. Authorize and initialize

```js
const devices = await ServiceMouse.getDevices()
const { id } = devices[0]
await ServiceMouse.init(id)
```

### 3. Read the info area before changing settings

```js
const info = await ServiceMouse.getDeviceInfo()
const func = await ServiceMouse.getFuncInfo()

await ServiceMouse.patchFuncInfo({ reportRate: 500 })
```

### 4. Listen for HID connect/disconnect

```js
ServiceMouse.on('usbChange', (data) => {
  // data.type: 'connect' | 'disconnect'
})
```

After disconnect, cached data is cleared; plug in again and call `init()` once more.

## Capability overview

| Capability | Documentation |
|---|---|
| Device info (sensor / DPI group limit / report rate limit) | [Basic device information](./api/info) |
| LOD / debounce / sleep / battery / factory reset / 2.4G status | [Global settings](./api/globalSetting) |
| Report rate / DPI groups | [Performance / DPI](./api/performance) |
| Key remapping | [Key remapping](./api/keyRemapping) |
| Macros | [Macros](./api/macro) |
| Wired online upgrade (same IAP as 1K keyboard) | [Firmware upgrade](./api/upgrade) |
| Command table / packet format | [Commands](./api/commands) |
| Keycode table | [Keycodes](./keycodes) |
| Parameter types | [Parameter types](./types) |

The mouse protocol uses a fixed command table `CMD_MOUSE` (macros `0x24`/`0x25`, battery `0x28`, reset `0x29`), which differs from keyboard V1–V4 command numbers. See [Commands](./api/commands).
