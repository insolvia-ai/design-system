// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The grid semantics are asserted by hand on this leaf, so they are what the
// test pins. Each day's accessible name is its ISO date rather than its
// number: "17" alone tells a screen-reader user nothing about which month they
// are in, and the native leaf has no `<table>` context to supply it.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Calendar } from './calendar';

const TODAY = '2026-03-11';

describe('Calendar (native leaf)', () => {
  it('renders a grid of six weeks with the month named', () => {
    render(<Calendar today={TODAY} />);

    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
  });

  it('selects a date on press', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Calendar today={TODAY} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: '17 March 2026' }));

    expect(onValueChange).toHaveBeenCalledWith('2026-03-17');
  });

  it('pages to the next month', async () => {
    const user = userEvent.setup();
    render(<Calendar today={TODAY} />);

    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('marks a date outside the range as disabled', () => {
    render(<Calendar today={TODAY} min="2026-03-10" max="2026-03-20" />);

    // Asserted, not pressed: react-native-web renders a disabled Pressable
    // with `pointer-events: none`, so user-event will not click it at all.
    expect(screen.getByRole('button', { name: '5 March 2026' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('resolves the selected day’s colour from the ACTIVE scheme', () => {
    setPrefersColorScheme('dark');
    render(<Calendar today={TODAY} defaultValue="2026-03-17" />);

    expect(rgb(getComputedStyle(screen.getByText('17')).color)).toEqual(
      rgb(colors.dark.primaryText),
    );
  });

  // The 0.23.0 defect, unfixed here until now: this leaf had no
  // `useNativeFocusRing` at all, so every one of its controls fell through to
  // the browser's own outline under react-native-web while the web leaf drew
  // the package's ring on the same three.
  describe('draws the design system’s OWN focus ring', () => {
    it.each([
      ['the previous-month pager', 'Previous month'],
      ['the next-month pager', 'Next month'],
      ['the roving day', '11 March 2026'],
    ])('%s', (_label, name) => {
      setPrefersColorScheme('light');
      render(<Calendar today={TODAY} />);

      const control = screen.getByRole('button', { name });
      expect(getComputedStyle(control).outlineWidth).not.toBe('2px');

      act(() => control.focus());

      const style = getComputedStyle(control);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
    });

    it('resolves the ring colour from the active scheme', () => {
      setPrefersColorScheme('dark');
      render(<Calendar today={TODAY} />);

      const control = screen.getByRole('button', { name: 'Next month' });
      act(() => control.focus());

      expect(rgb(getComputedStyle(control).outlineColor)).toEqual(rgb(colors.dark.accent));
    });

    // Each pager owns its own hook instance, and the grid's 42 cells share one
    // — which is safe only because `ringOn` names the single cell that holds
    // focus. A shared boolean with no name would light every day at once.
    it('rings one control at a time and no other', () => {
      setPrefersColorScheme('light');
      render(<Calendar today={TODAY} />);

      const previous = screen.getByRole('button', { name: 'Previous month' });
      const next = screen.getByRole('button', { name: 'Next month' });
      const day = screen.getByRole('button', { name: '11 March 2026' });

      act(() => day.focus());

      expect(getComputedStyle(day).outlineWidth).toBe('2px');
      expect(getComputedStyle(previous).outlineWidth).not.toBe('2px');
      expect(getComputedStyle(next).outlineWidth).not.toBe('2px');
      expect(
        getComputedStyle(screen.getByRole('button', { name: '12 March 2026' })).outlineWidth,
      ).not.toBe('2px');
    });
  });

  // The roving tabindex moved and DOM focus did not, so the ring, the tab
  // order and what a screen reader announced came apart the moment an arrow
  // was pressed: measured in a browser, ArrowRight off 19 March left
  // `document.activeElement` on 19 and put `tabindex="0"` on 20. The web leaf
  // has always followed the roving cell with real focus.
  describe('the roving tabindex carries real focus with it', () => {
    it('moves focus and the ring on the arrows', async () => {
      setPrefersColorScheme('light');
      const user = userEvent.setup();
      render(<Calendar today={TODAY} />);

      const start = screen.getByRole('button', { name: '11 March 2026' });
      act(() => start.focus());

      await user.keyboard('{ArrowRight}');

      const next = screen.getByRole('button', { name: '12 March 2026' });
      expect(document.activeElement).toBe(next);
      expect(next).toHaveAttribute('tabindex', '0');
      expect(getComputedStyle(next).outlineWidth).toBe('2px');
      expect(getComputedStyle(start).outlineWidth).not.toBe('2px');
    });

    // Where the two leaves genuinely part, and it is react-native-web's doing:
    // its Pressable reads `aria-disabled` off `disabled` and `createDOMProps`
    // turns that into a real `<button disabled>`, which cannot take focus. The
    // web leaf's `aria-disabled` button can. So focus stays put rather than
    // being thrown at an element that would drop it on `<body>` — and the ring
    // stays with focus, because it follows focus and not the tabindex.
    it('leaves focus where it is when the next day is out of range', async () => {
      setPrefersColorScheme('light');
      const user = userEvent.setup();
      // The range ends on the roving day, so one ArrowRight walks off it.
      render(<Calendar today={TODAY} min="2026-03-10" max={TODAY} />);

      const last = screen.getByRole('button', { name: '11 March 2026' });
      act(() => last.focus());

      await user.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(last);
      expect(getComputedStyle(last).outlineWidth).toBe('2px');
      expect(screen.getByRole('button', { name: '12 March 2026' })).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    // The web leaf's `insideRef` guard, in the shape this leaf spells it: a
    // re-render that moves the roving cell must not pull focus in from
    // wherever the page had it.
    it('does not steal focus when the grid does not have it', async () => {
      const user = userEvent.setup();
      render(<Calendar today={TODAY} />);

      const pager = screen.getByRole('button', { name: 'Next month' });
      act(() => pager.focus());

      await user.click(pager);

      expect(document.activeElement).toBe(pager);
    });
  });
});
