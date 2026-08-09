// NATIVE-leaf tests, run in the vitest `native` project — native-first
// resolution with react-native aliased to react-native-web, the exact pair the
// app ships on web. That makes these the tests that matter for this component:
// a React Native consumer never renders the `.web` leaf, so its keyboard grammar would be
// unreachable in the product if it lived only there.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Platform, View } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Field } from '../field';
import { Select } from './select';
import type { SelectOption } from './select.props';

const DISTRICTS: SelectOption[] = [
  { value: 'ak', label: 'Alaska' },
  { value: 'az', label: 'Arizona' },
  { value: 'ca', label: 'California', disabled: true },
  { value: 'nj', label: 'New Jersey' },
  { value: 'ny', label: 'New York' },
];

describe('Select (native leaf)', () => {
  it('emits a combobox with the collapsed state', () => {
    render(<Select options={DISTRICTS} aria-label="District" placeholder="Choose a district" />);
    const combobox = screen.getByRole('combobox', { name: 'District' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveTextContent('Choose a district');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens on press and commits the pressed option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={DISTRICTS} onValueChange={onValueChange} aria-label="District" />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeTruthy();

    await user.click(screen.getByRole('option', { name: 'New York' }));
    expect(onValueChange).toHaveBeenCalledWith('ny');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveTextContent('New York');
  });

  it('points aria-controls at the listbox it actually renders', async () => {
    const user = userEvent.setup();
    render(<Select options={DISTRICTS} aria-label="District" />);
    await user.click(screen.getByRole('combobox'));
    const id = screen.getByRole('combobox').getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toBe(screen.getByRole('listbox'));
  });

  describe('keyboard — the reason this leaf has key handlers at all', () => {
    it('opens with ArrowDown and commits with Enter', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Select options={DISTRICTS} onValueChange={onValueChange} aria-label="District" />);
      await user.tab();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('listbox')).toBeTruthy();
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('az');
    });

    it('skips a disabled option while arrowing', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Select options={DISTRICTS} onValueChange={onValueChange} aria-label="District" />);
      await user.tab();
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('nj');
    });

    it('closes on Escape without committing', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Select options={DISTRICTS} onValueChange={onValueChange} aria-label="District" />);
      await user.tab();
      await user.keyboard('{ArrowDown}{ArrowDown}{Escape}');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('reaches a multi-word label by typing through the space', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Select options={DISTRICTS} onValueChange={onValueChange} aria-label="District" />);
      await user.tab();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('new j{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('nj');
    });

    it('tracks the highlight in aria-activedescendant', async () => {
      const user = userEvent.setup();
      render(<Select options={DISTRICTS} aria-label="District" />);
      await user.tab();
      await user.keyboard('{ArrowDown}');
      const id = screen.getByRole('combobox').getAttribute('aria-activedescendant');
      expect(document.getElementById(id!)).toBe(screen.getByRole('option', { name: 'Alaska' }));
    });
  });

  // Reported from a real browser: hovering a row gave no feedback about which
  // option a click was about to commit. The highlight existed, but only the
  // ARROW KEYS moved it — so a pointer user saw nothing, and the web leaf,
  // which has always highlighted on `onMouseEnter`, disagreed with this one
  // under the one interaction anyone uses in a browser.
  describe('hover', () => {
    it('moves the highlight to the hovered option', async () => {
      const user = userEvent.setup();
      render(<Select options={DISTRICTS} aria-label="District" />);
      await user.click(screen.getByRole('combobox'));

      const option = screen.getByRole('option', { name: 'New Jersey' });
      await user.hover(option);

      // The paint AND the a11y consequence: the same `active` state drives
      // both, which is what makes hover and the arrow keys one mechanism
      // rather than two.
      expect(rgb(option.style.backgroundColor)).toEqual(rgb(colors.light.surfaceAlt));
      const id = screen.getByRole('combobox').getAttribute('aria-activedescendant');
      expect(document.getElementById(id!)).toBe(option);
    });

    it('will not highlight a disabled option', async () => {
      const user = userEvent.setup();
      render(<Select options={DISTRICTS} aria-label="District" />);
      await user.click(screen.getByRole('combobox'));

      // Asserted, not hovered — the same shape as the disabled-trigger test
      // above. react-native-web gives a disabled Pressable
      // `pointer-events: none`, so the hover never reaches it and user-event
      // refuses to fake one; that IS the guarantee. The `option.disabled`
      // guard in `onHoverIn` is the belt to this file's braces, for a platform
      // that delivers the event anyway.
      const disabled = screen.getByRole('option', { name: 'California' });
      expect(disabled).toHaveStyle({ pointerEvents: 'none' });
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');
    });
  });

  describe('inside a Field', () => {
    it('is named by the field label through aria-labelledby', () => {
      // The native direction: the control points BACK at the label, which is
      // what react-native-web can express — Field's native leaf establishes it.
      render(
        <Field.Root>
          <Field.Label>Destination system</Field.Label>
          <Select options={DISTRICTS} />
        </Field.Root>,
      );
      expect(screen.getByRole('combobox', { name: 'Destination system' })).toBeTruthy();
    });

    it('takes the field invalid state and description', () => {
      render(
        <Field.Root invalid>
          <Field.Label>Destination system</Field.Label>
          <Select options={DISTRICTS} />
          <Field.Error>A destination system is required.</Field.Error>
        </Field.Root>,
      );
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
      expect(combobox).toHaveAccessibleDescription('A destination system is required.');
    });
  });

  it('cannot be pressed while disabled', () => {
    render(<Select options={DISTRICTS} disabled aria-label="District" />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-disabled', 'true');
    // react-native-web's own guarantee for a disabled Pressable, and the thing
    // user-event refuses to click through — asserted directly rather than by
    // attempting a click that the test library will not perform.
    expect(combobox).toHaveStyle({ pointerEvents: 'none' });
  });

  // The 0.2.1 regression: colors baked in at module load stayed light inside a
  // dark app. Both schemes are asserted on the trigger label.
  it('resolves dark colors when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');
    render(<Select options={DISTRICTS} value="ny" aria-label="District" />);
    expect(rgb(screen.getByText('New York').style.color)).toEqual(rgb(colors.dark.ink));
  });

  it('resolves light colors when the OS scheme is light', () => {
    render(<Select options={DISTRICTS} value="ny" aria-label="District" />);
    expect(rgb(screen.getByText('New York').style.color)).toEqual(rgb(colors.light.ink));
  });
  describe('stacking', () => {
    // Reported from a real browser, not found by this suite: the open list
    // rendered BEHIND the description text, the file button and the submit
    // button that followed the Select in the form. react-native-web gives
    // every View `position: relative; z-index: 0`, so EVERY wrapper View is
    // its own stacking context — elevation set in here (or in the enclosing
    // Field) reaches exactly one level and dies at the first wrapper a
    // consumer adds. In a browser the fix is a portal: the open list renders
    // as a child of document.body, where no consumer wrapper can paint over
    // it. These tests pin the portal, since paint order itself is invisible
    // to jsdom.
    it('portals the open list out of every consumer stacking context', async () => {
      const user = userEvent.setup();
      // The wrapper stands in for a consumer's screen section: a plain View,
      // which react-native-web makes a stacking context. Before the portal,
      // nothing the package did could lift the list past this wrapper's
      // siblings.
      render(
        <View testID="consumer-wrapper">
          <Select options={DISTRICTS} aria-label="District" testID="select-root" />
        </View>,
      );

      await user.click(screen.getByRole('combobox'));
      const list = screen.getByRole('listbox');
      expect(list.parentElement).toBe(document.body);
      expect(screen.getByTestId('consumer-wrapper')).not.toContainElement(list);

      // The root must NOT elevate: with the list portaled out there is
      // nothing to lift, and an open Select creating a stacking context of
      // its own would shadow siblings for no reason. Asserted on the CLASS,
      // not `style.zIndex` — react-native-web compiles StyleSheet rules to
      // atomic classes (`r-zIndex-…`) and sets no inline style.
      expect(screen.getByTestId('select-root').className).not.toMatch(/r-zIndex-/);
    });

    it('removes the portaled list when closed', async () => {
      const user = userEvent.setup();
      render(<Select options={DISTRICTS} aria-label="District" />);

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeTruthy();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    // The INLINE route — what a real native device renders, where there is no
    // document to portal into. Forced by pointing Platform.OS away from
    // 'web': `overlayPortalEnabled()` reads it at render time, which is what
    // makes this switchable per-test at all.
    describe('inline (real native)', () => {
      const platformOS = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
      beforeEach(() => {
        Object.defineProperty(Platform, 'OS', { ...platformOS, value: 'ios' });
      });
      afterEach(() => {
        Object.defineProperty(Platform, 'OS', platformOS);
      });

      it('renders the list inside the root and lifts the root while open', async () => {
        const user = userEvent.setup();
        render(<Select options={DISTRICTS} aria-label="District" testID="select-root" />);

        const root = screen.getByTestId('select-root');
        expect(root.className).not.toMatch(/r-zIndex-/);

        await user.click(screen.getByRole('combobox'));
        expect(root).toContainElement(screen.getByRole('listbox'));
        // The root carries the elevation, not just the popup: z-index only
        // orders siblings, so the popup's own could never lift it past a
        // sibling following the whole Select.
        expect(root.className).toMatch(/r-zIndex-/);
      });

      it('creates no stacking context once closed', async () => {
        // A closed Select must not shadow anything of its own accord.
        const user = userEvent.setup();
        render(<Select options={DISTRICTS} aria-label="District" testID="select-root" />);
        const root = screen.getByTestId('select-root');

        await user.click(screen.getByRole('combobox'));
        expect(root.className).toMatch(/r-zIndex-/);

        await user.keyboard('{Escape}');
        expect(root.className).not.toMatch(/r-zIndex-/);
      });
    });
  });

  it('carries its accessible name on the combobox and not on a wrapper', async () => {
    // THE DEFECT THIS GUARDS. `aria-label` used to stay in `...props` and land
    // on the root View as well as the combobox, so one control answered to its
    // own name twice: React Native Testing Library reported two matches, and a
    // screen reader met a name on a node with no role to attach it to.
    //
    // Asserting `getByLabelText` throws on a duplicate is what catches it —
    // `getByRole` alone passes either way, because the combobox was always
    // labelled correctly.
    render(<Select aria-label="Destination system" options={DISTRICTS} />);

    // Exactly one node answers to the name. `getAllBy` rather than `getBy`
    // because `getBy` throwing on a duplicate would be a less legible failure
    // than a length assertion.
    expect(screen.getAllByLabelText('Destination system')).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: 'Destination system' })).toBeTruthy();
  });

  it('names the open listbox after the control', async () => {
    // A listbox with no accessible name is announced as an unlabelled group.
    // The web leaf names its <ul>; this makes the native leaf agree.
    const user = userEvent.setup();
    render(<Select aria-label="Destination system" options={DISTRICTS} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox', { name: 'Destination system' })).toBeTruthy();
  });
});
