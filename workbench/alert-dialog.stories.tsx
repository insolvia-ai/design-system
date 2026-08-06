import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { AlertDialog as AlertDialogWeb } from '@design-system/alert-dialog/alert-dialog.web.tsx';
import { AlertDialog as AlertDialogNative } from '@design-system/alert-dialog/alert-dialog.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/AlertDialog',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Same split as `dialog.stories.tsx`, for the same reason: the web leaf
 * portals its Backdrop/Popup into `document.body` as a fixed `z-50` card, the
 * native leaf opens an RN `Modal` through react-native-web's own portal as
 * `position: fixed; inset: 0` with a `ModalFocusTrap`, and two open overlays
 * on one page means the native one covers the web one and the focus traps
 * fight. `Default` pairs the two leaves CLOSED; the open state is a single
 * state per leaf, not a cross-leaf comparison, which is exactly what
 * `leaf-pair.tsx`'s doc comment sanctions a single-leaf story for.
 */
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

export const Default: Story = {
  render: () => (
    <LeafPair
      note="Both alert dialogs render CLOSED. Open one trigger at a time — an open web Popup and an open native Modal cannot share this page (see the file header)."
      web={<WithdrawFilingDialogWeb />}
      native={<WithdrawFilingDialogNative />}
    />
  ),
};

export const OpenWebLeaf: Story = {
  name: 'Open (web leaf only)',
  render: () => (
    <>
      <SingleLeafNote>
        Single-leaf on purpose — see the file header. This audits the web Popup actually open:
        `role="alertdialog"`, `aria-modal`, and that Escape/backdrop-click do NOT dismiss it.
      </SingleLeafNote>
      <WithdrawFilingDialogWeb defaultOpen />
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
 * card roleless. The fix made the alert dialog do both.
 */
export const OpenNativeLeaf: Story = {
  name: 'Open (native leaf only)',
  render: () => (
    <>
      <SingleLeafNote>
        Single-leaf on purpose — see the file header. Guards the 0.8.3 fix: react-native-web&apos;s
        Modal wraps this card in its own `role=&quot;dialog&quot;`, and that outer element must
        carry the title&apos;s id too, or axe fails it as `aria-dialog-name`.
      </SingleLeafNote>
      <WithdrawFilingDialogNative defaultOpen />
    </>
  ),
};

/**
 * `Title`/`Description` are direct children of `Popup`, never wrapped, for
 * the same identity-scan reason as the Dialog. `Backdrop` is composed even
 * though it renders nothing on native (no tap-outside dismissal here) so the
 * call site matches across leaves and across `Dialog`/`AlertDialog`.
 */
function WithdrawFilingDialogWeb({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <AlertDialogWeb.Root defaultOpen={defaultOpen}>
      <AlertDialogWeb.Trigger>Withdraw filing</AlertDialogWeb.Trigger>
      <AlertDialogWeb.Backdrop />
      <AlertDialogWeb.Popup>
        <AlertDialogWeb.Title>Withdraw the Chapter 7 petition?</AlertDialogWeb.Title>
        <AlertDialogWeb.Description>
          This cannot be undone once it is submitted to the court.
        </AlertDialogWeb.Description>
        <AlertDialogWeb.Close>Keep editing</AlertDialogWeb.Close>
        {/* No `danger` intent exists on Button — the semantic token set has no
            danger-text pair (see button.props.ts) — so the destructive choice
            is `primary`, same as any other confirming action. */}
        <ButtonWeb intent="primary">Withdraw filing</ButtonWeb>
      </AlertDialogWeb.Popup>
    </AlertDialogWeb.Root>
  );
}

function WithdrawFilingDialogNative({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <AlertDialogNative.Root defaultOpen={defaultOpen}>
      <AlertDialogNative.Trigger>Withdraw filing</AlertDialogNative.Trigger>
      <AlertDialogNative.Backdrop />
      <AlertDialogNative.Popup>
        <AlertDialogNative.Title>Withdraw the Chapter 7 petition?</AlertDialogNative.Title>
        <AlertDialogNative.Description>
          This cannot be undone once it is submitted to the court.
        </AlertDialogNative.Description>
        <AlertDialogNative.Close>Keep editing</AlertDialogNative.Close>
        <ButtonNative intent="primary">Withdraw filing</ButtonNative>
      </AlertDialogNative.Popup>
    </AlertDialogNative.Root>
  );
}
