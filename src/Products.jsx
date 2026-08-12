import { forwardRef, useEffect, useState } from 'react';

const Products = forwardRef(function Products(_props, ref) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Mounted only once the code section is done, so the reveal transition
    // needs a tick after mount to actually animate rather than start
    // already in its end state.
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section ref={ref} className="flex h-screen shrink-0 snap-start snap-always flex-col items-center justify-center bg-bg px-8 text-ink">
      <div
        className={`w-full max-w-[1180px] transition-all duration-700 ease-out motion-reduce:transition-none ${
          revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h2 className="mb-10 font-display text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.05] tracking-[-0.01em]">Projects</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-border bg-bg-card p-7">
            <div className="mb-4 flex flex-col items-start gap-2">
              <h3 className="font-display text-2xl font-extrabold tracking-[-0.01em]">BlazeGard</h3>
              <span className="rounded-full border border-border px-3 py-1 font-mono text-[11px] font-bold tracking-[0.08em] text-ink-dim uppercase">Prototype</span>
            </div>
            <p className="mb-5 text-[15px] leading-[1.6] text-ink">
              Watches a live camera feed and calls for help before a fire spreads, from the detection model through the alert that reaches a phone.
            </p>
            <ul className="mb-6 flex flex-wrap gap-2 font-mono text-xs text-ink-dim">
              <li className="rounded-full bg-bg px-2.5 py-1">PyTorch</li>
              <li className="rounded-full bg-bg px-2.5 py-1">YOLOv5</li>
              <li className="rounded-full bg-bg px-2.5 py-1">TensorRT/ONNX</li>
              <li className="rounded-full bg-bg px-2.5 py-1">FastAPI</li>
              <li className="rounded-full bg-bg px-2.5 py-1">React</li>
            </ul>
            <p className="mb-2 font-mono text-xs text-ink-dim">Built and demoed on edge hardware, not running as a live product today.</p>
            <a href="https://youtu.be/rgY9_IHGM0U" target="_blank" rel="noopener" className="mt-auto inline-flex items-center gap-1.5 font-mono text-xs font-bold text-accent hover:underline">
              Watch it in action
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
            </a>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-bg-card p-7">
            <div className="mb-4 flex flex-col items-start gap-2">
              <h3 className="font-display text-2xl font-extrabold tracking-[-0.01em]">Kwazi</h3>
              <span className="rounded-full bg-accent px-3 py-1 font-mono text-[11px] font-bold tracking-[0.08em] text-bg uppercase">Live</span>
            </div>
            <p className="mb-5 text-[15px] leading-[1.6] text-ink">
              Tells a student what they're actually missing, not just what they got wrong, by reading their real notes, worksheets and rubrics to find the gap underneath the grade.
            </p>
            <ul className="mb-6 flex flex-wrap gap-2 font-mono text-xs text-ink-dim">
              <li className="rounded-full bg-bg px-2.5 py-1">NLP</li>
              <li className="rounded-full bg-bg px-2.5 py-1">FastAPI</li>
              <li className="rounded-full bg-bg px-2.5 py-1">React</li>
            </ul>
            <a href="https://kwazi.app" target="_blank" rel="noopener" className="mt-auto inline-flex items-center gap-1.5 font-mono text-xs font-bold text-accent hover:underline">
              Visit kwazi.app
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
            </a>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-bg-card p-7">
            <div className="mb-4 flex flex-col items-start gap-2">
              <h3 className="font-display text-2xl font-extrabold tracking-[-0.01em]">OrangeDotTaxi</h3>
              <span className="rounded-full bg-accent px-3 py-1 font-mono text-[11px] font-bold tracking-[0.08em] text-bg uppercase">Demo</span>
            </div>
            <p className="mb-5 text-[15px] leading-[1.6] text-ink">
              Real-time ride matching for local transport: passengers and drivers share live location over WebSockets, matched by server-side proximity within a 5km radius, with admin-drawn route coverage.
            </p>
            <ul className="mb-6 flex flex-wrap gap-2 font-mono text-xs text-ink-dim">
              <li className="rounded-full bg-bg px-2.5 py-1">React</li>
              <li className="rounded-full bg-bg px-2.5 py-1">Express</li>
              <li className="rounded-full bg-bg px-2.5 py-1">WebSockets</li>
              <li className="rounded-full bg-bg px-2.5 py-1">PostgreSQL</li>
              <li className="rounded-full bg-bg px-2.5 py-1">Drizzle ORM</li>
            </ul>
            <a href="https://orange-dot-taxi--monwabisigaga.replit.app" target="_blank" rel="noopener" className="mt-auto inline-flex items-center gap-1.5 font-mono text-xs font-bold text-accent hover:underline">
              Visit OrangeDotTaxi
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Products;
