import { forwardRef, useEffect, useRef } from 'react';
import { createTypewriter } from './typewriterEngine';
import { createStageSettleTracker } from './advance';
import AdvanceCue from './AdvanceCue';
import {
  COMMENT_LINES,
  SKILLS_LINES,
  SKILLS_SUMMARY_LINE,
  EXPERIENCE_LINES,
  EXPERIENCE_SUMMARY_LINE,
  CALIBRATE_CALL_LINES,
  RESULT_COMMENT_LINES,
  RESULT_LINES,
} from './typewriterData';

const DOCBLOCK_DURATION = 1000;
const SKILLS_DURATION = 1000;

const Stage = forwardRef(function Stage({ started, onResultTyped }, ref) {
  const gutterRef = useRef(null);
  const codeColumnRef = useRef(null);
  const advanceCueRef = useRef(null);
  const phaseLabelRef = useRef(null);
  const startedOnceRef = useRef(false);

  useEffect(() => {
    if (!started || startedOnceRef.current) return;
    startedOnceRef.current = true;

    const stageEl = ref.current;
    const mainEl = stageEl.closest('main');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cursor = document.createElement('span');
    cursor.setAttribute('aria-hidden', 'true');
    cursor.className = 'inline-block w-[7px] translate-y-[1px] bg-editor-ink motion-safe:animate-cursor-blink';
    cursor.style.height = '1em';
    cursor.style.marginLeft = '1px';

    const typewriter = createTypewriter({
      gutter: gutterRef.current,
      codeColumn: codeColumnRef.current,
      cursor,
      reduceMotion,
    });

    const settleTracker = createStageSettleTracker({ main: mainEl, stage: stageEl });

    async function showAdvanceCue(options) {
      if (advanceCueRef.current) advanceCueRef.current.hidden = false;
      const source = await settleTracker.waitForAdvance(options);
      if (advanceCueRef.current) advanceCueRef.current.hidden = true;
      return source;
    }

    // Ties the code back to the thesis's input -> process -> output framing
    // (skills/experience ARE the input, calibrate() IS the process, result
    // IS the output) — without this label, that mapping only lives in the
    // reader's memory of a section they scrolled past minutes earlier.
    function setPhase(phase) {
      if (phaseLabelRef.current) phaseLabelRef.current.textContent = phase;
    }

    let cancelled = false;

    async function runSequence() {
      typewriter.reset();
      setPhase('input');

      await typewriter.typeLines(COMMENT_LINES, { durationMs: DOCBLOCK_DURATION });
      await typewriter.typeLines(SKILLS_LINES, { durationMs: SKILLS_DURATION });
      if (cancelled) return;
      await showAdvanceCue();

      const skillsLineEls = Array.from(codeColumnRef.current.children).slice(-SKILLS_LINES.length);
      await typewriter.foldToSummary(skillsLineEls, SKILLS_SUMMARY_LINE);

      // Purely a visual gap between statements — not a real source line, so
      // it doesn't get a line number or gutter row.
      typewriter.addSpacer();

      await typewriter.typeLines(EXPERIENCE_LINES, { durationMs: 1400 });
      if (cancelled) return;
      await showAdvanceCue();

      const experienceLineEls = Array.from(codeColumnRef.current.children).slice(-EXPERIENCE_LINES.length);
      await typewriter.foldToSummary(experienceLineEls, EXPERIENCE_SUMMARY_LINE);

      typewriter.addSpacer();

      setPhase('process');
      await typewriter.typeLines(CALIBRATE_CALL_LINES, { durationMs: 500 });
      if (cancelled) return;
      await showAdvanceCue();

      typewriter.addSpacer();

      setPhase('output');
      await typewriter.typeLines(RESULT_COMMENT_LINES, { durationMs: 900 });
      if (cancelled) return;
      await typewriter.typeLines(RESULT_LINES, { durationMs: 1600 });
      if (cancelled) return;
      // "Done" means the last character of result has actually been
      // printed — not that the reader has advanced past it. This is the
      // exact moment the next section (if any) is allowed to exist in the
      // DOM at all. If a parent renders one in response, it mounts right
      // now, on this same tick.
      onResultTyped();

      // This advance is a genuine transition to whatever comes after the
      // stage (if anything does) — not an in-place reaction — so it must
      // NOT swallow the rest of the gesture the way every advance before
      // it does. Swallowing here would fight the very scroll that's meant
      // to carry the reader into the next section, the same bug this
      // caused the first time a Projects section existed after the stage.
      const source = await showAdvanceCue({ keepInPlace: false });
      // A scroll gesture's own momentum carries the viewport there
      // natively. Return has no such momentum, so without this it would
      // silently do nothing — hitting Enter must behave the same as
      // scrolling down. Read the next section lazily (right now, not
      // earlier) since it's only mounted in response to onResultTyped()
      // above, on this same tick.
      if (source === 'key') {
        const nextSection = stageEl.nextElementSibling;
        if (nextSection) {
          nextSection.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
    }

    runSequence();

    return () => {
      cancelled = true;
      settleTracker.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  return (
    <section ref={ref} data-stage className="relative flex h-screen shrink-0 snap-start snap-always items-start overflow-hidden bg-editor-bg px-0 pt-24 text-editor-ink">
      <p
        ref={phaseLabelRef}
        data-phase-label
        className="absolute top-8 left-6 font-mono text-xs font-bold tracking-[0.24em] text-editor-ink uppercase sm:left-9"
      />

      <div className="mx-auto flex w-full max-w-7xl px-6">
        <div aria-hidden="true" ref={gutterRef} data-line-gutter className="w-[3ch] shrink-0 select-none pr-4 text-right font-mono text-sm leading-[1.7] text-editor-gutter" />
        <div ref={codeColumnRef} data-code-column className="min-h-[1.7em] flex-1 whitespace-pre-wrap break-words border-l border-editor-line pl-6 pr-28 font-mono text-sm leading-[1.7]" />
      </div>

      <AdvanceCue ref={advanceCueRef} hidden label="continue / scroll" color="text-editor-gutter" />
    </section>
  );
});

export default Stage;
