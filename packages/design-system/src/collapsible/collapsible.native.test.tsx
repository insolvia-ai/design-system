// NATIVE-leaf tests — see button.native.test.tsx for how the `native` vitest
// project resolves './collapsible' to collapsible.native.tsx and renders it
// through react-native-web, the pair a React Native consumer ships on web.
//
// `aria-expanded` IS asserted here now. It did not used to be, and the note
// that stood in its place was correct about the mechanism and wrong about the
// conclusion: react-native-web really does ignore the nested
// `accessibilityState`, but the fix for that is to set `aria-expanded`
// explicitly — which is what checkbox.native.tsx and switch.native.tsx had
// always done — rather than to stop testing the state. For as long as that
// note stood, the trigger announced no expanded state at all on the web build
// (WCAG 4.1.2), and the mount/unmount assertion below could not see it.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Collapsible } from './collapsible';

function Notes() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>Show case notes</Collapsible.Trigger>
      <Collapsible.Panel>Filed jointly, no prior filings.</Collapsible.Panel>
    </Collapsible.Root>
  );
}

describe('Collapsible (native leaf)', () => {
  it('reports its expanded state to assistive tech', async () => {
    // The regression guard for the note above: react-native-web drops the
    // nested `accessibilityState`, so this passes only while the leaf also
    // sets `aria-expanded` explicitly.
    const user = userEvent.setup();
    render(<Notes />);

    const trigger = screen.getByRole('button', { name: 'Show case notes' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the trigger as a button, unmounts the panel while closed, and mounts it on press', async () => {
    const user = userEvent.setup();

    render(<Notes />);

    const trigger = screen.getByRole('button', { name: 'Show case notes' });
    expect(screen.queryByText('Filed jointly, no prior filings.')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByText('Filed jointly, no prior filings.')).toBeVisible();

    await user.click(trigger);

    expect(screen.queryByText('Filed jointly, no prior filings.')).not.toBeInTheDocument();
  });

  it('reports disabled state and does not toggle when the root is disabled', () => {
    render(
      <Collapsible.Root disabled>
        <Collapsible.Trigger>Show case notes</Collapsible.Trigger>
        <Collapsible.Panel>Filed jointly, no prior filings.</Collapsible.Panel>
      </Collapsible.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Show case notes' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-disabled', 'true');

    // A real disabled <button> does not dispatch click handlers at all (jsdom
    // mirrors browser behavior here); firing the event directly is enough to
    // prove the panel never mounts, without userEvent's pointer-events check.
    fireEvent.click(trigger);

    expect(screen.queryByText('Filed jointly, no prior filings.')).not.toBeInTheDocument();
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors for the trigger label when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(<Notes />);

    const label = screen.getByText('Show case notes');
    expect(rgb(label.style.color)).toEqual(rgb(colors.dark.ink));
  });
});
