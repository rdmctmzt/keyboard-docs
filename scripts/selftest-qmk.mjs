/**
 * QMK docs selftest: every public method must appear in qmk markdown.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(__dirname, '../qmk')
const sidebarPath = join(__dirname, '../.vitepress/option/sidebar.js')
const distCandidates = [
  join(__dirname, '../../sdk-keyboard/packages/qmk/dist/index.js'),
  join(__dirname, '../../Demo/node_modules/@rdmctmzt/sdk-qmk/dist/index.js'),
]

let fail = 0
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    fail += 1
  } else {
    console.log('OK:', msg)
  }
}

const dist = distCandidates.find((p) => existsSync(p))
assert(Boolean(dist), `sdk-qmk dist found (${dist || 'none'})`)
if (!dist) process.exit(1)

const mod = await import(pathToFileURL(dist).href)
const {
  default: QmkKeyboardDefault,
  QmkKeyboard,
  CMD_VIA,
  KeyboardValue,
  CustomChannel,
  shiftTo16Bit,
  shiftFrom16Bit,
  findViaCommandIndex,
  encodeMacroProfiles,
  decodeMacroBuffer,
} = mod

const Ctor = QmkKeyboard || QmkKeyboardDefault

assert(shiftTo16Bit([0x12, 0x34]) === 0x1234, 'shiftTo16Bit BE')
assert(
  JSON.stringify(shiftFrom16Bit(0x1234)) === JSON.stringify([0x12, 0x34]),
  'shiftFrom16Bit BE',
)
assert(findViaCommandIndex([0x04, 1, 2, 3], 0x04) === 0, 'cmd at 0')
assert(CMD_VIA.GET_PROTOCOL_VERSION === 0x01, 'CMD_VIA')
assert(KeyboardValue.FIRMWARE_VERSION === 0x04, 'KeyboardValue')
assert(CustomChannel.RGB_MATRIX === 3, 'CustomChannel')

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

const kb = new Ctor({
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
const methods = Object.getOwnPropertyNames(Ctor.prototype).filter(
  (n) => n !== 'constructor' && typeof Ctor.prototype[n] === 'function',
)
const qmkSrc = join(__dirname, '../../sdk-keyboard/packages/qmk/src/qmk.ts')
const privateMethods = new Set(
  existsSync(qmkSrc)
    ? [...readFileSync(qmkSrc, 'utf8').matchAll(/^\s+private (?:async )?([a-zA-Z]+)\(/gm)].map(
        (m) => m[1],
      )
    : [],
)
const skip = new Set(['on', 'off', ...privateMethods])
const missing = methods.filter((m) => !skip.has(m) && !allDocs.includes(m))
console.log('missing methods in docs:', missing)
assert(missing.length === 0, 'all public methods mentioned in docs')

const sidebar = readFileSync(sidebarPath, 'utf8')
const links = [...sidebar.matchAll(/link:\s*'(\/qmk[^']*)'/g)].map((m) => m[1])
for (const link of links) {
  const rel =
    link === '/qmk/' ? 'index.md' : link.replace(/^\/qmk\//, '') + '.md'
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
