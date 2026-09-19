# 性能

性能相关开关在功能区，可用本页便捷 API 或 `patchFuncInfo`。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 建议先 `getDeviceInfo()` | 速度/休眠等与协议版本、能力相关 |
| 底层是功能区 | `setPerformance` ≡ 对部分字段做 `patchFuncInfo` |
| `sleepTime` / `deepSleepTime` | 单位是**秒**（5 分钟 = `300`） |
| 编码器相关字段 | 无编码器机型可忽略 `wheelDefaultMode` |

---

## 改性能与系统开关

`ServiceKeyboard.setPerformance(patch)`

改全键无冲、Win 锁、休眠、Snap Tap 等性能相关字段。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `patch.sixKeysOrAllKeys` | `number?` | `0` 六键 / `1` 全键无冲 |
| `patch.maxOrWin` | `number?` | `0` Win / `1` Mac |
| `patch.winLock` | `number?` | `0` 不锁 / `1` 锁 Win |
| `patch.keyWasd` | `number?` | `0` 正常 / `1` WASD↔方向键 |
| `patch.scanDelay` | `number?` | 回报率档位索引，见 [功能区](./func#性能--系统) |
| `patch.layerDefault` | `number?` | 上电默认层 `0–3` |
| `patch.fSwitch` | `boolean?` | F 区切换 |
| `patch.wheelDefaultMode` | `number?` | 编码器默认模式 |
| `patch.sleepTime` | `number?` | 浅睡，**秒**（如 5 分钟 = `300`） |
| `patch.deepSleepTime` | `number?` | 深睡，**秒** |
| `patch.snapTap` | `boolean?` | Snap Tap / SOCD |

### 返回值

`Promise<FuncInfo>` — 写回后的完整功能区。

### 使用示例

```js
await ServiceKeyboard.getDeviceInfo()
await ServiceKeyboard.setPerformance({
  sixKeysOrAllKeys: 1,
  winLock: 1,
  sleepTime: 300,
  deepSleepTime: 1800,
  snapTap: true,
})

// 读当前值
const func = await ServiceKeyboard.getFuncInfo()
```
