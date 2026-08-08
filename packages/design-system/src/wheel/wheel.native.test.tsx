// NATIVE-leaf tests, run in the vitest `native` project — native-first
// resolution with react-native aliased to react-native-web, the exact pair a
// React Native consumer ships on web. That makes these the tests that matter
// for this component: the keyboard grammar and the listbox semantics both live
// in the leaf, and a consumer on this leaf never renders the `.web` one, so a
// break here would be unreachable by every test in the other project.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import type { WheelItem } from './wheel.props';
import { Wheel } from './wheel';

const YEARS: WheelItem[] = Array.from({ length: 41 }, (_, index) => {
  const year = 1990 + index;
  return { value: String(year), label: String(year) };
});

describe('Wheel (native leaf)', () => {
  it('emits a listbox of options, named and with one selected', () => {
    render(<Wheel label="Year" items={YEARS} defaultValue="2020" />);
    expect(screen.getByRole('listbox', { name: 'Year' })).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(YEARS.length);
    expect(screen.getByRole('option', { name: '2020' })).toHaveAttribute('aria-selected', 'true');
  });

  it('is a single tab stop pointing at the selected row', () => {
    // react-native-web gives every enabled Pressable `tabIndex="0"`, so without
    // the override in the leaf this column alone is forty-one tab stops and a
    // datetime picker is about a hundred and fifty. The web leaf was correct
    // and this one was not — which is the whole reason native leaves get their
    // own tests.
    render(<Wheel label="Year" items={YEARS} defaultValue="2020" />);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('tabindex', '0');
    for (const option of screen.getAllByRole('option')) {
      expect(option).toHaveAttribute('tabindex', '-1');
    }
    expect(listbox.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: '2020' }).id,
    );
  });

  describe('keyboard — the reason this leaf has key handlers at all', () => {
    it('moves a row on the arrows and jumps on Home/End', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Wheel label="Year" items={YEARS} defaultValue="2020" onValueChange={onValueChange} />,
      );

      const listbox = screen.getByRole('listbox');
      listbox.focus();

      await user.keyboard('{ArrowDown}');
      expect(onValueChange).toHaveBeenLastCalledWith('2021');
      await user.keyboard('{Home}');
      expect(onValueChange).toHaveBeenLastCalledWith('1990');
    });
  });

  it('selects a row that is pressed', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Wheel label="Year" items={YEARS} defaultValue="2020" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('option', { name: '2023' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('2023');
  });

  it('refuses a disabled row from both the pointer and the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const withGap: WheelItem[] = [
      { value: '2019', label: '2019' },
      { value: '2020', label: '2020', disabled: true },
      { value: '2021', label: '2021' },
    ];
    render(
      <Wheel label="Year" items={withGap} defaultValue="2019" onValueChange={onValueChange} />,
    );

    // Asserted, not clicked: react-native-web can only speak ARIA here, never
    // the real `disabled` attribute.
    expect(screen.getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');

    screen.getByRole('listbox').focus();
    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith('2021');
  });

  it('resolves the selection band at RENDER time, so it follows the scheme', () => {
    // 0.2.1 shipped every native leaf reading `colors.light` at module load, so
    // each surface stayed light inside a dark app. The band is this component's
    // only painted surface, which makes it the one worth pinning.
    setPrefersColorScheme('dark');
    const { container } = render(<Wheel label="Year" items={YEARS} defaultValue="2020" />);

    const band = container.querySelector('[aria-hidden="true"]');
    expect(band).toBeTruthy();
    expect(rgb(getComputedStyle(band as Element).backgroundColor)).toEqual(
      rgb(colors.dark.surfaceAlt),
    );
  });
});
