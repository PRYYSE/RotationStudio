import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const { chromium } = await import(process.env.ROTATION_PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.ROTATION_FIXTURE_URL || 'http://localhost:31460/RotationStudio/'
const output = resolve(process.env.ROTATION_S1_EVIDENCE || 'review-evidence/s1')
const origin = new URL(base).origin
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
  args: ['--disable-dev-shm-usage'] })
const samples = []
const placement = page => page.getByLabel('Placement').textContent()
const note = async (page, text) => page.getByRole('status').filter({ hasText: text }).waitFor()
const save = async page => {
  await page.getByRole('button', { name: 'Save library' }).click()
  await note(page, /Saved on this browser|Saved privately in cloud storage/)
}
const where = async (page, x, z) => page.getByLabel('Authoring court').evaluate((svg, point) => {
  const p = new DOMPoint(point.x, point.z).matrixTransform(svg.getScreenCTM())
  return [p.x, p.y]
}, { x, z })
async function run(name, options, runTest) {
  const context = await browser.newContext({ ...options, acceptDownloads: true })
  const errors = []
  const page = await context.newPage()
  page.setDefaultTimeout(12000)
  try {
    page.on('pageerror', e => errors.push(e.message))
    assert.equal((await context.request.get(base)).status(), 401)
    assert.equal((await context.request.post(origin + '/__fixture/sign-in')).status(), 204)
    await page.goto(base + '?workspace=plans')
    await page.getByRole('heading', { name: 'Team plans' }).waitFor()
    await runTest(page, context)
    const layout = await page.locator('main').evaluate(el => [el.clientWidth, el.scrollWidth])
    assert(layout[1] <= layout[0], 'Authoring UI overflowed: ' + layout)
    assert.deepEqual(errors, [])
    await page.screenshot({ path: resolve(output, name + '.png'), fullPage: true })
    samples.push({ name, viewport: options.viewport, status: 'PASS' })
  } catch (e) {
    console.error(name, errors, (await page.locator('body').innerText()).slice(0, 1800));
    await page.screenshot({ path: resolve(output, name + '-failure.png'), fullPage: true }).catch(() => {})
    throw e
  } finally { await context.close() }
}
try {
  await run('desktop', { viewport: { width: 1440, height: 950 } }, async page => {
    await page.getByRole('button', { name: 'Open sample' }).click()
    await page.getByLabel('Moment', { exact: true }).selectOption('receive')
    const original = await placement(page)
    await page.getByText('Import and export', { exact: true }).click()
    const sample = await readFile(new URL('../contracts/synthetic-proposal.json', import.meta.url))
    await page.getByLabel('Import AI proposal').setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: sample })
    await page.getByRole('heading', { name: 'Proposal preview' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Undo edit' }).count(), 0)
    await page.getByRole('button', { name: 'Show original placement' }).click()
    assert.match(await page.locator('[data-slot=aurora-slot-1]').getAttribute('data-x'), /^2\.49/)
    await page.getByRole('button', { name: 'Show proposed placement' }).click()
    assert.equal(await page.locator('[data-slot=aurora-slot-1]').getAttribute('data-x'), '1.4')
    await page.getByRole('button', { name: 'Reject', exact: true }).click()
    assert.equal(await placement(page), original)
    const pack = JSON.parse(await readFile(new URL('../contracts/synthetic-pack.json', import.meta.url), 'utf8'))
    const newMoment = { ...pack.plan.cases[0].moments.find(m => m.id === 'receive'), id: 'browser-new', name: 'New arrival', ms: 2200 }
    const added = { ...JSON.parse(sample), proposalId: 'browser-proposal', operationId: 'browser-add-moment',
      scope: [{ caseId: pack.plan.cases[0].id }], operations: [{ type: 'addMoment', caseId: pack.plan.cases[0].id, moment: newMoment }] }
    await page.getByLabel('Import AI proposal').setInputFiles({ name: 'new-moment.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(added)) })
    await page.getByRole('heading', { name: 'Proposal preview' }).waitFor()
    assert.equal(await page.getByLabel('Moment', { exact: true }).inputValue(), 'browser-new')
    await page.getByRole('button', { name: 'Show original placement' }).click()
    await note(page, 'did not exist before the proposal')
    assert.equal(await page.getByLabel('Authoring court').count(), 0)
    await page.getByRole('button', { name: 'Reject', exact: true }).click()
    await page.getByLabel('Moment', { exact: true }).selectOption('receive')
    await page.getByLabel('Import AI proposal').setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: sample })
    await page.getByRole('button', { name: 'Apply proposal' }).click()
    await note(page, 'Proposal applied as one edit')
    assert.match(await placement(page), /X 1.40 m · Z 4.90 m/)
    await page.getByRole('button', { name: 'Undo edit' }).click()
    await note(page, 'Last edit restored')
    assert.equal(await placement(page), original)
    const box = await page.locator('[data-slot=aurora-slot-1] circle').boundingBox()
    const to = await where(page, 1.12, 4.4)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(...to, { steps: 6 })
    await page.mouse.up()
    await note(page, 'Placement updated')
    const moved = await placement(page)
    assert.notEqual(moved, original)
    await save(page)
    await page.reload()
    await page.getByLabel('Moment', { exact: true }).selectOption('receive')
    assert.equal(await placement(page), moved)
    await page.getByRole('button', { name: 'Undo edit' }).click()
    await note(page, 'Last edit restored')
    assert.equal(await placement(page), original)
    await save(page)
    await page.getByText('Make a fill-in copy', { exact: true }).click()
    await page.getByLabel('Variant name').fill('Friday reserve lineup')
    await page.getByRole('button', { name: 'Create fill-in draft' }).click()
    await page.getByRole('heading', { name: 'Friday reserve lineup' }).waitFor()
    assert.equal(await page.getByLabel('Player', { exact: true }).locator('option').first().textContent(), 'Gio')
    await save(page)
  })
  await run('phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, async (page, context) => {
    await page.getByRole('button', { name: 'Open private library' }).click()
    await note(page, 'Private library is empty')
    await page.getByRole('button', { name: 'Open sample' }).click()
    await page.getByLabel('Moment', { exact: true }).selectOption('receive')
    const original = await placement(page)
    await page.getByLabel('Authoring court').scrollIntoViewIfNeeded()
    const [x, y] = await where(page, 1.45, 5.6)
    await page.touchscreen.tap(x, y)
    await note(page, 'Placement updated')
    const moved = await placement(page)
    assert.notEqual(moved, original)
    await save(page)
    const otherDevice = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
    try {
      await otherDevice.request.post(origin + '/__fixture/sign-in')
      const other = await otherDevice.newPage()
      await other.goto(base + '?workspace=plans')
      await other.getByRole('button', { name: 'Open private library' }).click()
      await other.getByLabel('Moment', { exact: true }).selectOption('receive')
      assert.equal(await placement(other), moved)
      await other.getByRole('button', { name: 'Undo edit' }).tap()
      await note(other, 'Last edit restored')
      assert.equal(await placement(other), original)
      await save(other)
      await page.getByRole('button', { name: 'Right', exact: true }).tap()
      await note(page, 'Placement updated')
      const conflictPosition = await placement(page)
      await page.getByRole('button', { name: 'Save library' }).tap()
      await page.getByRole('alert').filter({ hasText: 'Cloud revision conflict' }).waitFor()
      assert.equal(await placement(page), conflictPosition)
      await page.reload()
      await page.getByRole('button', { name: 'Recover cloud edits' }).tap()
      await page.getByLabel('Moment', { exact: true }).selectOption('receive')
      assert.equal(await placement(page), conflictPosition)
      await page.getByRole('button', { name: 'Keep draft and open latest' }).tap()
      await note(page, 'Opened saved cloud library')
      await page.getByLabel('Moment', { exact: true }).selectOption('receive')
      assert.equal(await placement(page), original)
      await page.getByRole('button', { name: 'Recover branch as new draft' }).tap()
      await note(page, 'Recovered a new private draft')
      await page.getByLabel('Moment', { exact: true }).selectOption('receive')
      assert.equal(await placement(page), conflictPosition)
      await save(page)
    } finally { await otherDevice.close() }
    const current = await (await context.request.get(origin + '/api/v1/library')).json()
    assert.equal(current.revision, 3)
  })
  await run('recovery-tabs', { viewport: { width: 1100, height: 850 } }, async (page, context) => {
    const second = await context.newPage()
    try {
      await second.goto(base + '?workspace=plans')
      const pendingIds = [], expectedPositions = []
      for (const [tab, direction] of [[page, 'Left'], [second, 'Right']]) {
        await tab.getByRole('button', { name: 'Open private library' }).click()
        await note(tab, 'Opened saved cloud library')
        await tab.getByRole('button', { name: direction, exact: true }).click()
        await note(tab, 'Placement updated')
        expectedPositions.push(await placement(tab))
        await tab.route(origin + '/api/v1/library', async route => {
          if (route.request().method() !== 'PUT') return route.continue()
          pendingIds.push(route.request().postDataJSON().requestId)
          await route.fulfill({ status: 503, json: { error: 'Fixture temporarily offline' } })
        })
        await tab.getByRole('button', { name: 'Save library' }).click()
        await tab.getByRole('alert').filter({ hasText: 'Private save failed' }).waitFor()
      }
      assert.equal(pendingIds.length, 2)
      assert.notEqual(expectedPositions[0], expectedPositions[1])
      for (const [i, id] of pendingIds.entries()) {
        await page.reload()
        await page.getByLabel('Unsaved cloud branch').selectOption(id)
        await page.getByRole('button', { name: 'Recover cloud edits' }).click()
        await note(page, 'Recovered unsent cloud edits')
        assert.equal(await placement(page), expectedPositions[i])
      }
    } finally { await second.close() }
  })
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ status: 'PASS', testedSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), samples }, null, 2) + '\n')
  console.log('S1 desktop and touch browser journeys passed.')
} finally {
  await browser.close()
}
