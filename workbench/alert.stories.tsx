import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Alert as AlertWeb } from '@design-system/alert/alert.web.tsx';
import { Alert as AlertNative } from '@design-system/alert/alert.native.tsx';
import type { AlertIntent } from '@design-system/alert/alert.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const INTENTS = ['info', 'success', 'warning', 'danger'] as const satisfies readonly AlertIntent[];

/**
 * `Alert` is a parts object (`Root`/`Title`/`Description`/`Close`), so there is
 * no single component for a meta `component` to point at. Args cover the
 * content threaded into that composition plus `Root`'s own intent and
 * dismissibility.
 */
type AlertArgs = {
  intent: AlertIntent;
  title: string;
  description: string;
  dismissible: boolean;
  onDismiss: () => void;
};

/**
 * A message box that holds no state of its own: it renders while you render
 * it, and `onDismiss` tells you to stop. An alert that hid itself could not
 * come back for the next occurrence of the same error, which is the case that
 * matters.
 *
 * Two things here are decided in `alert.props.ts` rather than in either leaf.
 * The live-region role — `danger` and `warning` get `alert` and interrupt a
 * screen reader; `info` and `success` get the polite `status` — because
 * interrupting someone mid-sentence to say "Saved" is a real defect. And the
 * intent being a STRIPE rather than coloured text, for the contrast reason
 * `badge.props.ts` measures out at length.
 */
const meta = {
  title: 'Data display/Alert',
  parameters: { layout: 'fullscreen' },
  args: {
    intent: 'warning',
    title: 'Fuel below reserve',
    description: 'The jump will complete, but you will arrive without margin.',
    dismissible: true,
    onDismiss: fn(),
  },
  argTypes: {
    intent: { control: 'inline-radio', options: [...INTENTS] },
    title: { control: 'text' },
    description: { control: 'text' },
    dismissible: { control: 'boolean' },
    onDismiss: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <AlertWeb.Root
          intent={args.intent}
          onDismiss={args.dismissible ? args.onDismiss : undefined}
        >
          <AlertWeb.Title>{args.title}</AlertWeb.Title>
          <AlertWeb.Description>{args.description}</AlertWeb.Description>
        </AlertWeb.Root>
      }
      native={
        <AlertNative.Root
          intent={args.intent}
          onDismiss={args.dismissible ? args.onDismiss : undefined}
        >
          <AlertNative.Title>{args.title}</AlertNative.Title>
          <AlertNative.Description>{args.description}</AlertNative.Description>
        </AlertNative.Root>
      }
    />
  ),
} satisfies Meta<AlertArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both panes' dismiss controls drive the SAME `onDismiss` arg, so the play
 * counts calls per pane rather than just checking the last one — a pane that
 * silently dropped the press would otherwise be vouched for by the other
 * pane's earlier call.
 *
 * The alert is still on screen when the play ends, which is what axe then
 * audits: a dismissed alert would audit nothing.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: the corner control is named and calls onDismiss', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Dismiss' }));
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('native leaf: same name, same handler', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Dismiss' }));
      await expect(args.onDismiss).toHaveBeenCalledTimes(2);
    });

    await step('both panes carry the intent’s live-region role', async () => {
      // `warning` is assertive on both leaves — the web leaf from a `role`
      // attribute, the native leaf from RN's `role` prop through
      // react-native-web. Same string, two very different code paths.
      await expect(web.getByRole('alert')).toBeInTheDocument();
      await expect(native.getByRole('alert')).toBeInTheDocument();
    });
  },
};

/**
 * The four intents stacked. Watch the left stripe, not the text: every intent
 * renders its title in `ink` and its body in `muted`, in both schemes.
 *
 * These are not dismissible, so neither leaf renders a control — with no
 * `onDismiss` there is nothing a dismiss button could do, and a dead button is
 * worse than no button.
 */
export const Intents: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {INTENTS.map((intent) => (
            <AlertWeb.Root key={intent} intent={intent}>
              <AlertWeb.Title>{intent}</AlertWeb.Title>
              <AlertWeb.Description>{args.description}</AlertWeb.Description>
            </AlertWeb.Root>
          ))}
        </div>
      }
      native={
        <View style={{ gap: 12 }}>
          {INTENTS.map((intent) => (
            <AlertNative.Root key={intent} intent={intent}>
              <AlertNative.Title>{intent}</AlertNative.Title>
              <AlertNative.Description>{args.description}</AlertNative.Description>
            </AlertNative.Root>
          ))}
        </View>
      }
    />
  ),
};

/**
 * `Alert.Close` — an in-body dismiss control, for when a text button beside an
 * action reads better than the corner ×. It renders nothing unless the Root is
 * dismissible, which is why it can be composed unconditionally.
 */
export const WithBodyClose: Story = {
  render: (args) => (
    <LeafPair
      web={
        <AlertWeb.Root intent="info" onDismiss={args.onDismiss}>
          <AlertWeb.Title>Nav data updated</AlertWeb.Title>
          <AlertWeb.Description>{args.description}</AlertWeb.Description>
          <AlertWeb.Close>Got it</AlertWeb.Close>
        </AlertWeb.Root>
      }
      native={
        <AlertNative.Root intent="info" onDismiss={args.onDismiss}>
          <AlertNative.Title>Nav data updated</AlertNative.Title>
          <AlertNative.Description>{args.description}</AlertNative.Description>
          <AlertNative.Close>Got it</AlertNative.Close>
        </AlertNative.Root>
      }
    />
  ),
};
