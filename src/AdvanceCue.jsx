import { forwardRef } from 'react';
import { CornerDownLeft, ArrowDown } from 'lucide-react';

// A single physical keycap — bordered rounded-square, like a real keyboard
// key — rather than a bare Unicode glyph floating next to text.
function KeyCap({ icon: Icon }) {
  return (
    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded border border-current text-accent">
      <Icon className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}

const ICONS = { continue: CornerDownLeft, scroll: ArrowDown };

// Shared "how to advance" indicator — same fixed position (vertically
// centered, right edge) and layout in every section, so the reader always
// finds it in the same place regardless of which section they're on.
// Color is the one thing sections legitimately differ on (each section has
// its own background/ink pairing), so it stays a prop rather than baked in.
const AdvanceCue = forwardRef(function AdvanceCue({ label = 'continue / scroll', color = 'text-hero-dim', hidden = false }, ref) {
  const words = label.split(' / ');
  return (
    <p
      ref={ref}
      hidden={hidden}
      data-advance-cue
      className={`motion-safe:animate-bounce-slow absolute top-1/2 right-8 flex -translate-y-1/2 flex-col items-center gap-2 text-xs font-bold tracking-[0.24em] uppercase ${color}`}
    >
      {words.map((word) => (
        <span key={word} className="flex items-center">
          {word}
          {ICONS[word] && <KeyCap icon={ICONS[word]} />}
        </span>
      ))}
    </p>
  );
});

export default AdvanceCue;
