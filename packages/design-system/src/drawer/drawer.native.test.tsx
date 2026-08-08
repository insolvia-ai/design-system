// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The labelling is the part worth pinning: it sits on RN's <Modal>, not on the
// inner panel, because react-native-web renders the Modal container itself as
// the dialog element — the same arrangement (and the same reasoning) as
// Dialog's native leaf.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Drawer } from './drawer';

function Example() {
  return (
    <Drawer.Root side="left">
      <Drawer.Trigger>Open filters</Drawer.Trigger>
      <Drawer.Backdrop />
      <Drawer.Panel>
        <Drawer.Title>Filters</Drawer.Title>
        <Drawer.Description>Narrow the fleet list.</Drawer.Description>
        <Drawer.Close>Done</Drawer.Close>
      </Drawer.Panel>
    </Drawer.Root>
  );
}

describe('Drawer (native leaf)', () => {
  it('opens a dialog named by its title', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Filters');
  });

  it('closes from the Close part', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its Backdrop part as nothing — the Modal owns the scrim', () => {
    // Kept as a part purely so one piece of JSX composes on both leaves.
    const { container } = render(<Drawer.Root>{<Drawer.Backdrop />}</Drawer.Root>);

    expect(container).toBeEmptyDOMElement();
  });
});
