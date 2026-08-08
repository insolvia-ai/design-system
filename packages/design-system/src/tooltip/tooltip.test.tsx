import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './tooltip';

function Example() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>Jump drive</Tooltip.Trigger>
      <Tooltip.Content>Charges for 30 seconds before engaging.</Tooltip.Content>
    </Tooltip.Root>
  );
}

describe('Tooltip', () => {
  it('shows on hover and hides again', async () => {
    const user = userEvent.setup();
    render(<Example />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Jump drive' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.unhover(screen.getByRole('button', { name: 'Jump drive' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on FOCUS — the half that makes it reachable by keyboard', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.tab();

    expect(screen.getByRole('button', { name: 'Jump drive' })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('dismisses on Escape without moving focus (WCAG 1.4.13)', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump drive' })).toHaveFocus();
  });

  it('describes its trigger only while the bubble exists', async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole('button', { name: 'Jump drive' });
    // A dangling aria-describedby pointing at an absent id is its own defect.
    expect(trigger).not.toHaveAttribute('aria-describedby');

    await user.hover(trigger);

    expect(trigger).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
    // DESCRIBES, does not NAME: the trigger keeps its own label.
    expect(trigger).toHaveAccessibleName('Jump drive');
    expect(trigger).toHaveAccessibleDescription('Charges for 30 seconds before engaging.');
  });

  it('throws when a part is used outside its Root', () => {
    expect(() => render(<Tooltip.Content>orphan</Tooltip.Content>)).toThrow(
      /Tooltip.Content must be rendered inside/,
    );
  });
});
