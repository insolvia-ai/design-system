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
 * WHERE THE STACK LIVES IS THE DIVERGENCE. The web Viewport portals to
 * `document.body`, so no `overflow: hidden` ancestor can clip it. React Native
 * has nowhere to portal to, so its Viewport is an in-tree overlay that the
 * consumer must render LAST inside their root view — every RN View starts its
 * own stacking context, so there is no z-index that rescues one rendered too
 * early. In this story that difference is visible: the web toasts pin to the
 * window's corner, the native ones to their pane's.
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
      note="Web toasts pin to the WINDOW corner (portaled); native toasts pin to their pane. Same store, different hosting — see the doc comment."
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
        <ToastNative.Provider>
          {/* `alignItems: 'flex-start'` so the Pressable hugs its label the
              way the web pane's inline-flex button does. A React Native View
              stretches its children by default, and without this the two
              panes' buttons are different widths for no reason the components
              are responsible for. */}
          <View style={{ minHeight: 160, alignItems: 'flex-start' }}>
            <PublisherNative args={args} />
            <ToastNative.Viewport label="Notifications (native leaf)" />
          </View>
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
