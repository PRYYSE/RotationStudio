// One private Chrome smoke. A local navigation failure is a known host blocker;
// record it and stop, without retries or touching any personal browser profile.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import net from 'node:net'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url)), cache = path.resolve(root, '../.cache/browser-qa')
const { default: puppeteer } = await import(pathToFileURL(path.join(cache, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const reserve = net.createServer()
await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve))
const port = reserve.address().port
await new Promise(resolve => reserve.close(resolve))
const server = await createServer({ root, server: { port, host: '127.0.0.1', strictPort: true } })
const report = { status: 'UNVERIFIED', port, checks: [], pageErrors: [], consoleErrors: [], screenshots: [] }
let browser, page
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const bounded = (promise, ms) => Promise.race([promise, pause(ms).then(() => { throw Error(`Operation exceeded ${ms} ms`) })])
const capture = async name => {
  const file = `V5-S07A-${name}.png`
  try { await bounded(page.screenshot({ path: path.join(cache, file) }), 5000); report.screenshots.push(file) }
  catch (e) { report.screenshotError = String(e) }
}
try {
  await server.listen()
  const url = `http://127.0.0.1:${port}/?mode=rotations&r=1&serve=us`
  report.httpStatus = (await fetch(`http://127.0.0.1:${port}/plans/team.json`)).status
  browser = await puppeteer.launch({ executablePath: process.env.STUDIO_QA_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    timeout: 25000, userDataDir: path.join(cache, `s07a-private-${Date.now()}`), args: ['--no-first-run', '--disable-background-networking'] })
  page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  page.on('pageerror', e => report.pageErrors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()) })
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 }) }
  catch (e) {
    report.status = 'HOST_NAVIGATION_BLOCKED'; report.error = String(e)
    await capture('navigation-blocked')
  }
  if (report.status !== 'HOST_NAVIGATION_BLOCKED') {
    page.setDefaultTimeout(10000)
    await page.waitForSelector('.rotation-canvas canvas')
    const click = async (text, scope = '') => {
      for (const button of await page.$$(scope ? `${scope} button` : 'button')) if (await button.evaluate(e => e.textContent.trim()) === text) {
        await button.evaluate(e => e.scrollIntoView({ block: 'center' })); await button.click(); await pause(120); return
      }
      throw Error(`Missing button ${text}`)
    }
    const field = async (label, value) => {
      const input = await page.$(`[aria-label="${label}"]`)
      await input.evaluate(e => e.scrollIntoView({ block: 'center' })); await input.click()
      await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control')
      await page.keyboard.type(String(value)); await page.keyboard.press('Enter'); await pause(150)
    }
    const event = async id => {
      if (!await page.$eval('.event-navigator', e => e.open)) await page.click('.event-navigator summary')
      const button = await page.$(`[data-event-id="${id}"]`)
      await button.evaluate(e => e.scrollIntoView({ block: 'center' })); await button.click(); await pause(200)
    }
    const coverage = async () => {
      if (!await page.$eval('.coverage-editor', e => e.open)) {
        const summary = await page.$('.coverage-editor summary')
        await summary.evaluate(e => e.scrollIntoView({ block: 'center' })); await summary.click()
      }
    }
    await click('Strategies'); await click('New from baseline'); await click('Save'); await click('Edit strategy')
    const modules = await page.evaluate(() => performance.getEntriesByType('resource').map(r => new URL(r.name).pathname + new URL(r.name).search))
    const strategyModule = modules.find(p => /\/src\/state\/strategyStore\.ts/.test(p))
    const rotationModule = modules.find(p => /\/src\/state\/rotationStore\.ts/.test(p))
    const fiberModule = modules.find(p => /\/@react-three_fiber\.js/.test(p))
    assert.ok(strategyModule && rotationModule && fiberModule)
    const read = () => page.evaluate(async ({ strategyModule, rotationModule }) => {
      const { useStrategies } = await import(strategyModule), { useRotations, activeScenario } = await import(rotationModule)
      const s = useStrategies.getState(), r = useRotations.getState()
      return { working: s.working, past: s.past.length, time: r.time, scenario: activeScenario(r) }
    }, { strategyModule, rotationModule })
    const initial = await read()
    await event('p3:our-dig'); await event('p8:next-dig')
    assert.deepEqual((await read()).working, initial.working)
    await page.select('[aria-label="Selected athlete"]', 'caleb')
    await event('p3:our-dig'); await field('X metres', '.2'); await coverage()
    await page.select('[aria-label="Coverage role"]', 'tip'); await field('Coverage width metres', '2')
    await event('p8:next-dig'); await field('X metres', '-1'); await coverage()
    await page.select('[aria-label="Coverage role"]', 'deep'); await field('Coverage width metres', '4')
    await click('Add bend')
    const edited = await read(), patches = edited.working.overrides['1/us'].eventOverrides
    assert.equal(patches['p3:our-dig'].anchors.caleb.x, .2); assert.equal(patches['p8:next-dig'].anchors.caleb.x, -1)
    assert.equal(patches['p3:our-dig'].coverage.caleb.radiusX, 1); assert.equal(patches['p8:next-dig'].coverage.caleb.radiusX, 2)
    await capture('desktop-events')
    const locate = () => page.evaluate(async ({ rotationModule, fiberModule }) => {
      const { useRotations, activeScenario } = await import(rotationModule), { _roots } = await import(fiberModule)
      const { sampleTrack } = await import('/src/lib/rotationModel.ts'), THREE = await import('/node_modules/.vite/deps/three.js')
      const r = useRotations.getState(), p = sampleTrack(activeScenario(r).tracks.caleb, r.time)
      const canvas = document.querySelector('.rotation-canvas canvas'), box = canvas.getBoundingClientRect(), camera = _roots.get(canvas).store.getState().camera
      const q = new THREE.Vector3(p.x, .7, p.z).project(camera)
      return { x: box.left + (q.x + 1) * box.width / 2, y: box.top + (1 - q.y) * box.height / 2 }
    }, { rotationModule, fiberModule })
    await click('Areas off')
    let before = await read(), p = await locate()
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 16, p.y - 10, { steps: 8 }); await page.mouse.up(); await pause(200)
    assert.equal((await read()).past, before.past + 1); await click('Undo'); assert.deepEqual((await read()).working, before.working)
    report.checks.push('1440: actual event/field/coverage/route UI, real court pointer gesture and one undo')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); await pause(500)
    before = await read(); p = await locate()
    const cdp = await page.createCDPSession()
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x + 12, y: p.y - 8, id: 1 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(200)
    assert.equal((await read()).past, before.past + 1); await click('Undo'); assert.deepEqual((await read()).working, before.working)
    await event('p3:our-dig'); assert.equal((await read()).time, 5.4)
    await event('p8:next-dig'); assert.equal((await read()).time, 12.29)
    await click('Reset event'); await click('Undo'); assert.deepEqual((await read()).working, before.working)
    await capture('phone-events')
    report.checks.push('390: actual touch drag, event steps and Reset/Undo preserve separate first/next edits')
    assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.consoleErrors, [])
    report.status = 'PASS'
  }
} catch (e) {
  report.status = 'FAILED'; report.error = e.stack ?? String(e)
  if (page) await capture('failure')
  process.exitCode = 1
} finally {
  if (browser) await bounded(browser.close(), 3000).catch(() => browser.process()?.kill())
  await server.close()
  await fs.writeFile(path.join(cache, 'V5-S07A-browser-result.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}

if (report.status !== 'PASS') process.exitCode = 1
