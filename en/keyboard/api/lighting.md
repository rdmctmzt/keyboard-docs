# Lighting

Runtime parameters live in the function area; mode tables, custom per-key colors, and rhythm use separate commands. Call `init()` first; prefer `getDeviceInfo()` first.

## Notes

| Feature | Condition |
|---|---|
| Backlight | `info.showLight === true` |
| LOGO light | `info.showLogoLight === true` |
| Side light | `info.showLightSideLight === true` |
| Custom per-key colors | `info.showLight` and `info.lightKeySize > 0` |
| Music rhythm | (`info.logoLightSupportMusic` or `info.sideLightSupportMusic`) and `protocolVer ≥ 2` |

```js
const info = await ServiceKeyboard.getDeviceInfo()

if (info.showLight) {
  await ServiceKeyboard.setBacklight({ lightSwitch: 1, lightBrightness: 4 })
}
if (info.showLogoLight) {
  await ServiceKeyboard.setLogoLight({ logoLightSwitch: 1 })
}
if (info.showLightSideLight) {
  await ServiceKeyboard.setSideLight({ sideLightSwitch: 1 })
}
if (info.logoLightSupportMusic || info.sideLightSupportMusic) {
  await ServiceKeyboard.setMusicRhythmColors(colors, { keepSession: true })
}
```

---

## Set backlight

`ServiceKeyboard.setBacklight(patch)`

Changes only backlight-related function-area fields and writes the full packet — equivalent to `patchFuncInfo`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.lightSwitch` | `number?` | `0` off / `1` on |
| `patch.lightMode` | `number?` | Effect index; `0xfd` = custom lighting |
| `patch.lightBrightness` | `number?` | Brightness |
| `patch.lightSpeed` | `number?` | Speed (converted value) |
| `patch.lightMixColor` | `number?` | Mix flag |
| `patch.lightColorIndex` | `number?` | Preset color index |
| `patch.lightRValue` | `number?` | R `0–255` |
| `patch.lightGValue` | `number?` | G |
| `patch.lightBValue` | `number?` | B |
| `patch.lightCustomIndex` | `number?` | Custom light slot id, often with `lightMode=0xfd` |

### Returns

`Promise<FuncInfo>`.

### Example

```js
await ServiceKeyboard.setBacklight({
  lightSwitch: 1,
  lightMode: 2,
  lightBrightness: 4,
  lightSpeed: 3,
  lightRValue: 255,
  lightGValue: 0,
  lightBValue: 0,
})
```

---

## Set LOGO light

`ServiceKeyboard.setLogoLight(patch)`

Changes only LOGO-related function-area fields and writes the full packet — equivalent to `patchFuncInfo`.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.logoLightSwitch` | `number?` | Switch |
| `patch.logoLightMode` | `number?` | Mode |
| `patch.logoLightBrightness` | `number?` | Brightness |
| `patch.logoLightSpeed` | `number?` | Speed |
| `patch.logoLightMixColor` | `number?` | Mix |
| `patch.logoLightColorIndex` | `number?` | Preset color |
| `patch.logoLightRValue` / `G` / `B` | `number?` | RGB |

### Returns

`Promise<FuncInfo>`.

### Example

```js
await ServiceKeyboard.setLogoLight({
  logoLightSwitch: 1,
  logoLightMode: 1,
  logoLightBrightness: 3,
  logoLightSpeed: 2,
})
```

---

## Set side light

`ServiceKeyboard.setSideLight(patch)`

Changes only side-light function-area fields and writes the full packet — equivalent to `patchFuncInfo`; fields use `sideLight*` prefix (`sideLightSwitch`, `sideLightMode`, etc.), same naming as backlight.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.sideLightSwitch` | `number?` | Switch |
| `patch.sideLightMode` | `number?` | Mode |
| `patch.sideLightBrightness` | `number?` | Brightness |
| `patch.sideLightSpeed` | `number?` | Speed (converted) |
| `patch.sideLightMixColor` | `number?` | Mix |
| `patch.sideLightColorIndex` | `number?` | Preset color |
| `patch.sideLightRValue` / `G` / `B` | `number?` | RGB |

### Returns

`Promise<FuncInfo>`.

### Example

```js
await ServiceKeyboard.setSideLight({
  sideLightSwitch: 1,
  sideLightMode: 1,
  sideLightBrightness: 3,
})
```

---

## Read backlight mode table

`ServiceKeyboard.getBackLightModes()`

Reads raw backlight available-mode bytes from the device response.

### Parameters

None.

### Returns

`Promise<number[]>` — mode table bytes starting at response byte 9.

### Example

```js
const modes = await ServiceKeyboard.getBackLightModes()
```

---

## Read LOGO light mode table

`ServiceKeyboard.getLogoLightModes()`

Reads raw LOGO available-mode bytes.

### Parameters

None.

### Returns

`Promise<number[]>` — mode table bytes starting at response byte 9.

### Example

```js
const modes = await ServiceKeyboard.getLogoLightModes()
```

---

## Read side light mode table

`ServiceKeyboard.getSideLightModes()`

Reads raw side-light available-mode bytes.

### Parameters

None.

### Returns

`Promise<number[]>` — mode table bytes starting at response byte 9.

### Example

```js
const modes = await ServiceKeyboard.getSideLightModes()
```

---

## Read key-to-LED mapping

`ServiceKeyboard.getLightMatrix()`

Reads the key matrix slot → LED index table. Custom per-key colors write **LED indices**, not the remap slot itself.

### Parameters

None.

### Returns

`Promise<number[]>` — length 128.

| Index | Value |
|---|---|
| Key matrix index (same as [remap index](./key#key-index)) | LED index `0–127`; `0xFF` means no LED for that key |

### Example

```js
const matrix = await ServiceKeyboard.getLightMatrix()
```

---

## How to get the correct LED index {#led-index}

Custom lighting and remapping share the same **key matrix index** (layout `code` vs factory keymap — see [Layout / remapping](./key#key-index)). The color buffer is ordered by **LED index**:

```
LED index = lightMatrix[key matrix index]
Color byte offset = LED index * 3
```

`0xFF` or out-of-range means no LED — do not write.

```js
function layoutCodeOf(key) {
  if (key.type === 0x10 && key.code1 !== 0) {
    const mod = {
      0x01: 0xe0, 0x02: 0xe1, 0x04: 0xe2, 0x08: 0xe3,
      0x10: 0xe4, 0x20: 0xe5, 0x40: 0xe6, 0x80: 0xe7,
    }
    return mod[key.code1] ?? key.code2
  }
  return key.code2
}

const defaults = await ServiceKeyboard.getDefaultKeymap(0)
const keyIndex = defaults.findIndex((k) => layoutCodeOf(k) === 41) // layout code, e.g. Esc
const lightMatrix = await ServiceKeyboard.getLightMatrix()
const ledIndex = lightMatrix[keyIndex]
if (ledIndex == null || ledIndex === 0xff || ledIndex >= 128) {
  throw new Error('This key has no LED')
}

await ServiceKeyboard.applyUserLightSlot(0)
await ServiceKeyboard.setUserKeyColor(0, ledIndex, '#ff6600')
```

For full-table writes, fill by LED index: `colors[ledIndex] = '#ff6600'`, then `setUserAllKeyColors`. `getUserKeyColors()` returns LED order; preview one key with `colors[ledIndex]`, not `colors[keyIndex]`.

---

## Switch to custom light slot {#custom-light-slot}

`ServiceKeyboard.applyUserLightSlot(lightId)`

Writes `lightMode=0xfd`, `lightCustomIndex=lightId`, `lightMixColor=0` to enter custom lighting before reading/writing per-key colors.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `lightId` | `number` | Slot `0–4` (five custom light datasets) |

### Returns

`Promise<FuncInfo>`.

### Example

```js
await ServiceKeyboard.applyUserLightSlot(0)
// Then use getUserKeyColors / setUserKeyColor for per-key colors
```

---

## Read custom per-key colors

`ServiceKeyboard.getUserKeyColors(lightId?)`

Reads hex colors for 128 positions in the given slot.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `lightId` | `number` | `0` | Light slot |

### Returns

`Promise<string[]>` — length 128, hex colors; indices are **LED indices** (not key matrix index).

### Example

```js
await ServiceKeyboard.applyUserLightSlot(0)
const colors = await ServiceKeyboard.getUserKeyColors(0)
```

---

## Set single-key custom color

`ServiceKeyboard.setUserKeyColor(lightId, keyIndex, color)`

Changes one LED in the slot. Reads 128 colors for the slot, replaces one, writes full 128×3 bytes — do not send only 3 bytes for one LED.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `lightId` | `number` | Slot `0–4` |
| `keyIndex` | `number` | **LED index** `0–127`, i.e. `getLightMatrix()[key matrix index]`, not layout array index |
| `color` | `string` | Hex, e.g. `#ff6600` |

### Returns

`Promise<void>`.

### Example

```js
await ServiceKeyboard.setUserKeyColor(0, ledIndex, '#ff6600')
```

---

## Write full custom color table

`ServiceKeyboard.setUserAllKeyColors(lightId, colors)`

Writes all colors for the slot at once. `colors[i]` is LED index `i`, not key matrix index.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `lightId` | `number` | Light slot |
| `colors` | `string[]` | Length 128 recommended; index = LED index; pad with `#000000` if short |

### Returns

`Promise<void>`.

### Example

```js
const colors = await ServiceKeyboard.getUserKeyColors(0)
await ServiceKeyboard.setUserKeyColor(0, 12, '#ff6600')
await ServiceKeyboard.setUserAllKeyColors(0, colors)
```

---

## Push music rhythm colors {#setmusicrhythmcolors}

`ServiceKeyboard.setMusicRhythmColors(colors, options?)`

Streams RGB565 rhythm colors to the device in real time (CMD `0x2e`, requires `protocolVer ≥ 2`). Needs information-area `logoLightSupportMusic` / `sideLightSupportMusic` etc. (SDK does not enforce).

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `colors` | `string[]` | — | Hex color per LED |
| `options.ledCount` | `number?` | `colors.length` | Active LED count |
| `options.startOffset` | `number?` | `0` | Starting LED index (by LED count) |
| `options.keepSession` | `boolean?` | `false` | When `true`, keep session open for continuous streaming |

### Returns

`Promise<void>`.

### Example

```js
await ServiceKeyboard.setMusicRhythmColors(['#ff0000', '#00ff00'], {
  keepSession: true,
})
```

### Notes

SDK throws when `protocolVer < 2`. To end streaming, send another frame with `keepSession: false`, or call `close()`.
