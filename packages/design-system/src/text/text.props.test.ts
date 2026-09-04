// Direct unit tests for the shared variant data — the part BOTH leaves key
// off. `isHeadingVariant` in particular decides an `<h3>` on one platform and
// an `accessibilityRole` on the other, so it is pinned here once rather than
// inferred twice from rendered output.
import { describe, expect, it } from 'vitest';

import {
  familyStyles,
  isHeadingVariant,
  toneStyles,
  variantFamily,
  variantStyles,
  variantWeight,
  weightStyles,
  type TextFamily,
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
      expect(familyStyles[variantFamily[variant]]).toBeTruthy();
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

describe('the family maps', () => {
  const FAMILIES: readonly TextFamily[] = ['body', 'heading', 'mono'];

  it('gives every family exactly one font utility', () => {
    for (const family of FAMILIES) {
      expect(familyStyles[family]).toMatch(/^font-[a-z]+$/);
    }
  });

  it('keeps the family OUT of variantStyles, which is now the size step alone', () => {
    // The regression this guards: putting `font-heading` back into
    // `variantStyles` would emit it alongside an overriding `font-mono` —
    // twMerge does not treat these as one conflict group, so stylesheet order,
    // not the caller, would pick the winner.
    for (const variant of VARIANTS) {
      expect(variantStyles[variant]).not.toContain('font-');
    }
  });

  it('keeps the three heading variants on the heading family and copy on body', () => {
    expect(variantFamily.display).toBe('heading');
    expect(variantFamily.heading).toBe('heading');
    expect(variantFamily.title).toBe('heading');
    expect(variantFamily.body).toBe('body');
    expect(variantFamily.caption).toBe('body');
  });

  it('does not smuggle tabular-nums into mono — see the note in text.props.ts', () => {
    expect(familyStyles.mono).toBe('font-mono');
  });
});
