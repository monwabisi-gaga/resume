// Pure data + line-building for the editor stage's typewriter content.
// No DOM access here — only token/line construction, shared by the
// typewriter engine.

export const SKILLS_DATA = [
  ['front-end', ['React', 'Vue.js', 'TypeScript', 'Tailwind', 'Redux/Zustand', 'React Query', 'TanStack Query', 'Cypress', 'Playwright']],
  ['back-end', ['Rails', 'Go', 'Node.js', 'Express', 'FastAPI', 'Django', 'PHP/Laravel', 'GraphQL', 'WebSockets', 'ActiveRecord', 'Drizzle ORM', 'ActionCable', 'ORMs', 'Zod', 'Redis', 'Sidekiq']],
  ['architecture', ['Kubernetes', 'Docker', 'AWS', 'GCP', 'Nginx', 'Terraform', 'RabbitMQ/SQS', 'GitHub Actions', 'Helm', 'Ansible']],
  ['security', ['OAuth2', 'JWT', 'CORS/CSP', 'Devise', 'Pundit/CanCanCan', 'Session-based auth', 'bcrypt']],
  ['observability', ['New Relic', 'Sentry', 'Honeybadger', 'Prometheus/Grafana', 'Structured logging']],
  ['nlp', ['RAG', 'LangChain', 'FAISS/Pinecone', 'BERT/GPT fine-tuning', 'spaCy/NLTK']],
  ['computer-vision', ['YOLOv5', 'OpenCV', 'EfficientNet', 'ResNet', 'TensorRT/ONNX']],
  ['data-engineering', ['Apache Spark', 'Kafka', 'Airflow', 'Hadoop', 'PostgreSQL']],
];

// Prettier-style array wrapping: the key opens with just "[" on its own
// line, items are grouped a few per line indented one level deeper, and
// the closing "]," sits on its own line back at the key's indent.
const SKILLS_ITEMS_PER_LINE = 8;

function skillsBucketLines([key, items], isLast) {
  const lines = [
    [{ t: `  "${key}": `, c: 'text-editor-key' }, { t: '[', c: 'text-editor-gutter' }],
  ];

  for (let i = 0; i < items.length; i += SKILLS_ITEMS_PER_LINE) {
    const chunk = items.slice(i, i + SKILLS_ITEMS_PER_LINE);
    const tokens = [];
    chunk.forEach((item, ci) => {
      const isLastInBucket = i + ci === items.length - 1;
      const isLastInLine = ci === chunk.length - 1;
      const suffix = isLastInBucket ? '' : isLastInLine ? ',' : ', ';
      tokens.push({ t: `"${item}"`, c: 'text-editor-string' });
      if (suffix) tokens.push({ t: suffix, c: 'text-editor-gutter' });
    });
    lines.push([{ t: '      ', c: 'text-editor-gutter' }, ...tokens]);
  }

  lines.push([{ t: `  ]${isLast ? '' : ','}`, c: 'text-editor-gutter' }]);
  return lines;
}

export const SKILLS_INTRO_LINES = [
  [{ t: '// input, in its rawest form', c: 'text-editor-comment italic' }],
];

export const SKILLS_LINES = [
  [{ t: 'const ', c: 'text-editor-kw' }, { t: 'skills', c: 'text-editor-ink' }, { t: ' = {', c: 'text-editor-gutter' }],
  ...SKILLS_DATA.flatMap((entry, i) => skillsBucketLines(entry, i === SKILLS_DATA.length - 1)),
  [{ t: '};', c: 'text-editor-gutter' }],
];

export const SKILLS_SUMMARY_LINE = [
  { t: 'const ', c: 'text-editor-kw' }, { t: 'skills', c: 'text-editor-ink' }, { t: ' = {', c: 'text-editor-gutter' }, { t: ' … ', c: 'text-editor-comment italic' }, { t: '};', c: 'text-editor-gutter' },
];

function experienceEntryLines(entry) {
  const lines = [[{ t: '{', c: 'text-editor-gutter' }]];
  Object.entries(entry).forEach(([key, value], i, arr) => {
    const isLast = i === arr.length - 1;
    if (Array.isArray(value)) {
      const items = value.flatMap((v, vi) => {
        const tokens = [{ t: `"${v}"`, c: 'text-editor-string' }];
        if (vi < value.length - 1) tokens.push({ t: ', ', c: 'text-editor-gutter' });
        return tokens;
      });
      lines.push([{ t: `  ${key}: `, c: 'text-editor-key' }, { t: '[', c: 'text-editor-gutter' }, ...items, { t: `]${isLast ? '' : ','}`, c: 'text-editor-gutter' }]);
    } else {
      lines.push([
        { t: `  ${key}: `, c: 'text-editor-key' },
        { t: `"${value}"`, c: 'text-editor-string' },
        ...(isLast ? [] : [{ t: ',', c: 'text-editor-gutter' }]),
      ]);
    }
  });
  lines.push([{ t: '},', c: 'text-editor-gutter' }]);
  return lines;
}

export const EXPERIENCE_ENTRIES = [
  { company: 'CASI', role: 'Senior Developer', span: '2024 — present', stack: ['Vue.js', 'AWS', 'Docker', 'Kubernetes'] },
  { company: 'BlazeGard', role: 'Founder & ML Engineer', span: '2024 — 2025', stack: ['PyTorch', 'YOLOv5', 'FastAPI', 'TensorRT/ONNX'] },
  { company: 'Platform45', role: 'Senior Software Engineer', span: '2024 — 2025', stack: ['Ruby on Rails', 'Heroku', 'New Relic', 'Azure'] },
  { company: 'Docfox', role: 'Fullstack Developer', span: '2021 — 2024', stack: ['Ruby on Rails', 'React', 'Cypress', 'RSpec'] },
  { era: 'Early Career', role: 'Web Developer → Fullstack Developer', span: '2012 — 2021', note: '12 short engagements compressed into one line, this is where the range came from.' },
];

export const EXPERIENCE_INTRO_LINES = [
  [{ t: '// input, too: the years behind it', c: 'text-editor-comment italic' }],
];

export const EXPERIENCE_LINES = [
  [{ t: 'const ', c: 'text-editor-kw' }, { t: 'experience', c: 'text-editor-ink' }, { t: ' = [', c: 'text-editor-gutter' }],
  ...EXPERIENCE_ENTRIES.flatMap(experienceEntryLines),
  [{ t: '];', c: 'text-editor-gutter' }],
];

export const EXPERIENCE_SUMMARY_LINE = [
  { t: 'const ', c: 'text-editor-kw' }, { t: 'experience', c: 'text-editor-ink' }, { t: ' = [', c: 'text-editor-gutter' }, { t: ' … ', c: 'text-editor-comment italic' }, { t: '];', c: 'text-editor-gutter' },
];

export const CALIBRATE_INTRO_LINES = [
  [{ t: '// process: skills and experience, applied', c: 'text-editor-comment italic' }],
];

export const CALIBRATE_CALL_LINES = [
  [{ t: 'const ', c: 'text-editor-kw' }, { t: 'result', c: 'text-editor-ink' }, { t: ' = ', c: 'text-editor-gutter' }, { t: 'calibrate', c: 'text-editor-key' }, { t: '(', c: 'text-editor-gutter' }, { t: 'skills', c: 'text-editor-ink' }, { t: ', ', c: 'text-editor-gutter' }, { t: 'experience', c: 'text-editor-ink' }, { t: ');', c: 'text-editor-gutter' }],
];

export const RESULT_DATA = [
  ['adaptability', 'Comfortable stepping into unfamiliar territory, absorbing real constraints quickly, and becoming effective without waiting for the problem to be simplified, carrying sound judgement across changing domains, stages and pressures.'],
  ['judgement', 'Treats engineering as a means to an outcome, not an end in itself, able to distinguish what is possible from what is worth doing, while keeping users, trade-offs and downstream consequences in view.'],
  ['ownership', 'Thinks beyond the edge of a ticket, connecting product intent, technical choices and operational reality, staying with the work until it produces a result that matters, rather than simply reaching a definition of done.'],
  ['durability', 'Designs for the full life of a system, not the moment of hand-off: deliberate with trade-offs, resilient under pressure, visible when things break, and structured to evolve without becoming opaque or fragile.'],
];

// Lines can carry a hangIndent (character count) so that when the line's
// content is long enough to wrap, the continuation rows indent under the
// value instead of resetting to the far-left margin — a plain hanging
// indent, same idea as a bullet list where wrapped text aligns under the
// first word rather than under the bullet.
//
// All four keys share one indent width (the longest key's prefix), with
// shorter keys padded out to match — so every value's opening quote, and
// every wrapped continuation line beneath it, lines up in the same column
// regardless of which key is longer.
const RESULT_KEY_COLUMN_WIDTH = Math.max(...RESULT_DATA.map(([key]) => `  ${key}: `.length));

export const RESULT_COMMENT_LINES = [
  [{ t: '// output: skills and experience, culminating in a specific calibre engineer', c: 'text-editor-comment italic' }],
  [],
];

export const RESULT_LINES = [
  [{ t: 'const ', c: 'text-editor-kw' }, { t: 'result', c: 'text-editor-ink' }, { t: ' = {', c: 'text-editor-gutter' }],
  ...RESULT_DATA.flatMap(([key, value], i) => {
    const prefix = `  ${key}: `.padEnd(RESULT_KEY_COLUMN_WIDTH, ' ');
    const line = [
      { t: prefix, c: 'text-editor-key' },
      { t: `"${value}"`, c: 'text-editor-string' },
      ...(i === RESULT_DATA.length - 1 ? [] : [{ t: ',', c: 'text-editor-gutter' }]),
    ];
    line.hangIndent = RESULT_KEY_COLUMN_WIDTH;
    // A blank line between entries (not after the last one) — a real
    // source line like the docblock's own spacer, so it still gets a line
    // number, just no visible content.
    return i === RESULT_DATA.length - 1 ? [line] : [line, []];
  }),
  [{ t: '};', c: 'text-editor-gutter' }],
];

export const COMMENT_LINES = [
  [{ t: '/**', c: 'text-editor-comment italic' }],
  [{ t: ' * Software development, broken down to a certain level, is a series of ', c: 'text-editor-comment italic' }, { t: 'method calls', c: 'text-editor-ink' }, { t: ' which accept data', c: 'text-editor-comment italic' }],
  [{ t: ' * (', c: 'text-editor-comment italic' }, { t: 'user input', c: 'text-editor-ink' }, { t: '), parameters which we declare as ', c: 'text-editor-comment italic' }, { t: 'variables', c: 'text-editor-ink' }, { t: '.', c: 'text-editor-comment italic' }],
  [{ t: ' */', c: 'text-editor-comment italic' }],
  [],
];
