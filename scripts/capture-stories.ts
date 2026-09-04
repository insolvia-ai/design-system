// Capture workbench stories as PNGs — both leaves, both colour schemes.
//
// This exists because of a requirement the `design-system-pr` skill already
// makes and could not make easy: every visual change owes a screenshot of BOTH
// leaves, in both schemes when colour moved, because the tests here render into
// jsdom and structurally cannot see wrong colour, wrong position, or one thing
// painted underneath another. That evidence was being produced by hand — start
// the workbench, click a story, click the Scheme toolbar, crop — which is
// exactly the kind of chore that gets skipped on the PR where it matters.
//
// Three things it does that hand-capture kept getting wrong:
//
//   1. IT RESOLVES STORY IDs RATHER THAN GUESSING THEM. Storybook's `sanitize`
//      lowercases and replaces runs of non-alphanumerics, and does NOT split
//      camelCase — so `Forms/IconButton` is `forms-iconbutton`, not
//      `forms-icon-button`. Guessing that wrong yields an empty canvas and a
//      30-second Playwright timeout rather than an error that says so. Targets
//      here are matched against the workbench's own `index.json`, and a miss
//      prints the candidates.
//   2. IT CROPS TO WHAT ACTUALLY PAINTED. `#storybook-root` fills the viewport,
//      so an element screenshot of it is mostly empty canvas — the component
//      ends up a strip at the top of a tall image. The clip is the union of the
//      painted boxes inside it, with the viewport-sized decorator wrappers
//      filtered out.
//   3. IT SHOOTS BOTH SCHEMES. A story renders in ONE scheme per load. The
//      `scheme` global is what the Scheme toolbar drives, so it is set through
//      the URL and the page is loaded once per scheme.
//
// Playwright is a direct devDependency (the a11y gate runs stories in a real
// browser through it), so this adds no dependency. It needs the workbench
// running — `./scripts/dev-up.sh` — because it drives the dev server rather
// than building a static Storybook, which would cost a minute per run.
//
// Run with plain `node`, no loader and no build step, like the other scripts
// here: Node >=24 strips TypeScript types natively, so no `enum`, `namespace`
// or parameter properties (`erasableSyntaxOnly` in tsconfig.base.json enforces
// it, via tsconfig.scripts.json).
// The `page.evaluate` callback below is serialised and runs in the BROWSER, not
// in node, so it needs `document` and `window`. `tsconfig.scripts.json` has no
// DOM lib — correctly, since every other script here is pure node — so this
// file pulls the DOM types in on its own rather than widening that program.
/// <reference lib="dom" />
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEFAULT_URL = 'http://localhost:6006';
const DEFAULT_OUT = '.screenshots';

// Wide enough that a LeafPair puts its two cards side by side rather than
// stacking them — a stacked pair is not the comparison this is for. 2x so the
// image survives GitHub's rendering at half size.
const VIEWPORT = { width: 980, height: 700 };
const SCALE = 2;

type Scheme = 'light' | 'dark';
type StoryEntry = { id: string; title: string; name: string; type?: string };
type Shot = { id: string; label: string; files: Partial<Record<Scheme, string>> };

function usage(): string {
  return [
    'Usage: node scripts/capture-stories.ts [options] <target>...',
    '',
    'A target is a story id (forms-slider--buffered), a component name',
    '(slider, IconButton, toggle-group), or a story title (Forms/Slider).',
    'A component target captures every story it has.',
    '',
    'Options:',
    `  --out <dir>       output directory (default ${DEFAULT_OUT})`,
    `  --url <url>       running workbench (default ${DEFAULT_URL})`,
    '  --scheme <s>      light | dark | both (default both)',
    '  --sheet <name>    also write <name>.png, one composite of every capture',
    '  --list            print every story id and exit',
    '',
    'The workbench must be running: ./scripts/dev-up.sh',
  ].join('\n');
}

// `sanitize` the same way Storybook does when it builds an id, so a human can
// type `IconButton` or `icon-button` or `iconbutton` and get the same story.
function fold(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseArgs(argv: string[]): {
  targets: string[];
  out: string;
  url: string;
  schemes: Scheme[];
  sheet: string | null;
  list: boolean;
} {
  const targets: string[] = [];
  let out = DEFAULT_OUT;
  let url = DEFAULT_URL;
  let scheme = 'both';
  let sheet: string | null = null;
  let list = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === '--list') {
      list = true;
    } else if (arg === '--out' || arg === '--url' || arg === '--scheme' || arg === '--sheet') {
      const value = argv[index + 1];
      if (value === undefined) throw new Error(`${arg} needs a value.\n\n${usage()}`);
      index += 1;
      if (arg === '--out') out = value;
      else if (arg === '--url') url = value;
      else if (arg === '--scheme') scheme = value;
      else sheet = value;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option ${arg}.\n\n${usage()}`);
    } else {
      targets.push(arg);
    }
  }

  if (scheme !== 'light' && scheme !== 'dark' && scheme !== 'both') {
    throw new Error(`--scheme must be light, dark or both (got ${scheme}).`);
  }
  const schemes: Scheme[] = scheme === 'both' ? ['light', 'dark'] : [scheme];

  return { targets, out, url: url.replace(/\/$/, ''), schemes, sheet, list };
}

// The workbench's own index is the only authority on what a story is called.
async function readIndex(url: string): Promise<StoryEntry[]> {
  let payload: { entries?: Record<string, StoryEntry> };
  try {
    const response = await fetch(`${url}/index.json`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    payload = (await response.json()) as { entries?: Record<string, StoryEntry> };
  } catch (cause) {
    throw new Error(
      `Could not read ${url}/index.json — is the workbench running?\n` +
        `Start it with ./scripts/dev-up.sh, then re-run.\n` +
        `(${cause instanceof Error ? cause.message : String(cause)})`,
    );
  }
  return Object.values(payload.entries ?? {}).filter((entry) => entry.type === 'story');
}

// Exact id first, then "every story of this component", matched on the folded
// component segment so `IconButton`, `icon-button` and `iconbutton` all land.
function resolveTargets(targets: string[], stories: StoryEntry[]): StoryEntry[] {
  const chosen: StoryEntry[] = [];
  const seen = new Set<string>();

  for (const target of targets) {
    const folded = fold(target);
    const matches = stories.filter((story) => {
      if (story.id === target) return true;
      const [component = ''] = story.id.split('--');
      if (fold(component) === folded) return true;
      // A title target: `Forms/Slider`, or just `Slider`.
      if (fold(story.title) === folded) return true;
      return fold(story.title.split('/').pop() ?? '') === folded;
    });

    if (matches.length === 0) {
      const components = [...new Set(stories.map((story) => story.id.split('--')[0]))].sort();
      throw new Error(
        `No story matches "${target}".\n\nComponents available:\n  ${components.join('\n  ')}`,
      );
    }
    for (const match of matches) {
      if (seen.has(match.id)) continue;
      seen.add(match.id);
      chosen.push(match);
    }
  }

  return chosen;
}

async function shoot(page: Page, url: string, story: StoryEntry, scheme: Scheme, file: string) {
  // `viewMode=story` is the bare canvas — no manager chrome, no addon panel.
  // `globals=scheme:…` is what the Scheme toolbar sets; see workbench/scheme.ts
  // for why one toolbar item drives two different scheme mechanisms.
  await page.goto(`${url}/iframe.html?id=${story.id}&viewMode=story&globals=scheme:${scheme}`, {
    waitUntil: 'networkidle',
  });
  const root = page.locator('#storybook-root');
  await root.waitFor({ state: 'visible', timeout: 15_000 });

  const clip = await page.evaluate(() => {
    const host = document.querySelector('#storybook-root');
    if (host === null) return null;
    const view = { width: window.innerWidth, height: window.innerHeight };
    const boxes = Array.from(host.querySelectorAll('*'))
      .map((element) => element.getBoundingClientRect())
      // Drop the decorator wrappers that stretch to the viewport. Including
      // them is what leaves the component as a strip on a mostly-empty image.
      .filter((box) => box.width > 0 && box.height > 0)
      .filter((box) => box.height < view.height * 0.9 && box.width < view.width * 0.98);
    if (boxes.length === 0) return null;

    const pad = 16;
    const left = Math.max(0, Math.min(...boxes.map((box) => box.left)) - pad);
    const top = Math.max(0, Math.min(...boxes.map((box) => box.top)) - pad);
    const right = Math.min(view.width, Math.max(...boxes.map((box) => box.right)) + pad);
    const bottom = Math.min(view.height, Math.max(...boxes.map((box) => box.bottom)) + pad);
    return { x: left, y: top, width: right - left, height: bottom - top };
  });

  // A story that painted nothing measurable falls back to the whole viewport
  // rather than failing — an empty capture is still evidence of something.
  await page.screenshot(clip === null ? { path: file } : { path: file, clip });
}

// One image per run, so a PR body carries a single attachment instead of a
// dozen. Built as a file:// page of <img>s and screenshotted, because there is
// no image library here and adding one for this would not be worth it.
async function contactSheet(browser: Browser, dir: string, shots: Shot[], name: string) {
  const sections = shots
    .map((shot) => {
      const panes = (['light', 'dark'] as Scheme[])
        .filter((scheme) => shot.files[scheme] !== undefined)
        .map(
          (scheme) =>
            `<figure><figcaption>${scheme.toUpperCase()}</figcaption>` +
            `<img src="${shot.files[scheme]}"></figure>`,
        )
        .join('');
      return `<section><p class="cap">${shot.label}</p><div class="pair">${panes}</div></section>`;
    })
    .join('\n');

  const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin:0; padding:28px 28px 10px; background:#f4f4f5; color:#18181b;
         font:14px/1.5 ui-sans-serif,-apple-system,"Segoe UI",sans-serif; }
  p.lede { color:#71717a; margin:0 0 22px; font-size:13px; }
  section { margin-bottom:26px; }
  .cap { margin:0 0 8px; font-size:13px; color:#3f3f46; font-weight:600; }
  .pair { display:grid; grid-template-columns:repeat(auto-fit,minmax(0,1fr)); gap:14px; }
  figure { margin:0; }
  figcaption { font-size:10px; letter-spacing:.09em; color:#a1a1aa; margin-bottom:5px; }
  img { width:100%; display:block; border:1px solid #d4d4d8; border-radius:7px; }
</style>
<p class="lede">Each tile is the workbench canvas: the WEB leaf (React DOM + Tailwind) beside the NATIVE leaf (RN primitives via react-native-web).</p>
${sections}`;

  const scaffold = join(dir, `${name}.html`);
  writeFileSync(scaffold, html);
  const page = await browser.newPage({
    viewport: { width: 1500, height: 900 },
    deviceScaleFactor: SCALE,
  });
  await page.goto(`file://${resolve(scaffold)}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
  await page.close();
  rmSync(scaffold, { force: true });
}

// Everything below is the CLI. Failures here are operator errors — the
// workbench is not running, a target does not match — so they print the message
// and nothing else. A stack trace would bury the one line that says what to do.
async function main() {
  const options = parseArgs(process.argv.slice(2));
  const stories = await readIndex(options.url);

  if (options.list) {
    for (const story of stories.map((entry) => entry.id).sort()) console.log(story);
    return;
  }

  if (options.targets.length === 0) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const chosen = resolveTargets(options.targets, stories);
  mkdirSync(options.out, { recursive: true });

  const browser = await chromium.launch();
  const shots: Shot[] = [];
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: SCALE });

    for (const story of chosen) {
      const shot: Shot = { id: story.id, label: `${story.title} — ${story.name}`, files: {} };
      for (const scheme of options.schemes) {
        const file = `${story.id}-${scheme}.png`;
        await shoot(page, options.url, story, scheme, join(options.out, file));
        shot.files[scheme] = file;
      }
      shots.push(shot);
      console.log(`✓ ${story.id} (${options.schemes.join(', ')})`);
    }

    if (options.sheet !== null) {
      await contactSheet(browser, options.out, shots, options.sheet);
      console.log(`✓ ${join(options.out, `${options.sheet}.png`)}`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${shots.length} stor${shots.length === 1 ? 'y' : 'ies'} → ${options.out}/`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
