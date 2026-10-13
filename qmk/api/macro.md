# 宏

VIA 动态宏缓冲：`0x0C`–`0x10`。保存时整包重写（先清空再写）。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 容量 | 先 `getMacroBufferSize()`；超限会抛错 |
| 写入流程 | SDK `setMacroBytes` 已按 VIA：reset → 末字节 `0xFF` → 分块写 → 末字节 `0x00` |
| 组分隔 | 宏组之间用 `0x00`；Flash **不存组号**，按下标解析 |
| 与改键绑定 | keymap 里写 `MACRO(n)` 对应槽位（见 [键值表](../keycodes)） |

---

## 宏槽数量

`ServiceQmk.getMacroCount()`

VIA `0x0C`。

### 参数

无。

### 返回值

`Promise<number>`

### 使用示例

```js
const n = await ServiceQmk.getMacroCount()
```

---

## 宏缓冲大小

`ServiceQmk.getMacroBufferSize()`

VIA `0x0D`，单位字节。

### 参数

无。

### 返回值

`Promise<number>`

### 使用示例

```js
const size = await ServiceQmk.getMacroBufferSize()
```

---

## 读取宏原始字节

`ServiceQmk.getMacroBytes()`

分块 `0x0E` 读满整个缓冲。

### 参数

无。

### 返回值

`Promise<number[]>`

### 使用示例

```js
const raw = await ServiceQmk.getMacroBytes()
```

---

## 写入宏原始字节

`ServiceQmk.setMacroBytes(data)`

整包写入；长度不可超过缓冲大小。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `data` | `number[]` | 完整宏区内容 |

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.setMacroBytes(raw)
```

---

## 清空宏

`ServiceQmk.resetMacros()`

VIA `0x10`。

### 参数

无。

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceQmk.resetMacros()
```

---

## 结构化读写（推荐）

`ServiceQmk.getMacros()` / `ServiceQmk.setMacros(profiles)`

在原始缓冲与 `ViaMacroProfile[]` 之间编解码。

### 事件编码

| 类型 | 缓冲格式 | 说明 |
|---|---|---|
| Tap | `01 01` + key | 单击 |
| Down | `01 02` + key | 按下 |
| Up | `01 03` + key | 抬起 |
| Delay | `01 04` + ASCII 毫秒 + `7C` | 如 `1187\|` → 1187 ms |
| ASCII | 双字节重复 | `61 61` → `a` |

### 参数 / 返回值

| API | 说明 |
|---|---|
| `getMacros()` | `Promise<ViaMacroProfile[]>` |
| `setMacros(profiles)` | `profiles[].index` 为槽位；`events` 为上表事件 |

### 使用示例

```js
await ServiceQmk.setMacros([
  {
    index: 0,
    events: [
      { type: 'ascii', text: 'hello' },
      { type: 'delay', ms: 50 },
      { type: 'tap', keycode: 0x28 }, // Enter（单字节约定，以固件为准）
    ],
  },
])

const list = await ServiceQmk.getMacros()
```

---

## 读回后如何处理 {#process-after-read}

优先用 `getMacros()`。它已经把缓冲解成 `ViaMacroProfile[]`。只有要自己改线格式时才用 `getMacroBytes` + `decodeMacroBuffer`。

### 1. 槽位

| 字段 | 用法 |
|---|---|
| `index` | 宏槽号。keymap 里的 `MACRO(n)` 对应 `n` |
| `events` | 事件列表；空表示该槽无内容 |

```js
const profiles = await ServiceQmk.getMacros()
const bySlot = new Map(profiles.map((p) => [p.index, p]))
```

### 2. 事件怎么变成可用步骤

| `event.type` | 字段 | 含义 |
|---|---|---|
| `'tap'` | `keycode` | 单击（内部等价 down+up） |
| `'down'` / `'up'` | `keycode` | 按下 / 抬起；`keycode` 为协议单字节约定 |
| `'delay'` | `ms` | 延时毫秒 |
| `'ascii'` | `text` | 连续 ASCII 字符 |

```js
function eventsToSteps(events) {
  return events.map((ev, i) => {
    if (ev.type === 'ascii') return { index: i, kind: 'text', text: ev.text }
    if (ev.type === 'delay') return { index: i, kind: 'delay', ms: ev.ms }
    return {
      index: i,
      kind: ev.type,
      keycode: ev.keycode,
    }
  })
}

const profile = bySlot.get(0)
const steps = eventsToSteps(profile?.events ?? [])
```

### 3. 和 keymap 绑定合并

1. `readRawMatrix` 得到一层 keycode。
2. 找出 `MACRO(n)`（VIA v12 常见 `0x7700 + n`，其它版本基址见 [键值表](../keycodes)）。
3. `n` 对 `profiles` 里 `index === n` 的 `events`。

```js
const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)
for (let i = 0; i < layer0.length; i += 1) {
  const kc = layer0[i]
  if (kc < 0x7700 || kc > 0x777f) continue
  const slot = kc - 0x7700
  const profile = bySlot.get(slot)
  // i → row/col；slot → 宏内容 profile.events
}
```

### 4. 写回

改 `events` 后调用 `setMacros`。SDK 会按 VIA 流程整包重写。超缓冲会抛错；先看 `getMacroBufferSize()`。

---

## 编解码工具函数

不依赖已连接设备，可单独使用：

| 函数 | 说明 |
|---|---|
| `encodeMacroEvents(events)` | 事件列表 → 字节 |
| `encodeMacroProfiles(profiles)` | 多槽 → 整包缓冲（组间 `0x00`） |
| `decodeMacroBuffer(bytes)` | 缓冲 → `ViaMacroProfile[]` |

```js
import {
  encodeMacroProfiles,
  decodeMacroBuffer,
  encodeMacroEvents,
} from '@rdmctmzt/sdk-qmk'

const bytes = encodeMacroProfiles([
  { index: 0, events: [{ type: 'ascii', text: 'hi' }] },
])
const profiles = decodeMacroBuffer(bytes)
```

