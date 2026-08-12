// Regression test for the scroll-snap / typewriter advance logic in script.js.
// Requires a static server already running against this directory, e.g.:
//   python3 -m http.server 8123
// then: npm test
const { chromium } = require('playwright');

const URL = 'http://localhost:5173/resume/';

function codeText(page) {
  return page.$eval('[data-code-column]', (el) => el.textContent.trim());
}

function lineCount(page) {
  return page.$$eval('[data-code-column] > *', (els) => els.length);
}

function visibleGutterNumbers(page) {
  // Blank-spacer rows are legitimate empty gutter cells (kept only so the
  // gutter and code column stay row-for-row aligned) — filter them out
  // rather than counting them as a numbered line.
  return page.$$eval('[data-line-gutter] > *', (els) =>
    els
      .filter((el) => el.style.display !== 'none' && el.textContent.trim() !== '')
      .map((el) => Number(el.textContent))
  );
}

// A single large mouse.wheel() call doesn't reliably drive CSS scroll-snap in
// Chromium (it can get absorbed mid an already-animating smooth-scroll) —
// real trackpad/wheel input arrives as many small events over time, so
// replicate that instead of one big synthetic jump.
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
    if (condition) {
      console.log(`PASS: ${label}`);
    } else {
      console.log(`FAIL: ${label}`);
      failures.push(label);
    }
  }

  async function scrollTop() {
    return page.$eval('main', (el) => el.scrollTop);
  }

  await page.goto(URL);
  await page.waitForTimeout(300);

  // Step 1: scroll hero -> thesis
  await realisticScroll(page, 800);
  await page.waitForTimeout(700);
  check('hero -> thesis: scrollTop advanced one section (900)', (await scrollTop()) === 900);

  // Step 2: scroll thesis -> code, let docblock+skills type out fully
  await realisticScroll(page, 800);
  await page.waitForTimeout(700);
  check('thesis -> code: scrollTop advanced one section (1800)', (await scrollTop()) === 1800);

  await page.waitForTimeout(2200); // docblock (1s) + skills (1s) + margin

  const textAfterTyping = await codeText(page);
  const linesAfterTyping = await lineCount(page);
  check('code section: skills finished typing (contains data-engineering)', textAfterTyping.includes('data-engineering'));
  console.log(`  -> line count after initial typing: ${linesAfterTyping}`);

  // Step 3: scroll back up to thesis (should do nothing to code content)
  await realisticScroll(page, -800);
  await page.waitForTimeout(700);
  check('back to thesis: scrollTop is 900', (await scrollTop()) === 900);

  const textAtThesis = await codeText(page);
  check('scrolled back to thesis: code content unchanged', textAtThesis === textAfterTyping);

  // Step 4: scroll back down into code (arrival alone should NOT advance/fold)
  await realisticScroll(page, 800);
  await page.waitForTimeout(150); // well within the 500ms settle delay, but
  // the CSS smooth-scroll snap itself may still be animating toward 1800
  check('back to code: scrollTop near 1800 (snap animation may still be settling)', (await scrollTop()) >= 1700);

  const textRightAfterReturn = await codeText(page);
  check(
    'arriving back at code (within settle delay): content unchanged, not folded/advanced',
    textRightAfterReturn === textAfterTyping
  );

  // give the settle delay time to fully elapse, then confirm STILL unchanged
  // (arrival itself must never advance, regardless of how long we wait)
  await page.waitForTimeout(600);
  const textAfterSettleWait = await codeText(page);
  check(
    'after settle delay elapses with no further gesture: content still unchanged',
    textAfterSettleWait === textAfterTyping
  );

  // Step 5: NOW perform a genuine in-place scroll while resting on the code section
  // Find the actual line number for "const skills = {" directly, rather than
  // assuming a fixed line count for the block — that count changes as the
  // skills content grows/shrinks.
  const skillsFirstLine = await page.evaluate(() => {
    const lines = Array.from(document.querySelector('[data-code-column]').children);
    const idx = lines.findIndex((el) => el.textContent.trim().startsWith('const skills ='));
    return Number(lines[idx].dataset.line);
  });

  await realisticScroll(page, 800);
  await page.waitForTimeout(1200); // fold animation (~1s)
  const textAfterFold = await codeText(page);
  check(
    'in-place scroll while resting on code: skills folded to summary',
    textAfterFold.includes('…') && !textAfterFold.includes('data-engineering')
  );

  await page.waitForTimeout(1600); // experience typing duration
  const textAfterExperience = await codeText(page);
  check(
    'experience typed in after fold',
    textAfterExperience.includes('CASI') && textAfterExperience.includes('BlazeGard')
  );

  // Real editor fold semantics: the folded summary keeps its block's own
  // first line number (folding doesn't move the statement), and the gutter
  // jumps straight to the next real line after it — it never renumbers the
  // lines the fold swallowed.
  const gutterAfterFold = await visibleGutterNumbers(page);
  check(
    `folded "const skills" summary keeps its original line number (${skillsFirstLine})`,
    gutterAfterFold.includes(skillsFirstLine)
  );
  const foldIndex = gutterAfterFold.indexOf(skillsFirstLine);
  const nextVisibleNumber = gutterAfterFold[foldIndex + 1];
  check(
    `line after the fold does not renumber to ${skillsFirstLine + 1} (it's the real next source line, ${nextVisibleNumber})`,
    nextVisibleNumber > skillsFirstLine + 1
  );
  check(
    'gutter numbers strictly increase with no duplicates (no renumbering happened anywhere)',
    gutterAfterFold.every((n, i) => i === 0 || n > gutterAfterFold[i - 1])
  );

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
  console.error('Test script error:', err);
  process.exit(1);
});
