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
