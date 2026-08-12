// Imperative typewriter/gutter engine, ported from the original vanilla
// script.js almost unchanged — only difference is it's parameterized over
// explicit gutter/codeColumn/cursor elements (passed in) instead of reaching
// out to document.querySelector itself, so React can own mounting them.

export function countChars(lines) {
  let total = 0;
  lines.forEach((line) => line.forEach((token) => {
    total += token.t.length;
  }));
  return Math.max(total, 1);
}

export function createTypewriter({ gutter, codeColumn, cursor, reduceMotion }) {
  let nextLineNumber = 1;

  // The row itself is created upfront so gutter/code-column rows stay in
  // lockstep (needed for height sync), but its number text stays empty
  // until revealGutterNumber() is called — otherwise every line in a batch
  // (e.g. all 38 lines of skills) would show its number instantly, before
  // any of that block's text has even started typing, which reads as a
  // sudden pop rather than the same gradual reveal the text itself gets.
  function renderGutterRow(lineEl) {
    const row = document.createElement('p');
    row.dataset.forLine = lineEl.dataset.line;
    gutter.appendChild(row);
  }

  function revealGutterNumber(lineEl) {
    const row = gutter.querySelector(`[data-for-line="${lineEl.dataset.line}"]`);
    if (row && !row.textContent) row.textContent = lineEl.dataset.line;
  }

  function setGutterRowVisible(lineEl, visible) {
    const row = gutter.querySelector(`[data-for-line="${lineEl.dataset.line}"]`);
    if (row) row.style.display = visible ? '' : 'none';
  }

  function syncGutterRowHeight(lineEl) {
    if (!lineEl.dataset.line) return;
    const row = gutter.querySelector(`[data-for-line="${lineEl.dataset.line}"]`);
    if (row) row.style.height = lineEl.getBoundingClientRect().height + 'px';
  }

  function makeLineEl(hangIndent) {
    const p = document.createElement('p');
    p.style.lineHeight = 'inherit';
    p.style.minHeight = '1lh';
    if (hangIndent) {
      p.style.paddingLeft = `${hangIndent}ch`;
      p.style.textIndent = `-${hangIndent}ch`;
    }
    p.dataset.line = String(nextLineNumber);
    nextLineNumber += 1;
    renderGutterRow(p);
    return p;
  }

  function makeSpacerEl() {
    const p = document.createElement('p');
    p.style.lineHeight = 'inherit';
    p.style.minHeight = '1lh';
    const row = document.createElement('p');
    row.style.lineHeight = 'inherit';
    row.style.minHeight = '1lh';
    gutter.appendChild(row);
    return p;
  }

  function appendToken(lineEl, token) {
    if (!token.t) return null;
    const span = document.createElement('span');
    if (token.c) span.className = token.c;
    lineEl.appendChild(span);
    return span;
  }

  function addSpacer() {
    const blank = makeSpacerEl();
    codeColumn.appendChild(blank);
    blank.appendChild(cursor);
  }

  function typeLines(lines, { durationMs = 1000 } = {}) {
    const totalChars = countChars(lines);

    const plan = [];
    lines.forEach((line, lineIndex) => {
      line.forEach((token, tokenIndex) => {
        for (let i = 0; i < token.t.length; i += 1) {
          plan.push({ lineIndex, tokenIndex, charIndex: i });
        }
      });
    });

    const lineEls = lines.map((line) => makeLineEl(line.hangIndent));
    const tokenSpans = lines.map((line) =>
      line.map((token) => {
        const span = document.createElement('span');
        if (token.c) span.className = token.c;
        return span;
      })
    );

    lineEls.forEach((lineEl) => codeColumn.appendChild(lineEl));

    if (reduceMotion) {
      lines.forEach((line, lineIndex) => {
        line.forEach((token, tokenIndex) => {
          tokenSpans[lineIndex][tokenIndex].textContent = token.t;
          lineEls[lineIndex].appendChild(tokenSpans[lineIndex][tokenIndex]);
        });
      });
      lineEls.forEach((lineEl) => {
        revealGutterNumber(lineEl);
        syncGutterRowHeight(lineEl);
      });
      lineEls[lineEls.length - 1].appendChild(cursor);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const start = performance.now();

      function placeCursorAfter(lineIndex, tokenIndex) {
        const span = tokenSpans[lineIndex][tokenIndex];
        if (span && span.parentNode) span.after(cursor);
        else lineEls[lineIndex].appendChild(cursor);
      }

      let revealed = 0;
      // Lines with zero characters (a blank line inside a batch, e.g. the
      // docblock's trailing spacer or result's between-entry gaps) never
      // appear in `plan`, so the char-reveal loop below would never reach
      // them — tracked separately so their number still reveals in its
      // correct sequential position rather than only at the very end.
      let lineRevealedUpTo = -1;

      function revealLinesUpTo(lineIndex) {
        while (lineRevealedUpTo < lineIndex) {
          lineRevealedUpTo += 1;
          revealGutterNumber(lineEls[lineRevealedUpTo]);
        }
      }

      function tick() {
        const elapsed = performance.now() - start;
        const shouldHaveRevealed = totalChars <= 0 ? plan.length : Math.min(plan.length, Math.floor((elapsed / durationMs) * totalChars));

        while (revealed < shouldHaveRevealed) {
          const step = plan[revealed];
          const span = tokenSpans[step.lineIndex][step.tokenIndex];
          if (!span.parentNode) lineEls[step.lineIndex].appendChild(span);
          span.textContent += lines[step.lineIndex][step.tokenIndex].t[step.charIndex];
          placeCursorAfter(step.lineIndex, step.tokenIndex);
          revealLinesUpTo(step.lineIndex);
          syncGutterRowHeight(lineEls[step.lineIndex]);
          revealed += 1;
        }

        if (revealed >= plan.length) {
          revealLinesUpTo(lineEls.length - 1);
          lineEls.forEach(syncGutterRowHeight);
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      }

      if (plan.length === 0) {
        lineEls[0].appendChild(cursor);
        resolve();
        return;
      }

      requestAnimationFrame(tick);
    });
  }

  function fillLine(lineEl, tokens) {
    lineEl.innerHTML = '';
    tokens.forEach((token) => {
      const span = appendToken(lineEl, token);
      if (span) span.textContent = token.t;
    });
    syncGutterRowHeight(lineEl);
  }

  function sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function foldToSummary(lineEls, summaryLine) {
    if (cursor.parentNode) cursor.remove();
    const [firstLine, ...restLines] = lineEls;

    if (reduceMotion) {
      restLines.forEach((el) => {
        setGutterRowVisible(el, false);
        el.remove();
      });
      fillLine(firstLine, summaryLine);
      return;
    }

    const heights = restLines.map((el) => el.offsetHeight);
    const totalHeight = heights.reduce((a, b) => a + b, 0);

    const wrapper = document.createElement('div');
    wrapper.style.overflow = 'hidden';
    wrapper.style.height = totalHeight + 'px';
    wrapper.style.transition = 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease';
    if (restLines.length > 0) {
      restLines[0].before(wrapper);
      restLines.forEach((el) => wrapper.appendChild(el));
    }

    await sleep(20);
    wrapper.style.height = '0px';
    wrapper.style.opacity = '0';
    await sleep(520);

    restLines.forEach((el) => setGutterRowVisible(el, false));
    wrapper.remove();
    fillLine(firstLine, summaryLine);
  }

  function reset() {
    codeColumn.innerHTML = '';
    gutter.innerHTML = '';
    nextLineNumber = 1;
  }

  return { typeLines, foldToSummary, addSpacer, reset };
}
