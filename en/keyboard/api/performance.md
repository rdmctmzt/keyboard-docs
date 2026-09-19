# Performance

Performance switches live in the function area. Use this page’s helpers or `patchFuncInfo`.

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Prefer `getDeviceInfo()` first | Speed/sleep depend on protocol version and capabilities |
| Underlying layer is function area | `setPerformance` ≡ `patchFuncInfo` on selected fields |
| `sleepTime` / `deepSleepTime` | Unit is **seconds** (5 minutes = `300`) |
| Encoder fields | Ignore `wheelDefaultMode` on models without an encoder |

---

## Change performance and system switches

`ServiceKeyboard.setPerformance(patch)`

Updates NKRO, Win lock, sleep, Snap Tap, and related fields.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `patch.sixKeysOrAllKeys` | `number?` | `0` 6-key / `1` NKRO |
| `patch.maxOrWin` | `number?` | `0` Win / `1` Mac |
| `patch.winLock` | `number?` | `0` unlocked / `1` Win locked |
| `patch.keyWasd` | `number?` | `0` normal / `1` WASD↔arrows |
| `patch.scanDelay` | `number?` | Polling rate index; see [Function area](./func#performance-system) |
| `patch.layerDefault` | `number?` | Default layer on power-up `0–3` |
| `patch.fSwitch` | `boolean?` | F-row mode toggle |
| `patch.wheelDefaultMode` | `number?` | Encoder default mode |
| `patch.sleepTime` | `number?` | Light sleep, **seconds** (e.g. 5 min = `300`) |
| `patch.deepSleepTime` | `number?` | Deep sleep, **seconds** |
| `patch.snapTap` | `boolean?` | Snap Tap / SOCD |

### Returns

`Promise<FuncInfo>` — full function area after write.

### Example

```js
await ServiceKeyboard.getDeviceInfo()
await ServiceKeyboard.setPerformance({
  sixKeysOrAllKeys: 1,
  winLock: 1,
  sleepTime: 300,
  deepSleepTime: 1800,
  snapTap: true,
})

// Read current values
const func = await ServiceKeyboard.getFuncInfo()
```
