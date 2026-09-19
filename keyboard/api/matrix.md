# 点阵屏

信息区 `matrixScreen === true` 时可用。运行参数走功能区；像素数据走独立命令。

## 注意事项

| 条件 | 说明 |
|---|---|
| `info.matrixScreen === true` | 信息区表示带点阵 |
| `protocolVer ≥ 2` | 点阵像素 / 动态 / 灯同步等命令 |
| `info.matrixScreenHasGif === true`（多为 V4） | `get/setMatrixGifColors` |
| 格子数 | 默认 `matrixScreenLightRows × matrixScreenLightColumns` |

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.matrixScreen) {
  throw new Error('本机型无点阵')
}

const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns

await ServiceKeyboard.setMatrixScreen({ matrixScreenLightSwitch: true })
```

---

## 设置点阵灯效

`ServiceKeyboard.setMatrixScreen(patch)`

只改点阵屏灯光相关功能区字段并整包写回。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.matrixScreenLightSwitch` | `boolean?` | 开关 |
| `patch.matrixScreenLightMode` | `number?` | 灯效模式 |
| `patch.matrixScreenLightBrightness` | `number?` | 亮度 |
| `patch.matrixScreenLightSpeed` | `number?` | 速度 |
| `patch.matrixScreenLightMixColor` | `number?` | 混色标志 |
| `patch.matrixScreenLightColorIndex` | `number?` | 预设色索引 |
| `patch.matrixScreenLightRValue` | `number?` | R `0–255` |
| `patch.matrixScreenLightGValue` | `number?` | G |
| `patch.matrixScreenLightBValue` | `number?` | B |
| `patch.matrixLtGifCount` | `number?` | V4 GIF 数量 |

### 返回值

`Promise<FuncInfo>`。字段细节见 [功能区 · 点阵屏灯光](./func#点阵屏灯光标准布局)。

### 使用示例

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

## 开启灯色同步

`ServiceKeyboard.openLightSync()`

开启点阵与键盘灯色的持续同步回报（V2+，CMD `0x3c`）；持续回报灯色前须先调用本方法。

### 参数

无。

### 返回值

`Promise<void>`。

### 使用示例

```js
await ServiceKeyboard.openLightSync()
```

---

## 关闭灯色同步

`ServiceKeyboard.closeLightSync()`

关闭灯色同步（V2+，CMD `0x3d`）。

### 参数

无。

### 返回值

`Promise<void>`。

### 使用示例

```js
await ServiceKeyboard.closeLightSync()
```

---

## 读取静态像素

`ServiceKeyboard.getMatrixPixelColors(options?)`

读取当前静态点阵帧的每格颜色（CMD `0x3a`）。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `options.rgb` | `boolean?` | `true` | `false` 为单色灰阶 |
| `options.cellCount` | `number?` | rows×columns | 覆盖信息区推算的格子数 |
| `options.frameCount` | `number?` | `1` | 本接口按单帧读 |

### 返回值

`Promise<string[]>`，hex 颜色，长度 ≈ `cellCount`。

### 使用示例

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

## 写入静态像素

`ServiceKeyboard.setMatrixPixelColors(colors, options?)`

写入静态点阵帧（CMD `0x3b`）；`protocolVer ≥ 4` 且彩色时按 RGB565（每帧对齐 128 字节）。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `colors` | `string[]` | hex 颜色数组；不足 `cellCount` 的位置按 `#000000` |
| `options.rgb` | `boolean?` | 同读接口，默认 `true` |
| `options.cellCount` | `number?` | 格子数 |
| `options.frameCount` | `number?` | 本接口按单帧写，默认 `1` |

### 返回值

`Promise<void>`。

### 使用示例

```js
await ServiceKeyboard.setMatrixPixelColors(colors, { rgb: true, cellCount })
```

---

## 读取动态帧

`ServiceKeyboard.getMatrixDynamicColors(options?)`

读取多帧动态点阵数据；V4 彩色走 GIF 通道。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `options.rgb` | `boolean?` | `true` | 是否彩色 |
| `options.cellCount` | `number?` | 信息区 | 格子数 |
| `options.frameCount` | `number?` | `1` | 帧数 |

### 返回值

`Promise<string[]>`，长度 `cellCount × frameCount`；第 f 帧第 i 格 = `colors[f * cellCount + i]`。

### 使用示例

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

## 写入动态帧

`ServiceKeyboard.setMatrixDynamicColors(colors, options?)`

写入多帧动态点阵；颜色数组长度须为 `cellCount × frameCount`。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `colors` | `string[]` | — | 长度 `cellCount × frameCount` |
| `options.rgb` | `boolean?` | `true` | 是否彩色 |
| `options.cellCount` | `number?` | 信息区 | 格子数 |
| `options.frameCount` | `number?` | `1` | 帧数 |

### 返回值

`Promise<void>`。

### 使用示例

```js
await ServiceKeyboard.setMatrixDynamicColors(colors, {
  rgb: true,
  cellCount,
  frameCount,
})
```

---

## 读取点阵 GIF

`ServiceKeyboard.getMatrixGifColors(options?)`

读取 V4 点阵 GIF 多帧彩色数据；须 `protocolVer ≥ 4`，否则 SDK 抛错。

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 无 GIF 能力的机型勿调用 |
| `info.matrixScreen === true` | 带点阵 |
| `info.matrixScreenHasGif === true` | 信息区声明支持 GIF |
| `protocolVer ≥ 4` | 走 GIF 通道；否则 SDK 抛错 |

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `options.cellCount` | `number?` | `rows × columns` | 信息区推算格子数 |
| `options.frameCount` | `number?` | `1` | 帧数；读写须传同一值 |

固定按彩色（RGB565，每帧对齐 128 字节）；无 `options.rgb` 参数。

### 返回值

`Promise<string[]>`，长度 = `cellCount × frameCount`，每格一个 hex（如 `#FF0000`）。

### 使用示例

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.matrixScreen || !info.matrixScreenHasGif || info.protocolVer < 4) {
  throw new Error('本机型不支持点阵 GIF')
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

## 写入点阵 GIF

`ServiceKeyboard.setMatrixGifColors(colors, options?)`

写入 V4 点阵 GIF；写入首包会等 Flash 擦除延时。

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 无 GIF 能力的机型勿调用 |
| `info.matrixScreen === true` | 带点阵 |
| `info.matrixScreenHasGif === true` | 信息区声明支持 GIF |
| `protocolVer ≥ 4` | 走 GIF 通道；否则 SDK 抛错 |

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `colors` | `string[]` | — | 长度 = `cellCount × frameCount` |
| `options.cellCount` | `number?` | `rows × columns` | 格子数 |
| `options.frameCount` | `number?` | `1` | 帧数 |

### 返回值

`Promise<void>`。

### 使用示例

```js
const blank = Array.from({ length: cellCount * frameCount }, () => '#000000')
blank[0] = '#FF0000'
await ServiceKeyboard.setMatrixGifColors(blank, { cellCount, frameCount })

await ServiceKeyboard.setMatrixScreen({ matrixLtGifCount: frameCount })
```

---

## 读取迎宾点阵

`ServiceKeyboard.getWelcomeMatrixColors(options?)`

读取迎宾 / 会议点阵单色画面（CMD `0x41`）；设备侧固定 **512** 字节缓冲，SDK 按单色编码并 pad。

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 无迎宾/会议点阵的机型勿调用 |
| `info.matrixScreen === true` | 带点阵 |
| `protocolVer ≥ 2` | 命令 `0x41` / `0x42` |

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `options.cellCount` | `number?` | `rows × columns` | 信息区推算格子数 |

### 返回值

`Promise<string[]>`，单色灰阶 hex，长度 = `cellCount`。

### 使用示例

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.matrixScreen || info.protocolVer < 2) {
  throw new Error('本机型不支持迎宾点阵')
}

const cellCount =
  info.matrixScreenLightRows * info.matrixScreenLightColumns

const welcome = await ServiceKeyboard.getWelcomeMatrixColors({ cellCount })
```

---

## 写入迎宾点阵

`ServiceKeyboard.setWelcomeMatrixColors(colors, options?)`

写入迎宾 / 会议点阵单色画面（CMD `0x42`）；亮/灭常用 `#FFFFFF` / `#000000`。

### 注意事项

| 条件 | 说明 |
|---|---|
| **需要固件支持才开放此功能** | 无迎宾/会议点阵的机型勿调用 |
| `info.matrixScreen === true` | 带点阵 |
| `protocolVer ≥ 2` | 命令 `0x41` / `0x42` |

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `colors` | `string[]` | 单色灰阶 hex，长度 = `cellCount` |
| `options.cellCount` | `number?` | 默认 `rows × columns`（信息区） |

### 返回值

`Promise<void>`。

### 使用示例

```js
const colors = Array.from({ length: cellCount }, () => '#000000')
for (let i = 0; i < 8 && i < cellCount; i += 1) {
  colors[i] = '#FFFFFF'
}
await ServiceKeyboard.setWelcomeMatrixColors(colors, { cellCount })
```
