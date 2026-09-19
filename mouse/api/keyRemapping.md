# 按键映射

可改写层与默认层键表：每层 128 键，每键 3 字节 `{ type, code1, code2 }`。

物理按键数量远少于 128；以 `getDefaultKeymap` + 布局 JSON 的 `index` 对应实际左右键、侧键、DPI 键等。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | 未连接时读写会失败 |
| 建议先 `getDeviceInfo()` | — |
| 层号 `0–3` | 超出范围行为未定义 |
| 键位 `0–127` | 与矩阵 index 对应，不是物理位置编号 |
| 键值含义 | 见 [键值表](../keycodes)；鼠标功能键 `0x50`、火力键 `0x70`、宏 `0x60`/`0x61` |

```js
await ServiceMouse.getDeviceInfo()
const keys = await ServiceMouse.getKeymap(0)
const defaults = await ServiceMouse.getDefaultKeymap(0)
```

---

## 读取可改写键表

`ServiceMouse.getKeymap(layer?)`

读取指定层的用户键表。

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
const keys = await ServiceMouse.getKeymap(0)
```

---

## 读取出厂键表

`ServiceMouse.getDefaultKeymap(layer?)`

读取出厂默认键表（只读），结构同 `getKeymap`。

### 参数

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `layer` | `number` | `0` | 层号 `0–3` |

### 返回值

`Promise<KeyEntry[]>` — 同 `getKeymap`。

### 使用示例

```js
const defaults = await ServiceMouse.getDefaultKeymap(0)
```

常用于把默认 `type=0x40` 的鼠标键映射到 UI 槽位（左 / 右 / 中 / 前进 / 后退 / DPI）。

---

## 改单个键

`ServiceMouse.setKey(layer, index, key)`

写入单层单键的 3 字节键值。

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
// 把某键改成鼠标右键
await ServiceMouse.setKey(0, 4, {
  type: 0x40,
  code1: 0,
  code2: 2,
})

// 参数切换（鼠标功能 KEY_CPI_SET）
await ServiceMouse.setKey(0, 6, {
  type: 0x50,
  code1: 0x14,
  code2: 0,
})

// 火力键：间隔 8ms，按住连发
await ServiceMouse.setKey(0, 1, {
  type: 0x70,
  code1: 4, // 4×2ms = 8ms；0 表示默认 2ms
  code2: 0, // 0 = 按住连发；>0 = 发射次数
})
```

---

## 常见物理键 → 默认矩阵

以 1K 鼠标布局为例（具体 index 以 `getDefaultKeymap` 为准）：

| UI | 默认 type / code2（鼠标键） |
|---|---|
| 左键 | `0x40` / `1` |
| 右键 | `0x40` / `2` |
| 中键 | `0x40` / `4` |
| 后退 | `0x40` / `8` |
| 前进 | `0x40` / `16` |
| DPI / 参数切换 | 常为 `0x50` / `code1=0x14` |
