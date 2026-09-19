# 性能 / DPI

回报率与 DPI 组都在**功能区**（CMD `0x14` / `0x15`）。SDK 提供整包读写，以及 `setPerformance` / `setDpi` 便捷接口。

## 注意事项

| 条件 | 说明 |
|---|---|
| 须先 `init()` | — |
| 建议先 `getDeviceInfo()` | 用 `dpiGroupMax` / `reportRateMax` 约束 UI |
| DPI 组最多 **8** 槽 | 仅 `enabled: true` 的组会下发；写回时紧凑到前面，空槽清零 |
| 回报率枚举 | `1000` / `500` / `250` / `125`（Hz） |
| 当前档 | `dpiLevel` 为启用组中的下标（0 = 第 1 组） |

```js
await ServiceMouse.getDeviceInfo()
const func = await ServiceMouse.getFuncInfo()
```

---

## 设置回报率

`ServiceMouse.setPerformance({ reportRate })`

写入功能区回报率字段的便捷接口。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `reportRate` | `1000 \| 500 \| 250 \| 125` | 回报率 Hz |

### 返回值

`Promise<MouseFuncInfo>`

### 使用示例

```js
await ServiceMouse.setPerformance({ reportRate: 500 })

// 或
await ServiceMouse.patchFuncInfo({ reportRate: 1000 })
```

---

## 写入 DPI 组

`ServiceMouse.setDpi({ level, groups })`

设置当前档与最多 8 组 DPI；SDK 按启用组紧凑并重算 `dpiLevel`。读回当前档与组列表用 [读取功能区](./globalSetting#读取功能区) 的 `getFuncInfo()`（字段 `dpiLevel`、`dpiGroups`）。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `level` | `number` | 当前档下标（基于**改前**的组下标；SDK 会按启用组重新紧凑并校正） |
| `groups` | `MouseDpiGroup[]` | 最多 8 组 |

#### MouseDpiGroup

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | `boolean` | 是否启用；未启用的组不下发 |
| `xySeparate` | `boolean` | 是否 XY 独立 |
| `dpiX` | `number` | X 轴 DPI |
| `dpiY` | `number` | Y 轴 DPI（`xySeparate=false` 时与 X 相同） |
| `color` | `{ r, g, b }` | 档位指示色（0–255） |

### 返回值

`Promise<MouseFuncInfo>`

### 使用示例

```js
const func = await ServiceMouse.getFuncInfo()

await ServiceMouse.setDpi({
  level: 1,
  groups: [
    {
      enabled: true,
      xySeparate: false,
      dpiX: 800,
      dpiY: 800,
      color: { r: 255, g: 72, b: 72 },
    },
    {
      enabled: true,
      xySeparate: false,
      dpiX: 1600,
      dpiY: 1600,
      color: { r: 56, g: 220, b: 96 },
    },
    ...func.dpiGroups.slice(2).map((g) => ({ ...g, enabled: false })),
  ],
})
```

---

## 切换当前 DPI 档

`ServiceMouse.patchFuncInfo({ dpiLevel })`

只改当前 DPI 档位，不改各组 DPI 数值。

### 参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `dpiLevel` | `number` | 启用组中的下标 |

### 返回值

`Promise<MouseFuncInfo>`

### 使用示例

```js
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.patchFuncInfo({ dpiLevel: 2 })
```

---

## 功能区相关字段速查

| 字段 | 说明 |
|---|---|
| `reportRate` | 回报率 Hz |
| `dpiLevel` | 当前 DPI 档 |
| `dpiGroups` | 最多 8 组 |
| `lodHeight` / `scanDelay` / `sleepTime` | 见 [全局设置](./globalSetting) |
