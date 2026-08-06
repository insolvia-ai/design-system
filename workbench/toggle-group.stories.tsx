import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { ToggleGroup as ToggleGroupWeb } from '@design-system/toggle-group/toggle-group.web.tsx';
import { ToggleGroup as ToggleGroupNative } from '@design-system/toggle-group/toggle-group.native.tsx';
import { Toggle as ToggleWeb } from '@design-system/toggle/toggle.web.tsx';
import { Toggle as ToggleNative } from '@design-system/toggle/toggle.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/ToggleGroup',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `ToggleGroup.Root` cannot be labelled the same way on both leaves. The web
 * Root is `role="group"` and takes `aria-label` correctly; the native Root is
 * a bare `View` with no `role="group"` equivalent in RN (see
 * `toggle-group.native.tsx`'s header), so `accessibilityLabel`/`aria-label`
 * there is a prohibited ARIA attribute — axe's `aria-prohibited-attr`, live in
 * this gate. So: the web pane names the group with `aria-label`; the native
 * pane instead gets a plain visible `<Text>` heading above an unnamed group.
 * That is shown honestly here, not papered over.
 */
export const SingleSelect: Story = {
  render: () => (
    <LeafPair
      note='Native `ToggleGroup.Root` has no `role="group"` equivalent, so `aria-label` there is a prohibited ARIA attribute. The web group is labelled with `aria-label="Text alignment"`; the native pane gets a visible heading instead, and the group itself stays unnamed.'
      web={
        <ToggleGroupWeb.Root defaultValue={['left']} aria-label="Text alignment">
          <ToggleWeb value="left">Left</ToggleWeb>
          <ToggleWeb value="center">Center</ToggleWeb>
          <ToggleWeb value="right">Right</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>Text alignment</Text>
          <ToggleGroupNative.Root defaultValue={['left']}>
            <ToggleNative value="left">Left</ToggleNative>
            <ToggleNative value="center">Center</ToggleNative>
            <ToggleNative value="right">Right</ToggleNative>
          </ToggleGroupNative.Root>
        </View>
      }
    />
  ),
};

export const MultiSelect: Story = {
  render: () => (
    <LeafPair
      note="Same native labelling gap as SingleSelect: only the web group carries an accessible name, so the native pane repeats the visible-heading idiom."
      web={
        <ToggleGroupWeb.Root multiple defaultValue={['bold', 'italic']} aria-label="Text style">
          <ToggleWeb value="bold">Bold</ToggleWeb>
          <ToggleWeb value="italic">Italic</ToggleWeb>
          <ToggleWeb value="underline">Underline</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>Text style</Text>
          <ToggleGroupNative.Root multiple defaultValue={['bold', 'italic']}>
            <ToggleNative value="bold">Bold</ToggleNative>
            <ToggleNative value="italic">Italic</ToggleNative>
            <ToggleNative value="underline">Underline</ToggleNative>
          </ToggleGroupNative.Root>
        </View>
      }
    />
  ),
};
