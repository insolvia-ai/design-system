import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import { Dialog as DialogWeb } from '@design-system/dialog/dialog.web.tsx';
import { Dialog as DialogNative } from '@design-system/dialog/dialog.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * Dialog is a parts object (Root/Trigger/Popup/Title/…), so args cover the
 * CONTENT the story threads into the composition, not the parts' own props —
 * there is no meta `component` because no single component owns this surface,
 * and react-docgen has nothing useful to say about a namespace object.
 */
type DialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: 'Components/Dialog',
  parameters: { layout: 'fullscreen' },
  args: {
    triggerLabel: 'Add case note',
    title: 'Add a case note',
    description: 'Visible to everyone assigned to this filing.',
    onOpenChange: fn(),
  },
  render: (args) => (
    <LeafPair
      note="Both dialogs render CLOSED. Open one trigger at a time — an open web Popup and an open native Modal cannot share this page (see the file header)."
      web={<CaseNoteDialogWeb {...storyContent(args)} />}
      native={<CaseNoteDialogNative {...storyContent(args)} />}
    />
  ),
} satisfies Meta<DialogArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Why this file has no "both open at once" story, unlike everything else in
 * the workbench.
 *
 * The web leaf `createPortal`s its Backdrop and Popup into `document.body` as
 * a fixed, centred, `z-50` card — unconditionally, with no `className`/`style`
 * escape. The native leaf opens an RN `Modal`, which react-native-web renders
 * through its OWN portal as `position: fixed; inset: 0` plus a
 * `ModalFocusTrap`. Two open at once means the native overlay completely
 * covers the web one and the two focus traps fight over Tab. There is no
 * layout that fixes this; the fix is to never have both open on one page.
 *
 * The same rule binds the play below: it opens the web dialog, closes it, and
 * only then opens the native one — strictly sequential, ending with both
 * closed. Both portals escape the LeafPair panes entirely, so the play reaches
 * them through `screen`, not `pair()` (whose doc comment says exactly this).
 *
 * `Basic` pairs the two leaves CLOSED — comparing the trigger and
 * composition is still useful — and the open state gets its own single-leaf
 * stories instead. `leaf-pair.tsx`'s doc comment sanctions exactly this: "A
 * story that renders only ONE leaf is fine when the point is a state rather
 * than a comparison." An open Dialog is a state, not a cross-leaf comparison,
 * and forcing it through `LeafPair` would be the very failure this file
 * exists to avoid.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web dialog: open, verify wiring, close, focus returns', async () => {
      const trigger = web.getByRole('button', { name: args.triggerLabel });
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog', { name: args.title });
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
      // The hand-rolled focus trap's least visible promise: focus RETURNS to
      // the opener on close. Worth pinning — a broken return strands keyboard
      // users at the top of the page and no axe rule notices.
      await expect(trigger).toHaveFocus();
    });

    await step('native dialog: open, verify, close — only after web closed', async () => {
      await userEvent.click(native.getByRole('button', { name: args.triggerLabel }));
      const dialog = await screen.findByRole('dialog', { name: args.title });
      await expect(within(dialog).getByText(args.description)).toBeVisible();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });
  },
};

const singleLeafStyles: Record<string, React.CSSProperties> = {
  wrap: { padding: 24, fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
  note: {
    margin: '0 0 16px',
    padding: '8px 12px',
    borderLeft: '3px solid currentColor',
    fontSize: 13,
    lineHeight: 1.5,
  },
};

/**
 * The note AND the leaf share one padded wrapper.
 *
 * They used to be siblings — a padded `<div>` for the note, then the component
 * loose beside it — which left the trigger flush against the story container's
 * top-left corner while the note above it sat 24px in. On a docs page, where
 * the canvas draws a visible border, the button reads as falling out of the
 * frame. Whatever wraps the note has to wrap the component too.
 */
function SingleLeafFrame({ note, children }: { note: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={singleLeafStyles.wrap}>
      <p style={singleLeafStyles.note}>{note}</p>
      {children}
    </div>
  );
}

export const OpenWebLeaf: Story = {
  name: 'Open (web leaf only)',
  render: (args) => (
    <SingleLeafFrame
      note="Single-leaf on purpose — see the file header. This audits the web Popup actually open: role, aria-modal, and the Title/Description wiring, with axe running against it."
    >
      <CaseNoteDialogWeb defaultOpen {...storyContent(args)} />
    </SingleLeafFrame>
  ),
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: args.title });

    // The card's WIDTH, pinned as a computed length — the 0.8.4 fix.
    //
    // `max-w-md` compiled to `max-width: var(--spacing-md)` — 16px, not the
    // 28rem it reads as — because this theme names its spacing scale with
    // t-shirt sizes and Tailwind v4 prefers that namespace over its own
    // container scale. The popup collapsed below its own `p-lg` padding and
    // every word wrapped onto its own line.
    //
    // Nothing else in the repo can catch that. tsc never reads CSS, jsdom
    // computes no layout, and axe passed it happily: an overflowing dialog
    // still has fine contrast and a valid accessible name. Only a computed
    // length read in a real browser sees it, which is exactly what this is.
    //
    // 448 is the same number the native leaf hard-codes, so this doubles as
    // the cross-leaf agreement check. Only the web side needs pinning — the
    // native leaf's `maxWidth: 448` is a literal in `StyleSheet.create`, with
    // no theme indirection that could silently redefine it.
    await expect(getComputedStyle(dialog).maxWidth).toBe('448px');
  },
};

export const OpenNativeLeaf: Story = {
  name: 'Open (native leaf only)',
  render: (args) => (
    <SingleLeafFrame note="Single-leaf on purpose — see the file header. This audits the native Modal actually open, as react-native-web renders it.">
      <CaseNoteDialogNative defaultOpen {...storyContent(args)} />
    </SingleLeafFrame>
  ),
};

/** The content args, minus nothing — a named helper so the four call sites
 *  can't drift apart one prop at a time. */
function storyContent(args: DialogArgs) {
  return {
    triggerLabel: args.triggerLabel,
    title: args.title,
    description: args.description,
    onOpenChange: args.onOpenChange,
  };
}

interface CaseNoteDialogProps extends DialogArgs {
  defaultOpen?: boolean;
}

/**
 * `Title` and `Description` are direct children of `Popup` in both leaves,
 * never wrapped — both leaves decide `aria-labelledby`/`aria-describedby` by
 * scanning `children` for their own `Title`/`Description` identities, and a
 * wrapper `div` would make the popup invisible to that scan (silently losing
 * its accessible name — an `aria-dialog-name` failure). `Backdrop` is
 * composed even though the native leaf renders it as `null` — the RN `Modal`
 * draws its own scrim — so the call site is identical across leaves.
 */
function CaseNoteDialogWeb({
  defaultOpen,
  triggerLabel,
  title,
  description,
  onOpenChange,
}: CaseNoteDialogProps) {
  return (
    <DialogWeb.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogWeb.Trigger>{triggerLabel}</DialogWeb.Trigger>
      <DialogWeb.Backdrop />
      <DialogWeb.Popup>
        <DialogWeb.Title>{title}</DialogWeb.Title>
        <DialogWeb.Description>{description}</DialogWeb.Description>
        <DialogWeb.Close>Cancel</DialogWeb.Close>
        <ButtonWeb intent="primary">Save note</ButtonWeb>
      </DialogWeb.Popup>
    </DialogWeb.Root>
  );
}

function CaseNoteDialogNative({
  defaultOpen,
  triggerLabel,
  title,
  description,
  onOpenChange,
}: CaseNoteDialogProps) {
  return (
    <DialogNative.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogNative.Trigger>{triggerLabel}</DialogNative.Trigger>
      <DialogNative.Backdrop />
      <DialogNative.Popup>
        <DialogNative.Title>{title}</DialogNative.Title>
        <DialogNative.Description>{description}</DialogNative.Description>
        <DialogNative.Close>Cancel</DialogNative.Close>
        <ButtonNative intent="primary">Save note</ButtonNative>
      </DialogNative.Popup>
    </DialogNative.Root>
  );
}
