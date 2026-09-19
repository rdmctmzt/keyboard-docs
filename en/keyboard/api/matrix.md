# Matrix screen

Available when information area `matrixScreen === true`. Runtime parameters use the function area; pixel data uses separate commands.

## Notes

| Condition | Description |
|---|---|
| `info.matrixScreen === true` | Information area indicates matrix present |
| `protocolVer ≥ 2` | Matrix pixel / dynamic / light sync commands |
| `info.matrixScreenHasGif === true` (often V4) | `get/setMatrixGifColors` |
| Cell count | Default `matrixScreenLightRows × matrixScreenLightColumns` |

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.matrixScreen) {
  throw new Error('This model has no matrix screen')
}

const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns

await ServiceKeyboard.setMatrixScreen({ matrixScreenLightSwitch: true })
```

---

## Set matrix lighting

`ServiceKeyboard.setMatrixScreen(patch)`

Changes only matrix-screen lighting function-area fields and writes the full packet.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.matrixScreenLightSwitch` | `boolean?` | Switch |
| `patch.matrixScreenLightMode` | `number?` | Effect mode |
| `patch.matrixScreenLightBrightness` | `number?` | Brightness |
| `patch.matrixScreenLightSpeed` | `number?` | Speed |
| `patch.matrixScreenLightMixColor` | `number?` | Mix flag |
| `patch.matrixScreenLightColorIndex` | `number?` | Preset color index |
| `patch.matrixScreenLightRValue` | `number?` | R `0–255` |
| `patch.matrixScreenLightGValue` | `number?` | G |
| `patch.matrixScreenLightBValue` | `number?` | B |
| `patch.matrixLtGifCount` | `number?` | V4 GIF frame count |

### Returns

`Promise<FuncInfo>`. Field details: [Function area · matrix screen lighting](./func#matrix-light-standard).

### Example

```js
await ServiceKeyboard.setMatrixScreen({
  matrixScreenLightSwitch: true,
  matrixScreenLightMode: 2,
  matrixScreenLightBrightness: 4,
  matrixScreenLightSpeed: 3,
  matrixScreenLightRValue: 255,
  matrixScreenLightGValue: 255,
  matrixScreenLightBValue: 255,
})
```

---

## Enable light color sync

`ServiceKeyboard.openLightSync()`

Enables continuous matrix ↔ keyboard light color sync reports (V2+, CMD `0x3c`); call this before relying on continuous color reports.

### Parameters

None.

### Returns

`Promise<void>`.

### Example

```js
await ServiceKeyboard.openLightSync()
```

---

## Disable light color sync

`ServiceKeyboard.closeLightSync()`

Disables light color sync (V2+, CMD `0x3d`).

### Parameters

None.

### Returns

`Promise<void>`.

### Example

```js
await ServiceKeyboard.closeLightSync()
```

---

## Read static pixels

`ServiceKeyboard.getMatrixPixelColors(options?)`

Reads per-cell colors of the current static matrix frame (CMD `0x3a`).

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.rgb` | `boolean?` | `true` | `false` for monochrome grayscale |
| `options.cellCount` | `number?` | rows×columns | Override cell count from information area |
| `options.frameCount` | `number?` | `1` | This API reads a single frame |

### Returns

`Promise<string[]>` — hex colors, length ≈ `cellCount`.

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns

const colors = await ServiceKeyboard.getMatrixPixelColors({
  rgb: true,
  cellCount,
})
```

---

## Write static pixels

`ServiceKeyboard.setMatrixPixelColors(colors, options?)`

Writes static matrix frame (CMD `0x3b`); on `protocolVer ≥ 4` with color, uses RGB565 (128-byte aligned per frame).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `colors` | `string[]` | Hex color array; short arrays pad with `#000000` |
| `options.rgb` | `boolean?` | Same as read API, default `true` |
| `options.cellCount` | `number?` | Cell count |
| `options.frameCount` | `number?` | Single-frame write, default `1` |

### Returns

`Promise<void>`.

### Example

```js
await ServiceKeyboard.setMatrixPixelColors(colors, { rgb: true, cellCount })
```

---

## Read dynamic frames

`ServiceKeyboard.getMatrixDynamicColors(options?)`

Reads multi-frame dynamic matrix data; V4 color uses GIF channel.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.rgb` | `boolean?` | `true` | Color vs not |
| `options.cellCount` | `number?` | information area | Cell count |
| `options.frameCount` | `number?` | `1` | Frame count |

### Returns

`Promise<string[]>` — length `cellCount × frameCount`; frame f cell i = `colors[f * cellCount + i]`.

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns
const frameCount = 8

const colors = await ServiceKeyboard.getMatrixDynamicColors({
  rgb: true,
  cellCount,
  frameCount,
})
```

---

## Write dynamic frames

`ServiceKeyboard.setMatrixDynamicColors(colors, options?)`

Writes multi-frame dynamic matrix; color array length must be `cellCount × frameCount`.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `colors` | `string[]` | — | Length `cellCount × frameCount` |
| `options.rgb` | `boolean?` | `true` | Color vs not |
| `options.cellCount` | `number?` | information area | Cell count |
| `options.frameCount` | `number?` | `1` | Frame count |

### Returns

`Promise<void>`.

### Example

```js
await ServiceKeyboard.setMatrixDynamicColors(colors, {
  rgb: true,
  cellCount,
  frameCount,
})
```

---

## Read matrix GIF

`ServiceKeyboard.getMatrixGifColors(options?)`

Reads V4 matrix GIF multi-frame color data; requires `protocolVer ≥ 4` or SDK throws.

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Do not call on models without GIF |
| `info.matrixScreen === true` | Matrix present |
| `info.matrixScreenHasGif === true` | Information area declares GIF |
| `protocolVer ≥ 4` | GIF channel; otherwise SDK throws |

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.cellCount` | `number?` | `rows × columns` | Cell count from information area |
| `options.frameCount` | `number?` | `1` | Frames; read/write must use same value |

Always color (RGB565, 128-byte aligned per frame); no `options.rgb`.

### Returns

`Promise<string[]>` — length = `cellCount × frameCount`, one hex per cell (e.g. `#FF0000`).

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.matrixScreen || !info.matrixScreenHasGif || info.protocolVer < 4) {
  throw new Error('This model does not support matrix GIF')
}

const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns
const frameCount = 8

const frames = await ServiceKeyboard.getMatrixGifColors({
  cellCount,
  frameCount,
})
```

---

## Write matrix GIF

`ServiceKeyboard.setMatrixGifColors(colors, options?)`

Writes V4 matrix GIF; first packet waits for Flash erase delay.

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Do not call on models without GIF |
| `info.matrixScreen === true` | Matrix present |
| `info.matrixScreenHasGif === true` | Information area declares GIF |
| `protocolVer ≥ 4` | GIF channel; otherwise SDK throws |

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `colors` | `string[]` | — | Length = `cellCount × frameCount` |
| `options.cellCount` | `number?` | `rows × columns` | Cell count |
| `options.frameCount` | `number?` | `1` | Frame count |

### Returns

`Promise<void>`.

### Example

```js
const blank = Array.from({ length: cellCount * frameCount }, () => '#000000')
blank[0] = '#FF0000'
await ServiceKeyboard.setMatrixGifColors(blank, { cellCount, frameCount })

await ServiceKeyboard.setMatrixScreen({ matrixLtGifCount: frameCount })
```

---

## Read welcome matrix

`ServiceKeyboard.getWelcomeMatrixColors(options?)`

Reads welcome / meeting matrix monochrome image (CMD `0x41`); device uses fixed **512**-byte buffer; SDK encodes monochrome and pads.

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Do not call without welcome/meeting matrix |
| `info.matrixScreen === true` | Matrix present |
| `protocolVer ≥ 2` | Commands `0x41` / `0x42` |

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.cellCount` | `number?` | `rows × columns` | Cell count from information area |

### Returns

`Promise<string[]>` — monochrome grayscale hex, length = `cellCount`.

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.matrixScreen || info.protocolVer < 2) {
  throw new Error('This model does not support welcome matrix')
}

const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns

const welcome = await ServiceKeyboard.getWelcomeMatrixColors({ cellCount })
```

---

## Write welcome matrix

`ServiceKeyboard.setWelcomeMatrixColors(colors, options?)`

Writes welcome / meeting matrix monochrome image (CMD `0x42`); on/off often `#FFFFFF` / `#000000`.

### Notes

| Condition | Description |
|---|---|
| **Requires firmware support** | Do not call without welcome/meeting matrix |
| `info.matrixScreen === true` | Matrix present |
| `protocolVer ≥ 2` | Commands `0x41` / `0x42` |

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `colors` | `string[]` | Monochrome grayscale hex, length = `cellCount` |
| `options.cellCount` | `number?` | Default `rows × columns` (information area) |

### Returns

`Promise<void>`.

### Example

```js
const colors = Array.from({ length: cellCount }, () => '#000000')
for (let i = 0; i < 8 && i < cellCount; i += 1) {
  colors[i] = '#FFFFFF'
}
await ServiceKeyboard.setWelcomeMatrixColors(colors, { cellCount })
```
