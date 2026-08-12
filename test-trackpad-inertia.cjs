// Regression test for a real bug: `realisticScroll` (8 equal steps) doesn't
// resemble actual trackpad input, which arrives as many small wheel events
// with an exponentially decaying delta as momentum scrolling tapers off.
// That decaying tail exposed a bug where the thesis -> editor-stage
// transition relied on the *same* triggering gesture to carry the viewport
// the rest of the way there (via native scroll-snap) instead of driving it
// explicitly — a short/weak real trackpad flick could fire the transition's
// listener (starting the typewriter) without ever actually scrolling the
// viewport there, leaving the reader stuck looking at the thesis section
// while skills typed invisibly underneath.
// Requires a static server already running against this directory, e.g.:
//   python3 -m http.server 8123
// then: node test-trackpad-inertia.js
const { chromium } = require('playwright');

const URL = 'http://localhost:5173/resume/';

async function trackpadScroll(page, initialDelta, decayMs) {
  let delta = initialDelta;
  const start = Date.now();
  while (Date.now() - start < decayMs && delta > 0.5) {
    // eslint-disable-next-line no-await-in-loop
    await page.mouse.wheel(0, delta);
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(16);
    delta *= 0.92;
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const failures = [];

  function check(label, condition) {
    console.log(`${condition ? 'PASS' : 'FAIL'}: ${label}`);
    if (!condition) failures.push(label);
  }

  async function scrollTop() {
    return page.$eval('main', (el) => el.scrollTop);
  }

  await page.goto(URL);
  await page.waitForTimeout(300);

  // A short, weak trackpad flick — decays to nothing well before it would
  // naturally carry the viewport across a full section on momentum alone.
  await trackpadScroll(page, 120, 300);
  await page.waitForTimeout(1000);
  check('hero -> thesis: weak trackpad flick still lands on thesis (900)', (await scrollTop()) === 900);

  await trackpadScroll(page, 120, 300);
  await page.waitForTimeout(2500);
  check(
    'thesis -> stage: weak trackpad flick still explicitly lands on the editor stage (1800), not stuck on thesis',
    (await scrollTop()) === 1800
  );

  const codeText = await page.$eval('[data-code-column]', (el) => el.textContent);
  check('editor stage: skills started typing', codeText.includes('const skills'));

  await browser.close();

  console.log('\n--- SUMMARY ---');
  if (failures.length === 0) {
    console.log('ALL CHECKS PASSED');
    process.exit(0);
  } else {
    console.log(`${failures.length} CHECK(S) FAILED:`);
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
