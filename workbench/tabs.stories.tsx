import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text } from 'react-native';

import { Tabs as TabsWeb } from '@design-system/tabs/tabs.web.tsx';
import { Tabs as TabsNative } from '@design-system/tabs/tabs.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Tabs',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Tabs.Root` requires `defaultValue` — deliberately: there is no reliable
 * "first tab" for `Root` to discover on its own (`List`'s children are the
 * caller's, not introspected), so an uncontrolled root with nothing supplied
 * would start with no tab selected at all. Every story here passes it.
 *
 * The two leaves diverge on the panel: web `Tabs.Panel` accepts arbitrary
 * nodes, but native `Tabs.Panel` is a plain `View`, so its text is wrapped in
 * `<Text>` by hand below. Native tabs also have no `tabpanel` role at all —
 * RN has no DOM ids to pair a tab and panel with, so the pairing is by
 * `value` equality alone, done invisibly by both leaves' shared state model.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      note="Native `Tabs.Panel` is a bare `View` — its text is wrapped in `<Text>` here by hand, unlike the web `Panel`, which takes any node directly. Native also exposes no `tabpanel` role at all: Tab/Panel pairing is by `value` equality, not DOM ids."
      web={
        <TabsWeb.Root defaultValue="content">
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
        <TabsNative.Root defaultValue="content">
          <TabsNative.List>
            <TabsNative.Tab value="content">Content</TabsNative.Tab>
            <TabsNative.Tab value="comments">Comments</TabsNative.Tab>
            <TabsNative.Tab value="history">History</TabsNative.Tab>
          </TabsNative.List>
          <TabsNative.Panel value="content">
            <Text>Draft language for the assignment clause.</Text>
          </TabsNative.Panel>
          <TabsNative.Panel value="comments">
            <Text>2 open comments from collaborators.</Text>
          </TabsNative.Panel>
          <TabsNative.Panel value="history">
            <Text>Last edited 3 minutes ago.</Text>
          </TabsNative.Panel>
        </TabsNative.Root>
      }
    />
  ),
};
