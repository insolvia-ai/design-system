import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

// What this file guards, and why it is the only thing that can.
//
// `theme.css` is a Tailwind v4 `@theme` block, and a `@theme` block does not
// only ADD utilities — a key landing in a namespace Tailwind already consults
// REDEFINES every utility that reads that namespace. The spacing steps are
// named with t-shirt sizes, and `w-*`, `min-w-*`, `max-w-*` and `basis-*`
// resolve `--spacing-*` ahead of Tailwind's own `--container-*`, so
// `--spacing-md: 1rem` silently turned `max-w-md` into a 16px cap: the class
// still compiled, still applied, and meant a seventeenth of what it reads as.
//
// Nothing else here can see that. Nothing imports this stylesheet: the
// consumer's Tailwind build does, from its own CSS entrypoint. tsc reads no
// CSS. jsdom computes no layout, so a component rendered 16px wide asserts the
// same roles and labels as one rendered 28rem wide. axe scores contrast and
// names on an element whose width it never questions. The failure surfaced in
// a browser, on a paragraph wrapping one word per line.
//
// So the assertions below run the real Tailwind compiler over the real file,
// twice — once with this theme and once without — and compare. That framing is
// deliberate: the claim worth pinning is not "max-w-md is 28rem" (a value this
// repo does not own and should not restate) but "importing this theme does not
// change what a stock Tailwind utility means". Adding a key Tailwind lacks is
// the one permitted difference.

const require = createRequire(import.meta.url);
const THEME_PATH = path.join(import.meta.dirname, 'theme.css');

/**
 * Resolves an `@import` the way a bundler's Tailwind plugin would: the bare
 * `tailwindcss` specifier and its own internal relative imports, plus this
 * package's stylesheet under test.
 */
async function loadStylesheet(id: string, base: string) {
  const file =
    id === 'tailwindcss'
      ? require.resolve('tailwindcss/index.css')
      : id.startsWith('tailwindcss/')
        ? require.resolve(id)
        : path.resolve(base, id);
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
}

/** Compiles `candidates` and returns the CSS, with or without this theme. */
async function build(candidates: string[], withTheme: boolean): Promise<string> {
  const entry = withTheme
    ? `@import "tailwindcss";\n@import "${THEME_PATH}";\n`
    : '@import "tailwindcss";\n';
  const compiler = await compile(entry, { base: import.meta.dirname, loadStylesheet });
  return compiler.build(candidates);
}

/** Every custom property the build emitted, so a `var()` chain can be walked. */
function customProperties(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)[;}]/g)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined && !map.has(name)) map.set(name, value.trim());
  }
  return map;
}

/**
 * The value `class` gives `property`, with every `var()` followed to a literal
 * — which is the only form two builds can be compared in, since the whole bug
 * is that two different variables carry the same number.
 *
 * Returns `null` when the utility does not exist in that build.
 */
function resolved(css: string, className: string, property: string): string | null {
  const rule = css.match(
    new RegExp(`\\.${className.replace(/[-\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`),
  )?.[1];
  const declared = rule?.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`))?.[1];
  if (declared === undefined) return null;

  const properties = customProperties(css);
  return expandVars(declared, properties).replace(/\s+/g, ' ').trim();
}

/**
 * Substitutes every `var(--name, fallback)` for what it resolves to.
 *
 * Hand-written rather than a regex because the values under test nest — the
 * width keys are literally `var(--container-md, var(--spacing-md))`, and the
 * fallback arm runs to a balanced close paren, which a regex cannot find.
 */
function expandVars(value: string, properties: Map<string, string>, depth = 0): string {
  const start = value.indexOf('var(');
  if (start === -1 || depth > 10) return value;

  let end = start + 4;
  for (let open = 1; open > 0 && end < value.length; end++) {
    if (value[end] === '(') open++;
    else if (value[end] === ')') open--;
  }
  const inner = value.slice(start + 4, end - 1);

  // Split off the first top-level comma: everything after it is the fallback,
  // which may itself contain commas inside a nested function call.
  let comma = -1;
  for (let i = 0, open = 0; i < inner.length; i++) {
    if (inner[i] === '(') open++;
    else if (inner[i] === ')') open--;
    else if (inner[i] === ',' && open === 0) {
      comma = i;
      break;
    }
  }
  const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
  const fallback = comma === -1 ? '' : inner.slice(comma + 1).trim();

  const substituted = properties.get(name) ?? fallback;
  return expandVars(
    value.slice(0, start) + expandVars(substituted, properties, depth + 1) + value.slice(end),
    properties,
    depth + 1,
  );
}

/** The t-shirt keys this theme puts into the shared `--spacing-*` namespace. */
const SPACING_KEYS = [...fs.readFileSync(THEME_PATH, 'utf8').matchAll(/^\s*--spacing-([\w-]+):/gm)]
  .map((match) => match[1])
  .filter((key): key is string => key !== undefined);

// The four utilities Tailwind resolves through `--spacing` BEFORE `--container`
// — the complete set at risk, paired with the property each one sets.
const WIDTH_UTILITIES = [
  ['w', 'width'],
  ['min-w', 'min-width'],
  ['max-w', 'max-width'],
  ['basis', 'flex-basis'],
] as const;

// Utilities that read `--spacing` and nothing else. They are what the spacing
// steps are FOR, and the fix must leave them alone — a shim that "fixed"
// `max-w-md` by moving the spacing scale would break every one of these.
const SPACING_UTILITIES = [
  ['p', 'padding'],
  ['gap', 'gap'],
  ['h', 'height'],
  ['max-h', 'max-height'],
] as const;

// The additive half of the same question. Everything above asks what this theme
// must NOT change; these ask that the keys it adds are in namespaces Tailwind
// actually reads, which is the failure mode a `@theme` key has all to itself: an
// unknown namespace still emits a perfectly valid custom property, and the
// utility that was supposed to come with it simply never exists. Nothing else
// here would notice — the property resolves, the diff looks right, and the class
// silently drops out of the consumer's build.
//
// One per namespace introduced, not one per key: 24 ramp steps and 3 motion
// tokens share three lookups between them, and asserting all 27 would restate
// the token file rather than test it.
const ADDED_UTILITIES = [
  // The neutral ramp — an opaque step and an alpha step, since the alpha keys
  // are the ones whose `a1`-style suffix is easiest to get wrong.
  ['bg-neutral-1', 'background-color'],
  ['bg-neutral-a12', 'background-color'],
  ['text-neutral-12', 'color'],
  // Motion. `--transition-duration-*` is the namespace `duration-*` reads —
  // there is no `--duration-*` — and this is what pins that down.
  ['duration-fast', 'transition-duration'],
  ['duration-base', 'transition-duration'],
  ['ease-standard', 'transition-timing-function'],
  // Radii. `none` and `xs` are new keys on a scale this theme already owns.
  ['rounded-none', 'border-radius'],
  ['rounded-xs', 'border-radius'],
] as const;

describe('theme.css namespaces', () => {
  it('names spacing steps that could collide, or this file is asserting nothing', () => {
    expect(SPACING_KEYS.length).toBeGreaterThan(0);
  });

  it.each(ADDED_UTILITIES)('%s is a real utility with this theme', async (className, property) => {
    const css = await build([className], true);
    const value = resolved(css, className, property);
    expect(value).not.toBeNull();
    expect(value).not.toBe('');
  });

  it('font-mono keeps meaning a monospace stack', async () => {
    // This theme declares `--font-mono`, which Tailwind's own default theme
    // also declares — so unlike every other key here, it REDEFINES a built-in
    // utility. That is deliberate (the role has to exist in the token package
    // for the React Native output too) and safe only because the value is the
    // same system stack. Assert the property this rests on rather than the
    // exact string, which is Tailwind's to change and this repo's to match.
    const css = await build(['font-mono'], true);
    expect(resolved(css, 'font-mono', 'font-family')).toMatch(/monospace$/);
  });

  describe.each(WIDTH_UTILITIES)('%s-*', (utility, property) => {
    it.each(SPACING_KEYS)(`%s means the same as it does without this theme`, async (key) => {
      const className = `${utility}-${key}`;
      // `p-${key}` rides along so the no-container-key branch below has the
      // spacing step to compare against, in the same build.
      const [themed, stock] = await Promise.all([
        build([className, `p-${key}`], true),
        build([className], false),
      ]);

      const ours = resolved(themed, className, property);
      const theirs = resolved(stock, className, property);

      if (theirs !== null) {
        // Tailwind has a container width of this name. Importing the theme
        // must not have moved it — this is the assertion that fails if the
        // spacing scale ever shadows the container scale again.
        expect(ours).toBe(theirs);
      } else {
        // Tailwind has no such key, so there is nothing to shadow and the
        // spacing step is the only meaning available. Adding a utility is
        // fine; the theme still may not leave it resolving to nothing.
        expect(ours).toBe(resolved(themed, `p-${key}`, 'padding'));
      }
    });
  });

  describe.each(SPACING_UTILITIES)('%s-*', (utility, property) => {
    it.each(SPACING_KEYS)('%s still reads the spacing scale', async (key) => {
      const css = await build([`${utility}-${key}`, `p-${key}`], true);
      expect(resolved(css, `${utility}-${key}`, property)).toBe(
        resolved(css, `p-${key}`, 'padding'),
      );
    });
  });
});
