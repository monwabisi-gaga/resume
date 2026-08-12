// Shared "advance" gesture (Return key or scroll/swipe) + stage-settle
// tracking, ported unchanged from the vanilla script.js. Kept as plain
// functions operating on passed-in elements rather than reaching for
// document.querySelector, so React owns the elements' lifecycle.

// Scroll/wheel listeners get a short grace period before they arm: the same
// gesture that scrolled the previous section into view often keeps firing
// wheel events (trackpad inertia) after the snap has settled, which would
// otherwise instantly "advance" past whatever just arrived. Return has no
// such residue, so it stays live immediately.
export const SCROLL_ARM_DELAY = 500;

// A single scroll/swipe gesture fires many wheel/touchmove events. When an
// advance is meant to keep the reader on the *same* section (folding
// skills, typing the next block in place — never a transition to a
// different section), preventDefault() on the one triggering event isn't
// enough: the rest of the same gesture would otherwise reach the browser's
// native scroll-snap unopposed and carry the viewport into whatever comes
// next before the in-place reaction has had a chance to run. This is why
// the stage must stay the last scrollable section: a section added after
// it would give a swallowed gesture's residual momentum somewhere to carry
// the viewport to before the in-place reaction runs. The next section is
// only mounted into the DOM once the code section is genuinely done
// (result finished typing) — see App.jsx — so there's nothing to scroll
// into while any of this is live.
//
// Section-to-section transitions (thesis -> stage) are driven explicitly
// (scrollIntoView) rather than by trusting the triggering gesture to carry
// the viewport the rest of the way there — a real trackpad gesture can be
// too short/weak to cross a full section on its own, especially once
// partly consumed by the arm-delay window. They also swallow the rest of
// their gesture, so the native scroll-snap doesn't fight the explicit
// scroll.
//
// The listener that does this swallowing is only attached for the window
// it's actually needed, then removed — a permanent always-on capture-phase
// wheel listener (even a no-op one, condition false) was observed to change
// how the browser processes wheel events well outside that window, which
// broke unrelated section-to-section scrolling elsewhere on the page.
const GESTURE_SWALLOW_MS = 600;

function swallowRestOfGesture() {
  function onWheel(e) {
    e.preventDefault();
  }
  document.addEventListener('wheel', onWheel, { passive: false, capture: true });
  setTimeout(() => {
    document.removeEventListener('wheel', onWheel, { capture: true });
  }, GESTURE_SWALLOW_MS);
}

export function onNextAdvance(callback, { scrollDelay = SCROLL_ARM_DELAY, keepInPlace = false } = {}) {
  let done = false;
  let scrollArmed = scrollDelay <= 0;

  function fire(source) {
    if (done) return;
    done = true;
    cleanup();
    if (source === 'scroll' && keepInPlace) swallowRestOfGesture();
    callback(source);
  }

  function onKeydown(e) {
    if (e.key !== 'Enter' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    fire('key');
  }

  // Only a forward gesture (scroll/swipe down) counts as "advance" — a
  // backward gesture means the reader is navigating back toward the
  // previous section, never a request to progress the sequence.
  function onWheel(e) {
    if (!scrollArmed) return;
    if (e.deltaY < 4) return;
    e.preventDefault();
    fire('scroll');
  }

  let touchStartY = null;
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (!scrollArmed || touchStartY === null) return;
    const delta = touchStartY - e.touches[0].clientY;
    if (delta < 24) return;
    fire('scroll');
  }

  function cleanup() {
    clearTimeout(armTimer);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('wheel', onWheel);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
  }

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true });

  const armTimer = scrollArmed
    ? null
    : setTimeout(() => {
        scrollArmed = true;
      }, scrollDelay);

  return cleanup;
}

// Tracks whether the reader is genuinely resting on `stage` (not just
// arriving at or leaving it). "Advancing" (the Return/scroll gesture that
// folds skills or moves past the finished experience list) must wait for
// this to be true: arriving at or leaving the stage is never itself an
// advance, only an in-place scroll/Return while already resting there is.
export function createStageSettleTracker({ main, stage }) {
  let stageSettled = false;
  let settleTimer = null;
  const settleChangeListeners = new Set();

  function setStageSettled(value) {
    if (stageSettled === value) return;
    stageSettled = value;
    settleChangeListeners.forEach((listener) => listener(value));
  }

  function onSettleChange(listener) {
    settleChangeListeners.add(listener);
    return () => settleChangeListeners.delete(listener);
  }

  function whenStageSettled() {
    if (stageSettled) return Promise.resolve();
    return new Promise((resolve) => {
      const unsub = onSettleChange((value) => {
        if (value) {
          unsub();
          resolve();
        }
      });
    });
  }

  const STAGE_SETTLE_TOLERANCE_PX = 4;

  function isAtStageRest() {
    return Math.abs(main.scrollTop - stage.offsetTop) <= STAGE_SETTLE_TOLERANCE_PX;
  }

  const stageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      clearTimeout(settleTimer);
      if (entry.isIntersecting) {
        settleTimer = setTimeout(() => setStageSettled(true), SCROLL_ARM_DELAY);
      } else if (!isAtStageRest()) {
        setStageSettled(false);
      }
    });
  }, { threshold: 0.9 });

  stageObserver.observe(stage);

  function destroy() {
    stageObserver.disconnect();
    clearTimeout(settleTimer);
  }

  async function waitForAdvance({ keepInPlace = true } = {}) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      await whenStageSettled();

      // eslint-disable-next-line no-loop-func, no-await-in-loop
      const source = await new Promise((resolve) => {
        const cleanupAdvance = onNextAdvance((advanceSource) => {
          unsubSettle();
          resolve(advanceSource);
        }, { scrollDelay: 0, keepInPlace });

        const unsubSettle = onSettleChange((value) => {
          if (!value) {
            cleanupAdvance();
            unsubSettle();
            resolve(null);
          }
        });
      });

      if (source) return source;
    }
  }

  return { waitForAdvance, destroy };
}
