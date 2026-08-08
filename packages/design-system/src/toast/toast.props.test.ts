// Direct unit tests for the shared store — the part BOTH leaves run. Timers
// are the reason this file exists: an expiry that fires at the wrong moment is
// invisible to a rendering test, and "update restarts the clock" is the
// surprising half of every hand-rolled toast implementation.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_TOAST_DURATION, useToastStore } from './toast.props';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useToastStore', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useToastStore());

    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds a toast with the default intent and duration, and returns its id', () => {
    const { result } = renderHook(() => useToastStore());

    let id = '';
    act(() => {
      id = result.current.api.add({ title: 'Jump logged' });
    });

    expect(id).not.toBe('');
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      id,
      title: 'Jump logged',
      intent: 'info',
      duration: DEFAULT_TOAST_DURATION,
    });
  });

  it('dismisses itself after its duration', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.api.add({ title: 'Jump logged', duration: 1000 });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('never expires a toast with duration 0', () => {
    // The escape hatch for a failure the user has to act on — a deadline the
    // user cannot see is not a UI.
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.api.add({ title: 'Upload failed', intent: 'danger', duration: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('patches a toast in place', () => {
    const { result } = renderHook(() => useToastStore());

    let id = '';
    act(() => {
      id = result.current.api.add({ title: 'Uploading…', duration: 0 });
    });
    act(() => {
      result.current.api.update(id, { title: 'Uploaded', intent: 'success' });
    });

    expect(result.current.toasts[0]).toMatchObject({ title: 'Uploaded', intent: 'success' });
  });

  it('leaves intent alone when the patch does not mention it', () => {
    const { result } = renderHook(() => useToastStore());

    let id = '';
    act(() => {
      id = result.current.api.add({ title: 'Uploading…', intent: 'warning', duration: 0 });
    });
    act(() => {
      result.current.api.update(id, { title: 'Still uploading…' });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Still uploading…',
      intent: 'warning',
    });
  });

  it('RESTARTS the clock when the patch changes the duration', () => {
    // Leaving the old timer running would dismiss the UPDATED message after
    // the original message's time.
    const { result } = renderHook(() => useToastStore());

    let id = '';
    act(() => {
      id = result.current.api.add({ title: 'Uploading…', duration: 1000 });
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });
    act(() => {
      result.current.api.update(id, { title: 'Uploaded', duration: 1000 });
    });

    // The original deadline passes and the toast is still up...
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.toasts).toHaveLength(1);

    // ...and it leaves 1000ms after the UPDATE, not after the add.
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('removes one toast and clears them all', () => {
    const { result } = renderHook(() => useToastStore());

    let first = '';
    act(() => {
      first = result.current.api.add({ title: 'One', duration: 0 });
      result.current.api.add({ title: 'Two', duration: 0 });
    });
    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.api.remove(first);
    });
    expect(result.current.toasts.map((toast) => toast.title)).toEqual(['Two']);

    act(() => {
      result.current.api.clear();
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('cancels a pending timer when the toast is removed by hand', () => {
    // Otherwise the timer fires later against a toast that is already gone —
    // harmless today, and a setState on an unmounted store tomorrow.
    const { result } = renderHook(() => useToastStore());

    let id = '';
    act(() => {
      id = result.current.api.add({ title: 'One', duration: 1000 });
    });
    act(() => {
      result.current.api.remove(id);
    });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('drops every pending timer when the store unmounts', () => {
    const { result, unmount } = renderHook(() => useToastStore());

    act(() => {
      result.current.api.add({ title: 'One', duration: 5000 });
      result.current.api.add({ title: 'Two', duration: 5000 });
    });
    expect(vi.getTimerCount()).toBe(2);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
