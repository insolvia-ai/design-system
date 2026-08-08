// Direct unit tests for the shared live-region rule — the part BOTH leaves
// execute. Getting this wrong is not a visual bug: an `alert` role interrupts
// a screen reader mid-sentence, so "Saved" announced assertively is a real
// defect that no rendering test would call out.
import { describe, expect, it } from 'vitest';

import { alertRole, stripeStyles, type AlertIntent } from './alert.props';

const INTENTS: readonly AlertIntent[] = ['info', 'success', 'warning', 'danger'];

describe('alertRole', () => {
  it('interrupts only for the intents that describe something going wrong', () => {
    expect(alertRole('danger')).toBe('alert');
    expect(alertRole('warning')).toBe('alert');
  });

  it('stays polite for informational intents', () => {
    expect(alertRole('info')).toBe('status');
    expect(alertRole('success')).toBe('status');
  });
});

describe('stripeStyles', () => {
  it('covers every intent', () => {
    for (const intent of INTENTS) {
      expect(stripeStyles[intent]).toMatch(/^border-l-/);
    }
  });
});
