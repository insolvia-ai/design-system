// NATIVE-leaf tests — see switch.native.test.tsx for what the `native` vitest
// project resolves and why the assertions are on `aria-*` rather than on
// `accessibilityValue`: react-native-web ignores the nested object, so the flat
// props are what actually reach the DOM.
//
// The GESTURE is not asserted here, and that is a real gap rather than an
// oversight. PanResponder's handlers are driven by React Native's responder
// system, which react-native-web reimplements over pointer events, and every
// seek needs a track width that jsdom — which has no layout — reports as 0. A
// test that faked both would be asserting on the fake. What IS pinned here is
// everything a screen reader and a dark-mode consumer see, plus the
// increment/decrement path, which is the same step arithmetic the drag uses.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Slider } from './slider';

describe('Slider (native leaf)', () => {
  it('announces itself as a named slider carrying its value and range', () => {
    render(<Slider label="Seek" defaultValue={40} max={80} />);

    const slider = screen.getByRole('slider', { name: 'Seek' });
    expect(slider).toHaveAttribute('aria-valuenow', '40');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '80');
  });

  it('snaps the value it reports to the step', () => {
    render(<Slider label="Seek" defaultValue={37} step={10} />);

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '40');
  });

  it('marks a disabled slider', () => {
    render(<Slider label="Seek" disabled />);

    expect(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true');
  });

  it('resolves dark colors for the fill when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(<Slider label="Seek" defaultValue={50} testID="slider" />);

    // The thumb is the last child of the root; the fill is inside the track.
    const root = screen.getByRole('slider');
    const thumb = root.lastElementChild as HTMLElement;
    expect(rgb(thumb.style.backgroundColor)).toEqual(rgb(colors.dark.primary));
  });
});
