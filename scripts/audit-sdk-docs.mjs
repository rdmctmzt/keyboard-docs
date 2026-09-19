/**
 * Audit: SDK public API vs keyboard-docs coverage + markdown link check.
 * Run: node scripts/audit-sdk-docs.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsRoot = path.resolve(__dirname, '..')
const sdkRoot = path.resolve(docsRoot, '../sdk-keyboard/packages/keyboard')

const keyboardSrc = fs.readFileSync(path.join(sdkRoot, 'src/keyboard.ts'), 'utf8')
const lcdSrc = fs.readFileSync(path.join(sdkRoot, 'src/lcdScreen.ts'), 'utf8')
const indexSrc = fs.readFileSync(path.join(sdkRoot, 'src/index.ts'), 'utf8')
const typesSrc = fs.readFileSync(path.join(sdkRoot, 'src/types.ts'), 'utf8')

function extractPublicMethods(src, classHint) {
  // Rough: public async/sync methods at class indent (2 spaces), skip private/constructor
  const methods = new Set()
  const re = /^(?:  )(?:async\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*\(/gm
  let m
  while ((m = re.exec(src))) {
    const name = m[1]
    if (name === 'constructor') continue
    // skip nested / local by requiring previous non-empty line not deeper
    methods.add(name)
  }
  // filter known private helpers that appear at 2-space in file incorrectly
  const privateish = new Set([
    'ensureConnected',
    'requireCmd',
    'speedCaps',
    'sendCommand',
    'readChunks',
    'writeChunks',
    'writeGifChunks',
    'resolveMatrixGeometry',
    'readLightModes',
    'clearCaches',
    'deviceIdOf',
    'matchFilter',
  ])
  for (const p of privateish) methods.delete(p)
  return [...methods].sort()
}

function extractExportedTypes(src) {
  const types = new Set()
  const re = /export\s+type\s+\{([^}]+)\}/gs
  let m
  while ((m = re.exec(src))) {
    m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
      .forEach((t) => types.add(t))
  }
  // also export type Foo =
  const re2 = /export\s+type\s+([A-Z][A-Za-z0-9]*)/g
  while ((m = re2.exec(typesSrc))) types.add(m[1])
  while ((m = re2.exec(src))) types.add(m[1])
  return [...types].sort()
}

function walkMd(dir) {
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.vitepress' || ent.name === 'dist') continue
      out.push(...walkMd(p))
    } else if (ent.name.endsWith('.md')) out.push(p)
  }
  return out
}

const keyboardMethods = extractPublicMethods(keyboardSrc)
// LcdScreen: keep only real public API
const lcdMethods = [
  'getDevices',
  'init',
  'close',
  'getScreenSize',
  'getScreenFuncInfo',
  'syncTime',
  'getConnectStatus',
  'startHeartbeat',
  'stopHeartbeat',
  'suspendHeartbeat',
  'resumeHeartbeat',
  'downloadQgif',
  'convertImage',
  'uploadImage',
  'uploadImages',
  'startComm',
  'stopComm',
  'send',
].sort()

const docsFiles = walkMd(docsRoot)
const keyboardDocs = docsFiles.filter((f) => f.includes(`${path.sep}keyboard${path.sep}`))
const allDocsText = docsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
const keyboardDocsText = keyboardDocs.map((f) => fs.readFileSync(f, 'utf8')).join('\n')

const kbMissing = keyboardMethods.filter((name) => {
  // method mentioned as name( or `name
  const re = new RegExp(`\\b${name}\\s*\\(|\`${name}(\\(|\`|/|\\)|\\s)`)
  return !re.test(keyboardDocsText)
})

const lcdMissing = lcdMethods.filter((name) => {
  const re = new RegExp(`\\b${name}\\s*\\(|\`${name}(\\(|\`|/|\\)|\\s)`)
  return !re.test(keyboardDocsText)
})

// Low-level / internal-ish that docs may intentionally omit
const lcdOptionalOmit = new Set(['send', 'startComm', 'stopComm'])
const lcdMissingRequired = lcdMissing.filter((n) => !lcdOptionalOmit.has(n))

const exportedTypes = extractExportedTypes(indexSrc)
const typesMissing = exportedTypes.filter((t) => {
  if (t === 'ApLayout' || t === 'DeviceBaseInfo') return false // deprecated / removed from docs on purpose
  return !keyboardDocsText.includes(t)
})

// Broken relative markdown links
const linkIssues = []
for (const file of docsFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const relDir = path.dirname(file)
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g
  let m
  while ((m = linkRe.exec(text))) {
    let href = m[2].trim()
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) continue
    // strip hash and query
    const hashIdx = href.indexOf('#')
    if (hashIdx >= 0) href = href.slice(0, hashIdx)
    if (!href) continue
    if (href.startsWith('/')) continue // site absolute
    const target = path.resolve(relDir, href.endsWith('.md') || path.extname(href) ? href : `${href}.md`)
    const alt = path.resolve(relDir, href, 'index.md')
    if (!fs.existsSync(target) && !fs.existsSync(alt) && !fs.existsSync(path.resolve(relDir, href))) {
      // vitepress links often omit .md
      const asMd = path.resolve(relDir, href.replace(/\/$/, '') + '.md')
      const asIndex = path.resolve(relDir, href, 'index.md')
      if (!fs.existsSync(asMd) && !fs.existsSync(asIndex)) {
        linkIssues.push({ file: path.relative(docsRoot, file), href: m[2], text: m[1] })
      }
    }
  }
}

// Placeholder / incomplete docs
const placeholders = []
for (const file of docsFiles) {
  const text = fs.readFileSync(file, 'utf8')
  if (/文档占位|TODO|FIXME|待补充|暂未/.test(text)) {
    placeholders.push(path.relative(docsRoot, file))
  }
}

// Sidebar links exist?
const sidebarPath = path.join(docsRoot, '.vitepress/option/sidebar.js')
const sidebar = fs.readFileSync(sidebarPath, 'utf8')
const sidebarLinks = [...sidebar.matchAll(/link:\s*'([^']+)'/g)].map((m) => m[1])
const sidebarMissing = []
for (const link of sidebarLinks) {
  // /keyboard/api/info -> keyboard/api/info.md
  const rel = link.replace(/^\//, '').replace(/\/$/, '')
  const md = path.join(docsRoot, `${rel}.md`)
  const index = path.join(docsRoot, rel, 'index.md')
  if (!fs.existsSync(md) && !fs.existsSync(index)) {
    sidebarMissing.push(link)
  }
}

// Pages without 注意事项 under keyboard/api
const apiPages = keyboardDocs.filter((f) => f.includes(`${path.sep}api${path.sep}`))
const noNotes = apiPages
  .filter((f) => !fs.readFileSync(f, 'utf8').includes('## 注意事项'))
  .map((f) => path.relative(docsRoot, f))

const report = {
  sdkKeyboardMethods: keyboardMethods,
  kbMissingInDocs: kbMissing,
  lcdMissingRequired,
  lcdMissingOptional: lcdMissing.filter((n) => lcdOptionalOmit.has(n)),
  typesMissingInDocs: typesMissing,
  linkIssues: linkIssues.slice(0, 50),
  linkIssueCount: linkIssues.length,
  placeholders,
  sidebarMissing,
  apiPagesWithout注意事项: noNotes,
}

console.log(JSON.stringify(report, null, 2))
console.log('\n--- SUMMARY ---')
console.log('Keyboard methods:', keyboardMethods.length, '| missing docs:', kbMissing.length)
console.log('Lcd required missing:', lcdMissingRequired.length, lcdMissingRequired)
console.log('Types missing:', typesMissing.length, typesMissing)
console.log('Broken links:', linkIssues.length)
console.log('Placeholders:', placeholders.length, placeholders)
console.log('Sidebar missing files:', sidebarMissing.length)
console.log('API pages without 注意事项:', noNotes)
