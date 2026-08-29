// Records the reviewer console for scenes 0 and 7: a real person failing at the
// job, measured by the service, with the verdict turning red at the end.
//
// THE RULE THIS FILE OBEYS, inherited from record_demo.js: wait for the STATE
// CHANGE, never for a timer. A clip that ends before the verdict renders asserts
// the opposite of the narration over it.
//
// THE ELEVEN IS SHOT, NOT COMPOSED. `approved_without_reading` counts approvals
// taken in under three seconds with nothing opened. A run that stamps all twelve
// blind produces twelve of twelve. The narration says eleven, so this session
// reads the first card properly: both detail sections opened, and long enough
// that the server's own clock records it. The other eleven are stamped at the
// speed a bored human actually clicks. Whatever the run yields is what the
// narration has to say; this script prints the figure so the script can be
// corrected rather than the take.
//
// The cursor is drawn. Playwright records the page and not the pointer, so a
// clip of real clicks looks like a UI operating itself. Every move and click
// below is a real event that fires real hover and focus states; only the dot
// that shows where it happened is painted in.
const { chromium } = require('playwright');

const URL = process.env.WATCHSPAN_WEB || 'https://watchspan-web-45ejdvuucq-uc.a.run.app';
const OUT = 'rec/desk';

const CURSOR = `
  const dot = document.createElement('div');
  dot.id = '__cursor';
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

async function centreDesk(page) {
  await page.evaluate(() => {
    const desk = [...document.querySelectorAll('section')]
      .filter((s) => s.innerText.includes('REVIEW THESE YOURSELF'))
      .pop();
    desk?.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}

async function glideTo(page, locator, steps = 22) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box for target');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  return box;
}

(async () => {
  const browser = await chromium.launch();
  // The viewport has to match the recording size. Playwright's screencast
  // captures CSS pixels and pads to `size` rather than scaling, so a smaller
  // viewport put the page in the top-left corner of a 1920 frame with grey
  // around it. Framing is done with page zoom instead, applied after load and
  // verified, because the console occupies a third of a 1920 frame at native
  // size and the rest of the page sits in its empty state.
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  await page.addInitScript(CURSOR);

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const ZOOM = 1.55;
  const applied = await page.evaluate((z) => {
    document.documentElement.style.zoom = String(z);
    return getComputedStyle(document.documentElement).zoom;
  }, ZOOM);
  if (String(parseFloat(applied)) !== String(ZOOM)) {
    throw new Error(`page zoom did not apply: got ${applied}`);
  }
  console.log('zoom applied:', applied);
  await page.waitForTimeout(600);

  const take = page.getByRole('button', { name: /Take the queue/i });
  await glideTo(page, take);
  await page.waitForTimeout(350);
  await take.click();

  // The state change, not a timer: the first card's Approve button existing.
  const approve = page.getByRole('button', { name: /^Approve$/ });
  await approve.waitFor({ timeout: 30000 });
  await centreDesk(page);
  await page.waitForTimeout(500);
  console.log('queue served');

  // Card one, read properly. Both sections opened so the server records depth 2,
  // and a dwell long enough that its own clock reads well over three seconds.
  for (const label of [/Why Watchspan scored it this way/i, /What the agent said about it/i]) {
    const section = page.getByRole('button', { name: label });
    await glideTo(page, section, 16);
    await page.waitForTimeout(300);
    await section.click();
    await page.waitForTimeout(2600);
  }
  await glideTo(page, approve, 18);
  await page.waitForTimeout(600);
  await approve.click();
  await page.getByText(/LAST DECISION/i).waitFor({ timeout: 20000 });
  console.log('card 1 reviewed');

  // The other eleven, at the speed a bored person clicks. Each one waits for the
  // next card rather than for a delay, so the clip cannot outrun the service.
  for (let i = 2; i <= 12; i += 1) {
    const button = page.getByRole('button', { name: /^Approve$/ });
    if (!(await button.count())) break;
    await glideTo(page, button, 6);
    await page.waitForTimeout(120);
    await button.click();
    await page.waitForFunction(
      (n) => !document.body.innerText.includes(`${n} of 12`),
      i,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(260);
  }

  // The verdict itself. This is the frame the film is being shot for.
  // .first() because three elements carry the phrase: the verdict itself, the
  // sentence explaining it, and the Article 14 panel further down. The one the
  // film needs is the readout.
  const verdict = page.getByText('oversight degraded', { exact: true }).first();
  await verdict.waitFor({ timeout: 30000 });
  await centreDesk(page);
  console.log('VERDICT ON SCREEN');
  await page.waitForTimeout(3200);

  // What the run actually produced, so the narration can be corrected to it.
  const summary = await page.evaluate(() => {
    const desk = [...document.querySelectorAll('section')]
      .filter((s) => s.innerText.includes('REVIEW THESE YOURSELF'))
      .pop();
    return desk ? desk.innerText.replace(/\n+/g, ' | ') : '(desk not found)';
  });
  console.log('RESULT:', summary);

  await ctx.close();
  await browser.close();
  console.log('written to', OUT);
})();
