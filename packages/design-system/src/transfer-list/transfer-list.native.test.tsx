// NATIVE-leaf tests — see button.native.test.tsx for how the `native` vitest
// project resolves './transfer-list' to transfer-list.native.tsx and renders
// it through react-native-web. These pin the row/button a11y wiring
// (accessibilityRole="checkbox"/"button" + the `aria-checked` react-native-web
// cannot derive on its own — see checkbox.native.tsx) and the dark-mode
// color-resolution regression the whole package tests for.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { TransferList } from './transfer-list';
import type { TransferListOption } from './transfer-list.props';

const SHIPS: TransferListOption[] = [
  { value: 'xwing', label: 'X-wing' },
  { value: 'freighter', label: 'YT-1300' },
];

describe('TransferList (native leaf)', () => {
  it('checking a row and pressing the right button fires onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TransferList options={SHIPS} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'X-wing' }));
    await user.click(screen.getByRole('button', { name: 'Move selected right' }));

    expect(onValueChange).toHaveBeenCalledWith(['xwing']);
  });

  it('reports aria-checked on a row and flips it on press', async () => {
    const user = userEvent.setup();
    render(<TransferList options={SHIPS} />);

    const row = screen.getByRole('checkbox', { name: 'X-wing' });
    expect(row).toHaveAttribute('aria-checked', 'false');

    await user.click(row);

    expect(row).toHaveAttribute('aria-checked', 'true');
  });

  it('a disabled row reports aria-disabled and ignores presses', async () => {
    // react-native-web renders `disabled` as `pointer-events: none` (a div,
    // not a real `<input disabled>`), which userEvent's pointer-events check
    // refuses to click outright — that refusal already proves disablement,
    // but it also stops us from proving RN's own press handling swallows the
    // press rather than just the browser's cursor styling. `fireEvent.click`
    // bypasses the pointer-events guard the same way radio-group's disabled
    // test does, so the assertion below is on the handler, not the guard.
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TransferList
        options={[...SHIPS, { value: 'barge', label: 'Sail barge', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );

    const barge = screen.getByRole('checkbox', { name: 'Sail barge' });
    expect(barge).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(barge);
    await user.click(screen.getByRole('button', { name: 'Move all right' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['xwing', 'freighter']);
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors for a checked row when the OS scheme is dark', async () => {
    setPrefersColorScheme('dark');
    const user = userEvent.setup();

    render(<TransferList options={SHIPS} />);
    await user.click(screen.getByRole('checkbox', { name: 'X-wing' }));

    const box = screen.getByTestId('transfer-list-box-xwing');
    expect(rgb(box.style.backgroundColor)).toEqual(rgb(colors.dark.primary));
  });
});
