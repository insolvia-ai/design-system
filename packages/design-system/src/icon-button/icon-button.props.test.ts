// Direct unit tests for the shared variant data. Two claims that no rendered
// test states as plainly: that every axis value has a row in every map (a
// missing key renders unstyled rather than throwing — the 0.8.3 failure
// button.stories.tsx records), and that the three shared intents are Button's
// OWN rows rather than a copy that is free to drift.
import { describe, expect, it } from 'vitest';

import { intentStyles } from '../button/button.props';
import {
  iconButtonClass,
  iconIntentStyles,
  iconSizeStyles,
  pressedStyles,
  type IconButtonIntent,
  type IconButtonSize,
} from './icon-button.props';

const INTENTS: readonly IconButtonIntent[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: readonly IconButtonSize[] = ['sm', 'md'];

describe('the icon button maps', () => {
  it('covers every intent in every intent map', () => {
    for (const intent of INTENTS) {
      expect(iconIntentStyles[intent]).toBeTruthy();
      expect(pressedStyles[intent]).toBeTruthy();
    }
  });

  it('covers every size', () => {
    for (const size of SIZES) {
      expect(iconSizeStyles[size]).toBeTruthy();
    }
  });

  it("reuses Button's rows verbatim rather than copying them", () => {
    for (const intent of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      expect(iconIntentStyles[intent]).toBe(intentStyles[intent]);
    }
  });

  // `danger` used to be added HERE, on the grounds that the token set had no
  // measured foreground for a label on a danger fill and this control has no
  // label. tokens 0.4.0 measured one (`danger-text`), Button took the intent,
  // and the two controls share one row again — which is what makes a text
  // button and an icon button that destroy the same thing read as one control.
  it('takes danger from Button, on the shared danger-text foreground', () => {
    expect(iconIntentStyles.danger).toContain('bg-danger');
    expect(iconIntentStyles.danger).toContain('text-danger-text');
    expect(iconIntentStyles.danger).toContain('hover:bg-danger-hover');
    expect(intentStyles).toHaveProperty('danger');
  });

  // The one intent that is NOT Button's, and the reason this type still
  // diverges: controls drawn over media, which the surface roles cannot
  // express. See icon-button.props.ts.
  it('adds overlay, which Button deliberately does not have', () => {
    expect(iconIntentStyles.overlay).toContain('text-overlay-ink');
    expect(iconIntentStyles.overlay).toContain('hover:bg-overlay-hover');
    expect(iconIntentStyles.overlay).toContain('active:bg-overlay-active');
    expect(intentStyles).not.toHaveProperty('overlay');
  });

  // 32dp is under the WCAG 2.5.5 floor, so `sm` — and only `sm` — carries the
  // coarse-pointer overlay that grows the TARGET without growing the box.
  it('gives sm a 44px hit area on a coarse pointer, and md none', () => {
    expect(iconButtonClass({ size: 'sm' })).toContain('pointer-coarse:after:size-11');
    expect(iconButtonClass({ size: 'md' })).not.toContain('pointer-coarse:after:size-11');
  });

  it('renders a square box for every size', () => {
    expect(iconButtonClass({ size: 'sm' })).toContain('h-8 w-8');
    expect(iconButtonClass({ size: 'md' })).toContain('h-11 w-11');
  });

  it('adds the pressed fill only when pressed is true', () => {
    // Split into classes rather than matching substrings: the unpressed string
    // already CONTAINS `bg-primary-active` inside `active:bg-primary-active`,
    // and a substring assertion would pass on the state it means to rule out.
    const classes = (options: Parameters<typeof iconButtonClass>[0]) =>
      iconButtonClass(options).split(' ');

    expect(classes({ intent: 'primary' })).not.toContain('bg-primary-active');
    expect(classes({ intent: 'primary', pressed: false })).not.toContain('bg-primary-active');

    const pressed = classes({ intent: 'primary', pressed: true });
    expect(pressed).toContain('bg-primary-active');
    // twMerge dropped the base fill it conflicts with, and left the pointer
    // states alone.
    expect(pressed).not.toContain('bg-primary');
    expect(pressed).toContain('hover:bg-primary-hover');
  });
});
