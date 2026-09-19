# 编码器

## 注意事项

| 条件 | 说明 |
|---|---|
| `info.encoder === true` | 信息区表示带编码器 / 旋钮 |
| `CMD_GET_WHEEL_DATA` | 号段随 `protocolVer` 变化；无命令时返回 `null` |
| `wheelDefaultMode` | 功能区字段；部分布局无此占位 |

---

## 读取旋钮对应键位

`ServiceKeyboard.getEncoderWheel()`

读取左 / 中 / 右对应的键位 index（`CMD_GET_WHEEL_DATA`，号段随 `protocolVer`）。改这些键的键值用 [布局/改键](./key) 的 `setKey`。

### 参数

无。

### 返回值

`Promise<EncoderWheelData | null>` — 失败或无命令时为 `null`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `left` | `number` | 左转对应键位 index |
| `center` | `number` | 按下对应键位 index |
| `right` | `number` | 右转对应键位 index |

### 使用示例

```js
const info = await ServiceKeyboard.getDeviceInfo()
if (info.encoder) {
  const wheel = await ServiceKeyboard.getEncoderWheel()
}
```

---

## 设置滚轮默认模式

`ServiceKeyboard.setEncoder(patch)`

设置编码器默认模式（写功能区 `wheelDefaultMode`）。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.wheelDefaultMode` | `number?` | `0` / `1`，是否启用第二模式 |

### 返回值

`Promise<FuncInfo>` — 写回后的完整功能区。等价于 `patchFuncInfo({ wheelDefaultMode })`。

### 使用示例

```js
await ServiceKeyboard.setEncoder({ wheelDefaultMode: 1 })
```
