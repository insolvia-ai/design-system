import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Collapsible as CollapsibleWeb } from '@design-system/collapsible/collapsible.web.tsx';
import { Collapsible as CollapsibleNative } from '@design-system/collapsible/collapsible.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Collapsible',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Web `Collapsible.Panel` accepts arbitrary children, the same as any other
 * `<div>`. Native `Collapsible.Panel` wraps its own children in a `<Text>`
 * internally (see `collapsible.native.tsx`), so it takes a plain string, not
 * elements — every story below passes one for that reason, not for brevity.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      note="Native `Collapsible.Panel` wraps its children in `<Text>` internally — pass a string, not elements. Every panel below is a plain string for that reason."
      web={
        <CollapsibleWeb.Root>
          <CollapsibleWeb.Trigger>Show revision history</CollapsibleWeb.Trigger>
          <CollapsibleWeb.Panel>Draft created 2 hours ago. 3 edits since.</CollapsibleWeb.Panel>
        </CollapsibleWeb.Root>
      }
      native={
        <CollapsibleNative.Root>
          <CollapsibleNative.Trigger>Show revision history</CollapsibleNative.Trigger>
          <CollapsibleNative.Panel>
            Draft created 2 hours ago. 3 edits since.
          </CollapsibleNative.Panel>
        </CollapsibleNative.Root>
      }
    />
  ),
};

export const Open: Story = {
  render: () => (
    <LeafPair
      web={
        <CollapsibleWeb.Root defaultOpen>
          <CollapsibleWeb.Trigger>Show comments</CollapsibleWeb.Trigger>
          <CollapsibleWeb.Panel>2 open comments from collaborators.</CollapsibleWeb.Panel>
        </CollapsibleWeb.Root>
      }
      native={
        <CollapsibleNative.Root defaultOpen>
          <CollapsibleNative.Trigger>Show comments</CollapsibleNative.Trigger>
          <CollapsibleNative.Panel>2 open comments from collaborators.</CollapsibleNative.Panel>
        </CollapsibleNative.Root>
      }
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={
        <CollapsibleWeb.Root disabled>
          <CollapsibleWeb.Trigger>Show audit log</CollapsibleWeb.Trigger>
          <CollapsibleWeb.Panel>No audit events recorded.</CollapsibleWeb.Panel>
        </CollapsibleWeb.Root>
      }
      native={
        <CollapsibleNative.Root disabled>
          <CollapsibleNative.Trigger>Show audit log</CollapsibleNative.Trigger>
          <CollapsibleNative.Panel>No audit events recorded.</CollapsibleNative.Panel>
        </CollapsibleNative.Root>
      }
    />
  ),
};
