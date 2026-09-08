// NATIVE-leaf tests — see button.native.test.tsx for how the `native` vitest
// project resolves './button-group' to button-group.native.tsx and renders it
// through react-native-web, the pair a React Native consumer ships on web.
// Root itself carries no accessibility role (see its file header — there is
// no group landmark here, unlike ToggleGroup's), but Item carries real
// press/disabled/colour wiring, which is what this file pins.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { ButtonGroup } from './button-group';

describe('ButtonGroup (native leaf)', () => {
  it('renders its member Items and fires onPress', async () => {
    const user = userEvent.setup();
    const onDay = vi.fn();

    render(
      <ButtonGroup.Root>
        <ButtonGroup.Item onPress={onDay}>Day</ButtonGroup.Item>
        <ButtonGroup.Item>Week</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    const day = screen.getByRole('button', { name: 'Day' });
    await user.click(day);

    expect(onDay).toHaveBeenCalledTimes(1);
  });

  it('disabled on the Root disables every Item', () => {
    // react-native-web renders `disabled` as `pointer-events: none`, which
    // userEvent's pointer-events guard already refuses to click — that alone
    // proves disablement but not that RN's OWN press handling swallows the
    // press, so `fireEvent.click` bypasses the guard the same way
    // toggle-group.native.test.tsx's disabled test does.
    const onDay = vi.fn();

    render(
      <ButtonGroup.Root disabled>
        <ButtonGroup.Item onPress={onDay}>Day</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    const day = screen.getByRole('button', { name: 'Day' });
    expect(day).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(day);
    expect(onDay).not.toHaveBeenCalled();
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors for a primary Item when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(
      <ButtonGroup.Root intent="primary">
        <ButtonGroup.Item>Day</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    const day = screen.getByRole('button', { name: 'Day' });
    expect(rgb(day.style.backgroundColor)).toEqual(rgb(colors.dark.primary));
  });

  it('resolves light colors for a primary Item when the OS scheme is light', () => {
    setPrefersColorScheme('light');

    render(
      <ButtonGroup.Root intent="primary">
        <ButtonGroup.Item>Day</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    const day = screen.getByRole('button', { name: 'Day' });
    expect(rgb(day.style.backgroundColor)).toEqual(rgb(colors.light.primary));
  });

  // Same family as the 0.12.2 Popover/Tooltip collapse: a native leaf
  // declaring nothing on an axis inherits its parent's answer, and a React
  // Native parent defaults to `alignItems: 'stretch'`.
  it('shrink-wraps rather than filling its parent', () => {
    render(
      <ButtonGroup.Root>
        <ButtonGroup.Item>Day</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    const day = screen.getByRole('button', { name: 'Day' });
    // Root is the day button's parent View, which react-native-web renders
    // as the button's containing element — assert on the group instead of
    // reaching for a role Root does not carry.
    expect(day.parentElement).toHaveStyle({ alignSelf: 'flex-start' });
  });
});
