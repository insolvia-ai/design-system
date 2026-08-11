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
        {/* The prose carries its own `Text`, which is the contract: the panel
            is a container and styles nothing inside it. */}
        <Accordion.Panel>
          <Text>Flat per-seat pricing, billed annually.</Text>
        </Accordion.Panel>
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

  it('passes children through without wrapping them in a Text', async () => {
    // THE REGRESSION this leaf's panel used to be. It wrapped every child in a
    // `Text`, which on a device is invalid nesting and through
    // react-native-web fails quietly instead: the wrapper carries
    // `display: inline` and sets the text-ancestor context, so a nested `Text`
    // re-renders as a `<span>` inheriting its colour rather than keeping its
    // own, and a flex layout inside collapses into inline flow.
    //
    // The tag IS the assertion. react-native-web renders `Text` as a block
    // `<div>` normally and as a `<span>` only under a text ancestor, so a
    // `SPAN` here means a wrapper is back above it.
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

  it("leaves a caller's own Text as the only styling authority over prose", async () => {
    // The consequence of the rule above, asserted so it cannot be softened
    // back into a convenience wrapper: the panel contributes NO text style, so
    // a caller's colour is what renders. The web leaf reaches the same result
    // by cascade (`text-muted` on the container); native has no cascade, and
    // this is that seam written down.
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item value="details">
          <Accordion.Header>
            <Accordion.Trigger>Details</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <Text style={{ color: 'rgb(1, 2, 3)' }}>Prose the caller styled</Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Details' }));

    const prose = screen.getByText('Prose the caller styled');
    expect(prose.tagName).toBe('DIV');
    expect(prose.style.color).toBe('rgb(1, 2, 3)');
  });
});
