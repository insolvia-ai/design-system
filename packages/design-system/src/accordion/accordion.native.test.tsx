// NATIVE-leaf tests. They run in the vitest `native` project, whose resolver is
// Metro's view of the package (native-first extensions, react-native aliased to
// react-native-web), so the extensionless './accordion' below lands on
// accordion.native.tsx. Assertions are made on the DOM react-native-web emits.
//
// Worth testing separately from the `.web` leaf because the two express the
// same behaviour through different contracts: the web trigger sets
// `aria-expanded` itself, while this leaf sets RN's `accessibilityState`
// and relies on react-native-web to map it. A leaf can hold correct state and
// still announce nothing, which is invisible to the props tests.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Accordion } from './accordion';

function Faq() {
  return (
    <Accordion.Root>
      <Accordion.Item value="cost">
        <Accordion.Header>
          <Accordion.Trigger>What does it cost?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Flat per-seat pricing, billed annually.</Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

describe('Accordion (native leaf)', () => {
  it('exposes the trigger as a button that reports its collapsed state', () => {
    render(<Faq />);

    const trigger = screen.getByRole('button', { name: 'What does it cost?' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands on press and reports the new state', async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const trigger = screen.getByRole('button', { name: 'What does it cost?' });
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Flat per-seat pricing, billed annually.')).toBeInTheDocument();
  });

  it('collapses again on a second press', async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const trigger = screen.getByRole('button', { name: 'What does it cost?' });
    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the panel out of the tree while collapsed', () => {
    // Not merely hidden. The native leaf unmounts the panel rather than
    // styling it away, so asserting absence — not invisibility — is what
    // actually describes this leaf.
    render(<Faq />);

    expect(screen.queryByText('Flat per-seat pricing, billed annually.')).not.toBeInTheDocument();
  });
});
