import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import QmkKeyboard, {
  CMD_VIA,
  KeyboardValue,
  CustomChannel,
  shiftTo16Bit,
  shiftFrom16Bit,
  findViaCommandIndex,
  encodeMacroProfiles,
  decodeMacroBuffer,
} from '../../sdk-keyboard/packages/qmk/dist/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(__dirname, '../qmk')
const sidebarPath = join(__dirname, '../.vitepress/option/sidebar.js')

let fail = 0
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    fail += 1
  } else {
    console.log('OK:', msg)
  }
}

assert(shiftTo16Bit([0x12, 0x34]) === 0x1234, 'shiftTo16Bit BE')
assert(
  JSON.stringify(shiftFrom16Bit(0x1234)) === JSON.stringify([0x12, 0x34]),
  'shiftFrom16Bit BE',
)
assert(findViaCommandIndex([0x04, 1, 2, 3], 0x04) === 0, 'cmd at 0')
assert(findViaCommandIndex([0, 0x04, 1, 2], 0x04) === 1, 'cmd after reportId')
assert(findViaCommandIndex([0xaa, 0x04, 1], 0x04) === 1, 'cmd after aa')

const profiles = [
  {
    index: 0,
    events: [
      { type: 'ascii', text: 'ab' },
      { type: 'delay', ms: 50 },
      { type: 'tap', keycode: 0x28 },
    ],
  },
]
const bytes = encodeMacroProfiles(profiles)
const back = decodeMacroBuffer(bytes)
assert(back.length >= 1 && back[0].index === 0, 'macro decode profile 0')
assert(
  back[0].events.some((e) => e.type === 'ascii' && e.text === 'ab'),
  'ascii event',
)
assert(
  back[0].events.some((e) => e.type === 'delay' && e.ms === 50),
  'delay event',
)
assert(
  back[0].events.some((e) => e.type === 'tap' && e.keycode === 0x28),
  'tap event',
)

assert(CMD_VIA.GET_PROTOCOL_VERSION === 0x01, 'CMD_VIA')
assert(KeyboardValue.FIRMWARE_VERSION === 0x04, 'KeyboardValue')
assert(CustomChannel.RGB_MATRIX === 3, 'CustomChannel')

const kb = new QmkKeyboard({
  configs: [{ vendorId: 0, productId: 0, usagePage: 0xff60, usage: 0x61 }],
})
assert(kb.cachedProtocolVersion === 0, 'cachedProtocolVersion')

function walk(d) {
  let t = ''
  for (const f of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, f.name)
    if (f.isDirectory()) t += walk(p)
    else if (f.name.endsWith('.md')) t += readFileSync(p, 'utf8')
  }
  return t
}

const allDocs = walk(docsRoot)
const methods = Object.getOwnPropertyNames(QmkKeyboard.prototype).filter(
  (n) =>
    n !== 'constructor' &&
    typeof QmkKeyboard.prototype[n] === 'function',
)
const qmkSrc = readFileSync(
  join(__dirname, '../../sdk-keyboard/packages/qmk/src/qmk.ts'),
  'utf8',
)
const privateMethods = new Set(
  [...qmkSrc.matchAll(/^\s+private (?:async )?([a-zA-Z]+)\(/gm)].map(
    (m) => m[1],
  ),
)
const skip = new Set(['on', 'off', ...privateMethods])
const missing = methods.filter((m) => !skip.has(m) && !allDocs.includes(m))
console.log('missing methods in docs:', missing)
assert(missing.length === 0, 'all public methods mentioned in docs')
assert(allDocs.includes('usbChange'), 'usbChange documented')

// keycodes: 3-col rows have exactly 4 pipes; extra | in cell => >4
const kc = readFileSync(join(docsRoot, 'keycodes.md'), 'utf8')
const badRows = []
for (const [i, line] of kc.split(/\n/).entries()) {
  if (!/^\| `0x[0-9A-Fa-f]+` \|/.test(line)) continue
  const pipes = (line.match(/\|/g) || []).length
  if (pipes !== 4) badRows.push({ line: i + 1, pipes, text: line })
}
if (badRows.length) {
  console.error('broken table rows:', badRows.slice(0, 30))
}
assert(badRows.length === 0, 'keycodes.md table rows have 3 columns')

// sidebar links exist
const sidebar = readFileSync(sidebarPath, 'utf8')
const links = [...sidebar.matchAll(/link:\s*'(\/qmk[^']*)'/g)].map((m) => m[1])
for (const link of links) {
  const rel =
    link === '/qmk/'
      ? 'index.md'
      : link.replace(/^\/qmk\//, '') + '.md'
  const path = join(docsRoot, rel)
  try {
    readFileSync(path)
    console.log('OK: sidebar', link)
  } catch {
    assert(false, `sidebar missing file ${link} -> ${rel}`)
  }
}

console.log(fail ? `RESULT FAIL ${fail}` : 'RESULT PASS')
process.exit(fail ? 1 : 0)
