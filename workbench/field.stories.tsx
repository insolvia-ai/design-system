import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Field',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Description` and `Error` are DIRECT children of `Root` in every story
 * below, never wrapped in a `div`/`View`. Both leaves compute
 * `aria-describedby` from a `React.Children.forEach` identity scan against
 * their own `Description`/`Error` — a wrapper defeats that scan and silently
 * drops the id from the association, even though the text still renders.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      web={
        <FieldWeb.Root>
          <FieldWeb.Label>Case number</FieldWeb.Label>
          <FieldWeb.Control placeholder="e.g. 24-10456" />
          <FieldWeb.Description>
            Assigned by the clerk&rsquo;s office once filed.
          </FieldWeb.Description>
        </FieldWeb.Root>
      }
      native={
        <FieldNative.Root>
          <FieldNative.Label>Case number</FieldNative.Label>
          <FieldNative.Control placeholder="e.g. 24-10456" />
          <FieldNative.Description>
            Assigned by the clerk&rsquo;s office once filed.
          </FieldNative.Description>
        </FieldNative.Root>
      }
    />
  ),
};

export const Invalid: Story = {
  render: () => (
    <LeafPair
      web={
        <FieldWeb.Root invalid>
          <FieldWeb.Label>Client email</FieldWeb.Label>
          <FieldWeb.Control type="email" placeholder="you@firm.com" defaultValue="not-an-email" />
          <FieldWeb.Error>Enter a valid email address.</FieldWeb.Error>
        </FieldWeb.Root>
      }
      native={
        <FieldNative.Root invalid>
          <FieldNative.Label>Client email</FieldNative.Label>
          <FieldNative.Control placeholder="you@firm.com" defaultValue="not-an-email" />
          <FieldNative.Error>Enter a valid email address.</FieldNative.Error>
        </FieldNative.Root>
      }
    />
  ),
};

/**
 * The two leaves take a read-only control through DIFFERENT props, not just
 * different spellings of the same one: the web `Control` is an `<input>` and
 * takes the standard `disabled`; the native `Control` is a `TextInput` and
 * has no `disabled` — it takes `editable={false}` instead (the native leaf
 * derives `accessibilityState.disabled` from that itself). A call site that
 * only sets `disabled` on both, expecting one prop name to work everywhere,
 * silently leaves the native field editable.
 */
export const ReadOnly: Story = {
  name: 'Disabled / read-only',
  render: () => (
    <LeafPair
      note="Different contracts, not different spellings: web `Control` takes `disabled`; native `Control` takes `editable={false}`."
      web={
        <FieldWeb.Root>
          <FieldWeb.Label>Filed by</FieldWeb.Label>
          <FieldWeb.Control defaultValue="Alex Rivera, Esq." disabled />
        </FieldWeb.Root>
      }
      native={
        <FieldNative.Root>
          <FieldNative.Label>Filed by</FieldNative.Label>
          <FieldNative.Control defaultValue="Alex Rivera, Esq." editable={false} />
        </FieldNative.Root>
      }
    />
  ),
};
