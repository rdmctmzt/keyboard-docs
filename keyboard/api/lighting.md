# 灯光

运行参数在功能区；模式表、自定义灯色、律动走独立命令。须先 `init()`，建议先 `getDeviceInfo()`。

## 注意事项

| 功能 | 判断条件 |
|---|---|
| 背光 | `info.showLight === true` |
| LOGO 灯 | `info.showLogoLight === true` |
| 侧灯 | `info.showLightSideLight === true` |
| 自定义每键灯色 | `info.showLight` 且 `info.lightKeySize > 0` |
| 音乐律动 | (`info.logoLightSupportMusic` 或 `info.sideLightSupportMusic`) 且 `protocolVer ≥ 2` |

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

## 设置背光

`ServiceKeyboard.setBacklight(patch)`

只改背光相关功能区字段并整包写回，等价于 `patchFuncInfo`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.lightSwitch` | `number?` | `0` 关 / `1` 开 |
| `patch.lightMode` | `number?` | 灯效索引；`0xfd` = 自定义灯 |
| `patch.lightBrightness` | `number?` | 亮度 |
| `patch.lightSpeed` | `number?` | 速度（已换算值） |
| `patch.lightMixColor` | `number?` | 混色标志 |
| `patch.lightColorIndex` | `number?` | 预设色索引 |
| `patch.lightRValue` | `number?` | R `0–255` |
| `patch.lightGValue` | `number?` | G |
| `patch.lightBValue` | `number?` | B |
| `patch.lightCustomIndex` | `number?` | 自定义灯槽 id，常与 `lightMode=0xfd` 联用 |

### 返回值

`Promise<FuncInfo>`。

### 使用示例

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

## 设置 LOGO 灯

`ServiceKeyboard.setLogoLight(patch)`

只改 LOGO 灯相关功能区字段并整包写回，等价于 `patchFuncInfo`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.logoLightSwitch` | `number?` | 开关 |
| `patch.logoLightMode` | `number?` | 模式 |
| `patch.logoLightBrightness` | `number?` | 亮度 |
| `patch.logoLightSpeed` | `number?` | 速度 |
| `patch.logoLightMixColor` | `number?` | 混色 |
| `patch.logoLightColorIndex` | `number?` | 预设色 |
| `patch.logoLightRValue` / `G` / `B` | `number?` | RGB |

### 返回值

`Promise<FuncInfo>`。

### 使用示例

```js
await ServiceKeyboard.setLogoLight({
  logoLightSwitch: 1,
  logoLightMode: 1,
  logoLightBrightness: 3,
  logoLightSpeed: 2,
})
```

---

## 设置侧灯

`ServiceKeyboard.setSideLight(patch)`

只改侧灯相关功能区字段并整包写回，等价于 `patchFuncInfo`；参数字段前缀为 `sideLight*`（`sideLightSwitch`、`sideLightMode` 等），语义同背光命名。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.sideLightSwitch` | `number?` | 开关 |
| `patch.sideLightMode` | `number?` | 模式 |
| `patch.sideLightBrightness` | `number?` | 亮度 |
| `patch.sideLightSpeed` | `number?` | 速度（已换算） |
| `patch.sideLightMixColor` | `number?` | 混色 |
| `patch.sideLightColorIndex` | `number?` | 预设色 |
| `patch.sideLightRValue` / `G` / `B` | `number?` | RGB |

### 返回值

`Promise<FuncInfo>`。

### 使用示例

```js
await ServiceKeyboard.setSideLight({
  sideLightSwitch: 1,
  sideLightMode: 1,
  sideLightBrightness: 3,
})
```

---

## 读取背光模式表

`ServiceKeyboard.getBackLightModes()`

读取设备应答中的背光可用模式表原始字节。

### 参数

无。

### 返回值

`Promise<number[]>`，从应答第 9 字节起的模式表字节。

### 使用示例

```js
const modes = await ServiceKeyboard.getBackLightModes()
```

---

## 读取 LOGO 灯模式表

`ServiceKeyboard.getLogoLightModes()`

读取 LOGO 灯可用模式表原始字节。

### 参数

无。

### 返回值

`Promise<number[]>`，从应答第 9 字节起的模式表字节。

### 使用示例

```js
const modes = await ServiceKeyboard.getLogoLightModes()
```

---

## 读取侧灯模式表

`ServiceKeyboard.getSideLightModes()`

读取侧灯可用模式表原始字节。

### 参数

无。

### 返回值

`Promise<number[]>`，从应答第 9 字节起的模式表字节。

### 使用示例

```js
const modes = await ServiceKeyboard.getSideLightModes()
```

---

## 读取键位灯位映射

`ServiceKeyboard.getLightMatrix()`

读取键位 index 到灯位 index 的映射表，用于自定义每键灯色。

### 参数

无。

### 返回值

`Promise<number[]>`，长度 128：键位 index → 灯位映射。

### 使用示例

```js
const matrix = await ServiceKeyboard.getLightMatrix()
```

---

## 切换到自定义灯槽

`ServiceKeyboard.applyUserLightSlot(lightId)`

写入 `lightMode=0xfd` 与 `lightCustomIndex=lightId`，进入自定义灯模式后再读写每键颜色。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `lightId` | `number` | 灯槽 `0–4`（对应 5 组自定义灯数据） |

### 返回值

`Promise<FuncInfo>`。

### 使用示例

```js
await ServiceKeyboard.applyUserLightSlot(0)
// 之后再用 getUserKeyColors / setUserKeyColor 写每键颜色
```

---

## 读取自定义每键灯色

`ServiceKeyboard.getUserKeyColors(lightId?)`

读取指定灯槽下 128 个键位的 hex 颜色。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `lightId` | `number` | `0` | 灯槽 |

### 返回值

`Promise<string[]>`，长度 128，hex 颜色。

### 使用示例

```js
await ServiceKeyboard.applyUserLightSlot(0)
const colors = await ServiceKeyboard.getUserKeyColors(0)
```

---

## 设置单键自定义灯色

`ServiceKeyboard.setUserKeyColor(lightId, keyIndex, color)`

改写指定灯槽中某一个键位的颜色。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `lightId` | `number` | 灯槽 `0–4` |
| `keyIndex` | `number` | 键位 `0–127` |
| `color` | `string` | hex，如 `#ff6600` |

### 返回值

`Promise<void>`。

### 使用示例

```js
await ServiceKeyboard.setUserKeyColor(0, 12, '#ff6600')
```

---

## 整表写入自定义灯色

`ServiceKeyboard.setUserAllKeyColors(lightId, colors)`

一次性写入指定灯槽的全部键位颜色。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `lightId` | `number` | 灯槽 |
| `colors` | `string[]` | 长度建议 128；不足补 `#000000` |

### 返回值

`Promise<void>`。

### 使用示例

```js
const colors = await ServiceKeyboard.getUserKeyColors(0)
await ServiceKeyboard.setUserKeyColor(0, 12, '#ff6600')
await ServiceKeyboard.setUserAllKeyColors(0, colors)
```

---

## 推送音乐律动颜色 {#setmusicrhythmcolors}

`ServiceKeyboard.setMusicRhythmColors(colors, options?)`

实时向设备推流 RGB565 律动颜色（CMD `0x2e`，须 `protocolVer ≥ 2`）。需信息区 `logoLightSupportMusic` / `sideLightSupportMusic` 等能力位（SDK 不强制拦截）。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `colors` | `string[]` | — | 各 LED 的 hex 颜色 |
| `options.ledCount` | `number?` | `colors.length` | 有效 LED 数量 |
| `options.startOffset` | `number?` | `0` | 起始灯位（按 LED 个数） |
| `options.keepSession` | `boolean?` | `false` | `true` 时保持通讯，便于连续推流 |

### 返回值

`Promise<void>`。

### 使用示例

```js
await ServiceKeyboard.setMusicRhythmColors(['#ff0000', '#00ff00'], {
  keepSession: true,
})
```

### 注意事项

`protocolVer < 2` 时 SDK 抛错。结束推流时可再发一帧并设 `keepSession: false`，或调用 `close()`。
