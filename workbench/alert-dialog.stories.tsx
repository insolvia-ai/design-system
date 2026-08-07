import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import { AlertDialog as AlertDialogWeb } from '@design-system/alert-dialog/alert-dialog.web.tsx';
import { AlertDialog as AlertDialogNative } from '@design-system/alert-dialog/alert-dialog.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * Same split as `dialog.stories.tsx`, for the same reason: the web leaf
 * portals its Backdrop/Popup into `document.body` as a fixed `z-50` card, the
 * native leaf opens an RN `Modal` through react-native-web's own portal as
 * `position: fixed; inset: 0` with a `ModalFocusTrap`, and two open overlays
 * on one page means the native one covers the web one and the focus traps
 * fight. Args cover the CONTENT threaded into the composition, not the parts'
 * own props — there is no meta `component` because no single component owns
 * this surface, same reason `dialog.stories.tsx` has none.
 */
type AlertDialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: 'Components/AlertDialog',
  parameters: { layout: 'fullscreen' },
  args: {
    triggerLabel: 'Withdraw filing',
    title: 'Withdraw the Chapter 7 petition?',
    description: 'This cannot be undone once it is submitted to the court.',
    onOpenChange: fn(),
  },
  render: (args) => (
    <LeafPair
      note="Both alert dialogs render CLOSED. Open one trigger at a time — an open web Popup and an open native Modal cannot share this page (see the file header)."
      web={<WithdrawFilingDialogWeb {...storyContent(args)} />}
      native={<WithdrawFilingDialogNative {...storyContent(args)} />}
    />
  ),
} satisfies Meta<AlertDialogArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

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

function SingleLeafNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={singleLeafStyles.wrap}>
      <p style={singleLeafStyles.note}>{children}</p>
    </div>
  );
}

/**
 * `Default` pairs the two leaves CLOSED — comparing the trigger and
 * composition is still useful — and the open state gets its own single-leaf
 * stories instead. `leaf-pair.tsx`'s doc comment sanctions exactly this: "A
 * story that renders only ONE leaf is fine when the point is a state rather
 * than a comparison." An open AlertDialog is a state, not a cross-leaf
 * comparison, and forcing it through `LeafPair` would be the very failure
 * this file exists to avoid.
 *
 * The play opens the web dialog, closes it, and only THEN opens the native
 * one — strictly sequential, ending with both closed, for the same reason
 * `dialog.stories.tsx`'s `Basic` play is: both portals escape the `LeafPair`
 * panes entirely, so the play reaches them through `screen`, not `pair()`.
 * It also checks the contract that makes this component an ALERT dialog
 * rather than a plain one — Escape does NOT dismiss it; only the explicit
 * "Keep editing" choice does.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step(
      'web alert dialog: open, resist Escape, close via an explicit choice, focus returns',
      async () => {
        const trigger = web.getByRole('button', { name: args.triggerLabel });
        await userEvent.click(trigger);
        const dialog = await screen.findByRole('alertdialog', { name: args.title });
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
        // Unlike Dialog, Escape must NOT close this — dismissal is only ever
        // an explicit choice (see the leaf's own header comment).
        await userEvent.keyboard('{Escape}');
        await expect(screen.getByRole('alertdialog')).toBeVisible();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
        await expect(trigger).toHaveFocus();
      },
    );

    await step('native alert dialog: open, verify, close — only after web closed', async () => {
      await userEvent.click(native.getByRole('button', { name: args.triggerLabel }));
      const dialog = await screen.findByRole('alertdialog', { name: args.title });
      await expect(within(dialog).getByText(args.description)).toBeVisible();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
      await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });
  },
};

export const OpenWebLeaf: Story = {
  name: 'Open (web leaf only)',
  render: (args) => (
    <>
      <SingleLeafNote>
        Single-leaf on purpose — see the file header. This audits the web Popup actually open:
        `role="alertdialog"`, `aria-modal`, and that Escape/backdrop-click do NOT dismiss it.
      </SingleLeafNote>
      <WithdrawFilingDialogWeb defaultOpen {...storyContent(args)} />
    </>
  ),
};

/**
 * THE REGRESSION STORY. Do not delete this one.
 *
 * Writing it is what found the 0.8.3 bug. `alert-dialog.native.tsx` put
 * `role="alertdialog"` + `aria-labelledby` on the INNER card and passed
 * nothing to `<Modal>`; react-native-web's own `ModalContent` sets
 * `role="dialog"` on ITS container regardless, so an open native alert dialog
 * rendered an UNNAMED `role="dialog"` wrapping the named `role="alertdialog"`
 * — `aria-dialog-name`, a serious violation, in the component whose entire
 * job is to be the accessible way to ask a destructive question.
 *
 * It survived a full native test suite because the offending element is
 * react-native-web's, not this package's: under jsdom the leaf's own markup is
 * correct and there is no Modal container to inspect. It took rendering the
 * open state in a real browser, which is what this story does and what
 * nothing else here can.
 *
 * `dialog.native.tsx` never had it — it labels the `<Modal>` and leaves its
 * card roleless. The fix made the alert dialog do both. The play pins that
 * fix in an assertion too, not just in axe and the eye: both the outer
 * react-native-web container and the inner card must carry the title as
 * their accessible name.
 */
export const OpenNativeLeaf: Story = {
  name: 'Open (native leaf only)',
  render: (args) => (
    <>
      <SingleLeafNote>
        Single-leaf on purpose — see the file header. Guards the 0.8.3 fix: react-native-web&apos;s
        Modal wraps this card in its own `role=&quot;dialog&quot;`, and that outer element must
        carry the title&apos;s id too, or axe fails it as `aria-dialog-name`.
      </SingleLeafNote>
      <WithdrawFilingDialogNative defaultOpen {...storyContent(args)} />
    </>
  ),
  play: async ({ args }) => {
    await expect(screen.getByRole('dialog', { name: args.title })).toBeInTheDocument();
    await expect(screen.getByRole('alertdialog', { name: args.title })).toBeInTheDocument();
  },
};

/** The content args, minus nothing — a named helper so the four call sites
 *  can't drift apart one prop at a time. */
function storyContent(args: AlertDialogArgs) {
  return {
    triggerLabel: args.triggerLabel,
    title: args.title,
    description: args.description,
    onOpenChange: args.onOpenChange,
  };
}

interface WithdrawFilingDialogProps extends AlertDialogArgs {
  defaultOpen?: boolean;
}

/**
 * `Title`/`Description` are direct children of `Popup`, never wrapped, for
 * the same identity-scan reason as the Dialog. `Backdrop` is composed even
 * though it renders nothing on native (no tap-outside dismissal here) so the
 * call site matches across leaves and across `Dialog`/`AlertDialog`.
 */
function WithdrawFilingDialogWeb({
  defaultOpen,
  triggerLabel,
  title,
  description,
  onOpenChange,
}: WithdrawFilingDialogProps) {
  return (
    <AlertDialogWeb.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <AlertDialogWeb.Trigger>{triggerLabel}</AlertDialogWeb.Trigger>
      <AlertDialogWeb.Backdrop />
      <AlertDialogWeb.Popup>
        <AlertDialogWeb.Title>{title}</AlertDialogWeb.Title>
        <AlertDialogWeb.Description>{description}</AlertDialogWeb.Description>
        <AlertDialogWeb.Close>Keep editing</AlertDialogWeb.Close>
        {/* No `danger` intent exists on Button — the semantic token set has no
            danger-text pair (see button.props.ts) — so the destructive choice
            is `primary`, same as any other confirming action. */}
        <ButtonWeb intent="primary">Withdraw filing</ButtonWeb>
      </AlertDialogWeb.Popup>
    </AlertDialogWeb.Root>
  );
}

function WithdrawFilingDialogNative({
  defaultOpen,
  triggerLabel,
  title,
  description,
  onOpenChange,
}: WithdrawFilingDialogProps) {
  return (
    <AlertDialogNative.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <AlertDialogNative.Trigger>{triggerLabel}</AlertDialogNative.Trigger>
      <AlertDialogNative.Backdrop />
      <AlertDialogNative.Popup>
        <AlertDialogNative.Title>{title}</AlertDialogNative.Title>
        <AlertDialogNative.Description>{description}</AlertDialogNative.Description>
        <AlertDialogNative.Close>Keep editing</AlertDialogNative.Close>
        <ButtonNative intent="primary">Withdraw filing</ButtonNative>
      </AlertDialogNative.Popup>
    </AlertDialogNative.Root>
  );
}
