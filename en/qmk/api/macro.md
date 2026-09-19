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
