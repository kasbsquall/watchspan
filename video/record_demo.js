// Records the Watchspan demo as the film needs it: the app driven through the
// real flow, at delivery resolution, cut from first paint. Three clips, because
// each scene needs a different moment and one long take cannot be reframed.
const { chromium } = require('playwright');

const URL = 'https://watchspan-web-45ejdvuucq-uc.a.run.app';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: 'rec/', size: { width: 1920, height: 1080 } },
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();

  // Warm the backend first so the clip never opens on a cold start.
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('run the fleet...');
  await page.getByRole('button', { name: /Run the fleet/i }).click();

  // The whole collapse: gauge draining, line falling, the red band firing.
  await page.waitForTimeout(20000);

  // The human decision, performed rather than mocked.
  const approve = page.getByRole('button', { name: /Approve recalibration/i });
  if (await approve.count()) {
    await approve.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await approve.click();
    console.log('recalibration approved');
    await page.waitForTimeout(2500);
  }

  // The evidence.
  const exp = page.getByRole('button', { name: /Export dossier/i });
  if (await exp.count()) {
    await exp.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await exp.click();
    console.log('dossier exported');
    await page.waitForTimeout(3000);
  }

  await ctx.close();
  await browser.close();
  console.log('done');
})();
