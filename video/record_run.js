// Records the seeded run for scenes 1 and 2: the routing split arriving, the
// attention gauge draining, and the drift declaration landing at 05:06.
//
// Same rules as record_desk.js, learned the hard way on that take:
//   - wait for the STATE CHANGE, never for a timer
//   - apply the page zoom after the DOM exists and VERIFY it, because an init
//     script does not survive the document parse and fails silently
//   - print where a clean cut begins, so the clip never opens on a page load
//   - the cursor is drawn; the clicks underneath it are real
//
// Framed wider than the desk take. Scene 1 needs the four counters and scene 2
// needs the gauge and the timeline, and they live in opposite columns, so this
// holds the whole instrument rather than pushing in on one panel. The film
// pushes in afterwards, on a plane that was captured flat and stable.
const { chromium } = require('playwright');

const URL = process.env.WATCHSPAN_WEB || 'https://watchspan-web-45ejdvuucq-uc.a.run.app';
const OUT = 'rec/run';
const ZOOM = 1.2;

const CURSOR = `
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position: 'fixed', top: '0', left: '0', width: '18px', height: '18px',
    marginLeft: '-9px', marginTop: '-9px', borderRadius: '50%',
    background: 'rgba(237,153,14,0.22)', border: '1.5px solid rgba(237,153,14,0.85)',
    boxShadow: '0 0 14px rgba(237,153,14,0.35)', pointerEvents: 'none',
    zIndex: '2147483647', transition: 'transform 90ms linear',
  });
  document.body.appendChild(dot);
  addEventListener('mousemove', (e) => {
    dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
  }, true);
  addEventListener('mousedown', () => { dot.style.background = 'rgba(237,153,14,0.6)'; }, true);
  addEventListener('mouseup', () => { dot.style.background = 'rgba(237,153,14,0.22)'; }, true);
`;

async function frameInstrument(page) {
  await page.evaluate(() => {
    document.querySelector('header')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollBy(0, 120);
  });
}

async function glideTo(page, locator, steps = 20) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box for target');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  const startedAt = Date.now();
  await page.addInitScript(CURSOR);

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const applied = await page.evaluate((z) => {
    document.documentElement.style.zoom = String(z);
    return getComputedStyle(document.documentElement).zoom;
  }, ZOOM);
  if (String(parseFloat(applied)) !== String(ZOOM)) {
    throw new Error(`page zoom did not apply: got ${applied}`);
  }
  console.log('zoom applied:', applied);
  await page.waitForLoadState('networkidle');

  await frameInstrument(page);
  await page.waitForTimeout(1400);
  const cutFrom = (Date.now() - startedAt) / 1000;

  const run = page.getByRole('button', { name: /Run the fleet/i });
  await glideTo(page, run);
  await page.waitForTimeout(400);
  await run.click();

  // The declaration itself, not a delay. A clip that ends before this renders
  // asserts the opposite of the narration over it.
  await page.getByText(/Oversight stopped being effective/i).waitFor({ timeout: 90000 });
  console.log('drift declared on screen');

  // Let the rest of the run play out, then hold on the finished instrument.
  await page.getByRole('button', { name: /Run again/i }).waitFor({ timeout: 90000 });
  console.log('run complete');
  await page.waitForTimeout(2600);

  const readout = await page.evaluate(() => {
    const grab = (label) => {
      const dt = [...document.querySelectorAll('dt')].find((d) =>
        d.textContent.trim().toLowerCase() === label,
      );
      return dt?.nextElementSibling?.textContent.trim() ?? '?';
    };
    const banner = document.body.innerText.match(/Oversight stopped being effective\s*([\d:]+)/);
    return {
      routed: grab('routed'),
      escalated: grab('escalated'),
      auto: grab('auto-run'),
      paused: grab('paused'),
      driftAt: banner ? banner[1] : '?',
    };
  });
  console.log('READOUT', JSON.stringify(readout));

  await ctx.close();
  await browser.close();
  console.log('CUT_FROM', cutFrom.toFixed(2));
  console.log('written to', OUT);
})();
