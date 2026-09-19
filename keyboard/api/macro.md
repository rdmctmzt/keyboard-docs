# 宏

## 注意事项

| 条件 | 说明 |
|---|---|
| 一般机型均支持宏命令 | `0x2c` / `0x2d` |
| `info.macroSize` | 缓冲字节 = `macroSize × 256`；为 `0` 时 SDK 回退 **1096** 字节 |
| 槽位 | 建议 `0–15` |

宏区大小由信息区 `macroSize × 256` 决定。动作用 HID usage / 鼠标按键码，不依赖 `KeyboardEvent.code`。

宏内容（`list`）与播放方式是两件事：

| 部分 | 存在哪 | 作用 |
|---|---|---|
| `MacroProfile.list` | 宏缓冲（`getMacros` / `setMacros`） | 按什么顺序按哪些键 |
| 改键 `type=0x60` / `0x61` | 键矩阵（`setKey` / `getKeymap`） | 触发哪个槽、怎么循环 / 播几次 |

---

## 宏类型（改键侧）

播放方式**不写在宏缓冲里**，绑到物理键时用键值类型：

| `type` | `code1` | `code2` | 含义 |
|---|---|---|---|
| `0x60` | 宏槽 `0–15` | 循环类型（见下表） | 普通宏绑定 |
| `0x61` | 宏槽 `0–15` | 重复次数 `2–255` | 指定播放次数（执行 N 次且 N>1） |

### 循环类型

| `code2` | 含义 |
|---|---|
| `0` | 执行 **1** 次（默认） |
| `1` | 按住时循环 |
| `3` | 按下播放，再按下停止 |

> 驱动侧偶见历史值 `2`，归一化为 `3`。执行 N 次且 N>1 时改用 `0x61`，不要把次数塞进 `0x60` 的 `code2`。

### 使用示例

```js
// 槽 0：执行 1 次
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })

// 槽 0：按住循环
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 1 })

// 槽 0：按下播放 / 再按停止
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 3 })

// 槽 0：执行 5 次
await ServiceKeyboard.setKey(0, 3, { type: 0x61, code1: 0, code2: 5 })
```

完整键值说明见 [键值表 · 0x60 / 0x61](../keycodes#060--061-宏键)。

---

## 读取宏

`ServiceKeyboard.getMacros()`

从设备读取宏槽列表。

### 参数

无。

### 返回值

`Promise<MacroProfile[]>`

#### 宏槽结构

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `number` | 槽位 `0–15`；改键绑宏时 `code1` 对应该值 |
| `name` | `string?` | 展示名；设备不存，读回时 SDK 填 `M0`/`M1`… |
| `type` | `number?` | **兼容字段**；读回默认 `0`，**不写入**宏缓冲 |
| `replayCnt` | `number?` | **兼容字段**；读回默认 `1`，**不写入**宏缓冲 |
| `list` | `MacroAction[]` | 动作序列（实际写入内容） |

#### 动作序列

`list` 里每一步的 `type` 只有两种：

| `type` | 含义 | 关键字段 |
|---|---|---|
| `'keyboard'` | 键盘 HID | `code` = usage（如 `0x04` = A） |
| `'mouse'` | 鼠标按键 | `button` = 按键位 |

共用字段：`down`（`true` 按下 / `false` 抬起）、`delayMs`（相对上一步延时，编码约 `10–10000`）。

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'keyboard' \| 'mouse'` | — |
| `code` | `number` | 仅 keyboard：HID usage |
| `button` | `number` | 仅 mouse：`1` 左 / `2` 右 / `4` 中 / `8` 后退 / `16` 前进 |
| `down` | `boolean` | 按下 / 抬起 |
| `delayMs` | `number` | 相对上一步延时 |

线编码：键盘动作 flag 低 4 位为 `1`，鼠标为 `3`；bit7 表示按下。

### 使用示例

```js
const info = await ServiceKeyboard.getDeviceInfo()
const bufferBytes = info.macroSize > 0 ? info.macroSize * 256 : 0
const macros = await ServiceKeyboard.getMacros()
```

---

## 写入宏

`ServiceKeyboard.setMacros(profiles)`

整包覆盖设备宏区。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `profiles` | `MacroProfile[]` | 空槽用对应 `key` 且 `list: []`，或省略该槽（按最大 `key+1` 建索引） |

### 返回值

`Promise<void>`

超出设备宏空间抛错：`Macro data exceeds device buffer`。`name` / `type` / `replayCnt` 不写入宏缓冲。

### 使用示例

```js
await ServiceKeyboard.setMacros([
  {
    key: 0,
    name: 'M0',
    list: [
      { type: 'keyboard', code: 0x04, down: true, delayMs: 10 },
      { type: 'keyboard', code: 0x04, down: false, delayMs: 50 },
    ],
  },
])

// 再绑到按键（执行 1 次）
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })
```
