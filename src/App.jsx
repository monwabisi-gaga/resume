import { useEffect, useRef, useState } from 'react';
import Hero from './Hero';
import Thesis from './Thesis';
import Stage from './Stage';
import Products from './Products';
import ThemeToggle from './ThemeToggle';
import { onNextAdvance } from './advance';

export default function App() {
  const thesisRef = useRef(null);
  const stageRef = useRef(null);
  const [stageStarted, setStageStarted] = useState(false);
  const [resultTyped, setResultTyped] = useState(false);
  const editorStartedRef = useRef(false);
  const thesisArmedRef = useRef(false);

  // Thesis: return or scroll to advance (only once thesis is the active
  // section). Thesis stays in the DOM permanently, as a normal snap-scroll
  // section — the reader can scroll back up to it at any time. "Advancing"
  // only starts the editor's typewriter sequence the first time; scrolling
  // forward again later must not replay it.
  useEffect(() => {
    const thesisEl = thesisRef.current;
    const stageEl = stageRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function enterStage() {
      if (editorStartedRef.current) return;
      editorStartedRef.current = true;
      // Always drive the transition explicitly rather than trusting the
      // triggering gesture to carry the viewport the rest of the way: a
      // real trackpad gesture can be too short/weak to cross the full
      // section on its own, leaving the reader stuck on thesis while the
      // editor has already silently started typing underneath.
      stageEl.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      setStageStarted(true);
    }

    const thesisObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !thesisArmedRef.current && !editorStartedRef.current) {
          thesisArmedRef.current = true;
          onNextAdvance(() => {
            thesisObserver.disconnect();
            enterStage();
          }, { keepInPlace: true });
        }
      });
    }, { threshold: 0.9 });

    thesisObserver.observe(thesisEl);

    return () => thesisObserver.disconnect();
  }, []);

  return (
    <>
      <ThemeToggle />
      <main className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        <Hero />
        <Thesis ref={thesisRef} />
        <Stage ref={stageRef} started={stageStarted} onResultTyped={() => setResultTyped(true)} />
        {/* Products only enters the DOM once the code section is genuinely
            done (the last character of result has printed) — there is
            nothing to scroll into before that, not just something
            hidden/off-screen. See Stage's onResultTyped. */}
        {resultTyped && <Products />}
      </main>
    </>
  );
}
