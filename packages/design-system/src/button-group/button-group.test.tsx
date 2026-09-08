import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ButtonGroup } from './button-group';

describe('ButtonGroup', () => {
  it('renders a role="group" container, named via `label`', () => {
    render(
      <ButtonGroup.Root label="View range">
        <ButtonGroup.Item>Day</ButtonGroup.Item>
        <ButtonGroup.Item>Week</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    expect(screen.getByRole('group', { name: 'View range' })).toBeInTheDocument();
  });

  it('computes first/middle/last for three Items', () => {
    render(
      <ButtonGroup.Root>
        <ButtonGroup.Item>Day</ButtonGroup.Item>
        <ButtonGroup.Item>Week</ButtonGroup.Item>
        <ButtonGroup.Item>Month</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('data-position', 'first');
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('data-position', 'middle');
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('data-position', 'last');
  });

  it('a single Item is "only"', () => {
    render(
      <ButtonGroup.Root>
        <ButtonGroup.Item>Day</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('data-position', 'only');
  });

  it('disabled on the Root disables every Item', () => {
    render(
      <ButtonGroup.Root disabled>
        <ButtonGroup.Item>Day</ButtonGroup.Item>
        <ButtonGroup.Item>Week</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    expect(screen.getByRole('button', { name: 'Day' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Week' })).toBeDisabled();
  });

  it("fires each Item's own onClick", async () => {
    const user = userEvent.setup();
    const onDay = vi.fn();
    const onWeek = vi.fn();

    render(
      <ButtonGroup.Root>
        <ButtonGroup.Item onClick={onDay}>Day</ButtonGroup.Item>
        <ButtonGroup.Item onClick={onWeek}>Week</ButtonGroup.Item>
      </ButtonGroup.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Day' }));
    expect(onDay).toHaveBeenCalledTimes(1);
    expect(onWeek).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Week' }));
    expect(onWeek).toHaveBeenCalledTimes(1);
    expect(onDay).toHaveBeenCalledTimes(1);
  });
});
