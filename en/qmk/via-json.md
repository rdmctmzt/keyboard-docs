# VIA JSON: obtain, validate, and process

A **VIA JSON** file (keyboard definition) describes **matrix size**, **UI layout**, **lighting menus**, **customKeycodes**, and related metadata for QMK keyboards.

With `@rdmctmzt/sdk-qmk`, JSON supplies **layout and UI semantics**. The **source of truth for key values** is still **16-bit keycodes** read from the device over VIA.

## How this relates to the three SDKs

| Product | VIA JSON | Key I/O |
|---|---|---|
| QMK / VIA keyboard | **Required** | [Layout / remap](./api/key) |
| Vendor keyboard `@rdmctmzt/sdk-keyboard` | No | [Keyboard SDK · remap](/en/keyboard/api/key) |
| Mouse `@rdmctmzt/sdk-mouse` | No | [Mouse SDK · key remap](/en/mouse/api/keyRemapping) |

---

## 1. Where JSON comes from

Your app prepares the definition. Common sources:

| Source | Notes |
|---|---|
| QMK / VIA project export | Must match the firmware matrix and VIA definition |
| Bundled product asset | Shipped with the app; match the current device by USB VID/PID |
| User import | Pick a local `.json`; use it only after validation |
| 2.4G dongle | If it is a separate file, **VID/PID must be the dongle APP HID**, not the wireless keyboard identity PID |

Do not treat `KC_*` strings in the JSON as the device's current key values. Current values come from the SDK read APIs.

---

## 2. Required fields and validation

After `JSON.parse`, validate at least:

| Field | Type / example | Purpose |
|---|---|---|
| `name` | string | Display name |
| `vendorId` | string, e.g. `"0x0000"` | Must match the current HID APP VID (`parseInt(..., 16)`). Fill with the real device; do not hardcode one model |
| `productId` | string, e.g. `"0x0000"` | Must match the current HID APP PID. Fill with the real device; do not hardcode one model |
| `matrix.rows` / `matrix.cols` | positive integers | Length and indexing for `readRawMatrix(matrix, layer)` |
| `layouts.keymap` | VIA / KLE array | `"row,col"` labels and keycap geometry |

On failure, reject the file and report missing fields or invalid JSON (**no comments** in standard JSON).

### Common optional fields

| Field | Purpose |
|---|---|
| `menus` | Pass to `PARSE_MENUS_TO_LIGHTING_EFFECTS` / `getLightingState` — see [Lighting](./api/lighting) |
| `customKeycodes` | Display names for custom keys — see [Keycodes · CUSTOM](./keycodes) |
| `keycodes` | e.g. `["qmk_lighting"]`, declares VIA capabilities |
| `layouts.keys` | Some layouts give the UI key array directly |

---

## 3. Recommended flow

After the device is connected:

```
Load and validate JSON → init → read protocol / layer count → readRawMatrix per layer
  → map raw values onto the UI with keymap → (optional) parse menus → edit
  → setKey / setKeymap / custom lighting write-back
```

### 1. Load the definition

1. Read the JSON text and `JSON.parse`.
2. Validate required fields with the rules above.
3. Compare `vendorId` / `productId` with the current HID device. Do not apply a mismatch.
4. For 2.4G, compare against the **dongle** VID/PID.

### 2. Initialize the QMK session

See [Start · authorize and init](./index#_2-authorize-and-initialize).

```js
import QmkKeyboard from '@rdmctmzt/sdk-qmk'

const vendorId = 0x0000
const productId = 0x0000
const ServiceQmk = new QmkKeyboard({
  configs: [{ vendorId, productId, usagePage: 0xff60, usage: 0x61 }],
})

const devices = await ServiceQmk.getDevices()
await ServiceQmk.init(devices[0].id)
```

### 3. Read firmware key values

```js
const definition = /* validated VIA JSON object */
const ver = await ServiceQmk.getProtocolVersion()
const layerCount = await ServiceQmk.getLayerCount()
const matrix = {
  rows: definition.matrix.rows,
  cols: definition.matrix.cols,
}

const layer0 = await ServiceQmk.readRawMatrix(matrix, 0)
// layer0.length === rows * cols; each item is a uint16 QMK keycode
```

- `"row,col"` in the JSON only maps raw indexes onto the UI.
- Current key values come from `readRawMatrix` / `getKeymap`.

### 4. Merge raw values into the UI

For each layer:

1. Walk `"row,col"` entries in `layouts.keymap`.
2. Take `layer0[index]` with `index = row * cols + col`.
3. Build each keycap's keycode, label, and geometry.

If a physical preview uses different coordinates than VIA, correct the preview only. Do not change keycodes read from the device.

### 5. Lighting and customKeycodes

```js
if (definition.customKeycodes?.length) {
  // Resolve custom key labels in your UI
}

const parsed = ServiceQmk.PARSE_MENUS_TO_LIGHTING_EFFECTS(definition.menus)
const state = await ServiceQmk.getLightingState(definition.menus)
// Write back with setCustomValue / commitCustomMenu — see Lighting
```

`channel` / `value_id` follow JSON `menus` and the firmware. There is no global brightness table.

### 6. Write remaps back

After editing:

- One key: `setKey(layer, row, col, keycode)`
- Whole layer / multi-layer: `setKeymap(matrix, keymap)` / `writeRawMatrix`

Remapping does not require re-importing JSON. Reload a new JSON only when `menus`, `matrix`, or `keymap` structure changes, then read layers again.

---

## 4. Keymap structure

`layouts.keymap` is a VIA / KLE-style 2D array:

- Metadata objects: `{ w, h, x, y, c, … }`
- Strings `"row,col"` for matrix coordinates
- Optional trailing QMK keycode strings as **default labels only**

`matrix.rows` / `cols` must match the firmware VIA definition. Otherwise keys shift or layer reads have the wrong length.

---

## 5. FAQ

| Symptom | What to check |
|---|---|
| Definition will not apply | JSON VID/PID does not match the current HID; 2.4G used the wireless keyboard PID |
| Keys are scrambled | `matrix` or keymap `row,col` does not match firmware |
| Empty lighting list | Missing `menus`, or firmware does not declare `qmk_lighting` |
| Validation fails | Missing required fields; JSON has comments; encoding is not UTF-8 |
| SDK reads keys but UI is wrong | Raw values were not mapped through `layouts.keymap` |

---

## Related docs

| Topic | Link |
|---|---|
| QMK setup | [Start](./index) |
| Matrix read / write | [Layout / remap](./api/key) |
| menus / lighting | [Lighting](./api/lighting) |
| `matrix` / `ViaMenu` types | [Types](./types) |
| VIA commands | [Commands](./api/commands) |
