// Direct unit tests for the shared, renderer-free logic: the status
// derivation, the clickability rule, and the native accessibility-label
// builder. All three are pure functions of their arguments, so they are
// pinned here once instead of once per platform.
import { describe, expect, it } from 'vitest';

import {
  deriveStatus,
  isStepClickable,
  stepAccessibilityLabel,
  stepSrSuffix,
} from './stepper.props';

describe('deriveStatus', () => {
  it('marks every index before the active one completed', () => {
    expect(deriveStatus(0, 2)).toBe('completed');
    expect(deriveStatus(1, 2)).toBe('completed');
  });

  it('marks the active index active', () => {
    expect(deriveStatus(2, 2)).toBe('active');
  });

  it('marks every index after the active one upcoming', () => {
    expect(deriveStatus(3, 2)).toBe('upcoming');
    expect(deriveStatus(4, 2)).toBe('upcoming');
  });

  it('never returns error — that is only ever an explicit override', () => {
    for (let index = 0; index < 5; index += 1) {
      expect(deriveStatus(index, 2)).not.toBe('error');
    }
  });
});

describe('isStepClickable', () => {
  it('is never clickable when the root is not interactive, whatever the status', () => {
    expect(isStepClickable('completed', false, true)).toBe(false);
    expect(isStepClickable('completed', false, false)).toBe(false);
  });

  it('linear mode only allows a completed step', () => {
    expect(isStepClickable('completed', true, true)).toBe(true);
    expect(isStepClickable('active', true, true)).toBe(false);
    expect(isStepClickable('upcoming', true, true)).toBe(false);
  });

  it('linear mode does not allow an errored step, even one before the active one', () => {
    // A step marked `error` no longer displays as `'completed'`, and
    // re-visiting a failed step is exactly the case linear mode gates.
    expect(isStepClickable('error', true, true)).toBe(false);
  });

  it('non-linear mode allows any status', () => {
    expect(isStepClickable('completed', true, false)).toBe(true);
    expect(isStepClickable('active', true, false)).toBe(true);
    expect(isStepClickable('upcoming', true, false)).toBe(true);
    expect(isStepClickable('error', true, false)).toBe(true);
  });
});

describe('stepSrSuffix', () => {
  it('adds a suffix for completed and error, nothing for active/upcoming', () => {
    expect(stepSrSuffix('completed')).toBe(' (completed)');
    expect(stepSrSuffix('error')).toBe(' (error)');
    expect(stepSrSuffix('active')).toBeNull();
    expect(stepSrSuffix('upcoming')).toBeNull();
  });
});

describe('stepAccessibilityLabel', () => {
  it('is 1-indexed and maps active to "current"', () => {
    expect(stepAccessibilityLabel(0, 'Account', 'completed')).toBe('Step 1: Account, completed');
    expect(stepAccessibilityLabel(1, 'Profile', 'active')).toBe('Step 2: Profile, current');
    expect(stepAccessibilityLabel(2, 'Review', 'upcoming')).toBe('Step 3: Review, upcoming');
    expect(stepAccessibilityLabel(3, 'Done', 'error')).toBe('Step 4: Done, error');
  });
});
