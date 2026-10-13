# Macros

VIA dynamic macro buffer: `0x0C`–`0x10`. On save, the whole buffer is rewritten (clear then write).

## Notes

| Condition | Description |
|---|---|
| Call `init()` first | — |
| Capacity | Call `getMacroBufferSize()` first; exceeding size throws |
| Write flow | SDK `setMacroBytes` follows VIA: reset → last byte `0xFF` → chunked write → last byte `0x00` |
| Group separation | Macro groups separated by `0x00`; Flash **does not store group numbers**, parsed by index |
| Keymap binding | Write `MACRO(n)` in keymap for slot *n* (see [Keycode table](../keycodes)) |

---

## Macro slot count

`ServiceQmk.getMacroCount()`

VIA `0x0C`.

### Parameters

None.

### Returns

`Promise<number>`

### Example

```js
const n = await ServiceQmk.getMacroCount()
```

---

## Macro buffer size

`ServiceQmk.getMacroBufferSize()`

VIA `0x0D`, in bytes.

### Parameters

None.

### Returns

`Promise<number>`

### Example

```js
const size = await ServiceQmk.getMacroBufferSize()
```

---

## Read raw macro bytes

`ServiceQmk.getMacroBytes()`

Reads the full buffer via chunked `0x0E`.

### Parameters

None.

### Returns

`Promise<number[]>`

### Example

```js
const raw = await ServiceQmk.getMacroBytes()
```

---

## Write raw macro bytes

`ServiceQmk.setMacroBytes(data)`

Writes the full buffer; length must not exceed buffer size.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `data` | `number[]` | Complete macro region |

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.setMacroBytes(raw)
```

---

## Clear macros

`ServiceQmk.resetMacros()`

VIA `0x10`.

### Parameters

None.

### Returns

`Promise<void>`

### Example

```js
await ServiceQmk.resetMacros()
```

---

## Structured read/write (recommended)

`ServiceQmk.getMacros()` / `ServiceQmk.setMacros(profiles)`

Encodes/decodes between raw buffer and `ViaMacroProfile[]`.

### Event encoding

| Type | Buffer format | Description |
|---|---|---|
| Tap | `01 01` + key | Single tap |
| Down | `01 02` + key | Key down |
| Up | `01 03` + key | Key up |
| Delay | `01 04` + ASCII ms + `7C` | e.g. `1187\|` → 1187 ms |
| ASCII | Repeated byte pair | `61 61` → `a` |

### Parameters / returns

| API | Description |
|---|---|
| `getMacros()` | `Promise<ViaMacroProfile[]>` |
| `setMacros(profiles)` | `profiles[].index` is slot; `events` as in table above |

### Example

```js
await ServiceQmk.setMacros([
  {
    index: 0,
    events: [
      { type: 'ascii', text: 'hello' },
      { type: 'delay', ms: 50 },
      { type: 'tap', keycode: 0x28 }, // Enter (single-byte convention, firmware-specific)
    ],
  },
])

const list = await ServiceQmk.getMacros()
```

---

## Process macros after read {#process-after-read}

Prefer `getMacros()`. It already decodes the buffer into `ViaMacroProfile[]`. Use `getMacroBytes` + `decodeMacroBuffer` only when you need to edit wire format yourself.

### 1. Slots

| Field | Usage |
|---|---|
| `index` | Macro slot. Keymap `MACRO(n)` maps to `n` |
| `events` | Event list; empty means no content in that slot |

```js
const profiles = await ServiceQmk.getMacros()
const bySlot = new Map(profiles.map((p) => [p.index, p]))
```

### 2. Turn events into usable steps

| `event.type` | Field | Meaning |
|---|---|---|
| `'tap'` | `keycode` | Single tap (internally down+up) |
| `'down'` / `'up'` | `keycode` | Press / release; `keycode` uses protocol single-byte convention |
| `'delay'` | `ms` | Delay in milliseconds |
| `'ascii'` | `text` | Continuous ASCII characters |

```js
function eventsToSteps(events) {
  return events.map((ev, i) => {
    if (ev.type === 'ascii') return { index: i, kind: 'text', text: ev.text }
    if (ev.type === 'delay') return { index: i, kind: 'delay', ms: ev.ms }
    return {
      index: i,
      kind: ev.type,
      keycode: ev.keycode,
    }
  })
}

const profile = bySlot.get(0)
const steps = eventsToSteps(profile?.events ?? [])
```

### 3. Merge with keymap bindings

1. Use `readRawMatrix` to get one layer of keycodes.
2. Find `MACRO(n)` (VIA v12 often `0x7700 + n`; other base addresses in [Keycode table](../keycodes)).
3. Match `n` to `profiles` where `index === n` for `events`.

```js
const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)
for (let i = 0; i < layer0.length; i += 1) {
  const kc = layer0[i]
  if (kc < 0x7700 || kc > 0x777f) continue
  const slot = kc - 0x7700
  const profile = bySlot.get(slot)
  // i → row/col; slot → macro content profile.events
}
```

### 4. Write back

After editing `events`, call `setMacros`. The SDK rewrites the whole buffer via the VIA flow. Over capacity throws; check `getMacroBufferSize()` first.

---

## SDK API names (see Chinese docs for full detail)

- `encodeMacroProfiles`
- `decodeMacroBuffer`
- `encodeMacroEvents`
