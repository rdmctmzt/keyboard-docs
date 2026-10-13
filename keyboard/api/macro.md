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

## 读回后如何处理 {#process-after-read}

`getMacros()` 已经把设备缓冲解成 `MacroProfile[]`。业务侧不要自己拆 `0xaa 0x55` 头，直接用返回对象。

### 1. 槽位怎么用

| 字段 | 读回后怎么用 |
|---|---|
| `key` | 槽号。和改键 `type=0x60/0x61` 的 `code1` 对应 |
| `name` | 仅展示。设备不存，SDK 填 `M0`、`M1`…；UI 可覆盖，写回时仍不会进缓冲 |
| `type` / `replayCnt` | 兼容字段，**不是**播放方式。播放方式只在键表 `code2` |
| `list` | 真正的动作序列。空数组表示该槽没有宏 |

```js
const macros = await ServiceKeyboard.getMacros()
const bySlot = new Map(macros.map((p) => [p.key, p]))

const filled = macros.filter((p) => p.list.length > 0)
```

### 2. 动作序列怎么解析成可用数据

`list` 里每一步已经是结构化动作。按 `type` 取字段：

| `action.type` | 取什么 | 含义 |
|---|---|---|
| `'keyboard'` | `action.code` | 键盘 HID Usage，例如 `0x04` = A。不是改键三字节，也不是 `KeyboardEvent.code` |
| `'mouse'` | `action.button` | `1` 左 / `2` 右 / `4` 中 / `8` 后退 / `16` 前进 |
| 共用 | `action.down` | `true` 按下，`false` 抬起 |
| 共用 | `action.delayMs` | 相对上一步的间隔（ms） |

一次完整点击通常是「按下 + 抬起」两步：

```js
function actionsToSteps(list) {
  return list.map((action, i) => {
    if (action.type === 'keyboard') {
      return {
        index: i,
        kind: 'keyboard',
        usage: action.code,
        down: action.down,
        delayMs: action.delayMs,
      }
    }
    return {
      index: i,
      kind: 'mouse',
      button: action.button,
      down: action.down,
      delayMs: action.delayMs,
    }
  })
}

const profile = bySlot.get(0)
const steps = actionsToSteps(profile?.list ?? [])
```

显示键名时，用 `usage` / `button` 去查 [键值表](../keycodes) 的 HID Usage 或鼠标键表。不要把 `code` 当成 `{ type, code1, code2 }`。

### 3. 和按键绑定拼在一起

宏能不能播，取决于有没有物理键绑到这个槽：

```js
const keys = await ServiceKeyboard.getKeymap(0)
const bindings = keys.filter((k) => k.type === 0x60 || k.type === 0x61)

for (const key of bindings) {
  const slot = key.code1
  const profile = bySlot.get(slot)
  const play =
    key.type === 0x61
      ? { mode: 'times', times: key.code2 }
      : {
          mode: 'loop',
          // 0 执行 1 次；1 按住循环；3 再按停止
          loop: key.code2,
        }

  // UI：哪个键位 index 触发哪个宏，动作看 profile.list，播放看 play
  console.log({
    keyIndex: key.index,
    slot,
    play,
    steps: actionsToSteps(profile?.list ?? []),
  })
}
```

| 想看的信息 | 从哪来 |
|---|---|
| 宏里按了哪些键 | `profile.list` |
| 绑在哪个物理键 | `getKeymap` 里 `type` 为 `0x60/0x61` 且 `code1 === profile.key` 的项 |
| 播一次 / 循环 / 播 N 次 | 该键的 `code2`（以及 `0x60` 还是 `0x61`） |

### 4. 编辑后再写回

1. 改 `list`（增删动作、改 `delayMs`）。
2. 用 `setMacros` 整包写回；空槽保留 `key` 且 `list: []`，或按最大槽号补齐。
3. 若要改播放方式，改键表上的 `0x60/0x61`，不要改 `profile.replayCnt`。

超出 `macroSize × 256`（为 0 时按 1096）会抛 `Macro data exceeds device buffer`。

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
