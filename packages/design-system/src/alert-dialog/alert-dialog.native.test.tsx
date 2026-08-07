// NATIVE-leaf tests — the `native` vitest project resolves './alert-dialog'
// to alert-dialog.native.tsx and renders it through react-native-web, the
// pair a consumer ships on web. react-native-web's Modal renders a portal into
// the document, so `screen` queries reach the modal content as usual.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { AlertDialog } from './alert-dialog';

function DiscardIntake() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>Discard intake</AlertDialog.Trigger>
      <AlertDialog.Backdrop />
      <AlertDialog.Popup>
        <AlertDialog.Title>Discard this intake?</AlertDialog.Title>
        <AlertDialog.Description>Unsaved answers are lost.</AlertDialog.Description>
        <AlertDialog.Close>Keep editing</AlertDialog.Close>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
}

describe('AlertDialog (native leaf)', () => {
  it('mounts the modal content when the trigger is pressed', async () => {
    const user = userEvent.setup();
    render(<DiscardIntake />);

    expect(screen.queryByText('Discard this intake?')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Discard intake' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Discard this intake?')).toBeInTheDocument();
    expect(screen.getByText('Unsaved answers are lost.')).toBeInTheDocument();
  });

  it('closes from the Close part', async () => {
    const user = userEvent.setup();
    render(<DiscardIntake />);

    await user.click(screen.getByRole('button', { name: 'Discard intake' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // The 0.8.3 regression, found by workbench/alert-dialog.stories.tsx.
  //
  // react-native-web's Modal wraps whatever it is given in a container it sets
  // `role="dialog"` on itself. This leaf labelled only its inner
  // `role="alertdialog"` card, so an open alert dialog rendered an UNNAMED
  // dialog around a named one — axe's `aria-dialog-name`, serious, in the
  // component whose whole job is asking a destructive question accessibly.
  //
  // The outer container was always reachable from here (the Modal portals into
  // the document — see this file's header); no test had asserted a name on it,
  // because it is a wrapper this leaf does not write. It does now.
  it('names react-native-web’s outer dialog container, not just the card', async () => {
    const user = userEvent.setup();
    render(<DiscardIntake />);

    await user.click(screen.getByRole('button', { name: 'Discard intake' }));

    expect(screen.getByRole('dialog', { name: 'Discard this intake?' })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { name: 'Discard this intake?' })).toBeInTheDocument();
  });

  // The 0.2.1 regression class: colors must resolve from the scheme at render
  // time, never from colors.light at module load.
  it('resolves dark colors when the OS scheme is dark', async () => {
    setPrefersColorScheme('dark');
    const user = userEvent.setup();
    render(<DiscardIntake />);

    await user.click(screen.getByRole('button', { name: 'Discard intake' }));

    const card = screen.getByRole('alertdialog');
    expect(rgb(card.style.backgroundColor)).toEqual(rgb(colors.dark.card));
  });
});
