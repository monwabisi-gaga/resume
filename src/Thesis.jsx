import { forwardRef } from 'react';
import AdvanceCue from './AdvanceCue';

const Thesis = forwardRef(function Thesis(_props, ref) {
  return (
    <section ref={ref} className="relative flex h-[100svh] min-h-[100svh] shrink-0 snap-start snap-always flex-col items-center justify-center bg-hero-bg px-5 text-hero-ink sm:px-8">
      <div className="max-w-3xl">
        <p className="mb-7 font-display text-[clamp(23px,3.6vw,38px)] font-bold leading-[1.28] tracking-[-0.005em] text-hero-ink">
          Software exists to take user input, process it, and then provide output. This has parallels to the career development of a software engineer.
        </p>
        <p className="font-display text-[clamp(23px,3.6vw,38px)] font-bold leading-[1.28] tracking-[-0.005em] text-accent">
          Let me show you how
        </p>
      </div>

      <AdvanceCue label="continue / scroll" color="text-hero-dim" />
    </section>
  );
});

export default Thesis;
