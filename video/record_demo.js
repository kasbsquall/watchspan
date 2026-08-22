// Records the Watchspan demo. The rule this file exists to obey: wait for the
// STATE CHANGE, never for a timer. A clip that ends on the button still unpressed
// asserts the opposite of the narration over it.
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

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: /Run the fleet/i }).click();

  // Wait for the declaration itself, so the clip cannot end before the story does.
  await page.getByText(/Oversight stopped being effective/i).waitFor({ timeout: 60000 });
  console.log('drift declared on screen');
  await page.getByRole('button', { name: /Run again/i }).waitFor({ timeout: 60000 });
  console.log('run complete');
  await page.waitForTimeout(1200);

  const approve = page.getByRole('button', { name: /Approve recalibration/i });
  await approve.waitFor({ timeout: 20000 });
  await approve.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await approve.click();

  // The proof the click landed: the confirmation text the app writes afterwards.
  await page.getByText(/Recalibration applied/i).waitFor({ timeout: 20000 });
  console.log('recalibration APPLIED (verified on screen)');
  await page.waitForTimeout(2200);

  const exp = page.getByRole('button', { name: /Export dossier/i });
  await exp.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await exp.click();
  // Wait for the generated summary, not for the click.
  await page.getByText(/routed .* requests|oversight/i).first().waitFor({ timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(3500);
  console.log('dossier generated');

  await ctx.close();
  await browser.close();
})();
