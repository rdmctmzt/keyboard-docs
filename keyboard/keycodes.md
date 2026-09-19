# 键值表

可改写键 / 默认键在协议里都是 **3 字节**：

```
{ type, code1, code2 }
```

对齐驱动 `customkeys` + `getKeyName` / `setKeyMatrixData`。

## 注意事项

| 条件 | 说明 |
|---|---|
| 配合改键 API | `setKey` / `getKeymap` 写入的就是这三字节 |
| 宏不是改 `list` 能播的 | 绑物理键要用 `type=0x60` / `0x61`，见下方宏键节 |
| 穿透键 | `type=0x10`（或 0）、`code1=0`、`code2=0x01`，显示为 `▽` |
| HID usage | 普通键 `code2` 是键盘 HID usage，不是 `KeyboardEvent.code` |

```js
await ServiceKeyboard.setKey(0, 12, { type: 0x10, code1: 0, code2: 0x04 }) // A
```

---

## type 一览

| type | 十进制 | 类别 | code1 / code2 含义 |
|---|---|---|---|
| `0x10` | 16 | 普通键盘键 | `code1`=修饰键位掩码；`code2`=HID Usage |
| `0x12` | 18 | 快捷键组合 | 同 `0x10`（驱动 UI「Shortcut」） |
| `0x20` | 32 | 系统电源类 | `code1`=`0x81/0x82/0x83`；`code2` 常为 0 |
| `0x30` | 48 | 多媒体 / 消费控制 | `code1`=Usage；`code2`=页/附加（常 0/1/2） |
| `0x40` | 64 | 鼠标按键 | 见下方鼠标表 |
| `0x50` | 80 | 特殊功能（Fn/灯/模式等） | `code1`=功能号；`code2` 常为 0 |
| `0x60` | 96 | 宏 | `code1`=宏槽；`code2`=0 执行1次 / 1 按住循环 / 3 切换播放 |
| `0x61` | 97 | 宏（指定次数） | `code1`=宏槽；`code2`=次数 2–255 |

穿透键（透明）：`type=0x10`（或 0）、`code1=0`、`code2=0x01`，显示为 `▽`。

---

## 0x10 / 0x12 普通键与组合键

### 修饰键掩码（code1）

可按位组合（左右修饰共用高低半字节判定，与驱动一致）：

| bit | 值 | 修饰键 |
|---|---|---|
| 0 | `0x01` | LCtrl（单独修饰时也可能映射到 `0xE0`） |
| 1 | `0x02` | LShift |
| 2 | `0x04` | LAlt |
| 3 | `0x08` | LGUI / Win |
| 4 | `0x10` | RCtrl |
| 5 | `0x20` | RShift |
| 6 | `0x40` | RAlt |
| 7 | `0x80` | RGUI |

仅修饰、无主键：`code2=0`，`code1` 为上表单值。

### 常用 HID Usage（code2）

| code2 | 键 | code2 | 键 |
|---|---|---|---|
| `0x04`–`0x1d` | A–Z | `0x1e`–`0x27` | 1–0 |
| `0x28` | Enter | `0x29` | Esc |
| `0x2a` | Backspace | `0x2b` | Tab |
| `0x2c` | Space | `0x2d` | `-` |
| `0x2e` | `=` | `0x2f` / `0x30` | `[` / `]` |
| `0x31` | `\` | `0x33` / `0x34` | `;` / `'` |
| `0x35` | `` ` `` | `0x36`–`0x38` | `,` `.` `/` |
| `0x39` | Caps | `0x3a`–`0x45` | F1–F12 |
| `0x46` | PrtSc | `0x47` | Scroll |
| `0x48` | Pause | `0x49` | Insert |
| `0x4a` | Home | `0x4b` | PageUp |
| `0x4c` | Delete | `0x4d` | End |
| `0x4e` | PageDown | `0x4f`–`0x52` | → ← ↓ ↑ |
| `0x53`–`0x63` | 小键盘区 | `0x65` | Menu / App |

### 示例

```js
// A
{ type: 0x10, code1: 0, code2: 0x04 }

// Ctrl+C（Shortcut，也可用 0x10）
{ type: 0x12, code1: 0x01, code2: 0x06 }

// LCtrl 单独
{ type: 0x10, code1: 0x01, code2: 0 }
```

---

## 0x20 系统键

| 名称 | type | code1 | code2 |
|---|---|---|---|
| Power | `0x20` | `0x81` (129) | 0 |
| Sleep | `0x20` | `0x82` (130) | 0 |
| WakeUp | `0x20` | `0x83` (131) | 0 |

---

## 0x30 多媒体键（常用）

`code1` 为 Usage，`code2` 为附加页（0/1/2）。

| 名称 | code1 | code2 |
|---|---|---|
| Volume + | 233 | 0 |
| Volume - | 234 | 0 |
| Mute | 226 | 0 |
| Play/Pause | 205 | 0 |
| Stop | 183 | 0 |
| Prev Track | 182 | 0 |
| Next Track | 181 | 0 |
| Multimedia | 131 | 1 |
| Screen Bright + | 111 | 0 |
| Screen Bright - | 112 | 0 |
| Homepage | 35 | 2 |
| Web Search | 33 | 2 |
| Web Favorites | 42 | 2 |
| Calculator | 146 | 1 |
| Mail | 138 | 1 |
| My Computer | 148 | 1 |

完整列表以驱动 `customkeys` → Media 分组为准。

---

## 0x40 鼠标键

| 名称 | code1 | code2 |
|---|---|---|
| 左键 | 0 | 1 |
| 右键 | 0 | 2 |
| 中键 | 0 | 4 |
| 后退 | 0 | 8 |
| 前进 | 0 | 16 |
| 上滚 | 5 | 1 |
| 下滚 | 6 | 1 |

---

## 0x50 特殊功能键（code1）

`type=0x50`，`code2` 一般为 0。`code1` 为功能号（对齐驱动 `customKeys`）：

| code1 | 功能 |
|---|---|
| 1–4 | Fn0–Fn3 |
| 5–8 | To0–To3（切到指定层） |
| 9 | 背光开关 |
| 10 / 11 | 背光模式 + / − |
| 12 / 13 | 背光色相 + / − |
| 14 / 15 | 背光亮度 + / − |
| 16 / 17 | 背光速度 + / − |
| 18 | 拾色板 / Color Board |
| 19–23 | 自定义灯 1–5 |
| 24 | LOGO 灯开关 |
| 25–32 | LOGO 模式/色相/亮度/速度 ± |
| 33 | 侧灯开关 |
| 34–41 | 侧灯模式/色相/亮度/速度 ± |
| 42 | 点阵灯开关 |
| 43–50 | 点阵模式/色相/亮度/速度 ± |
| 51 | Reset |
| 52–54 | BLE 模式 1–3 |
| 55 | 2.4G 模式 |
| 56 | USB 模式 |
| 57 | 电量显示 |
| 58 | 六键/全键切换 |
| 59 | Mac/Win 切换 |
| 60 | Win 锁切换 |
| 61 | WASD 切换 |
| 62 | 回报率/延迟档切换 |
| 63 | F 区模式切换 |
| 64 | 滚轮功能切换 |
| 65 | 整机电源相关切换 |
| 66–69 | LCD 电源/模式/GIF/USB |
| 70–72 | 滚轮左/右/确认 |
| 74 | LED Test |

---

## 0x60 / 0x61 宏键

| type | code1 | code2 | 含义 |
|---|---|---|---|
| `0x60` | 宏槽 index | 循环类型（见下表） | 普通宏绑定 |
| `0x61` | 宏槽 index | 重复次数 `2–255` | 指定播放次数 |

### 循环类型

| `code2` | 含义 |
|---|---|
| `0` | 执行 1 次（默认） |
| `1` | 按住时循环 |
| `3` | 按下播放，再按下停止 |

执行 N 次且 N>1 用 `0x61`（`code2`=次数）。宏内容用 `getMacros` / `setMacros`；播放方式只在改键侧。详见 [宏 · 宏类型](./api/macro#宏类型改键侧)。

---

## 改键调用示例

```js
// 普通键
await ServiceKeyboard.setKey(0, 0, { type: 0x10, code1: 0, code2: 0x29 }) // Esc

// 多媒体
await ServiceKeyboard.setKey(0, 1, { type: 0x30, code1: 233, code2: 0 }) // Vol+

// 特殊：背光开关
await ServiceKeyboard.setKey(0, 2, { type: 0x50, code1: 9, code2: 0 })

// 宏槽 0：执行 1 次
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })

// 宏槽 0：按住循环 / 切换播放 / 执行 5 次
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 1 })
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 3 })
await ServiceKeyboard.setKey(0, 3, { type: 0x61, code1: 0, code2: 5 })
```

相关：[布局/改键](./api/key) · [命令说明](./api/commands) · [宏](./api/macro)
