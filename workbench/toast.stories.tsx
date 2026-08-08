// The web Viewport PORTALS to document.body, so the toasts it renders are not
// inside their `<LeafPair>` pane — queries for them go through `screen`. The
// native Viewport is an in-tree overlay and stays inside its pane, which is
// itself one of the differences this story exists to show.
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, screen, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Toast as ToastWeb } from '@design-system/toast/toast.web.tsx';
import { Toast as ToastNative } from '@design-system/toast/toast.native.tsx';
import { useToast, type ToastIntent } from '@design-system/toast/toast.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

const INTENTS = ['info', 'success', 'warning', 'danger'] as const satisfies readonly ToastIntent[];

type ToastArgs = {
  title: string;
  description: string;
  intent: ToastIntent;
  /** 0 keeps the toast up until it is dismissed — what these stories use. */
  duration: number;
};

// The publisher has to sit INSIDE the Provider to reach `useToast()`, which is
// the whole ergonomic point of the hook: the button that raises a toast is
// usually nowhere near the JSX that renders one.
function PublisherWeb({ args }: { args: ToastArgs }) {
  const toast = useToast();
  return (
    <ButtonWeb
      onClick={() =>
        toast.add({
          title: args.title,
          description: args.description,
          intent: args.intent,
          duration: args.duration,
        })
      }
    >
      Raise a toast
    </ButtonWeb>
  );
}

function PublisherNative({ args }: { args: ToastArgs }) {
  const toast = useToast();
  return (
    <ButtonNative
      onPress={() =>
        toast.add({
          title: args.title,
          description: args.description,
          intent: args.intent,
          duration: args.duration,
        })
      }
    >
      Raise a toast
    </ButtonNative>
  );
}

/**
 * Transient notifications, raised imperatively.
 *
 * This is the one component in the package with a hook-based API alongside its
 * parts, and the reason is that a toast is asked for from an event handler far
 * from any JSX — `useToast().add(...)`. Everything about WHEN a toast leaves
 * lives in the shared store (`toast.props.ts`), including the rule that
 * patching a toast's duration restarts its clock rather than letting the old
 * deadline stand.
 *
 * The intent set and the live-region rule are imported from `Alert`: a toast
 * is an alert that shows up by itself, so "danger interrupts, success waits"
 * is decided once. The role sits on each TOAST rather than on the region — a
 * region that announced its own arrival would repeat every message twice.
 *
 * HOW THE STACK IS HOSTED DIFFERS; WHERE IT LANDS DOES NOT. The web Viewport
 * portals to `document.body`, so no `overflow: hidden` ancestor can clip it.
 * React Native has nowhere to portal to, so its Viewport is an in-tree overlay
 * pinned with `position: absolute` — and that is the constraint a consumer has
 * to honour: **render `Toast.Viewport` as a direct child of your root view.**
 * Every RN View is `position: relative`, so a Viewport nested inside one pins
 * to THAT view instead of the screen, and no z-index rescues it.
 *
 * This story got that wrong at first — it wrapped the native Viewport in a
 * decorative `View`, and the toast dutifully pinned itself inside the pane
 * while the web one went to the window corner. That read as a broken
 * component and was a broken story: on a device, a Viewport at the app root
 * pins to the screen, exactly as the web one pins to the window. Both panes
 * now do, and the native strip carries a story-level `bottom` offset purely so
 * the two do not land on top of each other.
 */
const meta = {
  title: 'Overlays/Toast',
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Jump logged',
    description: 'The nav computer stored the solution.',
    intent: 'success',
    duration: 0,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    intent: { control: 'inline-radio', options: [...INTENTS] },
    duration: { control: { type: 'number', min: 0, step: 1000 } },
  },
  render: (args) => (
    <LeafPair
      note="Both leaves pin to the WINDOW corner — the web one portaled, the native one absolutely positioned from the app root. The native strip sits a little higher only so the two do not overlap."
      web={
        <ToastWeb.Provider>
          <PublisherWeb args={args} />
          {/* Each pane names its region differently. Both leaves render a
              `region` landmark, `<LeafPair>` puts two live copies on one page,
              and with the same name axe's `landmark-unique` fires — the same
              workbench artifact breadcrumbs.stories.tsx documents. A real app
              has one viewport and takes the default name. */}
          <ToastWeb.Viewport label="Notifications (web leaf)" />
        </ToastWeb.Provider>
      }
      native={
        // The Viewport is a DIRECT child of the Provider, with no View
        // between them, and that is the whole arrangement — see the doc
        // comment. Wrapping it in one pins the toast to that wrapper.
        <ToastNative.Provider>
          <View style={{ alignItems: 'flex-start' }}>
            <PublisherNative args={args} />
          </View>
          <ToastNative.Viewport
            label="Notifications (native leaf)"
            // The lift is the STORY's, not the component's. Both leaves pin to
            // the same window corner, so without it the two panes' toasts land
            // on top of each other and the comparison shows one toast.
            style={{ bottom: 96 }}
          />
        </ToastNative.Provider>
      }
    />
  ),
} satisfies Meta<ToastArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with a toast up in each pane, so axe audits a rendered toast rather
 * than an empty viewport. `duration: 0` is what keeps them there — a
 * five-second default would expire mid-audit.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: the toast lands in the portaled region', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Raise a toast' }));
      // Portaled out of the pane, so this is a `screen` query.
      await expect(await screen.findByText(args.title)).toBeInTheDocument();
      await expect(screen.getByRole('status')).toHaveTextContent(args.title);
    });

    await step('native leaf: the toast lands INSIDE the pane', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Raise a toast' }));
      await expect(native.getByText(args.title)).toBeInTheDocument();
      await expect(native.getByRole('status')).toHaveTextContent(args.title);
    });
  },
};

/**
 * A danger toast, which is the intent that interrupts: `alert` rather than the
 * polite `status`. Worth hearing with a screen reader on, not just seeing.
 */
export const Danger: Story = {
  args: {
    title: 'Jump aborted',
    description: 'Fuel below reserve — the solution was discarded.',
    intent: 'danger',
  },
};
