// Regression test for gutter/code-line alignment through the full sequence,
// including the result block's long sentences that wrap onto multiple visual
// rows. A wrapped line is still one real source line (its gutter number
// appears once, sized tall enough to cover every wrapped row beneath it) —
// this only holds if the gutter row's height is synced to the actual
// rendered height of its line, in subpixel-accurate units (integer rounding
// via offsetHeight compounds into several pixels of drift by the bottom of
// a long block). Requires a static server already running against this
// directory, e.g.:
//   python3 -m http.server 8123
// then: node test-result-alignment.js
const { chromium } = require('playwright');

const URL = 'http://localhost:5173/resume/';

async function realisticScroll(page, totalDelta) {
  const steps = 8;
  const perStep = totalDelta / steps;
  for (let i = 0; i < steps; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await page.mouse.wheel(0, perStep);
    // eslint-disable-next-line no-await-in-loop
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

  await page.goto(URL);
  await page.waitForTimeout(300);

  // Drive all the way through: hero -> thesis -> code -> fold skills ->
  // experience -> fold experience -> calibrate() -> result.
  await realisticScroll(page, 800);
  await page.waitForTimeout(700);
  await realisticScroll(page, 800);
  await page.waitForTimeout(2200); // docblock + skills typing
  await realisticScroll(page, 800);
  await page.waitForTimeout(1700); // fold skills + experience typing
  await realisticScroll(page, 800);
  await page.waitForTimeout(1200); // fold experience + calibrate() typing
  await realisticScroll(page, 800);
  await page.waitForTimeout(3200); // result comment (900ms) + result itself (1600ms) + margin

  const text = await page.$eval('[data-code-column]', (el) => el.textContent);
  check('sequence reached the result block', text.includes('adaptability') && text.includes('durability'));
  const resultBlockText = text.slice(text.indexOf('adaptability'));
  check('result block has no em dashes (—) per the final approved copy', !resultBlockText.includes('—'));

  // The comment directly above `const result` is prose the reader actually
  // sees, same standing "no em dashes" rule as the result values themselves
  // — only date-range spans like "2024 — present" are allowed to keep one.
  const resultCommentText = text.slice(text.indexOf('/**', text.indexOf('calibrate(')), text.indexOf('const result ='));
  check('comment above result has no em dashes', !resultCommentText.includes('—'));

  const gutterRects = await page.$eval('[data-line-gutter]', (el) =>
    Array.from(el.children)
      .filter((c) => c.style.display !== 'none')
      .map((c) => ({ text: c.textContent, top: c.getBoundingClientRect().top }))
  );
  const lineRects = await page.$eval('[data-code-column]', (el) =>
    Array.from(el.children).map((c) => ({ text: c.textContent.slice(0, 30), top: c.getBoundingClientRect().top }))
  );

  check('gutter row count matches code line count', gutterRects.length === lineRects.length);

  let maxDiff = 0;
  const misaligned = [];
  for (let i = 0; i < Math.min(gutterRects.length, lineRects.length); i += 1) {
    const diff = Math.abs(gutterRects[i].top - lineRects[i].top);
    maxDiff = Math.max(maxDiff, diff);
    if (diff >= 0.5) misaligned.push(`row ${i} ("${lineRects[i].text}"): diff=${diff.toFixed(2)}px`);
  }
  check(`every gutter row aligns with its code line (max diff ${maxDiff.toFixed(2)}px, threshold 0.5px)`, misaligned.length === 0);
  if (misaligned.length > 0) misaligned.forEach((m) => console.log(`  ${m}`));

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
