// Direct unit tests for the shared image-status state machine and the size
// map both leaves render off of.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { avatarSizePx, splitGroup, useAvatarImageStatus } from './avatar.props';

describe('useAvatarImageStatus', () => {
  it('starts idle — Fallback shows until an image resolves', () => {
    const { result } = renderHook(() => useAvatarImageStatus());

    expect(result.current[0]).toBe('idle');
  });

  it('moves to loaded when set, and back to error when set again', () => {
    const { result } = renderHook(() => useAvatarImageStatus());

    act(() => result.current[1]('loaded'));
    expect(result.current[0]).toBe('loaded');

    act(() => result.current[1]('error'));
    expect(result.current[0]).toBe('error');
  });
});

describe('avatarSizePx', () => {
  it('maps each size to its fixed pixel box', () => {
    expect(avatarSizePx.sm).toBe(24);
    expect(avatarSizePx.md).toBe(32);
    expect(avatarSizePx.lg).toBe(40);
  });

  describe('splitGroup', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];

    it('shows everything when there is no max', () => {
      expect(splitGroup(items, undefined)).toEqual({ visible: items, overflow: 0 });
    });

    it('shows everything when max is at or above the count', () => {
      // No "+0" chip: a counter for nothing is worse than no counter.
      expect(splitGroup(items, 5).overflow).toBe(0);
      expect(splitGroup(items, 9).overflow).toBe(0);
    });

    it('counts the remainder, not the replaced avatar', () => {
      // max=4 must read "+1", not "+2" — the chip is extra, it does not stand in
      // for the last visible avatar.
      expect(splitGroup(items, 4)).toEqual({ visible: ['a', 'b', 'c', 'd'], overflow: 1 });
      expect(splitGroup(items, 2)).toEqual({ visible: ['a', 'b'], overflow: 3 });
    });

    it('treats a negative max as zero rather than slicing from the end', () => {
      expect(splitGroup(items, -3)).toEqual({ visible: [], overflow: 5 });
    });
  });
});
