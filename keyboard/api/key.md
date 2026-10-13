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

## 读回后如何处理键值 {#process-after-read}

`getKeymap` / `getDefaultKeymap` 已经返回 `KeyEntry[]`，不必再解包二进制。每个元素都是可用的三字节键值，按 `type` 分支处理。

### 1. 先确认这是不是有效槽

| 情况 | 判定 | 建议 |
|---|---|---|
| 空槽 / 未用 | `type === 0` 且 `code1 === 0` 且 `code2 === 0` | UI 可不展示，或标成「空」 |
| 穿透键 | `type === 0x10`（或 `0`）且 `code1 === 0` 且 `code2 === 0x01` | 显示 `▽`，表示透到下层 |
| 有效键 | 其它 | 按下面分支解析 |

物理键只占一部分 `0–127` 槽。布局对应关系见 [如何得到正确的键位 index](#如何得到正确的键位-index)。

### 2. 按 `type` 拆成业务数据

| `type` | 可用数据怎么取 | 典型用途 |
|---|---|---|
| `0x10` / `0x12` | `code1` = 修饰键掩码；`code2` = 键盘 HID Usage | 普通键、快捷键。显示名查 [键值表](../keycodes) |
| `0x20` | `code1` = 系统功能（如电源） | 系统键 |
| `0x30` | `code1` = 多媒体 Usage | 音量、播放等 |
| `0x40` | `code2` = 鼠标按键位（`1` 左 / `2` 右 / `4` 中 / `8` 后退 / `16` 前进） | 鼠标键 |
| `0x50` | `code1` = 特殊功能号 | Fn、切层、灯效开关等 |
| `0x60` | `code1` = 宏槽；`code2` = 循环类型 `0/1/3` | 宏绑定，内容在 `getMacros()` |
| `0x61` | `code1` = 宏槽；`code2` = 播放次数 `2–255` | 指定次数的宏绑定 |

```js
function describeKey(key) {
  const { type, code1, code2 } = key
  if (type === 0 && code1 === 0 && code2 === 0) return { kind: 'empty' }
  if ((type === 0x10 || type === 0) && code1 === 0 && code2 === 0x01) {
    return { kind: 'transparent', label: '▽' }
  }
  if (type === 0x10 || type === 0x12) {
    return { kind: 'keyboard', mods: code1, usage: code2 }
  }
  if (type === 0x40) {
    return { kind: 'mouse', button: code2 }
  }
  if (type === 0x60) {
    return { kind: 'macro', slot: code1, loop: code2 }
  }
  if (type === 0x61) {
    return { kind: 'macro', slot: code1, times: code2 }
  }
  if (type === 0x50) {
    return { kind: 'special', fn: code1 }
  }
  return { kind: 'other', type, code1, code2 }
}

const keys = await ServiceKeyboard.getKeymap(0)
const uiKeys = keys.map((key) => ({
  index: key.index,
  layer: key.layer,
  ...describeKey(key),
}))
```

### 3. 宏键要和宏缓冲对上

读到 `type === 0x60` / `0x61` 时：

1. `code1` 就是宏槽号。
2. 再用 `getMacros()` 取 `profiles.find(p => p.key === code1)`。
3. 槽的动作在 `profile.list`；播放方式只看键上的 `code2`，不看 `profile.replayCnt`。

完整动作解析见 [宏 · 读回后如何处理](./macro#process-after-read)。

### 4. 改完再写回

展示 / 编辑用的是上面拆出来的字段。写回设备时仍组装成 `{ type, code1, code2 }`，调用 `setKey`。不要把显示名、宏 `list` 写进键表。

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
