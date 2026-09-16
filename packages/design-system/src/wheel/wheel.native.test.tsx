// NATIVE-leaf tests, run in the vitest `native` project — native-first
// resolution with react-native aliased to react-native-web, the exact pair a
// React Native consumer ships on web. That makes these the tests that matter
// for this component: the keyboard grammar and the listbox semantics both live
// in the leaf, and a consumer on this leaf never renders the `.web` one, so a
// break here would be unreachable by every test in the other project.
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  describe('a scroll event that outlives the leaf', () => {
    // THE ONE BUG IN THIS COMPONENT THAT CORRUPTED DATA. react-native-web's
    // ScrollViewBase schedules its scroll-end with a plain 100ms `setTimeout`
    // and never clears it on unmount, so it calls `onScroll` once more into a
    // leaf that has gone. Unguarded, that late event re-armed the settle timer
    // AFTER the cleanup which clears it had run, and 120ms later `settle`
    // committed whatever row the offset named. Through DateInput that meant
    // closing the native picker within about 100ms of opening it rewrote the
    // field it was opened on: `2019-02-14` became `1926-02-14`, on a date
    // field, silently.
    //
    // ONE INGREDIENT IS HAND-APPLIED, AND IT IS THE ONLY ONE. RNW's late
    // callback is real here — these are its own timers, not a stand-in for
    // them — but `normalizeScrollEvent` reads the position off the DOM node
    // through a getter, and a browser zeroes `scrollTop` when it detaches the
    // node while jsdom keeps the last value it was given. So the zero is set
    // below by hand, standing in for the detach, which is the single part of
    // the sequence a layout-free DOM cannot produce. The invariant asserted is
    // the general one anyway: a scroll event arriving after the leaf is gone
    // commits nothing, whatever offset it claims.
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('commits nothing', () => {
      const onValueChange = vi.fn();
      const { unmount } = render(
        <Wheel label="Year" items={YEARS} defaultValue="2020" onValueChange={onValueChange} />,
      );
      const listbox = screen.getByRole('listbox');

      fireEvent.scroll(listbox);
      unmount();
      // The detach, by hand. See above.
      listbox.scrollTop = 0;
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onValueChange).not.toHaveBeenCalled();
    });
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

  // The single tab stop above is the column's ONE focusable element, and until
  // now it was the one element with no ring: under react-native-web it fell
  // through to the browser's own outline while the web leaf ringed the same
  // listbox in the package's accent. A datetime picker is six of these in a
  // row, so it is the surface where the mismatch is hardest to miss.
  describe('draws the design system’s OWN focus ring on the listbox', () => {
    it('rings the listbox in the active scheme’s accent', () => {
      setPrefersColorScheme('light');
      render(<Wheel label="Year" items={YEARS} defaultValue="2020" />);

      const listbox = screen.getByRole('listbox');
      expect(getComputedStyle(listbox).outlineWidth).not.toBe('2px');

      act(() => listbox.focus());

      const style = getComputedStyle(listbox);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
    });

    it('resolves the ring colour from the active scheme', () => {
      setPrefersColorScheme('dark');
      render(<Wheel label="Year" items={YEARS} defaultValue="2020" />);

      const listbox = screen.getByRole('listbox');
      act(() => listbox.focus());

      expect(rgb(getComputedStyle(listbox).outlineColor)).toEqual(rgb(colors.dark.accent));
    });
  });
});
