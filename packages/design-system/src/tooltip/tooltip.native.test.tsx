// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The gesture differs by design (tooltip.props.ts argues why), so what is
// pinned here is the part that must NOT differ: the association. If
// `aria-describedby` stopped surviving react-native-web's forwarding, the
// bubble would still appear and would describe nothing.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './tooltip';

function Example() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger aria-label="Jump drive">Jump drive</Tooltip.Trigger>
      <Tooltip.Content>Charges for 30 seconds.</Tooltip.Content>
    </Tooltip.Root>
  );
}

describe('Tooltip (native leaf)', () => {
  it('shows on hover, which is the gesture react-native-web gives a pointer', async () => {
    const user = userEvent.setup();
    render(<Example />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Jump drive' }));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('describes the trigger only while the bubble exists', async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole('button', { name: 'Jump drive' });
    expect(trigger).not.toHaveAttribute('aria-describedby');

    await user.hover(trigger);

    expect(trigger).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  });

  it('hides again when the pointer leaves', async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole('button', { name: 'Jump drive' });
    await user.hover(trigger);
    await user.unhover(trigger);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
