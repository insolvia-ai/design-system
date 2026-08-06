import { create } from 'storybook/theming/create';

/**
 * The workbench shell theme: near-black, violet-accented, and deliberately
 * NOT built from this repo's design tokens.
 *
 * That last part is a decision with a history. A first pass themed the shell
 * from `colors.json`, and the navy chrome blended straight into the
 * dark-scheme components — frame and exhibit became one surface. The shell's
 * palette is therefore its own: neutral charcoals darker than anything the
 * design system paints, and an accent (violet) that appears nowhere in the
 * token set, so nothing in a story can ever be mistaken for chrome or vice
 * versa. If the design system ever gains a violet, change the accent here.
 *
 * `manager-head.html` carries the few cosmetic touches the theme API cannot
 * express; `manager.ts` and preview.tsx's `docs.theme` both consume this file
 * so the manager and the docs pages cannot drift apart.
 */

/** Chrome accent — belongs to the shell, absent from the token set. */
const accent = '#6C5CE7';

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
 */
const wordmark = `
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="30" viewBox="0 0 240 30">
  <text x="0" y="20" font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        font-size="14" font-weight="600" letter-spacing="0.5" fill="${shell.text}"
  >insolvia<tspan fill="${accent}" font-weight="700">//</tspan>design-system</text>
</svg>`;

export const workbenchTheme = create({
  base: 'dark',

  brandTitle: '@insolvia-ai / design-system',
  brandUrl: 'https://github.com/insolvia-ai/design-system',
  brandImage: `data:image/svg+xml,${encodeURIComponent(wordmark)}`,

  colorPrimary: accent,
  colorSecondary: accent,

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
  barHoverColor: '#8E7CF9',
  barSelectedColor: '#9D8CFF',

  inputBg: shell.raised,
  inputBorder: shell.line,
  inputTextColor: shell.text,
  inputBorderRadius: 6,

  buttonBg: shell.raised,
  buttonBorder: shell.line,
  booleanBg: shell.raised,
  booleanSelectedBg: '#1D2130',
});
