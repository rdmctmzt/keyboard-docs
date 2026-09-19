# 布局 / 改键

可改写层与默认层键表：每层 128 键，每键 3 字节 `{ type, code1, code2 }`。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | 未连接时读写会失败 |
| 建议先 `getDeviceInfo()` | 确认 `protocolVer`；部分键值/特殊键依赖协议 |
| 层号 `0–3` | 超出范围行为未定义 |
| 键位 `0–127` | 与布局矩阵对应，不是物理行列直观编号 |
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

协议命令见 [命令说明](./commands)。
