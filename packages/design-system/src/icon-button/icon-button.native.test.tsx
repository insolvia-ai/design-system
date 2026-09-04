// NATIVE-leaf tests. They run in the vitest `native` project, whose resolver
// is Metro's view of the package (native-first extensions, react-native
// aliased to react-native-web), so the extensionless './icon-button' below
// lands on icon-button.native.tsx and renders through the same
// react-native-web a React Native consumer ships on web.
//
// `aria-pressed` rather than `accessibilityState` is what these assert, for
// the reason toggle.native.tsx measured against this repo's pinned
// react-native-web: it does not flatten `accessibilityState` into any `aria-*`
// attribute, so the state exists only if the leaf also forwards the ARIA prop.
import { act, render, screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { IconButton } from './icon-button';

const Glyph = () => <Text>×</Text>;

describe('IconButton (native leaf)', () => {
  it('takes its accessible name from label and fires onPress', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    render(
      <IconButton label="Dismiss" onPress={onPress}>
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders no aria-pressed at all when pressed is not given', () => {
    render(
      <IconButton label="Dismiss">
        <Glyph />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Dismiss' })).not.toHaveAttribute('aria-pressed');
  });

  it('wires aria-pressed when pressed is given', () => {
    const { rerender } = render(
      <IconButton label="Mute" pressed={false}>
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Mute' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <IconButton label="Mute" pressed>
        <Glyph />
      </IconButton>,
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('wires aria-disabled and blocks the press', async () => {
    // react-native-web renders `disabled` as `pointer-events: none` (a div,
    // not a real `<button disabled>`), which user-event's default pointer
    // check already refuses to click — bypassing it proves RN's own press
    // handling swallows the press too, not just the cursor styling.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    const onPress = vi.fn();

    render(
      <IconButton label="Dismiss" disabled onPress={onPress}>
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('resolves light colors when the OS scheme is light', () => {
    render(
      <IconButton label="Delete" intent="danger">
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(rgb(button.style.backgroundColor)).toEqual(rgb(colors.light.danger));
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(
      <IconButton label="Delete" intent="danger">
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(rgb(button.style.backgroundColor)).toEqual(rgb(colors.dark.danger));
  });

  // lib/native-focus.native.ts exists because an unringed native control falls
  // through to Chrome's blue outline under react-native-web. The migration that
  // introduced it reached the text inputs only, so every Pressable — this one
  // included — kept the browser's ring while its web leaf drew the package's.
  it('draws the design system’s OWN focus ring, not the browser default', () => {
    setPrefersColorScheme('light');
    render(
      <IconButton label="Dismiss">
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(getComputedStyle(button).outlineWidth).not.toBe('2px');

    act(() => button.focus());

    const style = getComputedStyle(button);
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');
    expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
  });
});
