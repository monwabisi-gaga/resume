import { MapPin, Mail } from 'lucide-react';
import AdvanceCue from './AdvanceCue';

export default function Hero() {
  return (
    <section className="relative flex h-screen shrink-0 snap-start snap-always flex-col items-center justify-center bg-hero-bg px-8 text-hero-ink">
      <div className="w-full max-w-[696px]">
        <h1 className="mb-[18px] font-display text-[clamp(48px,9vw,96px)] font-extrabold leading-[0.98] tracking-[-0.015em] text-hero-ink">Monwabisi Gaga</h1>
        <p className="mb-5 font-mono text-[clamp(16px,1.9vw,19px)] font-bold tracking-[0.01em] text-accent">
          Full-stack Developer <span className="font-normal italic text-hero-dim">— battle tested</span>
        </p>
        <p className="mb-8 flex items-center gap-[7px] font-mono text-sm text-hero-dim">
          <MapPin className="h-[15px] w-[15px] shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
          Johannesburg, South Africa
        </p>
        <div className="flex gap-[18px]">
          <a className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-hero-border text-hero-dim transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent" href="mailto:monwabisi.gaga@gmail.com" aria-label="Email">
            <Mail className="h-[17px] w-[17px]" strokeWidth={2} />
          </a>
          <a className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-hero-border text-hero-dim transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent" href="https://x.com/GagaMonwabisi" aria-label="X (Twitter)">
            <svg className="h-[17px] w-[17px] fill-current" role="img" viewBox="0 0 24 24"><title>X</title><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" /></svg>
          </a>
          <a className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-hero-border text-hero-dim transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent" href="https://www.linkedin.com/in/monwabisi-gaga-4839522a3/" aria-label="LinkedIn">
            <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 11v5M8 8v.01M12 16v-3.5a1.5 1.5 0 0 1 3 0V16M15 16v-3.5" /></svg>
          </a>
        </div>
      </div>

      <AdvanceCue label="scroll" color="text-hero-dim" />
    </section>
  );
}
