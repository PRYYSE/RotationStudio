// Run from the repo root: node visualizer/tests/strategyLibrary.browser.mjs
// Requires the existing isolated Thorium QA installation and Vite on port 5231.
// COURTLINE_QA_URL overrides the app URL; PLANS_QA_BASELINE=1 captures the old layout.
// Every run creates a fresh profile and artifacts. Never opens a normal browser profile.
import fs from 'node:fs/promises'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]+$/, '')
const dir = `${root}/.cache/g1-10-plans-${Date.now()}`
const url = process.env.COURTLINE_QA_URL || 'http://127.0.0.1:5231/RotationStudio/'
const baseline = process.env.PLANS_QA_BASELINE === '1'
const { default: puppeteer } = await import(pathToFileURL(`${root}/.cache/browser-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js`).href)
await fs.mkdir(dir, { recursive: true })
const result = { status: 'RUNNING', checks: [], errors: [], layouts: [], dir, url }
const pause = () => new Promise(resolve => setTimeout(resolve, 180))
const ok = (value, name) => { if (!value) throw Error(name); result.checks.push(name); console.log('PASS', name) }
let browser, page
async function click(text, scope = '') {
  const buttons = await page.$$(`${scope ? scope + ' ' : ''}button`)
  for (const button of buttons) if (await button.evaluate((e, t) => e.textContent.trim() === t, text)) {
    await button.click(); await pause(); return
  }
  throw Error(`Missing button: ${text}`)
}
async function shot(name) { await page.screenshot({ path: `${dir}/${name}.png` }) }
async function downloaded(name) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { return JSON.parse(await fs.readFile(`${dir}/${name}`, 'utf8')) } catch { await pause() }
  }
  throw Error(`Download missing: ${name}`)
}
async function rawStorage() { return page.evaluate(() => localStorage.getItem('rotation-studio-strategies-v2')) }
async function upload(path) {
  const [chooser] = await Promise.all([page.waitForFileChooser(), click('Import JSON preview')])
  await chooser.accept([path]); await pause()
}
async function state() {
  return page.evaluate(async () => {
    const { useStrategies } = await import('/RotationStudio/src/state/strategyStore.ts')
    const s = useStrategies.getState()
    return { working: s.working, library: s.library, preview: s.preview, saved: s.saved, error: s.error }
  })
}
async function disclose(selector) {
  if (!await page.$eval(selector, e => e.open)) await page.click(`${selector} > summary`)
  await pause()
}
async function layout(name, working) {
  const m = await page.evaluate(() => {
    const panel = document.querySelector('.strategy-panel')
    const selectors = ['.strategy-library > label', '.strategy-status', '.plan-create-actions', '.plan-primary-actions']
    const bounds = selectors.map(sel => {
      const e = document.querySelector(sel), r = e?.getBoundingClientRect()
      return { sel, top: r?.top, bottom: r?.bottom }
    })
    return { width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth,
      panelScroll: panel.scrollTop, panelOverflow: panel.scrollHeight - panel.clientHeight, bounds,
      numbered: /0[123]\s*\//.test(document.querySelector('.strategy-library').textContent),
      disclosures: [...document.querySelectorAll('.plan-disclosure')].map(e => ({ open: e.open, title: e.querySelector('summary').textContent })) }
  })
  result.layouts.push({ name, ...m }); await shot(name)
  if (baseline) return
  ok(m.scroll <= m.width && m.panelScroll === 0, `${name}: no horizontal overflow or initial scroll`)
  ok(m.bounds.filter(b => working || b.sel !== '.plan-primary-actions').every(b => b.top >= 58 && b.bottom < m.height), `${name}: selection, status, current actions and creation above fold`)
  ok(!m.numbered && m.disclosures.length === 2 && m.disclosures.every(d => !d.open), `${name}: two closed task disclosures, no wizard`)
}
try {
  browser = await puppeteer.launch({ executablePath: process.env.THORIUM_QA_PATH || 'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',
    headless: true, userDataDir: `${dir}/isolated-profile`, args: ['--no-first-run', '--no-proxy-server'], timeout: 30000, protocolTimeout: 50000 })
  page = await browser.newPage(); page.setDefaultTimeout(18000)
  page.on('pageerror', error => result.errors.push(error.message))
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle0' }); await page.waitForSelector('canvas')
  await click('Strategies'); await page.waitForSelector('.strategy-library')
  for (const [width, height] of [[1440, 900], [1366, 768], [3440, 1440]]) {
    await page.setViewport({ width, height }); await pause(); await layout(`baseline-${width}`, false)
  }
  if (baseline) {
    await click('New from baseline')
    for (const [width, height] of [[1440, 900], [1366, 768], [3440, 1440]]) {
      await page.setViewport({ width, height }); await pause(); await layout(`unsaved-${width}`, true)
    }
  } else {
    await page.setViewport({ width: 1366, height: 768 }); await pause()
    ok(!await page.$('.plan-edit-cta'), 'Immutable baseline has no edit pseudo-control')
    ok(await page.$eval('.plan-local-notice', e => /browser/.test(e.textContent) && /not sync/.test(e.textContent)), 'Local browser storage and no sync explained')
    await page.focus('.plan-share-disclosure > summary'); await page.keyboard.press('Enter'); await pause()
    ok(await page.$eval('.plan-share-disclosure', e => e.open), 'Share disclosure opens with keyboard')
    await page.keyboard.press('Tab')
    ok(await page.evaluate(() => document.activeElement.textContent === 'Import JSON preview'), 'Tab reaches import')
    await page.focus('.plan-share-disclosure > summary'); await page.keyboard.press('Space'); await pause()
    ok(!await page.$eval('.plan-share-disclosure', e => e.open), 'Share disclosure closes with keyboard')
    await click('New from baseline')
    const fresh = await state()
    ok(!!fresh.working && !fresh.saved && !fresh.preview && fresh.library.length === 0, 'Baseline creates an unsaved independent plan')
    for (const [width, height] of [[1440, 900], [1366, 768], [3440, 1440]]) {
      await page.setViewport({ width, height }); await pause(); await layout(`unsaved-${width}`, true)
    }
    await click('New from current')
    ok((await state()).working.id === fresh.working.id, 'Unsaved creation guard retains current plan')
    await click('New from baseline')
    ok((await state()).working.id === fresh.working.id, 'Unsaved baseline creation guard retains current plan')
    await page.select('[aria-label="Saved strategy"]', '')
    ok(!!await page.$('.strategy-confirm') && (await state()).working.id === fresh.working.id, 'Unsaved selection requires explicit decision')
    await click('Keep editing')
    await click('Save', '.strategy-library')
    ok((await state()).saved && (await state()).library.length === 1, 'Visible Save stores plan locally')
    if (await page.$('.strategy-message')) await click('Dismiss')
    for (const [width, height] of [[1440, 900], [1366, 768], [3440, 1440]]) {
      await page.setViewport({ width, height }); await pause(); await layout(`saved-${width}`, true)
    }
    await page.setViewport({ width: 1366, height: 768 }); await pause()
    await disclose('.plan-manage-disclosure')
    await click('Rename / author')
    for (const [label, value] of [['Strategy name', 'G1.10 QA plan'], ['Strategy author', 'Isolated QA']]) {
      await page.focus(`[aria-label="${label}"]`); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control')
      await page.keyboard.press('Backspace'); await page.keyboard.type(value)
    }
    await click('Apply name')
    ok((await state()).working.name === 'G1.10 QA plan' && (await state()).working.author === 'Isolated QA' && (await state()).saved, 'Rename and author preserve existing autosave')
    const saved = await state()
    await click('Duplicate')
    ok((await state()).working.id !== saved.working.id && !(await state()).saved && (await state()).library.length === 1, 'Duplicate creates independent unsaved copy')
    await click('Duplicate')
    ok((await state()).library.length === 1 && /before duplicating/.test(await page.$eval('.strategy-message', e => e.textContent)), 'Duplicate unsaved guard')
    await click('Save', '.strategy-library')
    await click('Delete')
    ok((await state()).library.length === 2 && !!await page.$('.strategy-confirm'), 'Delete waits for explicit confirmation')
    await click('Cancel', '.strategy-confirm')
    ok((await state()).library.length === 2, 'Delete cancellation keeps both plans')
    await click('Delete'); await click('Confirm delete')
    ok((await state()).library.length === 1 && !(await state()).working, 'Confirmed delete only removes selected copy')
    await page.select('[aria-label="Saved strategy"]', saved.working.id)
    await click('New from current')
    ok((await state()).working.id !== saved.working.id && (await state()).working.name.endsWith(' copy'), 'New from current retains copy behaviour')
    await page.select('[aria-label="Saved strategy"]', saved.working.id); await click('Discard and switch')
    ok((await state()).working.id === saved.working.id && (await state()).saved, 'Explicit discard switches to saved selection')
    await click('Edit on court'); await page.waitForSelector('.desktop-athlete-editor')
    ok(!!await page.$('.strategy-selection') && !await page.$('.plan-disclosure'), 'Edit handoff uses original compact selector')
    await click('Strategies'); await page.waitForSelector('.strategy-library')
    await click('Team reference'); await page.waitForSelector('[role="dialog"]')
    ok(!!await page.$('.reference-court') && !!await page.$('.reference-actions'), 'Primary reference opens existing printable modal')
    await page.keyboard.press('Escape'); await pause()
    ok(!await page.$('[role="dialog"]'), 'Reference closes with Escape')
    ok(await page.evaluate(() => document.activeElement.textContent === 'Team reference'), 'Reference returns keyboard focus to primary action')
    await disclose('.plan-share-disclosure')
    const cdp = await page.createCDPSession()
    cdp.on('Page.downloadWillBegin', event => console.log('DOWNLOAD', event.suggestedFilename))
    cdp.on('Page.downloadProgress', event => console.log('DOWNLOAD', event.state))
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: path.resolve(dir) })
    await click('Export JSON')
    const exported = await downloaded(`strategy-${saved.working.id}.json`)
    ok(JSON.stringify(exported) === JSON.stringify((await state()).working), 'JSON download is lossless')
    await click('Export Review packet')
    const packet = await downloaded(`review-${saved.working.id}.json`)
    ok(isDeepStrictEqual(packet.draft, exported) && packet.status === 'DRAFT; not match-approved', 'Review packet contains exact draft and DRAFT provenance')
    const originalStorage = await rawStorage()
    const importPath = `${dir}/strategy-${saved.working.id}.json`
    await upload(importPath)
    ok((await state()).preview && !(await state()).saved && await rawStorage() === originalStorage, 'Import opens preview without overwriting existing local plan')
    ok(await page.$eval('input[type="file"]', e => e.value === ''), 'File input cleared after import')
    await upload(importPath)
    ok((await state()).preview && await rawStorage() === originalStorage && /before importing/.test(await page.$eval('.strategy-message', e => e.textContent)), 'Same file can be chosen again; unsaved import guard retains work')
    await disclose('.plan-manage-disclosure')
    ok(await page.$eval('.plan-manage-actions button:last-child', e => e.disabled), 'Preview cannot delete a local plan with the same ID')
    await click('Rename / author')
    await page.focus('[aria-label="Strategy name"]'); await page.keyboard.press('End'); await page.keyboard.type(' preview')
    await click('Apply name')
    ok((await state()).preview && !(await state()).saved && await rawStorage() === originalStorage, 'Preview metadata never autosaves')
    await click('Save a copy')
    ok(!(await state()).preview && (await state()).saved && (await state()).working.id !== exported.id && (await state()).library.length === 2, 'Saving import creates independent copy')
    await disclose('.plan-share-disclosure')
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('QA clipboard denied') } } }))
    await click('Share URL')
    const sharedURL = await page.$eval('.strategy-message', e => e.firstChild.textContent)
    ok(sharedURL.startsWith(new URL(url).origin) && sharedURL.includes('#strategy='), 'Clipboard rejection exposes usable preview URL')
    const sender = page, recipientContext = await browser.createBrowserContext()
    page = await recipientContext.newPage(); page.setDefaultTimeout(18000)
    page.on('pageerror', error => result.errors.push(error.message))
    await page.setViewport({ width: 1366, height: 768 })
    await page.goto('about:blank')
    await page.goto(sharedURL, { waitUntil: 'networkidle0' }); await page.waitForSelector('canvas'); await click('Strategies')
    ok((await state()).preview && (await state()).library.length === 0 && await rawStorage() === null, 'Shared recipient starts preview with no automatic storage write')
    ok(await page.$eval('.strategy-status', e => /Preview/.test(e.textContent)), 'Recipient preview status is explicit')
    await layout('recipient-preview-1366', true)
    const recipientId = (await state()).working.id
    await click('Save a copy')
    ok((await state()).saved && !(await state()).preview && (await state()).working.id !== recipientId && await page.evaluate(() => location.hash === ''), 'Recipient saves independent copy and clears shared address')
    await page.goto('about:blank')
    await page.goto(sharedURL, { waitUntil: 'networkidle0' }); await page.waitForSelector('canvas'); await click('Strategies')
    await page.select('[aria-label="Saved strategy"]', '')
    ok((await state()).preview && !!await page.$('.strategy-confirm'), 'Leaving recipient preview requires unsaved-selection decision')
    await click('Discard and switch')
    ok(!(await state()).working && !(await state()).preview && await page.evaluate(() => location.hash === ''), 'Explicit preview exit clears address and retains saved library')
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('canvas')
    ok(!(await state()).preview && (await state()).library.length === 1, 'Cleared shared address does not restore preview on reload')
    await recipientContext.close(); page = sender
    await page.select('[aria-label="Saved strategy"]', saved.working.id)
    await disclose('.plan-share-disclosure')
    await fs.writeFile(`${dir}/oversized.json`, 'x'.repeat(100001))
    const beforeInvalid = await rawStorage(), beforeId = (await state()).working.id
    await upload(`${dir}/oversized.json`)
    ok(/100 KB/.test((await state()).error) && (await state()).working.id === beforeId && await rawStorage() === beforeInvalid, 'Oversized JSON cannot replace current work or storage')
    await fs.writeFile(`${dir}/invalid.json`, '{bad json')
    await upload(`${dir}/invalid.json`)
    ok(!!(await state()).error && (await state()).working.id === beforeId && await rawStorage() === beforeInvalid, 'Invalid JSON retains work and library')
    const long = structuredClone(exported)
    long.notes = { team: Object.fromEntries(['1/us', '1/they', '2/us', '2/they'].map(key => [key, Object.fromEntries(['Start', 'Receive', 'Set', 'Attack', 'Defend'].map(stage => [stage, 'Long QA note '.repeat(30)]))])) }
    await fs.writeFile(`${dir}/long.json`, JSON.stringify(long)); await upload(`${dir}/long.json`)
    await click('Share URL')
    ok(/too long.*Export strategy JSON/.test(await page.$eval('.strategy-message', e => e.textContent)), 'Oversized share URL offers JSON fallback')
    await page.select('[aria-label="Saved strategy"]', saved.working.id); await click('Discard and switch')
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('canvas'); await click('Strategies')
    ok((await state()).library.some(d => d.id === saved.working.id && d.name === saved.working.name), 'Original saved plan survives copy, preview, invalid import and reload')
    // Inject storage faults only in this disposable profile; exercise real visible Save.
    await click('New from baseline')
    const beforeFailure = await rawStorage()
    await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('QA quota', 'QuotaExceededError') } })
    await click('Save', '.strategy-library')
    ok(!(await state()).saved && /Could not save locally/.test((await state()).error) && await rawStorage() === beforeFailure, 'Storage quota failure leaves work unsaved and existing bytes intact')
    await page.select('[aria-label="Saved strategy"]', saved.working.id); await click('Discard and switch')
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('canvas'); await click('Strategies')
    // Build 50 independent QA fixtures, never derived from user data.
    await page.evaluate(async () => {
      const { useStrategies } = await import('/RotationStudio/src/state/strategyStore.ts')
      const s = useStrategies.getState(), library = Array.from({ length: 50 }, (_, i) => ({ ...structuredClone(s.library[0]), id: crypto.randomUUID(), name: `QA quota ${i}` }))
      localStorage.setItem('rotation-studio-strategies-v2', JSON.stringify({ schemaVersion: 2, library, activeId: library[0].id }))
    })
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('canvas'); await click('Strategies')
    const full = await rawStorage(); await click('New from baseline'); await click('Save', '.strategy-library')
    ok((await state()).library.length === 50 && !(await state()).saved && await rawStorage() === full, '50-plan limit retains all saved plans and unsaved working copy')
    // Fresh mobile context confirms original View, original library actions and Set arcs.
    const mobileContext = await browser.createBrowserContext(), desktopPage = page
    page = await mobileContext.newPage(); page.on('pageerror', error => result.errors.push(error.message))
    await page.setViewport({ width: 390, height: 844 }); await page.goto(url, { waitUntil: 'networkidle0' }); await page.waitForSelector('canvas')
    ok(!await page.$('.plan-disclosure') && !await page.$('.desktop-athlete-editor') && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '390 View retains phone layout with no horizontal overflow')
    await shot('phone-view-390'); await click('Strategies'); await page.waitForSelector('.strategy-library')
    ok(!await page.$('.plan-primary-actions') && !await page.$('.plan-disclosure') && await page.$eval('.strategy-library > label', e => e.firstChild.textContent === 'Strategy'), '390 library retains original structure and label')
    const mobileActions = await page.$$eval('.strategy-library button', es => es.map(e => e.textContent))
    ok(JSON.stringify(mobileActions) === JSON.stringify(['New from baseline', 'New from current', 'Duplicate', 'Rename / author', 'Save', 'Delete', 'Import strategy', 'Export strategy', 'Share strategy', 'Export Review packet', 'Team reference']), 'Phone action order and original labels unchanged')
    await shot('phone-plans-390'); await click('View'); await click('Set arcs'); await page.waitForSelector('canvas')
    ok(!await page.$('.rotations'), 'Original Set arcs opens from phone')
    await shot('set-arcs-390')
    // Original Set arcs first-run coach intercepts clicks until dismissed.
    if (await page.$('button').then(async () => (await page.$$eval('button', es => es.some(e => e.textContent.trim() === 'Skip'))))) await click('Skip')
    await click('Rotations'); await page.waitForSelector('.rotations')
    await mobileContext.close(); page = desktopPage
  }
  ok(result.errors.length === 0, 'No JavaScript page errors')
  result.status = 'PASS'
} catch (error) {
  result.status = 'FAIL'; result.errors.push(String(error.stack || error)); console.error(result.errors.at(-1))
  await shot('failure').catch(() => {})
  process.exitCode = 1
} finally {
  await browser?.close().catch(() => {})
  await fs.writeFile(`${dir}/receipt.json`, JSON.stringify(result, null, 2))
  console.log('RESULT', result.status, result.checks.length, dir)
}
