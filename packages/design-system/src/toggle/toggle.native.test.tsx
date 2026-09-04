// NATIVE-leaf tests. They run in the vitest `native` project, whose resolver
// is Metro's view of the package (native-first extensions, react-native
// aliased to react-native-web), so the extensionless './toggle' below lands
// on toggle.native.tsx and renders through the same react-native-web a React Native
// consumer ships on web. Assertions are made on the DOM it emits.
//
// The leaf deliberately renders `accessibilityRole="button"` (NOT
// `"togglebutton"`, despite react-native's own types accepting it) with a
// forwarded `aria-pressed` — see toggle.native.tsx's header comment for why:
// this react-native-web version gives `role="togglebutton"` no computed
// accessible name and never translates `accessibilityState` into any
// `aria-*` attribute at all. These tests pin the working behavior so a
// regression back to `"togglebutton"`/`accessibilityState` is caught here,
// not discovered on the shipped (web-only) app.
import { act, render, screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Toggle } from './toggle';

describe('Toggle (native leaf)', () => {
  it('renders as a named button and fires onPressedChange on press', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();

    render(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>);

    const toggle = screen.getByRole('button', { name: 'Bold' });
    await user.click(toggle);

    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('wires aria-pressed to the pressed state', async () => {
    const user = userEvent.setup();

    render(<Toggle>Bold</Toggle>);

    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('wires aria-disabled and blocks press', async () => {
    // react-native-web renders `disabled` as `pointer-events: none` (a div,
    // not a real `<button disabled>`), which user-event's default pointer
    // check already refuses to click — that refusal IS proof of disablement,
    // but bypassing it here also proves RN's own press handling swallows the
    // press, not just the browser's cursor styling (see
    // checkbox.native.test.tsx for the same reasoning).
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    const onPressedChange = vi.fn();

    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );

    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('aria-disabled', 'true');

    await user.click(toggle);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('resolves light colors when the OS scheme is light and the toggle is pressed', async () => {
    const user = userEvent.setup();
    render(<Toggle>Bold</Toggle>);

    const toggle = screen.getByRole('button', { name: 'Bold' });
    await user.click(toggle);

    expect(rgb(toggle.style.backgroundColor)).toEqual(rgb(colors.light.primary));
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors when the OS scheme is dark and the toggle is pressed', async () => {
    setPrefersColorScheme('dark');
    const user = userEvent.setup();

    render(<Toggle>Bold</Toggle>);

    const toggle = screen.getByRole('button', { name: 'Bold' });
    await user.click(toggle);

    expect(rgb(toggle.style.backgroundColor)).toEqual(rgb(colors.dark.primary));
  });

  // lib/native-focus.native.ts exists because an unringed native control falls
  // through to Chrome's blue outline under react-native-web. The migration that
  // introduced it reached the text inputs only, so every Pressable — this one
  // included — kept the browser's ring while its web leaf drew the package's.
  it('draws the design system’s OWN focus ring, not the browser default', () => {
    setPrefersColorScheme('light');
    render(<Toggle>Bold</Toggle>);

    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(getComputedStyle(toggle).outlineWidth).not.toBe('2px');

    act(() => toggle.focus());

    const style = getComputedStyle(toggle);
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');
    expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
  });

  // A React Native parent defaults to `alignItems: 'stretch'`, so a text toggle
  // in an ordinary column View stretched edge to edge while the web leaf —
  // which carries `inline-flex` — hugged its label. `iconOnly` was already
  // immune, sizing itself from a definite width, which is how the two halves of
  // one component came to disagree.
  it('shrink-wraps rather than filling its parent', () => {
    render(<Toggle>Bold</Toggle>);

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveStyle({
      alignSelf: 'flex-start',
    });
  });
});
