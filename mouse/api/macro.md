# 宏

## 注意事项

| 条件 | 说明 |
|---|---|
| 命令 | 鼠标宏读写为 `0x24` / `0x25`（与键盘 `0x2c`/`0x2d` 不同） |
| `info.macroSize` | 缓冲字节 = `macroSize × 256`；为 `0` 时 SDK 回退 **1096** 字节 |
| 槽位 | 建议 `0–15` |

```js
const info = await ServiceMouse.getDeviceInfo()
const macros = await ServiceMouse.getMacros()
```

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

### 使用示例

```js
// 槽 0：执行 1 次
await ServiceMouse.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })

// 槽 0：按住循环
await ServiceMouse.setKey(0, 3, { type: 0x60, code1: 0, code2: 1 })

// 槽 0：执行 5 次
await ServiceMouse.setKey(0, 3, { type: 0x61, code1: 0, code2: 5 })
```

完整键值说明见 [键值表 · 0x60 / 0x61](../keycodes#060--061-宏键)。

---

## 读取宏

`ServiceMouse.getMacros()`

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

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `'keyboard' \| 'mouse'` | 键盘 HID / 鼠标按键 |
| `code` | `number` | `keyboard`：HID usage |
| `button` | `number` | `mouse`：按键码（1 左 / 2 右 / 4 中 …） |
| `down` | `boolean` | `true` 按下，`false` 抬起 |
| `delayMs` | `number` | 与上一步间隔；SDK 编码时夹到 10–10000，第一步固定 10 |

### 使用示例

```js
const macros = await ServiceMouse.getMacros()
```

---

## 写入宏

`ServiceMouse.setMacros(profiles)`

整包覆盖设备宏区；按 `key` 槽位写入。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `profiles` | `MacroProfile[]` | 按 `key` 槽位写入；空 `list` 表示清空该槽 |

### 返回值

`Promise<void>`

### 使用示例

```js
await ServiceMouse.setMacros([
  {
    key: 0,
    name: '双击左键',
    list: [
      { type: 'mouse', button: 1, down: true, delayMs: 10 },
      { type: 'mouse', button: 1, down: false, delayMs: 30 },
      { type: 'mouse', button: 1, down: true, delayMs: 30 },
      { type: 'mouse', button: 1, down: false, delayMs: 30 },
    ],
  },
])

// 再绑到侧键
await ServiceMouse.setKey(0, 0, { type: 0x60, code1: 0, code2: 0 })
```
