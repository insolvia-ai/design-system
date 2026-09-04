// Direct unit tests for the heading-family resolver the native leaves share.
// The rendered proof — both workbench panes painting a heading in the same
// family — is what the leaf-pair stories show; these pin the two rules that
// make it possible, including the one no rendered test can reach.
import { describe, expect, it } from 'vitest';

import { typography } from '@insolvia-ai/tokens';

import {
  headingFamily,
  headingFamilyByPlatform,
  monoFamily,
  monoFamilyByPlatform,
} from './native-typography';

describe('headingFamily', () => {
  // This project aliases react-native to react-native-web — the pair a React
  // Native consumer ships on web, and the pair the workbench renders. So this
  // assertion runs the workbench's own path: if it fails, the native pane has
  // stopped resolving the family the `.web` leaf's `font-heading` resolves,
  // and the two panes are no longer comparable at all.
  it('resolves to the token stack on web, matching the .web leaf exactly', () => {
    expect(headingFamily).toBe(typography.heading);
  });

  it('is always a non-empty family', () => {
    expect(headingFamily.length).toBeGreaterThan(0);
  });
});

describe('headingFamilyByPlatform', () => {
  // The arms this platform did not take. `Platform.select` resolves at module
  // load, so on web `headingFamily` can never exercise ios/android — and a
  // stack quietly parked in one of them is precisely the bug this module was
  // written to remove, invisible to every other check in the repo.
  it.each(['ios', 'android'] as const)(
    'gives %s a single registered family, never a CSS stack',
    (os) => {
      // React Native matches ONE registered family name. A comma-separated
      // stack matches nothing and falls back to the system sans, which is the
      // divergence that shipped: web serif, native sans, no error anywhere.
      expect(headingFamilyByPlatform[os]).not.toContain(',');
      expect(headingFamilyByPlatform[os].length).toBeGreaterThan(0);
    },
  );

  it('keeps the web arm as the token stack, so no leaf hard-codes type', () => {
    expect(headingFamilyByPlatform.default).toBe(typography.heading);
  });
});

describe('monoFamily', () => {
  // The `heading` rules, one family down — same seam, same two failure modes.
  it('resolves to the token stack on web, matching the .web leaf exactly', () => {
    expect(monoFamily).toBe(typography.mono);
  });

  it.each(['ios', 'android'] as const)(
    'gives %s a single registered family, never a CSS stack',
    (os) => {
      expect(monoFamilyByPlatform[os]).not.toContain(',');
      expect(monoFamilyByPlatform[os].length).toBeGreaterThan(0);
    },
  );

  it('keeps the web arm as the token stack, so no leaf hard-codes type', () => {
    expect(monoFamilyByPlatform.default).toBe(typography.mono);
  });

  it('is a different family from heading — the whole point of the prop', () => {
    expect(monoFamilyByPlatform.ios).not.toBe(headingFamilyByPlatform.ios);
    expect(monoFamilyByPlatform.android).not.toBe(headingFamilyByPlatform.android);
  });
});
