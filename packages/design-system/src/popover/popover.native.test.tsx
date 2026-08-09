// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// Note what is NOT tested here: dismissal by pressing outside. The native leaf
// deliberately does not have it — React Native has no document to listen to,
// and the alternatives (a Modal, a full-screen sibling) would each defeat the
// non-modal point. `Popover.Close` is the native dismissal, which is why it is
// exercised below rather than treated as optional decoration.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Popover } from './popover';

function Example() {
  return (
    <Popover.Root>
      <Popover.Trigger>Filters</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Filter the fleet</Popover.Title>
        <Popover.Close>Done</Popover.Close>
      </Popover.Content>
    </Popover.Root>
  );
}

describe('Popover (native leaf)', () => {
  it('toggles from the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is named by its Title and is not modal', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    const surface = screen.getByRole('dialog');
    expect(surface).toHaveAccessibleName('Filter the fleet');
    expect(surface).not.toHaveAttribute('aria-modal');
  });

  // The panel used to BE the absolutely positioned box, carrying `maxWidth:
  // 320` and no width — and a cap cannot size an absolutely positioned box. It
  // fell back to shrink-to-fit against the root, which hugs the trigger, so the
  // surface came out trigger-wide (74px against the web leaf's 320) with the
  // prose wrapping a word per line. jsdom does no layout, so what is checkable
  // is the arrangement that replaced it: an anchor stating the width, and a
  // panel free to hug inside it.
  it('anchors the panel in a width-stating layer rather than sizing it', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const surface = screen.getByRole('dialog');

    // The cap, as the web leaf's `max-w-[20rem]` states it.
    expect(surface.parentElement).toHaveStyle({ width: '320px' });
    // And the panel hugs inside it — the `w-max` half. A width here instead
    // would pad every short popover out to 320.
    expect(surface).not.toHaveStyle({ width: '320px' });
  });

  it('closes from the Close part — the native dismissal', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
