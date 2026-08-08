// Direct unit tests for the shared variant data — the part BOTH leaves key
// off. `isHeadingVariant` in particular decides an `<h3>` on one platform and
// an `accessibilityRole` on the other, so it is pinned here once rather than
// inferred twice from rendered output.
import { describe, expect, it } from 'vitest';

import {
  isHeadingVariant,
  toneStyles,
  variantStyles,
  variantWeight,
  weightStyles,
  type TextVariant,
} from './text.props';

const VARIANTS: readonly TextVariant[] = ['display', 'heading', 'title', 'body', 'caption'];

describe('isHeadingVariant', () => {
  it('treats the three structural sizes as headings', () => {
    expect(isHeadingVariant('display')).toBe(true);
    expect(isHeadingVariant('heading')).toBe(true);
    expect(isHeadingVariant('title')).toBe(true);
  });

  it('treats flowing copy as not a heading', () => {
    expect(isHeadingVariant('body')).toBe(false);
    expect(isHeadingVariant('caption')).toBe(false);
  });
});

describe('the variant maps', () => {
  it('covers every variant in every map', () => {
    // A missing key resolves to `undefined` and renders unstyled rather than
    // throwing — the failure mode `button.stories.tsx` records for
    // `intentStyles['danger']`. Asserting completeness catches it here.
    for (const variant of VARIANTS) {
      expect(variantStyles[variant]).toBeTruthy();
      expect(weightStyles[variantWeight[variant]]).toBeTruthy();
    }
  });

  it('gives headings a heavier default weight than body copy', () => {
    expect(variantWeight.heading).toBe('semibold');
    expect(variantWeight.body).toBe('regular');
  });

  it('maps every tone to a semantic colour utility, never a palette name', () => {
    for (const [tone, className] of Object.entries(toneStyles)) {
      expect(className, `${tone} must use a semantic token`).toMatch(/^text-[a-z-]+$/);
    }
  });
});
