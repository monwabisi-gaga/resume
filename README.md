# Monwabisi Gaga — Resume

Personal resume site. React + Vite + Tailwind CSS v4. Areas of expertise (input) feed into a filterable career history (processing), closing with real projects (output) — presented as a simulated code editor that types itself out.

Live at [monwabisi-gaga.github.io/resume](https://monwabisi-gaga.github.io/resume/).

## Setup

```
npm install
```

## Run locally

```
npm run dev
```

## Build for deploy

```
npm run build
```

## Tests

Requires the dev server running against `http://localhost:5173/` in a separate terminal:

```
npm run dev    # in one terminal
npm test       # in another
```

`test-scroll-behavior.cjs` checks the scroll-snap / typewriter advance logic — that arriving at or leaving a section never advances it, and only a genuine forward scroll/Return while resting on a section does.

`test-skills-indentation.cjs` checks the skills array formatting — Prettier-style wrapping with item lines indented deeper than the bucket's opening/closing brackets, measured by actual rendered glyph position.

`test-result-alignment.cjs` drives the full sequence through to the `result` block and checks gutter/code-line alignment holds even when a line's content wraps onto multiple visual rows.

`test-trackpad-inertia.cjs` drives hero -> thesis -> editor stage with a short, weak, exponentially-decaying scroll (real trackpad momentum) instead of a fixed-step scroll, and checks the thesis -> stage transition still explicitly lands on the stage.

`test-products-mount-timing.cjs` checks the Projects section never exists in the DOM (not just hidden) until the exact moment the `result` block finishes typing, and that both scrolling and pressing Return past `result` produce the same transition.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages automatically.
