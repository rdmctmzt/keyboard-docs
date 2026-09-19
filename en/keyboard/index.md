# Keyboard SDK documentation

Because of browser security, the SDK uses **WebHID**. **Complete browser authorization first**, then call other APIs.

## Requirements

| Item | Description |
|---|---|
| Browser | Chromium-based (Chrome / Edge, etc.); WebHID required |
| Page origin | **HTTPS** or `localhost` (otherwise authorization cannot be triggered) |
| Permission | Call `getDevices()` from a user gesture (e.g. click); do not auto-prompt on page load |

## Installation

```bash
pnpm add @rdmctmzt/sdk-keyboard
```

## Integration steps

### 1. Create an instance

```js
import Keyboard from '@rdmctmzt/sdk-keyboard'

// Replace with your VID/PID (examples in this doc use 0x0000)
const vendorId = 0x0000
const productId = 0x0000

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
  // Wired default 0x38; for 2.4G dongle use 0x18
  // packetSize: 0x38,
})
```

#### Constructor options

| Scenario | Recommendation |
|---|---|
| USB wired | Defaults are fine (`packetSize` implicitly `0x38`) |
| 2.4G receiver | `packetSize: 0x18` |

Full types: [Parameter types · Create keyboard instance](./types#create-keyboard-instance).

### 2. Authorize and initialize

```js
const devices = await ServiceKeyboard.getDevices()
const { id } = devices[0]
await ServiceKeyboard.init(id)
```

### 3. Recommended call order

```js
const info = await ServiceKeyboard.getDeviceInfo()   // information area
const func = await ServiceKeyboard.getFuncInfo()     // function area (lighting, performance, etc.)
const keys = await ServiceKeyboard.getKeymap(0)      // remapping
```

When changing function-area fields, **read before write** to avoid overwriting other settings:

```js
const func = await ServiceKeyboard.getFuncInfo()
await ServiceKeyboard.setFuncInfo({
  ...func,
  lightBrightness: 4,
  winLock: 1,
})
// or partial update
await ServiceKeyboard.patchFuncInfo({ lightBrightness: 4 })
```

### 4. Listen for connect/disconnect

```js
const onUsb = (data) => {
  if (data.type === 'disconnect') {
    // Device disconnected (SDK cleared cache)
  }
  if (data.type === 'connect') {
    // Device connected (still need to init again)
  }
}
ServiceKeyboard.on('usbChange', onUsb)
// When done: ServiceKeyboard.off('usbChange', onUsb)
```

More on lifecycle / battery / factory reset: [Other APIs](./api/misc).

## FAQ

| Symptom | Action |
|---|---|
| `navigator.hid` is missing | Use a Chromium browser, or confirm HTTPS / localhost |
| `getDevices()` returns no devices | Check VID/PID, `usagePage`/`usage`; confirm firmware exposes vendor HID |
| `init` returns `success: false` | `id` does not match authorized list; call `getDevices()` again |
| Read/write timeout / no response | Confirm `init`; for 2.4G try `packetSize: 0x18`; call `getDeviceInfo` first to align `protocolVer` |
| Boot not listed in upgrade dialog | `close()` the daily port first; after Boot switch, call `authorizeBoot()` in a separate click and pick PID `33FF` / `55FF` / `66FF` |
| `Macro data exceeds device buffer` | Shorten macro actions, or confirm `macroSize` was read |

## API index

| Doc | Description |
|---|---|
| [Device information](./api/info) | `getDeviceInfo`; **capability bit checks** |
| [Function area](./api/func) | `getFuncInfo` / `setFuncInfo` / `patchFuncInfo` |
| [Layout / remapping](./api/key) | `getKeymap` / `setKey` |
| [Lighting](./api/lighting) | Backlight / LOGO / side light, custom colors, music rhythm |
| [Matrix screen](./api/matrix) | Requires `info.matrixScreen` |
| [LCD](./api/lcd) | Requires `info.isLed`; `uploadImage` one-shot upload |
| [Encoder](./api/encoder) | Requires `info.encoder` |
| [Performance](./api/performance) | Win lock, NKRO, sleep, etc. |
| [Macros](./api/macro) | `getMacros` / `setMacros` |
| [Firmware upgrade](./api/upgrade) | `KeyboardFirmwareUpgrade`: FF00 Boot switch, then write IAP bin |
| [Other APIs](./api/misc) | Lifecycle, cache, battery (V2+), 2.4G status (`0xD0`), factory reset |
| [Command reference](./api/commands) | Full protocol CMD table, packet format |
| [Keycode table](./keycodes) | `type/code1/code2` |
| [Parameter types](./types) | `DeviceInfo` / `FuncInfo`, etc. |
