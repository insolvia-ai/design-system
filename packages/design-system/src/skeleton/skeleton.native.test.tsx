// NATIVE-leaf tests — see badge.native.test.tsx for what the `native` vitest
// project resolves and why these exist alongside the `.web` tests.
import { render, screen, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Skeleton } from './skeleton';

describe('Skeleton (native leaf)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is decorative — aria-hidden, nothing for assistive tech to stop on', () => {
    // `accessible={false}` is the leaf's real React Native prop for this
    // (see skeleton.native.tsx's header comment), but react-native-web drops
    // both `accessible` and `importantForAccessibility` before they ever
    // reach the DOM — nothing in its `forwardedProps` module names either
    // one. `aria-hidden` rides alongside them for exactly that reason, and
    // it is the one of the three this rendered-through-react-native-web test
    // can actually observe.
    render(<Skeleton testID="case-skeleton" />);

    expect(screen.getByTestId('case-skeleton')).toHaveAttribute('aria-hidden', 'true');
  });

  it('resolves fill colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<Skeleton testID="case-skeleton" />);

    const skeleton = screen.getByTestId('case-skeleton');
    expect(rgb(skeleton.style.backgroundColor)).toEqual(rgb(colors.dark.surfaceAlt));
  });

  it('skips the pulse and settles on a static opacity under reduce motion', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    vi.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: () => undefined,
    } as ReturnType<typeof AccessibilityInfo.addEventListener>);

    render(<Skeleton testID="case-skeleton" />);

    // No crash rendering or reacting to the resolved promise, and the loop
    // this leaf started optimistically before the promise settled winds back
    // down to the static end state rather than continuing to animate.
    await waitFor(() => {
      expect(screen.getByTestId('case-skeleton').style.opacity).toBe('1');
    });
  });
});
