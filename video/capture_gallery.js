// Captures the two gallery images that have to be the product itself.
//
// The other seven cards are authored, so their numbers can be read from
// evidence.json and asserted. These two cannot be: their whole job is to show
// that the thing exists and looks like this, which only a real page can do.
//
// Rules carried over from record_run.js, all of them learned by getting them
// wrong first:
//   - wait for the STATE CHANGE, never for a timer
//   - deviceScaleFactor 2, because a 1200x800 shot of a dense instrument loses
//     every hairline rule at 1x and the panels read as flat grey blocks
//   - screenshot the viewport, not fullPage: the gallery slot is 3:2 and a tall
//     page capture arrives letterboxed, which is what the old set did
const { chromium } = require('playwright');

const WEB = process.env.WATCHSPAN_WEB || 'https://watchspan-web-45ejdvuucq-uc.a.run.app';
const OUT = '../deliverables/gallery/new';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
  });

  // ---- the control room, after the seeded run has produced its verdict ----
  await page.goto(WEB, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Run the fleet' }).click();
  // The declaration is the state change worth waiting for. Waiting on the
  // counters instead catches them mid-roll, which is how the previous set
  // shipped a "170" with a digit half-turned.
  //
  // Waiting on the declaration is NOT enough, which the first run of this
  // script proved: the banner lands at 05:06 of simulated time and the stream
  // keeps arriving behind it, so the shot came back reading 93 routed with the
  // 3 half-turned and the button still saying "Running...". The run is over
  // when the button offers to run it again.
  await page.getByRole('button', { name: /Run again/i }).waitFor({ timeout: 180000 });
  await page.waitForTimeout(1200); // let the budget line and counters settle
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/PControlRoom.png` });
  console.log('captured the control room');

  // ---- the reviewer console, with a card served and both sections open ----
  // The console is a section of the same page, not a route. Asking for /review
  // gets a 404, which is what the first version of this script screenshotted.
  const take = page.getByRole('button', { name: /Take the queue/i });
  await take.scrollIntoViewIfNeeded();
  await take.click();
  // The state change: the first card's Approve button existing.
  await page.getByRole('button', { name: /^Approve$/ }).waitFor({ timeout: 60000 });

  // Open both detail sections, so the shot shows a card being read rather than
  // a card being stamped. The card that gets stamped is the film's argument;
  // the gallery image should show the instrument, not the failure.
  for (const label of [/Why Watchspan scored it this way/i, /What the agent said about it/i]) {
    const section = page.getByRole('button', { name: label });
    if (await section.count()) {
      await section.first().click();
      await page.waitForTimeout(400);
    }
  }
  await page.evaluate(() => {
    const approve = [...document.querySelectorAll('button')].find(
      (b) => b.innerText.trim() === 'Approve',
    );
    const card = approve?.closest('article, div[class*="border"]') ?? approve;
    const box = card?.getBoundingClientRect();
    if (box) window.scrollBy(0, box.top + box.height / 2 - innerHeight / 2);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/PConsole.png` });
  console.log('captured the reviewer console');

  await browser.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
