# Performance / DPI

Report rate and DPI groups live in the **function area** (CMD `0x14` / `0x15`). The SDK provides full read/write plus `setPerformance` / `setDpi` helpers.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer `getDeviceInfo()` first | Use `dpiGroupMax` / `reportRateMax` to constrain UI |
| Up to **8** DPI group slots | Only groups with `enabled: true` are sent; on write, compact to front and zero empty slots |
| Report rate enum | `1000` / `500` / `250` / `125` (Hz) |
| Current step | `dpiLevel` is index among enabled groups (0 = first group) |

```js
await ServiceMouse.getDeviceInfo()
const func = await ServiceMouse.getFuncInfo()
```

---

## Set report rate

`ServiceMouse.setPerformance({ reportRate })`

Convenience API to write the function area report rate field.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `reportRate` | `1000 \| 500 \| 250 \| 125` | Report rate in Hz |

### Returns

`Promise<MouseFuncInfo>`

### Example

```js
await ServiceMouse.setPerformance({ reportRate: 500 })

// or
await ServiceMouse.patchFuncInfo({ reportRate: 1000 })
```

---

## Write DPI groups

`ServiceMouse.setDpi({ level, groups })`

Sets current step and up to 8 DPI groups; the SDK compacts enabled groups and recalculates `dpiLevel`. Read current step and groups via [Read function area](./globalSetting#read-func) `getFuncInfo()` (`dpiLevel`, `dpiGroups`).

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `level` | `number` | Current step index (based on **pre-change** group index; SDK recompacts enabled groups and adjusts) |
| `groups` | `MouseDpiGroup[]` | Up to 8 groups |

#### MouseDpiGroup

| Field | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Whether enabled; disabled groups are not sent |
| `xySeparate` | `boolean` | Separate X/Y |
| `dpiX` | `number` | X-axis DPI |
| `dpiY` | `number` | Y-axis DPI (same as X when `xySeparate=false`) |
| `color` | `{ r, g, b }` | Step indicator color (0–255) |

### Returns

`Promise<MouseFuncInfo>`

### Example

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

## Switch current DPI step

`ServiceMouse.patchFuncInfo({ dpiLevel })`

Changes current DPI step only, not per-group DPI values.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `dpiLevel` | `number` | Index among enabled groups |

### Returns

`Promise<MouseFuncInfo>`

### Example

```js
const func = await ServiceMouse.getFuncInfo()
await ServiceMouse.patchFuncInfo({ dpiLevel: 2 })
```

---

## Function area field quick reference

| Field | Description |
|---|---|
| `reportRate` | Report rate in Hz |
| `dpiLevel` | Current DPI step |
| `dpiGroups` | Up to 8 groups |
| `lodHeight` / `scanDelay` / `sleepTime` | See [Global settings](./globalSetting) |
