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

## Process macros after read {#process-after-read}

`getMacros()` already decodes the device buffer into `MacroProfile[]`. Do not parse the `0xaa 0x55` header yourself — use the returned objects.

### 1. How to use slots

| Field | After read |
|---|---|
| `key` | Slot number; matches remap `type=0x60/0x61` `code1` |
| `name` | Display only. Not on device; SDK fills `M0`, `M1`…; UI may override; still not written to buffer on save |
| `type` / `replayCnt` | Compatibility fields; **not** playback mode. Playback is only in keymap `code2` |
| `list` | Actual action sequence. Empty array means no macro in that slot |

```js
const macros = await ServiceKeyboard.getMacros()
const bySlot = new Map(macros.map((p) => [p.key, p]))

const filled = macros.filter((p) => p.list.length > 0)
```

### 2. Parse the action sequence into usable data

Each step in `list` is already structured. Read fields by `type`:

| `action.type` | Field | Meaning |
|---|---|---|
| `'keyboard'` | `action.code` | Keyboard HID usage, e.g. `0x04` = A. Not a remap triple or `KeyboardEvent.code` |
| `'mouse'` | `action.button` | `1` left / `2` right / `4` middle / `8` back / `16` forward |
| Shared | `action.down` | `true` press, `false` release |
| Shared | `action.delayMs` | Delay after previous step (ms) |

A full click is usually press + release:

```js
function actionsToSteps(list) {
  return list.map((action, i) => {
    if (action.type === 'keyboard') {
      return {
        index: i,
        kind: 'keyboard',
        usage: action.code,
        down: action.down,
        delayMs: action.delayMs,
      }
    }
    return {
      index: i,
      kind: 'mouse',
      button: action.button,
      down: action.down,
      delayMs: action.delayMs,
    }
  })
}

const profile = bySlot.get(0)
const steps = actionsToSteps(profile?.list ?? [])
```

For key labels, look up `usage` / `button` in the [Keycode table](../keycodes) HID usage or mouse button tables. Do not treat `code` as `{ type, code1, code2 }`.

### 3. Merge with key bindings

Whether a macro can play depends on a physical key bound to that slot:

```js
const keys = await ServiceKeyboard.getKeymap(0)
const bindings = keys.filter((k) => k.type === 0x60 || k.type === 0x61)

for (const key of bindings) {
  const slot = key.code1
  const profile = bySlot.get(slot)
  const play =
    key.type === 0x61
      ? { mode: 'times', times: key.code2 }
      : {
          mode: 'loop',
          // 0 = play once; 1 = loop while held; 3 = press again to stop
          loop: key.code2,
        }

  // UI: which key index triggers which macro; actions from profile.list; playback from play
  console.log({
    keyIndex: key.index,
    slot,
    play,
    steps: actionsToSteps(profile?.list ?? []),
  })
}
```

| What you need | Source |
|---|---|
| Keys pressed in the macro | `profile.list` |
| Which physical key is bound | `getKeymap` entry with `type` `0x60/0x61` and `code1 === profile.key` |
| Once / loop / N times | That key’s `code2` (and `0x60` vs `0x61`) |

### 4. Write back after editing

1. Change `list` (add/remove actions, change `delayMs`).
2. Call `setMacros` to overwrite the whole area; keep empty slots with `key` and `list: []`, or pad to max slot as needed.
3. To change playback mode, edit `0x60/0x61` on the keymap — do not change `profile.replayCnt`.

Exceeding `macroSize × 256` (1096 when `macroSize` is 0) throws `Macro data exceeds device buffer`.

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
