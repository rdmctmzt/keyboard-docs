/**
 * SDK + 文档 + 上线风险自测
 *
 * 覆盖：
 * 1) 本地 packages 与 npm 已安装包版本/关键方法
 * 2) 中文文档是否覆盖公开实例方法
 * 3) 包资产（qgif）与 exports
 * 4) Demo 适配层调用的方法是否存在于已安装 SDK
 * 5) 上线后常见失效点（Vite qgif、VIA mode、鼠标 FF00 等）
 *
 * 用法（在 keyboard-docs 根目录）：
 *   node scripts/selftest-sdk-docs.mjs
 *   node scripts/selftest-sdk-docs.mjs --demo-nm "E:/工具项目/PMO/Demo/node_modules"
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(__dirname, '..')
const sdkRoot = join(docsRoot, '../sdk-keyboard')
const demoRoot = join(docsRoot, '../Demo')

const args = process.argv.slice(2)
const demoNmIdx = args.indexOf('--demo-nm')
const demoNm =
  demoNmIdx >= 0
    ? resolve(args[demoNmIdx + 1])
    : join(demoRoot, 'node_modules')

let fail = 0
let warn = 0
const findings = []

function ok(msg) {
  console.log('OK  ', msg)
}
function bad(msg) {
  fail += 1
  findings.push({ level: 'FAIL', msg })
  console.error('FAIL', msg)
}
function soft(msg) {
  warn += 1
  findings.push({ level: 'WARN', msg })
  console.warn('WARN', msg)
}

function walkMd(dir) {
  if (!existsSync(dir)) return ''
  let t = ''
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name)
    if (f.isDirectory()) t += walkMd(p)
    else if (f.name.endsWith('.md')) t += readFileSync(p, 'utf8')
  }
  return t
}

function publicMethods(Ctor, srcPath) {
  const methods = Object.getOwnPropertyNames(Ctor.prototype).filter(
    (n) => n !== 'constructor' && typeof Ctor.prototype[n] === 'function',
  )
  let privateMethods = new Set()
  if (srcPath && existsSync(srcPath)) {
    const src = readFileSync(srcPath, 'utf8')
    privateMethods = new Set(
      [...src.matchAll(/^\s+private (?:async )?([a-zA-Z]+)\(/gm)].map((m) => m[1]),
    )
  }
  const skip = new Set(['on', 'off', ...privateMethods])
  return methods.filter((m) => !skip.has(m))
}

async function importPkg(nmRoot, name) {
  const pkgJson = join(nmRoot, name, 'package.json')
  if (!existsSync(pkgJson)) throw new Error(`missing ${name} in ${nmRoot}`)
  const meta = JSON.parse(readFileSync(pkgJson, 'utf8'))
  const entry = join(nmRoot, name, meta.module || meta.main || 'dist/index.js')
  const mod = await import(pathToFileURL(entry).href)
  return { meta, mod, entry }
}

function checkAssets(nmRoot, name, files) {
  for (const f of files) {
    const p = join(nmRoot, name, f)
    if (!existsSync(p)) bad(`${name}: missing asset ${f}`)
    else {
      const st = statSync(p)
      if (st.size < 100) bad(`${name}: asset too small ${f} (${st.size}B)`)
      else ok(`${name}: asset ${f} (${st.size}B)`)
    }
  }
}

function checkExports(meta, name, required) {
  const exp = meta.exports || {}
  for (const key of required) {
    if (key === '.') {
      if (!exp['.'] && !meta.module && !meta.main) bad(`${name}: exports "." missing`)
      else ok(`${name}: export ${key}`)
    } else if (!(key in exp)) {
      soft(`${name}: package.json exports missing "${key}"`)
    } else ok(`${name}: export ${key}`)
  }
}

function scanDemoSdkCalls(filePath, sdkName) {
  if (!existsSync(filePath)) return []
  const text = readFileSync(filePath, 'utf8')
  // this.sdk.foo( / kb.foo( / mouse.foo(
  const re =
    sdkName === 'qmk'
      ? /\b(?:this\.sdk|kb)\.([a-zA-Z][a-zA-Z0-9]*)\s*\(/g
      : sdkName === 'keyboard'
        ? /\b(?:this\.sdk|kb)\.([a-zA-Z][a-zA-Z0-9]*)\s*\(/g
        : /\b(?:this\.sdk|mouse|kb)\.([a-zA-Z][a-zA-Z0-9]*)\s*\(/g
  const set = new Set()
  let m
  while ((m = re.exec(text))) set.add(m[1])
  return [...set]
}

console.log('=== SDK / Docs / Production selftest ===')
console.log('docsRoot:', docsRoot)
console.log('sdkRoot :', sdkRoot)
console.log('demoNm  :', demoNm)
console.log('')

// ── 1) npm installed packages ──
const pkgs = [
  {
    name: '@rdmctmzt/sdk-keyboard',
    localPkg: join(sdkRoot, 'packages/keyboard/package.json'),
    docsDir: join(docsRoot, 'keyboard'),
    className: 'Keyboard',
    srcClass: join(sdkRoot, 'packages/keyboard/src/keyboard.ts'),
    assets: ['assets/qgif.js', 'assets/qgif.wasm'],
    exportKeys: ['.', './assets/*'],
    demoFiles: [
      join(demoRoot, 'src/devices/KeyboardSdkDevice.ts'),
      join(demoRoot, 'src/services/keyboardSdk.ts'),
      join(demoRoot, 'src/services/keyboardSdkIap.ts'),
    ],
    criticalMethods: [
      'init',
      'initDevice',
      'getCurrentDevice',
      'getNativeDevice',
      'close',
      'getDeviceInfo',
      'getFuncInfo',
      'setKey',
      'setMacros',
    ],
  },
  {
    name: '@rdmctmzt/sdk-mouse',
    localPkg: join(sdkRoot, 'packages/mouse/package.json'),
    docsDir: join(docsRoot, 'mouse'),
    className: 'Mouse',
    srcClass: join(sdkRoot, 'packages/mouse/src/mouse.ts'),
    assets: [],
    exportKeys: ['.'],
    demoFiles: [
      join(demoRoot, 'src/devices/MouseSdkDevice.ts'),
      join(demoRoot, 'src/services/mouseSdk.ts'),
    ],
    criticalMethods: [
      'init',
      'initDevice',
      'getCurrentDevice',
      'getNativeDevice',
      'close',
      'getDeviceInfo',
      'getFuncInfo',
      'patchFuncInfo',
      'setMacros',
    ],
  },
  {
    name: '@rdmctmzt/sdk-qmk',
    localPkg: join(sdkRoot, 'packages/qmk/package.json'),
    docsDir: join(docsRoot, 'qmk'),
    className: 'QmkKeyboard',
    srcClass: join(sdkRoot, 'packages/qmk/src/qmk.ts'),
    assets: [],
    exportKeys: ['.'],
    demoFiles: [
      join(demoRoot, 'src/devices/QmkSdkDevice.ts'),
      join(demoRoot, 'src/services/qmkSdk.ts'),
    ],
    criticalMethods: [
      'init',
      'initDevice',
      'getCurrentDevice',
      'getNativeDevice',
      'close',
      'getProtocolVersion',
      'readRawMatrix',
      'writeRawMatrix',
      'getLightingState',
      'PARSE_MENUS_TO_LIGHTING_EFFECTS',
      'setMacroBytes',
    ],
  },
]

const installed = {}

for (const p of pkgs) {
  console.log(`\n--- ${p.name} ---`)
  try {
    const { meta, mod } = await importPkg(demoNm, p.name)
    installed[p.name] = { meta, mod }
    ok(`installed ${p.name}@${meta.version}`)

    if (existsSync(p.localPkg)) {
      const local = JSON.parse(readFileSync(p.localPkg, 'utf8'))
      if (local.version !== meta.version) {
        soft(
          `${p.name}: Demo installed ${meta.version} != local package ${local.version}`,
        )
      } else ok(`version matches local ${local.version}`)
    }

    checkExports(meta, p.name, p.exportKeys)
    if (p.assets.length) checkAssets(demoNm, p.name, p.assets)

    const Ctor = mod[p.className] || mod.default
    if (!Ctor) {
      bad(`${p.name}: class ${p.className} not exported`)
      continue
    }
    const methods = publicMethods(Ctor, p.srcClass)
    ok(`${p.name}: ${methods.length} public methods`)

    for (const m of p.criticalMethods) {
      if (typeof Ctor.prototype[m] === 'function' || typeof Ctor.prototype[m] === 'function') {
        ok(`critical ${m}`)
      } else if (m in Ctor.prototype) {
        ok(`critical ${m} (prop)`)
      } else {
        // getters like cachedProtocolVersion
        const desc = Object.getOwnPropertyDescriptor(Ctor.prototype, m)
        if (desc) ok(`critical ${m}`)
        else bad(`${p.name}: missing critical API ${m}`)
      }
    }

    // docs coverage
    const docs = walkMd(p.docsDir)
    if (!docs) soft(`${p.name}: docs dir empty/missing ${p.docsDir}`)
    else {
      const missing = methods.filter((m) => !docs.includes(m))
      if (missing.length) {
        bad(`${p.name}: docs missing methods: ${missing.join(', ')}`)
      } else ok(`${p.name}: all public methods mentioned in zh docs`)
    }

    // Demo adapter calls
    const calls = new Set()
    for (const f of p.demoFiles) {
      for (const c of scanDemoSdkCalls(f, p.name.includes('qmk') ? 'qmk' : p.name.includes('mouse') ? 'mouse' : 'keyboard')) {
        calls.add(c)
      }
    }
    const missingCalls = [...calls].filter((c) => {
      if (['then', 'catch', 'finally', 'constructor'].includes(c)) return false
      return typeof Ctor.prototype[c] !== 'function' && !(c in Ctor.prototype)
    })
    if (missingCalls.length) {
      bad(
        `${p.name}: Demo calls missing on SDK: ${missingCalls.join(', ')}`,
      )
    } else if (calls.size) {
      ok(`${p.name}: Demo adapter calls (${calls.size}) exist on SDK`)
    }
  } catch (e) {
    bad(`${p.name}: ${e.message}`)
  }
}

// ── 2) named exports Demo needs ──
console.log('\n--- named exports used by Demo ---')
const require = createRequire(import.meta.url)
const namedNeeded = [
  ['@rdmctmzt/sdk-keyboard', ['optionalCmd', 'resolveProtocolCmdTable', 'setQgifAssetsBaseUrl', 'KeyboardFirmwareUpgrade']],
  ['@rdmctmzt/sdk-qmk', ['DEFAULT_LIGHTING_PARSE_RULE', 'KeyboardValue', 'parseMenusToLightingEffects']],
  ['@rdmctmzt/sdk-mouse', ['CMD_MOUSE', 'parseRfStatusReport']],
]
for (const [pkg, names] of namedNeeded) {
  const mod = installed[pkg]?.mod
  if (!mod) {
    soft(`skip named exports for ${pkg}`)
    continue
  }
  for (const n of names) {
    if (mod[n] == null) bad(`${pkg}: named export missing ${n}`)
    else ok(`${pkg}: export ${n}`)
  }
}

// ── 3) production risk checks ──
console.log('\n--- production risks ---')

// qgif fragile pattern must NOT be in published keyboard dist
try {
  const kbDist = join(demoNm, '@rdmctmzt/sdk-keyboard/dist/index.js')
  const code = readFileSync(kbDist, 'utf8')
  if (/new URL\(\s*['"]\.\.\/assets\/qgif\.js['"]\s*,\s*import\.meta\.url\s*\)/.test(code)) {
    bad('sdk-keyboard dist still uses Vite-fragile new URL(../assets/qgif.js, import.meta.url)')
  } else ok('sdk-keyboard dist: no fragile qgif import.meta.url pattern')
  if (!code.includes('setQgifAssetsBaseUrl')) {
    bad('sdk-keyboard dist missing setQgifAssetsBaseUrl')
  } else ok('sdk-keyboard dist has setQgifAssetsBaseUrl')
  if (!code.includes('/node_modules/@rdmctmzt/sdk-keyboard/assets/')) {
    soft('sdk-keyboard dist default assets path may not include /node_modules/... fallback')
  } else ok('sdk-keyboard dist has node_modules assets fallback')
} catch (e) {
  soft(`qgif dist check: ${e.message}`)
}

// VIA must not send 0x10 open-comm in qmk transport
try {
  const qmkDist = join(demoNm, '@rdmctmzt/sdk-qmk/dist/index.js')
  const qcode = readFileSync(qmkDist, 'utf8')
  if (/openComm|0x10/.test(qcode) && /REPORT_ID/.test(qcode) && qcode.includes('0x10') && qcode.includes('sendSession')) {
    soft('sdk-qmk dist mentions 0x10 — verify it is not vendor open-comm')
  }
  if (!qcode.includes('packetLength') && !qcode.includes('33')) {
    soft('sdk-qmk: cannot confirm default packetLength 33 in dist')
  } else ok('sdk-qmk dist references VIA packet sizing')
  if (!qcode.includes('readRawMatrix')) bad('sdk-qmk dist missing readRawMatrix')
  else ok('sdk-qmk dist has readRawMatrix')
} catch (e) {
  soft(`qmk dist check: ${e.message}`)
}

// Demo electron:dev waits on 5173 but vite may be 5174
try {
  const demoPkg = JSON.parse(readFileSync(join(demoRoot, 'package.json'), 'utf8'))
  const viteCfg = readFileSync(join(demoRoot, 'vite.config.ts'), 'utf8')
  const portMatch = viteCfg.match(/port:\s*(\d+)/)
  const waitMatch = String(
    demoPkg.scripts['electron:dev:debug'] || demoPkg.scripts['electron:dev'] || '',
  ).match(/wait-on http:\/\/localhost:(\d+)/)
  if (portMatch && waitMatch && portMatch[1] !== waitMatch[1]) {
    soft(
      `Demo vite port ${portMatch[1]} != electron wait-on ${waitMatch[1]} — electron:dev may hang`,
    )
  } else if (portMatch) ok(`Demo vite port ${portMatch[1]}`)
} catch {
  /* ignore */
}

// mouse package version lag
const mouseInstalled = installed['@rdmctmzt/sdk-mouse']?.meta?.version
const mouseLocal = existsSync(join(sdkRoot, 'packages/mouse/package.json'))
  ? JSON.parse(readFileSync(join(sdkRoot, 'packages/mouse/package.json'), 'utf8')).version
  : null
if (mouseInstalled && mouseLocal && mouseInstalled !== mouseLocal) {
  soft(
    `mouse: Demo@${mouseInstalled} local@${mouseLocal} — confirm getNativeDevice/setLight on installed build`,
  )
}

// npmmirror lag risk
soft(
  'Install tip: default registry may be npmmirror; after publish use --registry https://registry.npmjs.org/ until synced',
)

// Electron file:// qgif
soft(
  'Electron production (file:): ensure build emits sdk-keyboard-assets/ or call setQgifAssetsBaseUrl — LCD upload depends on it',
)

// Dual transport risk for QMK
soft(
  'QMK: do not run KeyboardAPI deviceMode=2 and QmkKeyboard ViaTransport on the same HIDDevice concurrently',
)

console.log('\n=== SUMMARY ===')
console.log(`FAIL: ${fail}`)
console.log(`WARN: ${warn}`)
if (findings.length) {
  console.log('\nFindings:')
  for (const f of findings) console.log(`  [${f.level}] ${f.msg}`)
}
console.log(fail ? '\nRESULT FAIL' : '\nRESULT PASS (with warnings OK)')
process.exit(fail ? 1 : 0)
