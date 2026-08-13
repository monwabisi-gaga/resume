// Regression test for the "nothing in the DOM to scroll into until the code
// section is genuinely done" requirement: the Products section must not
// exist in the DOM at all (not hidden, not off-screen — absent) until the
// very last character of the result block has been typed, and main's
// scrollHeight must stay capped at exactly 3 sections (2700px) until then.
const { chromium } = require('playwright');

const URL = 'http://localhost:5173/resume/';

async function realisticScroll(page, totalDelta) {
  const steps = 8;
  const perStep = totalDelta / steps;
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, perStep);
    await page.waitForTimeout(16);
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

  async function sectionCount() {
    return page.evaluate(() => document.querySelectorAll('main > section').length);
  }
  async function scrollHeight() {
    return page.$eval('main', (el) => el.scrollHeight);
  }
  async function hasProducts() {
    return page.evaluate(() => Array.from(document.querySelectorAll('h2')).some((h) => h.textContent === 'Projects'));
  }

  await page.goto(URL);
  await page.waitForTimeout(300);

  await realisticScroll(page, 800);
  await page.waitForTimeout(700);
  await realisticScroll(page, 800);
  await page.waitForTimeout(2200); // docblock + skills typing

  check('3 sections while skills is typing', (await sectionCount()) === 3);
  check('scrollHeight capped at 2700 while skills is typing', (await scrollHeight()) === 2700);
  check('Products not in the DOM yet', !(await hasProducts()));

  await realisticScroll(page, 800);
  await page.waitForTimeout(1700); // fold skills + experience typing
  check('3 sections after fold-skills advance', (await sectionCount()) === 3);

  await realisticScroll(page, 800);
  await page.waitForTimeout(1200); // fold experience + calibrate() typing
  check('3 sections after fold-experience advance', (await sectionCount()) === 3);

  await realisticScroll(page, 800);
  await page.waitForTimeout(1000); // mid-result-comment-typing, NOT finished yet
  check('still 3 sections mid-result-typing (not done yet)', (await sectionCount()) === 3);
  check('scrollHeight still capped at 2700 mid-result-typing', (await scrollHeight()) === 2700);
  check('Products still not in the DOM mid-result-typing', !(await hasProducts()));

  await page.waitForTimeout(1500); // let the result comment (900ms) + result itself (1600ms) finish typing
  check('4 sections the instant result finishes typing', (await sectionCount()) === 4);
  // Products is min-h-screen, not h-screen (it grows taller than one
  // viewport to fit its cards + footer character without clipping), so
  // the exact height is viewport-dependent — only the "grew past 3
  // sections" invariant is real.
  check('scrollHeight grows past 2700 the instant result finishes', (await scrollHeight()) > 2700);
  check('Products exists in the DOM now', await hasProducts());

  const scrollTopStillOnStage = await page.$eval('main', (el) => el.scrollTop);
  check('viewport has NOT moved yet — reader must still advance to see it', scrollTopStillOnStage === 1800);

  // Now the reader actually advances past result — this should be the one
  // advance that's a genuine section-to-section transition. Poll instead of
  // a fixed wait: a cold Vite compile on the first request of a fresh test
  // run can add latency a fixed timeout doesn't budget for, which showed up
  // as flakiness here specifically (this file run back-to-back after four
  // others via npm test) even though the underlying behavior is correct.
  await realisticScroll(page, 800);
  let finalScrollTop = await page.$eval('main', (el) => el.scrollTop);
  const deadline = Date.now() + 5000;
  while (finalScrollTop !== 2700 && Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(100);
    // eslint-disable-next-line no-await-in-loop
    finalScrollTop = await page.$eval('main', (el) => el.scrollTop);
  }
  check('advancing past result scrolls to Products (2700)', finalScrollTop === 2700);

  // Pressing Enter must produce the exact same result as scrolling — a
  // scroll gesture's own momentum carries the viewport there natively, but
  // Enter has no momentum of its own, so this transition has to drive the
  // scroll explicitly when triggered by key rather than silently doing
  // nothing. Re-run the whole sequence via keyboard only to confirm.
  await page.goto(URL);
  await page.waitForTimeout(300);

  await realisticScroll(page, 800);
  await page.waitForTimeout(700);
  await realisticScroll(page, 800);
  await page.waitForTimeout(2200);
  await realisticScroll(page, 800);
  await page.waitForTimeout(1700);
  await realisticScroll(page, 800);
  await page.waitForTimeout(1200);
  await realisticScroll(page, 800);
  await page.waitForTimeout(3200); // result comment (900ms) + result itself (1600ms) + margin

  const scrollTopBeforeKey = await page.$eval('main', (el) => el.scrollTop);
  check('resting on stage before pressing Enter (1800)', scrollTopBeforeKey === 1800);

  await page.keyboard.press('Enter');
  let scrollTopAfterKey = await page.$eval('main', (el) => el.scrollTop);
  const keyDeadline = Date.now() + 5000;
  while (scrollTopAfterKey !== 2700 && Date.now() < keyDeadline) {
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(100);
    // eslint-disable-next-line no-await-in-loop
    scrollTopAfterKey = await page.$eval('main', (el) => el.scrollTop);
  }
  check('pressing Enter after result finishes behaves the same as scrolling (2700)', scrollTopAfterKey === 2700);

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
