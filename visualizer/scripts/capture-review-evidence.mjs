import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const output = path.resolve('review-evidence');
const base = process.env.REVIEW_URL || 'http://127.0.0.1:4173/RotationStudio/';
const testedSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(testedSha) || (process.env.REVIEW_COMMIT && process.env.REVIEW_COMMIT !== testedSha)) {
  throw new Error('Checked-out commit does not match the requested candidate.');
}
await fs.mkdir(output, { recursive: true });
const report = {
  schema: 2, tested_sha: testedSha, url: base, status: 'RUNNING',
  evidence_type: 'SCRIPTED_CHROMIUM_SOFTWARE_WEBGL_SMOKE',
  visual_review: 'PENDING', hardware_performance_verified: false, touch_or_pen_verified: false,
  viewports: [], errors: [],
};

// Observe contexts and draw calls the app actually creates. Do not create a test
// context that could falsely pass while the real court has failed to render.
function observeWebGL() {
  window.__reviewWebGL = [];
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const gl = getContext.call(this, type, ...args);
    if (gl && /^(webgl2?|experimental-webgl)$/.test(type) && !window.__reviewWebGL.some(item => item.gl === gl)) {
      const item = { canvas: this, gl, type, drawCalls: 0 };
      window.__reviewWebGL.push(item);
      for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        if (typeof gl[method] !== 'function') continue;
        const draw = gl[method];
        gl[method] = function (...values) { item.drawCalls += 1; return draw.apply(this, values); };
      }
    }
    return gl;
  };
}

async function renderingEvidence(page) {
  await page.waitForFunction(() => window.__reviewWebGL.some(item =>
    item.canvas.isConnected && item.drawCalls > 0 && !item.gl.isContextLost()), null, { timeout: 20000 });
  return page.evaluate(() => window.__reviewWebGL.filter(item => item.canvas.isConnected).map(item => {
    const gl = item.gl, debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      context: item.type, renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
      vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
      width: gl.drawingBufferWidth, height: gl.drawingBufferHeight,
      draw_calls: item.drawCalls, context_lost: gl.isContextLost(),
    };
  }));
}

let browser;
try {
  browser = await chromium.launch({ headless: true, args: [
    '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage',
  ] });
  const cases = [
    { name: 'studio-1440', width: 1440, height: 900, workspace: 'studio' },
    { name: 'court-portrait-390', width: 390, height: 844, workspace: 'court' },
    { name: 'court-landscape-844', width: 844, height: 390, workspace: 'court' },
    { name: 'court-tablet-1024', width: 1024, height: 768, workspace: 'court' },
  ];
  for (const size of cases) {
    const errorCountBefore = report.errors.length;
    const result = { ...size, status: 'RUNNING', actions: [], screenshots: [] };
    report.viewports.push(result);
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1,
      hasTouch: size.workspace === 'court',
    });
    await context.addInitScript(observeWebGL);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => report.errors.push(`${size.name}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(`${size.name}: console: ${message.text()}`);
    });
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) {
        report.errors.push(`${size.name}: HTTP ${response.status()} ${response.url()}`);
      }
    });
    const save = async name => {
      const renderers = await renderingEvidence(page);
      if (!renderers.some(item => item.draw_calls > 0 && item.width > 0 && item.height > 0 && !item.context_lost &&
        !/disabled|unavailable/i.test(String(item.renderer)))) throw new Error('No active app WebGL renderer.');
      await page.evaluate(() => document.fonts.ready);
      const filename = `${size.name}-${name}.png`;
      const bytes = await page.screenshot({ path: path.join(output, filename), animations: 'disabled' });
      result.screenshots.push({ file: filename, bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'), renderers });
    };
    try {
      const url = new URL(base);
      url.searchParams.set('workspace', size.workspace);
      await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 35000 });
      if (size.workspace === 'studio') {
        await page.getByRole('main', { name: 'Rotation studio', exact: true }).waitFor();
        await save('01-view');
        const modes = page.getByRole('navigation', { name: 'Strategy mode', exact: true });
        await modes.getByRole('button', { name: 'Strategies', exact: true }).click();
        await page.getByRole('region', { name: 'Strategy library', exact: true }).waitFor();
        await save('02-strategies');
        await modes.getByRole('button', { name: 'Edit strategy', exact: true }).click();
        await page.locator('main.strategy-editing .desktop-athlete-editor').waitFor();
        await save('03-editor');
        await modes.getByRole('button', { name: 'View', exact: true }).click();
        const setsTab = page.getByRole('navigation', { name: 'Studio mode', exact: true })
          .getByRole('button', { name: 'Set arcs', exact: true });
        await setsTab.click();
        await page.waitForFunction(() => document.querySelector('[aria-label="Studio mode"] button[aria-pressed="true"]')?.textContent === 'Set arcs');
        await page.getByRole('main', { name: 'Rotation studio', exact: true }).waitFor({ state: 'detached' });
        await page.getByRole('button', { name: 'More controls', exact: true }).waitFor();
        const skip = page.getByRole('button', { name: 'Skip', exact: true });
        await skip.waitFor();
        await skip.click();
        await skip.waitFor({ state: 'hidden' });
        await save('04-set-arcs');
        result.actions.push('Studio View', 'Strategy library', 'Stage-first editor', 'Original Set arcs');
      } else {
        await page.getByRole('main', { name: 'Court Mode', exact: true }).waitFor();
        await save('01-court');
        if (size.name === 'court-portrait-390') {
          await page.getByRole('button', { name: /^Open strategy chooser:/ }).click();
          const chooser = page.getByRole('combobox', { name: 'Choose actual strategy', exact: true });
          await chooser.waitFor();
          await save('02-strategy-chooser');
          await chooser.selectOption('pryyse-team-tactics-2026-v1');
          await page.getByRole('button', { name: /^Open strategy chooser: PRYYSE Team/ }).waitFor();
          await page.getByRole('group', { name: 'Choose rotation', exact: true })
            .getByRole('button', { name: 'R3', exact: true }).click();
          await page.getByRole('group', { name: 'Serving team', exact: true })
            .getByRole('button', { name: 'They serve', exact: true }).click();
          await page.getByRole('button', { name: 'Close panel', exact: true }).click();
          await page.getByRole('button', { name: 'Next phase', exact: true }).click();
          await page.waitForFunction(() => parseFloat(document.querySelector('[aria-label="Rally time"]')?.textContent || '0') > 0);
          await page.getByRole('button', { name: 'Play rally', exact: true }).waitFor();
          await save('03-r3-proposal-next-phase');
          result.actions.push('Open strategy chooser', 'Load actual R1 + R3 proposal', 'R3 their serve', 'Seek next phase while paused');
        }
        result.actions.push('Court Mode rendering at supplied viewport');
      }
      result.status = report.errors.length === errorCountBefore ? 'PASS' : 'FAIL';
    } catch (error) {
      result.status = 'FAIL';
      result.error = String(error.stack || error);
      report.errors.push(`${size.name}: ${error.message || error}`);
      await page.screenshot({ path: path.join(output, `${size.name}-failure.png`) }).catch(() => {});
    } finally {
      await context.close();
    }
  }
} catch (error) {
  report.errors.push(String(error.stack || error));
} finally {
  await browser?.close();
  report.status = report.errors.length ? 'FAIL' : 'PASS';
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.status}: ${report.viewports.reduce((count, item) => count + item.screenshots.length, 0)} screenshots for ${testedSha}`);
console.log('Software WebGL smoke only. Independent visual review and real-device interaction checks remain separate.');
if (report.status !== 'PASS') process.exitCode = 1;
