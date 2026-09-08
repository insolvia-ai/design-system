// Backdrop, like Dialog, portals its scrim into `document.body` — it escapes
// BOTH `<LeafPair>` panes entirely, so the play below reaches it through
// `screen`, never `pair()` (whose own doc comment says exactly this). And,
// same as `dialog.stories.tsx`: only ONE leaf opens at a time. Backdrop's web
// leaf carries no focus trap of its own, but the native leaf's RN `Modal`
// still does (react-native-web's `ModalFocusTrap`), and two of those pulling
// focus in the same page is the failure Dialog's file header documents in
// full — so this file follows the same rule rather than re-litigating it.
//
// Every story starts CLOSED behind a trigger button: Backdrop has no Trigger
// part of its own (`open` is controlled-only — see `backdrop.props.ts`), so
// each demo component below owns a bit of local state to flip it, the same
// role Dialog.Root plays for that component.
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test';
import { Pressable, Text } from 'react-native';

import { Backdrop as BackdropWeb } from '@design-system/backdrop/backdrop.web.tsx';
import { Backdrop as BackdropNative } from '@design-system/backdrop/backdrop.native.tsx';
import { useNativeColors } from '@design-system/lib/native-theme';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * The full-screen scrim Dialog and Drawer each paint privately as one part of
 * their own composition — offered standalone here, for a caller with no popup
 * card to go around it: "the whole app is busy" (pair it with a `children`
 * Spinner) or "tap anywhere to dismiss" (`onDismiss`). Compare how the two
 * leaves paint the scrim and — with `onDismiss` wired — how each exposes a
 * keyboard path to dismissal that a bare `<div>`/`View` cannot offer on its
 * own.
 */
type BackdropArgs = {
  triggerLabel: string;
  content: string;
  invisible: boolean;
  onDismiss: () => void;
};

const meta = {
  title: 'Overlays/Backdrop',
  // No `component:` — Backdrop's `open` is REQUIRED and controlled-only (no
  // Trigger part to seed an uncontrolled default from), so unlike every other
  // single-component story here, `args` cannot map onto the leaf's real props
  // 1:1: `open` has to come from state a demo owns, not from a control that
  // would fight it every render. Same reasoning `toast.stories.tsx` gives for
  // omitting it — content there is likewise raised through a hook, not passed
  // straight through as props.
  parameters: { layout: 'fullscreen' },
  args: {
    triggerLabel: 'Save changes',
    content: 'Loading…',
    invisible: false,
    onDismiss: fn(),
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    content: { control: 'text' },
    invisible: { control: 'boolean' },
    onDismiss: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Both start CLOSED — press the trigger in a pane to open that leaf's Backdrop. Backdrop has no Trigger of its own; see the file header for why only one leaf should be open at a time."
      web={<BackdropDemoWeb {...args} dismissible />}
      native={<BackdropDemoNative {...args} dismissible />}
    />
  ),
} satisfies Meta<BackdropArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Opens the web leaf, checks its content and dismissal wiring, closes it —
 * only THEN opens the native leaf and repeats. `args.onDismiss` is the one
 * `fn()` both demos share, so its call count is asserted after each pane
 * rather than just its last call: a pane that silently dropped the click
 * would otherwise be vouched for by the other pane's earlier call.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web: open via trigger, verify content, dismiss via scrim click', async () => {
      await userEvent.click(web.getByRole('button', { name: args.triggerLabel }));
      await expect(screen.findByText(args.content)).resolves.toBeVisible();

      // The scrim is decorative (`role="presentation"`) and carries no
      // accessible name, so it is reached the same way Dialog's own tests
      // reach its backdrop — a stable data hook, not a role/text query.
      const scrim = document.querySelector<HTMLElement>('[data-state="open"]');
      if (!scrim) throw new Error('Backdrop scrim not found');
      await userEvent.click(scrim);

      await waitFor(() => expect(screen.queryByText(args.content)).not.toBeInTheDocument());
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step(
      'native: open via trigger, dismiss via scrim press — only after web closed',
      async () => {
        await userEvent.click(native.getByRole('button', { name: args.triggerLabel }));
        await expect(screen.findByRole('dialog', { name: 'Overlay' })).resolves.toBeInTheDocument();
        await expect(screen.getByText(args.content)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await expect(args.onDismiss).toHaveBeenCalledTimes(2);
      },
    );
  },
};

/**
 * `invisible` — a transparent scrim that still blocks interaction underneath
 * it (Material's own name for the idea). Open each leaf to see the content
 * float over the page with no darkening behind it; the trigger and page stay
 * completely unreachable either way.
 */
export const Invisible: Story = {
  args: { invisible: true },
  render: (args) => (
    <LeafPair
      note="`invisible` — the scrim blocks interaction exactly as before, it just paints nothing. Press the trigger to see the content with no darkened backdrop behind it."
      web={<BackdropDemoWeb {...args} dismissible />}
      native={<BackdropDemoNative {...args} dismissible />}
    />
  ),
};

/**
 * No `onDismiss` — pressing the scrim does nothing, the correct shape for a
 * "the app is busy" surface with no user-initiated way out. No keyboard
 * Dismiss button and no Escape handling either, since there is nothing here
 * for either to do.
 */
export const NotDismissible: Story = {
  render: (args) => (
    <LeafPair
      note="No `onDismiss` — the scrim blocks interaction with nothing to end it. There is no Dismiss button and no Escape handling in this state; the trigger is only here to open it for a look."
      web={<BackdropDemoWeb {...args} dismissible={false} />}
      native={<BackdropDemoNative {...args} dismissible={false} />}
    />
  ),
};

interface BackdropDemoProps extends BackdropArgs {
  /** Whether THIS demo wires `onDismiss` at all — `NotDismissible` renders
   *  with the arg present (so its Actions-panel value stays visible) but does
   *  not pass it through, since that omission is the whole point of the
   *  story. */
  dismissible: boolean;
}

/**
 * The trigger button is a bare `<button>`, not `Button` — this workbench
 * never imports one component's leaf from another's story to render a third,
 * unrelated one; see the props-module leaf-import rule in
 * `design-system-component`. The Backdrop content is `text-overlay-ink`, NOT
 * `text-ink`: the scrim behind it is `bg-overlay-scrim`, opaque in BOTH
 * schemes, so the ordinary ink/muted roles — tuned for text on `bg`/`card` —
 * would read at or near invisible against it. `overlay-ink`/`overlay-muted`
 * are the tokens `tokens.json` measures specifically for text drawn OVER a
 * scrim like this one.
 */
function BackdropDemoWeb({
  triggerLabel,
  content,
  invisible,
  dismissible,
  onDismiss,
}: BackdropDemoProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" className="cursor-pointer" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      <BackdropWeb
        open={open}
        invisible={invisible}
        onDismiss={
          dismissible
            ? () => {
                onDismiss();
                setOpen(false);
              }
            : undefined
        }
      >
        <span className="font-body text-sm text-overlay-ink">{content}</span>
      </BackdropWeb>
    </>
  );
}

/** Same demo, RN primitives — see `BackdropDemoWeb` for the token note. */
function BackdropDemoNative({
  triggerLabel,
  content,
  invisible,
  dismissible,
  onDismiss,
}: BackdropDemoProps) {
  const [open, setOpen] = React.useState(false);
  const c = useNativeColors();
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
        <Text style={{ color: c.ink, fontWeight: '500' }}>{triggerLabel}</Text>
      </Pressable>
      <BackdropNative
        open={open}
        invisible={invisible}
        onDismiss={
          dismissible
            ? () => {
                onDismiss();
                setOpen(false);
              }
            : undefined
        }
      >
        <Text style={{ color: c.overlayInk }}>{content}</Text>
      </BackdropNative>
    </>
  );
}
