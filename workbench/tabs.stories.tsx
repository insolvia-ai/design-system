import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Text } from 'react-native';

import { Tabs as TabsWeb } from '@design-system/tabs/tabs.web.tsx';
import { Tabs as TabsNative } from '@design-system/tabs/tabs.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

/**
 * `Tabs.Root` requires `defaultValue` — deliberately: there is no reliable
 * "first tab" for `Root` to discover on its own (`List`'s children are the
 * caller's, not introspected), so an uncontrolled root with nothing supplied
 * would start with no tab selected at all. `defaultValue` gets no control
 * for a different reason than that requiredness, though: like Select's
 * `defaultValue`, it seeds uncontrolled state at mount, so a control that
 * "changes" it afterwards would do nothing visible.
 *
 * The two leaves diverge on the panel: web `Tabs.Panel` accepts arbitrary
 * nodes, but native `Tabs.Panel` is a plain `View`, so its text is wrapped in
 * `<Text>` by hand below. Native tabs also have no `tabpanel` role at all —
 * RN has no DOM ids to pair a tab and panel with, so the pairing is by
 * `value` equality alone, done invisibly by both leaves' shared state model.
 * No meta `component` either — `Tabs` is a parts object
 * (Root/List/Tab/Panel), same reason `dialog.stories.tsx` has none.
 */
type TabsArgs = {
  defaultValue: string;
  onValueChange: (next: string) => void;
};

const meta = {
  title: 'Data display/Tabs',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: 'content',
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Native `Tabs.Panel` is a bare `View` — its text is wrapped in `<Text>` here by hand, unlike the web `Panel`, which takes any node directly. Native also exposes no `tabpanel` role at all: Tab/Panel pairing is by `value` equality, not DOM ids."
      web={
        <TabsWeb.Root defaultValue={args.defaultValue} onValueChange={args.onValueChange}>
          <TabsWeb.List>
            <TabsWeb.Tab value="content">Content</TabsWeb.Tab>
            <TabsWeb.Tab value="comments">Comments</TabsWeb.Tab>
            <TabsWeb.Tab value="history">History</TabsWeb.Tab>
          </TabsWeb.List>
          <TabsWeb.Panel value="content">Draft language for the assignment clause.</TabsWeb.Panel>
          <TabsWeb.Panel value="comments">2 open comments from collaborators.</TabsWeb.Panel>
          <TabsWeb.Panel value="history">Last edited 3 minutes ago.</TabsWeb.Panel>
        </TabsWeb.Root>
      }
      native={
        <TabsNative.Root defaultValue={args.defaultValue} onValueChange={args.onValueChange}>
          <TabsNative.List>
            <TabsNative.Tab value="content">Content</TabsNative.Tab>
            <TabsNative.Tab value="comments">Comments</TabsNative.Tab>
            <TabsNative.Tab value="history">History</TabsNative.Tab>
          </TabsNative.List>
          <TabsNative.Panel value="content">
            <InkText>Draft language for the assignment clause.</InkText>
          </TabsNative.Panel>
          <TabsNative.Panel value="comments">
            <InkText>2 open comments from collaborators.</InkText>
          </TabsNative.Panel>
          <TabsNative.Panel value="history">
            <InkText>Last edited 3 minutes ago.</InkText>
          </TabsNative.Panel>
        </TabsNative.Root>
      }
    />
  ),
} satisfies Meta<TabsArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The play switches tabs through each leaf's OWN interaction, because the
 * two have genuinely different grammars: web supports arrow-key roving focus
 * with automatic activation (moving focus to a tab also activates it, so
 * `{ArrowRight}` alone both moves and switches), while native has no
 * keyboard concept at all — "touch just presses the tab it wants" per the
 * leaf's own header comment — so that step presses directly. Each step ends
 * on a DIFFERENT tab than the one before it, and the native assertion reads
 * visible text rather than `getByRole('tabpanel')`, since the native pane
 * exposes no such role.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: arrow-right moves focus and activates the next tab', async () => {
      const contentTab = web.getByRole('tab', { name: 'Content' });
      contentTab.focus();
      await userEvent.keyboard('{ArrowRight}');
      // Call COUNTS, not just lastCalledWith — the two panes share one
      // fn() arg, so a pane that silently drops the key would otherwise be
      // vouched for by the other pane's later call.
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('comments');
      await expect(web.getByRole('tab', { name: 'Comments' })).toHaveFocus();
      await expect(web.getByText('2 open comments from collaborators.')).toBeVisible();
    });

    await step('native leaf: no keyboard grammar — a press activates directly', async () => {
      await userEvent.click(native.getByRole('tab', { name: 'History' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('history');
      // No tabpanel role in the native pane — see the file header. Assert on
      // visible text instead.
      await expect(native.getByText('Last edited 3 minutes ago.')).toBeVisible();
    });
  },
};
