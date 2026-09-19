# 布局 / 改键

可改写层与默认层键表：每层 128 键，每键 3 字节 `{ type, code1, code2 }`。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | 未连接时读写会失败 |
| 建议先 `getDeviceInfo()` | 确认 `protocolVer`；部分键值/特殊键依赖协议 |
| 层号 `0–3` | 超出范围行为未定义 |
| 键位 `0–127` | 固件槽位，不是布局 JSON 数组下标，也不是 `row * 21 + col` |
| 正确 index | 用 [出厂键表](#如何得到正确的键位-index) 的 `code` 去对布局 `code` |
| 键值含义 | 见 [键值表](../keycodes)；宏绑定用 `0x60` / `0x61` |

---

## 读取可改写键表

`ServiceKeyboard.getKeymap(layer?)`

读取当前用户层键表。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `layer` | `number` | `0` | 层号 `0–3` |

### 返回值

`Promise<KeyEntry[]>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `index` | `number` | 键位 `0–127` |
| `layer` | `number` | 层 |
| `type` | `number` | 键值类型 |
| `code1` | `number` | 见 [键值表](../keycodes) |
| `code2` | `number` | 见键值表 |

### 使用示例

```js
await ServiceKeyboard.getDeviceInfo()
const keys = await ServiceKeyboard.getKeymap(0)
```

---

## 读取出厂键表

`ServiceKeyboard.getDefaultKeymap(layer?)`

读取出厂默认键表（只读）。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `layer` | `number` | `0` | 层号 `0–3` |

### 返回值

同 [读取可改写键表](#读取可改写键表)。

### 使用示例

```js
const defaults = await ServiceKeyboard.getDefaultKeymap(0)
```

---

## 改单个键

`ServiceKeyboard.setKey(layer, index, key)`

改写用户层某一个键。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `layer` | `number` | 层号 `0–3` |
| `index` | `number` | 键位 `0–127` |
| `key.type` | `number` | 键值类型 |
| `key.code1` | `number` | 第一数据字节 |
| `key.code2` | `number` | 第二数据字节 |

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceKeyboard.setKey(0, 12, {
  type: 0x10,
  code1: 0,
  code2: 0x04, // A
})
```

协议命令见 [命令说明](./commands)。自定义每键灯色用的是同一套键位 index，灯位还要再查 [灯光 · 键位到灯位](./lighting#如何得到正确的灯位-index)。

---

## 如何得到正确的键位 index

`setKey` / `getKeymap` 的 `index` 是固件 128 槽里的下标（每槽 3 字节）。布局 JSON 里的数组顺序、`x`/`y`、临时算的 `row * 21 + col` **都不能**直接当这个下标。

驱动连接后的做法（`updateDefaultKeys`）：

1. 布局每个键有 `code`（HID usage，如 Esc=`41`、F1=`58`）。JSON 里的 `index` 只是占位。
2. 读第 0 层出厂键表。
3. 用布局 `code` 在出厂键表里找第一处匹配，那个下标才是改键 index。

普通键匹配值：`type === 0x10` 且 `code1 === 0` 时就是 `code2`；仅修饰键时按 `code1` 映射到 `0xE0`–`0xE7`（与驱动 `getKeyCode` 一致）。

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
// layoutCode 来自该机型布局 JSON 的 key.code，例如 Esc = 41
const index = defaults.findIndex((k) => layoutCodeOf(k) === 41)
await ServiceKeyboard.setKey(0, index, { type: 0x10, code1: 0, code2: 0x04 })
```

同一 `code` 出现多次时，与驱动一样取 **第一个** 匹配槽。旋钮左/中/右的槽位用 [编码器](./encoder) 的 `getEncoderWheel()`，不要自己猜。
