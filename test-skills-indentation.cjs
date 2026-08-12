// Regression test for the skills array formatting in script.js — Prettier-
// style wrapping (key + "[" on its own line, items grouped a few per line,
// deeper-indented than the closing "]"). Requires a static server already
// running against this directory, e.g.:
//   python3 -m http.server 8123
// then: node test-skills-indentation.js
const { chromium } = require('playwright');

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
  let failed = false;

  function check(label, condition) {
    console.log(`${condition ? 'PASS' : 'FAIL'}: ${label}`);
    if (!condition) failed = true;
  }

  await page.goto('http://localhost:5173/resume/');
  await page.waitForTimeout(300);
  await realisticScroll(page, 800);
  await page.waitForTimeout(700);
  await realisticScroll(page, 800);
  await page.waitForTimeout(2600);

  const lines = await page.$eval('[data-code-column]', (el) => Array.from(el.children).map((c) => c.textContent));

  // Structural checks: every bucket's key line, item lines, and closing
  // bracket line should have the exact expected leading whitespace.
  let bucketOpenIdx = null;
  let itemLineIndents = [];
  let closeIdx = null;

  lines.forEach((line, i) => {
    const leadingSpaces = line.match(/^ */)[0].length;
    if (/^\s*"[a-z-]+":\s*\[$/.test(line)) {
      bucketOpenIdx = i;
      check(`bucket key line "${line.trim()}" indented 2 spaces`, leadingSpaces === 2);
    } else if (/^\s*"[^"]+".*[,"]$/.test(line) && bucketOpenIdx !== null && closeIdx === null) {
      itemLineIndents.push(leadingSpaces);
    } else if (/^\s*\],?$/.test(line)) {
      closeIdx = i;
      check(`closing bracket line "${line.trim()}" indented 2 spaces`, leadingSpaces === 2);
      // reset for next bucket
      bucketOpenIdx = null;
      closeIdx = null;
    }
  });

  check('all item lines found', itemLineIndents.length > 0);
  check('every item line indented exactly 6 spaces (2 more than the 4-space baseline)', itemLineIndents.every((n) => n === 6));
  check('item-line indent (6) is deeper than bracket-line indent (2) by more than the old 4-space baseline', itemLineIndents.every((n) => n > 4));

  console.log(`\nSample item-line indents found: ${JSON.stringify([...new Set(itemLineIndents)])}`);
  console.log(`Total item lines checked: ${itemLineIndents.length}`);

  // Pixel-level check: item lines' text glyphs should start visually to the
  // right of the closing bracket line's text glyphs. Measure the first
  // <span>'s own rect, not the parent <p>'s box (the <p> starts at the same
  // left margin regardless of how much leading whitespace its text has).
  const rects = await page.$eval('[data-code-column]', (el) => {
    const kids = Array.from(el.children);
    const bracketLine = kids.find((c) => /^\s*"back-end":\s*\[$/.test(c.textContent));
    const firstItemLine = bracketLine ? bracketLine.nextElementSibling : null;
    const closeLine = kids.find((c) => c.textContent.trim() === '],' && kids.indexOf(c) > kids.indexOf(bracketLine));

    function firstGlyphLeft(lineEl) {
      if (!lineEl) return null;
      // Walk the line's text to find where the first non-space character
      // actually renders, regardless of which span it's in.
      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const idx = node.textContent.search(/\S/);
        if (idx !== -1) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + 1);
          return range.getBoundingClientRect().left;
        }
        node = walker.nextNode();
      }
      return null;
    }

    return {
      bracketLeft: firstGlyphLeft(bracketLine),
      firstItemText: firstItemLine ? firstItemLine.textContent : null,
      firstItemLeft: firstGlyphLeft(firstItemLine),
      closeLeft: firstGlyphLeft(closeLine),
    };
  });
  console.log('\nPixel measurements:', rects);
  check(
    'first item line starts visually to the right of the closing bracket line',
    rects.firstItemLeft !== null && rects.closeLeft !== null && rects.firstItemLeft > rects.closeLeft
  );

  await browser.close();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
