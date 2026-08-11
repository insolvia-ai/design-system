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
import { Text, View } from 'react-native';
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

  it('wraps a bare string child so prose still carries the panel colour', async () => {
    const user = userEvent.setup();
    render(<Faq />);

    await user.click(screen.getByRole('button', { name: 'What does it cost?' }));

    // The convenience half of the contract, and the reason this leaf does not
    // simply pass everything through: a bare string emitted loose into a View
    // is invalid on a device, so the wrapper still has to exist for prose.
    // Nothing above it is a text ancestor, so it renders as a block `<div>`.
    expect(screen.getByText('Flat per-seat pricing, billed annually.').tagName).toBe('DIV');
  });

  it('passes a non-string child through instead of wrapping it in a Text', async () => {
    // THE REGRESSION this leaf's panel used to be. Until 0.15.0 it wrapped
    // EVERY child in a `Text`, which on a device is invalid nesting and
    // through react-native-web fails quietly instead: the wrapper carries
    // `display: inline` and sets the text-ancestor context, so a nested `Text`
    // re-renders as a `<span>` inheriting its colour rather than keeping its
    // own, and a flex layout inside collapses into inline flow. The tag IS the
    // assertion — a `SPAN` here means the wrapper is back.
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item value="details">
          <Accordion.Header>
            <Accordion.Trigger>Details</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <View>
              <Text>Nested in a View</Text>
            </View>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByText('Nested in a View').tagName).toBe('DIV');
  });
});
