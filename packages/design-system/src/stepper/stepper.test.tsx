// WEB-leaf behavioural tests (Vitest + Testing Library).
import * as React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from './stepper';
import { stepSrSuffix } from './stepper.props';

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

describe('Stepper (web leaf)', () => {
  it('puts aria-current="step" on the active step only', () => {
    render(<Flow />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).not.toHaveAttribute('aria-current');
    expect(items[3]).not.toHaveAttribute('aria-current');
  });

  it('derives completed/active/upcoming from index vs. the active step', () => {
    render(<Flow />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-state', 'completed');
    expect(items[1]).toHaveAttribute('data-state', 'completed');
    expect(items[2]).toHaveAttribute('data-state', 'active');
    expect(items[3]).toHaveAttribute('data-state', 'upcoming');
  });

  it('an interactive completed step is a button and fires onActiveStepChange', async () => {
    const onActiveStepChange = vi.fn();
    const user = userEvent.setup();
    render(<Flow interactive onActiveStepChange={onActiveStepChange} />);

    const accountButton = screen.getByRole('button', {
      name: `Account${stepSrSuffix('completed')}`,
    });
    await user.click(accountButton);

    expect(onActiveStepChange).toHaveBeenCalledTimes(1);
    expect(onActiveStepChange).toHaveBeenCalledWith(0);
  });

  it('a future step in linear mode is not a button', () => {
    render(<Flow interactive />);

    // "Done" is index 3, after the active index 2 — linear (the default)
    // keeps it un-clickable even though the root is interactive.
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('a future step becomes clickable when linear is off', () => {
    render(<Flow interactive linear={false} />);

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('the status prop overrides derivation, e.g. to mark a step errored', () => {
    render(
      <Stepper.Root defaultActiveStep={1}>
        <Stepper.Step label="Account" />
        <Stepper.Step label="Profile" status="error" />
      </Stepper.Root>,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('data-state', 'error');
    expect(screen.getByText('Profile')).toBeInTheDocument();
    // The sr-only suffix is its own text node (see `stepSrSuffix`) — a
    // screen reader concatenates it with the label via the accessible-name
    // algorithm; `getByText` only matches an element's OWN direct text, so
    // it is asserted here as the separate node it actually is.
    expect(screen.getByText(stepSrSuffix('error')!.trim())).toBeInTheDocument();
  });

  it('renders in vertical orientation', () => {
    render(<Flow orientation="vertical" />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
  });
});
