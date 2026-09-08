// NATIVE-leaf tests. They run in the vitest `native` project, whose resolver
// is Metro's view of the package (native-first extensions, react-native
// aliased to react-native-web), so the extensionless './stepper' below lands
// on stepper.native.tsx and renders through the same react-native-web a
// React Native consumer ships on web. Assertions are made on the DOM it
// emits.
import * as React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Stepper } from './stepper';
import { stepAccessibilityLabel } from './stepper.props';

function Flow(props: Partial<React.ComponentProps<typeof Stepper.Root>> = {}) {
  return (
    <Stepper.Root defaultActiveStep={2} {...props}>
      <Stepper.Step label="Account" />
      <Stepper.Step label="Profile" />
      <Stepper.Step label="Review" />
      <Stepper.Step label="Done" />
    </Stepper.Root>
  );
}

describe('Stepper (native leaf)', () => {
  it('an interactive completed step is a Pressable and fires onActiveStepChange on press', async () => {
    const onActiveStepChange = vi.fn();
    const user = userEvent.setup();
    render(<Flow interactive onActiveStepChange={onActiveStepChange} />);

    const accountStep = screen.getByRole('button', {
      name: stepAccessibilityLabel(0, 'Account', 'completed'),
    });
    await user.click(accountStep);

    expect(onActiveStepChange).toHaveBeenCalledTimes(1);
    expect(onActiveStepChange).toHaveBeenCalledWith(0);
  });

  // `accessibilityState.selected` is what real iOS/Android accessibility
  // reads; react-native-web does not unpack it into an `aria-*` attribute on
  // its own (see the leaf's own comment), so the active step is mirrored
  // explicitly with `aria-current="step"` instead — the same token the web
  // leaf's `<li aria-current="step">` uses, and the only one valid on the
  // `listitem`/`button` roles axe checks this leaf against.
  it('exposes the active step via aria-current="step", and no other step', () => {
    render(<Flow />);

    const activeStep = screen.getByLabelText(stepAccessibilityLabel(2, 'Review', 'active'));
    expect(activeStep).toHaveAttribute('aria-current', 'step');

    const completedStep = screen.getByLabelText(stepAccessibilityLabel(0, 'Account', 'completed'));
    expect(completedStep).not.toHaveAttribute('aria-current');

    const upcomingStep = screen.getByLabelText(stepAccessibilityLabel(3, 'Done', 'upcoming'));
    expect(upcomingStep).not.toHaveAttribute('aria-current');
  });

  it('every Step renders as a listitem inside the list-role Root', () => {
    render(<Flow />);

    const list = screen.getByRole('list', { name: 'Progress' });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    for (const item of items) {
      expect(list).toContainElement(item);
    }
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at
  // module load, so a dark-mode app rendered light design-system surfaces.
  // Colors must resolve from the scheme at render time — checked here on the
  // active step's ring/number, the one glyph every status colors distinctly.
  it('resolves dark colors for the active step when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');
    render(<Flow />);

    // "Review" is index 2, the active step under defaultActiveStep={2}; its
    // circle shows its 1-indexed number, "3", since active steps draw no
    // check/error glyph.
    const activeNumber = screen.getByText('3');
    expect(rgb(getComputedStyle(activeNumber).color)).toEqual(rgb(colors.dark.primary));
  });

  it('resolves light colors for the active step when the OS scheme is light', () => {
    render(<Flow />);

    const activeNumber = screen.getByText('3');
    expect(rgb(getComputedStyle(activeNumber).color)).toEqual(rgb(colors.light.primary));
  });
});
