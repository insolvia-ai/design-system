import { create } from 'storybook/theming/create';

/**
 * The workbench shell theme: near-black, violet-accented, and deliberately
 * NOT built from this repo's design tokens.
 *
 * That last part is a decision with a history. A first pass themed the shell
 * ENTIRELY from `colors.json`, and the navy chrome blended straight into the
 * dark-scheme components — frame and exhibit became one surface. The
 * SURFACES here are therefore the shell's own: neutral charcoals darker than
 * anything the design system paints. The ACCENT is the insolvia blue by
 * explicit request — acceptable where a full navy chrome was not, because an
 * accent is small: a selection pill and some tinted text cannot swallow a
 * story the way a navy sidebar and panels did.
 *
 * `manager-head.html` carries the few cosmetic touches the theme API cannot
 * express; `manager.ts` and preview.tsx's `docs.theme` both consume this file
 * so the manager and the docs pages cannot drift apart.
 */

/** The insolvia blue, for accent SURFACES (the selection pill's gradient). */
const accent = '#0B2A4A';

/**
 * The same hue lightened for accent TEXT — selected tab labels, links, form
 * accents sit on near-black panels, where the brand navy itself would be
 * unreadable (roughly 1.6:1 against the panel). One hue, two jobs.
 */
const accentText = '#6E9FD1';

const shell = {
  bg: '#08090C',
  panel: '#0D0F13',
  raised: '#14171D',
  line: 'rgba(255,255,255,0.08)',
  text: '#DEE2E6',
  muted: '#828B98',
};

/**
 * The sidebar wordmark, as an inline SVG so the header stops being
 * Storybook's logo-plus-text and the typography is ours to set. Kept as
 * source here (encoded below) so it can be read and edited like code.
 *
 * TWO LINES, and that is the size mechanism, not a style choice: the header
 * scales the image to roughly 200px of sidebar, so a single 23-character
 * line can never render above ~14px no matter what font-size the SVG asks
 * for — effective size is width divided by characters. Eight characters on
 * the top line is what buys a real heading. The slashes use the TEXT tint;
 * the brand navy itself disappears at glyph weight on a near-black header.
 */
const wordmark = `
<svg xmlns="http://www.w3.org/2000/svg" width="212" height="56" viewBox="0 0 212 56">
  <text x="0" y="26" font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        font-size="26" font-weight="700" letter-spacing="0.5" fill="${shell.text}">insolvia</text>
  <text x="0" y="48" font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        font-size="15" font-weight="600" letter-spacing="0.5"
  ><tspan fill="${accentText}" font-weight="700">//</tspan><tspan fill="${shell.muted}">design-system</tspan></text>
</svg>`;

export const workbenchTheme = create({
  base: 'dark',

  brandTitle: '@insolvia-ai / design-system',
  brandUrl: 'https://github.com/insolvia-ai/design-system',
  brandImage: `data:image/svg+xml,${encodeURIComponent(wordmark)}`,

  // Text-tint rather than the raw navy: these two feed link text, focus
  // accents and form controls sitting on the dark panels.
  colorPrimary: accentText,
  colorSecondary: accentText,

  appBg: shell.bg,
  appContentBg: shell.panel,
  appPreviewBg: shell.panel,
  appBorderColor: shell.line,
  appBorderRadius: 6,

  fontBase: 'ui-sans-serif, system-ui, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, monospace',

  textColor: shell.text,
  textInverseColor: shell.bg,
  textMutedColor: shell.muted,

  barBg: shell.panel,
  barTextColor: shell.muted,
  barHoverColor: '#8FB5DC',
  barSelectedColor: accentText,

  inputBg: shell.raised,
  inputBorder: shell.line,
  inputTextColor: shell.text,
  inputBorderRadius: 6,

  buttonBg: shell.raised,
  buttonBorder: shell.line,
  booleanBg: shell.raised,
  booleanSelectedBg: '#16233A',
});
