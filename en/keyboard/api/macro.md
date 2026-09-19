# Macros

## Notes

| Condition | Description |
|---|---|
| Most models support macro commands | `0x2c` / `0x2d` |
| `info.macroSize` | Buffer bytes = `macroSize × 256`; when `0`, SDK falls back to **1096** bytes |
| Slots | Recommended `0–15` |

Macro area size is `macroSize × 256` from the information area. Actions use HID usage / mouse button codes, not `KeyboardEvent.code`.

Macro content (`list`) and playback mode are separate:

| Part | Stored in | Role |
|---|---|---|
| `MacroProfile.list` | Macro buffer (`getMacros` / `setMacros`) | Key sequence and timing |
| Remap `type=0x60` / `0x61` | Key matrix (`setKey` / `getKeymap`) | Which slot, loop mode / repeat count |

---

## Macro type (remap side) {#macro-type-remap}

Playback mode is **not in the macro buffer**. Bind on a physical key with key types:

| `type` | `code1` | `code2` | Meaning |
|---|---|---|---|
| `0x60` | Macro slot `0–15` | Loop type (see table) | Standard macro bind |
| `0x61` | Macro slot `0–15` | Repeat count `2–255` | Fixed play count (N>1) |

### Loop types

| `code2` | Meaning |
|---|---|
| `0` | Play **1** time (default) |
| `1` | Loop while held |
| `3` | Press to start, press again to stop |

> Driver may expose legacy value `2`, normalized to `3`. For N>1 use `0x61`; do not put count in `0x60` `code2`.

### Example

```js
// Slot 0: play once
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })

// Slot 0: loop while held
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 1 })

// Slot 0: toggle play/stop
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 3 })

// Slot 0: play 5 times
await ServiceKeyboard.setKey(0, 3, { type: 0x61, code1: 0, code2: 5 })
```

Full key value details: [Keycode table · 0x60 / 0x61](../keycodes#macro-keys).

---

## Read macros

`ServiceKeyboard.getMacros()`

Reads macro slots from the device.

### Parameters

None.

### Returns

`Promise<MacroProfile[]>`

#### Slot structure

| Field | Type | Description |
|---|---|---|
| `key` | `number` | Slot `0–15`; remap `code1` matches this |
| `name` | `string?` | Display name; not on device; SDK fills `M0`/`M1`… on read |
| `type` | `number?` | **Compatibility**; default `0` on read, **not written** to macro buffer |
| `replayCnt` | `number?` | **Compatibility**; default `1` on read, **not written** to macro buffer |
| `list` | `MacroAction[]` | Action sequence (actual stored content) |

#### Action sequence

Each step in `list` has one of two `type` values:

| `type` | Meaning | Key fields |
|---|---|---|
| `'keyboard'` | Keyboard HID | `code` = usage (e.g. `0x04` = A) |
| `'mouse'` | Mouse button | `button` = button bit |

Shared: `down` (`true` press / `false` release), `delayMs` (delay after previous step, encoded ~ `10–10000`).

| Field | Type | Description |
|---|---|---|
| `type` | `'keyboard' \| 'mouse'` | — |
| `code` | `number` | keyboard only: HID usage |
| `button` | `number` | mouse only: `1` left / `2` right / `4` middle / `8` back / `16` forward |
| `down` | `boolean` | Press / release |
| `delayMs` | `number` | Delay after previous step |

Wire encoding: keyboard action flag low 4 bits = `1`, mouse = `3`; bit7 = pressed.

### Example

```js
const info = await ServiceKeyboard.getDeviceInfo()
const bufferBytes = info.macroSize > 0 ? info.macroSize * 256 : 0
const macros = await ServiceKeyboard.getMacros()
```

---

## Write macros

`ServiceKeyboard.setMacros(profiles)`

Overwrites the device macro area in one shot.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `profiles` | `MacroProfile[]` | Empty slot: same `key` with `list: []`, or omit slot (index built from max `key+1`) |

### Returns

`Promise<void>`

Throws `Macro data exceeds device buffer` when over capacity. `name` / `type` / `replayCnt` are not written to macro buffer.

### Example

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

// Bind to a key (play once)
await ServiceKeyboard.setKey(0, 3, { type: 0x60, code1: 0, code2: 0 })
```
