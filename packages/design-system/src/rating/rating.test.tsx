// WEB-leaf behavioural tests. The keyboard grammar and clear-on-reclick rule
// are unit-tested directly against rating.props.ts; these prove the leaf's
// DOM wiring of them — roles, click, and the resulting attributes.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Rating } from './rating';

describe('Rating', () => {
  it('renders one radio per star, matching `max`', () => {
    render(<Rating max={5} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('defaults `max` to 5', () => {
    render(<Rating />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('click sets the value and fires onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Rating onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: '3 stars' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'false');
  });

  it('clicking the current value again clears it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Rating defaultValue={3} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: '3 stars' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveAttribute('aria-checked', 'false');
  });

  it('keyboard arrows move the value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Rating defaultValue={2} onValueChange={onValueChange} />);

    screen.getByRole('radio', { name: '2 stars' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveAttribute('aria-checked', 'true');
    // Roving tabindex followed the value: the newly-checked star is now the
    // only tabbable one.
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onValueChange).toHaveBeenLastCalledWith(1);

    await user.keyboard('{End}');
    expect(onValueChange).toHaveBeenLastCalledWith(5);

    await user.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith(1);

    await user.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('readOnly renders a single labelled image, no radios', () => {
    render(<Rating readOnly defaultValue={3} max={5} />);

    expect(screen.getByRole('img', { name: '3 of 5 stars' })).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('disables every star and never changes the value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Rating disabled defaultValue={2} onValueChange={onValueChange} />);

    const stars = screen.getAllByRole('radio');
    for (const star of stars) expect(star).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
