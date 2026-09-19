# LCD

LCD 分两层，勿混用设备口：

| 层 | 设备 | SDK | 作用 |
|---|---|---|---|
| 键盘 AP | 键盘 HID | `ServiceKeyboard` | 功能区 LCD 字段、开/关屏枚举、同步通知 |
| 屏 HID | 独立屏口（常见 `0x1919`） | `LcdScreen` | 读尺寸、对时、图片转换并下发 |

推荐顺序：`lightOn()` → `LcdScreen.init()` → `startHeartbeat()` → `uploadImage(file)`。

## 注意事项

| 条件 | 说明 |
|---|---|
| `info.isLed === true` | 无 LCD 的机型不要走本页流程 |
| 两个 HID | 键盘口与屏口是**不同设备**；屏内容不能走键盘 AP |
| 须先 `lightOn()` | 打开屏 USB 枚举后，才能 `LcdScreen.getDevices()` / `init()` |
| **心跳必开** | `init` 后应 `startHeartbeat()`（约 10s 一次 `0x1c`）；长时间无心跳屏会话可能掉线 |
| 传图期间 | SDK 会自动 `suspendHeartbeat` / `resumeHeartbeat`；勿与其它屏命令并行狂发 |
| `protocolVer ≥ 2` | `lightOn` / `lightOff` / `syncLcdGif` 等键盘侧命令依赖协议版本 |

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (!info.isLed) throw new Error('本机型无 LCD')
```

---

## 完整流程

```js
import Keyboard, { LcdScreen } from '@rdmctmzt/sdk-keyboard'

const ServiceKeyboard = new Keyboard({
  configs: [{ vendorId: 0x0000, productId: 0x0000, usagePage: 0xff00, usage: 1 }],
})

// 1. 连接键盘
const kbDevices = await ServiceKeyboard.getDevices()
await ServiceKeyboard.init(kbDevices[0].id)
await ServiceKeyboard.getDeviceInfo()

// 2. 打开屏 USB 枚举（键盘侧）
await ServiceKeyboard.lightOn()

// 3. 连接独立屏口
const lcd = new LcdScreen({
  // 可选：站点托管 WASM 时指定
  // qgifBaseUrl: '/vendor/qgif/',
})
const lcdDevices = await lcd.getDevices()
await lcd.init(lcdDevices[0].id)

// 4. 心跳（保持屏会话）
lcd.startHeartbeat({
  intervalMs: 10000,
  onFail: (err) => console.warn('lcd heartbeat', err),
})

// 5. 读屏信息 / 对时
const size = await lcd.getScreenSize()
console.log(size.width, size.height, size.maxScreen)
await lcd.syncTime()

// 6. 传图片，SDK 内转 QGIF 并下发
await lcd.uploadImage(fileInput.files[0], {
  onProgress: (p) => console.log(p.phase, p.percentage),
})

// 7. 结束
lcd.stopHeartbeat()
await lcd.close()
await ServiceKeyboard.lightOff()
```

键盘侧须先 `ServiceKeyboard.init()`。

---

## 写功能区 LCD 字段

`ServiceKeyboard.setLcd(patch)`

合并写入功能区里的 LCD 相关字段；等价于对同一字段调用 `patchFuncInfo`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.lcdScreenLightSwitch` | `boolean?` | 开关；`true`=开 |
| `patch.lcdScreenLightMode` | `number?` | 显示模式 |
| `patch.lcdScreenLightBrightness` | `number?` | 多为亮度；部分布局表示 GIF 索引 |
| `patch.lcdScreenMaxGif` | `number?` | GIF 张数 / 容量相关 |
| `patch.lcdScreenLanguage` | `number?` | 语言索引 |
| `patch.lcdScreenUsbEnum` | `boolean?` | 是否枚举为独立 USB 设备 |

### 返回值

`Promise<FuncInfo>`

### 使用示例

```js
await ServiceKeyboard.setLcd({
  lcdScreenLightSwitch: true,
  lcdScreenLightMode: 1,
  lcdScreenLightBrightness: 3,
  lcdScreenMaxGif: 4,
  lcdScreenLanguage: 0,
  lcdScreenUsbEnum: true,
})

// 等价
await ServiceKeyboard.patchFuncInfo({
  lcdScreenLightSwitch: true,
  lcdScreenLightMode: 1,
})
```

---

## 打开屏 USB 枚举

`ServiceKeyboard.lightOn()`

发送 CMD `0xe0`（V2+），让屏枚举为独立 USB 设备，以便 `LcdScreen` 连接。

### 参数

无。

### 返回值

`Promise<boolean>`

### 使用示例

```js
const ok = await ServiceKeyboard.lightOn()
```

---

## 关闭屏 USB 枚举

`ServiceKeyboard.lightOff()`

发送 CMD `0xe1`（V2+），关闭屏的独立 USB 枚举。

### 参数

无。

### 返回值

`Promise<boolean>`

### 使用示例

```js
await ServiceKeyboard.lightOff()
```

---

## 查询屏是否在线

`ServiceKeyboard.checkLcdStatus()`

查询键盘侧记录的 LCD 在线状态。

### 参数

无。

### 返回值

`Promise<{ online: boolean }>`

### 使用示例

```js
const { online } = await ServiceKeyboard.checkLcdStatus()
if (!online) {
  await ServiceKeyboard.lightOn()
}
```

---

## 同步 GIF 通知

`ServiceKeyboard.syncLcdGif()`

发送 CMD `0xe3`，只通知键盘侧；**不会**往屏写图片。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceKeyboard.syncLcdGif()
```

### 注意事项

协议版本不足时抛错；完整传图仍须走 `LcdScreen.uploadImage` 等屏侧 API。

---

## 创建屏对象

`new LcdScreen(options?)`

构造独立屏 HID 客户端；传图依赖包内或站点托管的 QGIF WASM。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `options.configs` | `{ vendorId, productId, usagePage?, usage? }[]` | `0x1919` / MSI `0x0db0` | 屏 HID 过滤 |
| `options.chunkSize` | `number` | `56` | 写 Flash 分包长度 |
| `options.qgifBaseUrl` | `string` | 包内 `assets/` | `qgif.js` / `qgif.wasm` 目录 URL |

### 返回值

`LcdScreen` 实例。

### 使用示例

```js
const lcd = new LcdScreen()

const lcd2 = new LcdScreen({
  configs: [{ vendorId: 0x1919, productId: 0x1919 }],
  chunkSize: 56,
  qgifBaseUrl: '/vendor/qgif/',
})
```

---

## 列举屏 HID 设备

`lcd.getDevices()`

按构造时的 `configs` 过滤 WebHID 设备列表。

### 参数

无。

### 返回值

`Promise<{ id, productName?, vendorId, productId, opened }[]>`

### 使用示例

```js
const devices = await lcd.getDevices()
```

---

## 连接屏口

`lcd.init(id?)`

打开指定屏 HID；省略 `id` 时取 `getDevices()` 第一台。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string?` | WebHID 设备 id |

### 返回值

`Promise<{ success, device }>`

### 使用示例

```js
const devices = await lcd.getDevices()
const { success, device } = await lcd.init(devices[0].id)
if (!success) throw new Error('lcd init failed')
```

---

## 断开屏口

`lcd.close()`

关闭屏 HID 会话。

### 参数

无。

### 返回值

`void`

### 使用示例

```js
await lcd.close()
```

---

## 启动心跳

`lcd.startHeartbeat(options?)`

周期性发送屏侧 CMD `0x1c`（`getConnectStatus`），保持屏会话；长时间占用屏口时**必须**开启。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `options.intervalMs` | `number?` | `10000` | 间隔；对齐驱动约 10s |
| `options.maxFails` | `number?` | `2` | 连续失败次数后触发 `onFail` |
| `options.onFail` | `(error) => void` | — | 连续失败回调 |

### 返回值

`void`

### 使用示例

```js
lcd.startHeartbeat({
  intervalMs: 10000,
  onFail: (err) => console.warn(err),
})
```

### 注意事项

心跳间隔内勿夹杂其它屏命令抢会话。

---

## 停止心跳

`lcd.stopHeartbeat()`

停止 `startHeartbeat` 启动的定时器。

### 参数

无。

### 返回值

`void`

### 使用示例

```js
lcd.stopHeartbeat()
```

---

## 暂停心跳

`lcd.suspendHeartbeat()`

暂停心跳定时器；大包擦写期间 SDK 会自动调用。

### 参数

无。

### 返回值

`void`

### 使用示例

```js
lcd.suspendHeartbeat()
```

---

## 恢复心跳

`lcd.resumeHeartbeat()`

恢复被暂停的心跳；传图结束后 SDK 会自动调用。

### 参数

无。

### 返回值

`void`

### 使用示例

```js
lcd.resumeHeartbeat()
```

---

## 上传一张图

`lcd.uploadImage(input, options?)`

传入 PNG / JPG / GIF（`File` | `Blob` | `ArrayBuffer` | `Uint8Array` | URL 字符串）；SDK 内缩放、压成 QGIF 并写入 Flash。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | `File \| Blob \| ArrayBuffer \| Uint8Array \| string` | 图片或 GIF；字符串为可 fetch 的 URL |
| `options.width` | `number?` | 目标宽；默认 `getScreenSize().width` |
| `options.height` | `number?` | 目标高；默认 `getScreenSize().height` |
| `options.fps` | `number?` | 静态图帧率，默认 `20`；GIF 按 delay 估算 |
| `options.onProgress` | `(p) => void` | 进度回调 |

`onProgress` 的 `p.phase` 常见：`converting` → `initializing` → `preparing` → `erasing` → `transferring` → `finalizing` → `completed`；另有 `currentScreen`、`totalScreens`、`bytesTransferred`、`totalBytes`、`percentage`。

### 返回值

`Promise<void>`

### 使用示例

```js
await lcd.uploadImage(fileInput.files[0], {
  onProgress: (p) => {
    console.log(p.phase, p.percentage, p.currentScreen, p.totalScreens)
  },
})

await lcd.uploadImage(file, {
  width: 240,
  height: 320,
  fps: 20,
})

await lcd.uploadImage('https://example.com/cover.png')
```

---

## 上传多槽

`lcd.uploadImages(inputs, options?)`

按槽位依次上传；`null` / `undefined` 槽跳过。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `inputs` | `(ImageInput \| null \| undefined)[]` | 多槽图片 |
| `options` | 同 `uploadImage` | 宽高、fps、进度 |

### 返回值

`Promise<void>`

### 使用示例

```js
await lcd.uploadImages([file0, null, file2], {
  onProgress: (p) => console.log(p.phase, p.percentage),
})
```

---

## 只转换不写设备

`lcd.convertImage(input, options?)`

在本地将图片转为 QGIF 二进制，不写入 Flash。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | 同 `uploadImage` | 图片或 GIF |
| `options.width` / `height` / `fps` | `number?` | 同 `uploadImage` |

### 返回值

`Promise<Uint8Array>`（QGIF）

### 使用示例

```js
const qgif = await lcd.convertImage(file, { width: 240, height: 320 })
await lcd.downloadQgif([qgif])
```

---

## 读取屏尺寸

`lcd.getScreenSize()`

读取屏固件版本与分辨率、最大屏数等。

### 参数

无。

### 返回值

`Promise<{ firmwareVersion: number, width: number, height: number, maxScreen: number }>`

### 使用示例

```js
const size = await lcd.getScreenSize()
```

---

## 读取屏功能

`lcd.getScreenFuncInfo()`

读取屏侧功能状态（如升级状态）。

### 参数

无。

### 返回值

`Promise<{ upgradeStatus: number }>`

### 使用示例

```js
const info = await lcd.getScreenFuncInfo()
```

---

## 同步时间

`lcd.syncTime(date?)`

将系统时间写入屏侧时钟。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `date` | `Date?` | 默认 `new Date()` |

### 返回值

`Promise<void>`

### 使用示例

```js
await lcd.syncTime()
await lcd.syncTime(new Date('2026-09-16T12:00:00'))
```

---

## 查询连接状态

`lcd.getConnectStatus()`

查询屏 HID 连接状态；心跳内部也使用 CMD `0x1c`。

### 参数

无。

### 返回值

`Promise<{ connectStatus: number, ok: boolean }>`

### 使用示例

```js
const status = await lcd.getConnectStatus()
```

---

## 下发已有 QGIF

`lcd.downloadQgif(bins, onProgress?)`

已有 QGIF 二进制时直接擦写并下发到 Flash，跳过 `convertImage`。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `bins` | `(Uint8Array \| number[])[]` | 每槽一份 QGIF |
| `onProgress` | `(p) => void` | 可选；字段同 `uploadImage` 进度 |

### 返回值

`Promise<void>`

### 使用示例

```js
const bin0 = await lcd.convertImage(file0)
const bin1 = await lcd.convertImage(file1)
await lcd.downloadQgif([bin0, bin1], (p) => {
  console.log(p.phase, p.percentage)
})
```

---

## qgif WASM

包内自带 `assets/qgif.js` + `assets/qgif.wasm`。默认按 `import.meta.url` 解析。

若打包后加载失败，把 `assets` 拷到站点目录并指定路径：

```js
const lcd = new LcdScreen({
  qgifBaseUrl: '/vendor/qgif/', // 目录内需有 qgif.js、qgif.wasm
})
```
