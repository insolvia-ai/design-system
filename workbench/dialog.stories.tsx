import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Dialog as DialogWeb } from '@design-system/dialog/dialog.web.tsx';
import { Dialog as DialogNative } from '@design-system/dialog/dialog.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Dialog',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

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
 * So `Default` below pairs the two leaves CLOSED — comparing the trigger and
 * composition is still useful — and the open state gets its own single-leaf
 * stories instead. `leaf-pair.tsx`'s doc comment sanctions exactly this: "A
 * story that renders only ONE leaf is fine when the point is a state rather
 * than a comparison." An open Dialog is a state, not a cross-leaf comparison,
 * and forcing it through `LeafPair` would be the very failure this file
 * exists to avoid.
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
      note="Both dialogs render CLOSED. Open one trigger at a time — an open web Popup and an open native Modal cannot share this page (see the file header)."
      web={<CaseNoteDialogWeb />}
      native={<CaseNoteDialogNative />}
    />
  ),
};

export const OpenWebLeaf: Story = {
  name: 'Open (web leaf only)',
  render: () => (
    <>
      <SingleLeafNote>
        Single-leaf on purpose — see the file header. This audits the web Popup actually open: role,
        aria-modal, and the Title/Description wiring, with axe running against it.
      </SingleLeafNote>
      <CaseNoteDialogWeb defaultOpen />
    </>
  ),
};

export const OpenNativeLeaf: Story = {
  name: 'Open (native leaf only)',
  render: () => (
    <>
      <SingleLeafNote>
        Single-leaf on purpose — see the file header. This audits the native Modal actually open, as
        react-native-web renders it.
      </SingleLeafNote>
      <CaseNoteDialogNative defaultOpen />
    </>
  ),
};

/**
 * `Title` and `Description` are direct children of `Popup` in both leaves,
 * never wrapped — both leaves decide `aria-labelledby`/`aria-describedby` by
 * scanning `children` for their own `Title`/`Description` identities, and a
 * wrapper `div` would make the popup invisible to that scan (silently losing
 * its accessible name — an `aria-dialog-name` failure). `Backdrop` is
 * composed even though the native leaf renders it as `null` — the RN `Modal`
 * draws its own scrim — so the call site is identical across leaves.
 */
function CaseNoteDialogWeb({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <DialogWeb.Root defaultOpen={defaultOpen}>
      <DialogWeb.Trigger>Add case note</DialogWeb.Trigger>
      <DialogWeb.Backdrop />
      <DialogWeb.Popup>
        <DialogWeb.Title>Add a case note</DialogWeb.Title>
        <DialogWeb.Description>Visible to everyone assigned to this filing.</DialogWeb.Description>
        <DialogWeb.Close>Cancel</DialogWeb.Close>
        <ButtonWeb intent="primary">Save note</ButtonWeb>
      </DialogWeb.Popup>
    </DialogWeb.Root>
  );
}

function CaseNoteDialogNative({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <DialogNative.Root defaultOpen={defaultOpen}>
      <DialogNative.Trigger>Add case note</DialogNative.Trigger>
      <DialogNative.Backdrop />
      <DialogNative.Popup>
        <DialogNative.Title>Add a case note</DialogNative.Title>
        <DialogNative.Description>
          Visible to everyone assigned to this filing.
        </DialogNative.Description>
        <DialogNative.Close>Cancel</DialogNative.Close>
        <ButtonNative intent="primary">Save note</ButtonNative>
      </DialogNative.Popup>
    </DialogNative.Root>
  );
}
