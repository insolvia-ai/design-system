import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Avatar as AvatarWeb } from '@design-system/avatar/avatar.web.tsx';
import { Avatar as AvatarNative } from '@design-system/avatar/avatar.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Avatar',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = ['sm', 'md', 'lg'] as const;

// A 1x1 PNG, inlined so the loaded-image story resolves with no
// network round trip in headless Chromium. react-native-web's Image loads a
// `data:` URI the same way a browser `<img>` does, so this exercises the
// real load path on both leaves.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// `.invalid` is reserved by RFC 2606 to never resolve — a deterministic way
// to force the error branch without depending on some third party's server
// returning the right status code on the day CI runs.
const BROKEN_URL = 'https://avatar-fixture.invalid/does-not-exist.jpg';

// Avatar.Root is a bare box with no role — never give it an aria-label, the
// same rule as Separator's native leaf: a label with no subtree text and no
// role is a hard `aria-prohibited-attr` violation.
export const Sizes: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {SIZES.map((size) => (
            <AvatarWeb.Root key={size} size={size}>
              <AvatarWeb.Fallback>MC</AvatarWeb.Fallback>
            </AvatarWeb.Root>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {SIZES.map((size) => (
            <AvatarNative.Root key={size} size={size}>
              <AvatarNative.Fallback>MC</AvatarNative.Fallback>
            </AvatarNative.Root>
          ))}
        </View>
      }
    />
  ),
};

/**
 * The two leaves take the image source through different props — `src` on
 * web, RN's `source={{ uri }}` on native — which is why this story builds
 * each leaf's `Image` with its own prop shape rather than sharing one.
 *
 * A sharper divergence was hiding here than the prop-shape one, and writing
 * this story is what found it. On a web build, react-native-web's `Image`
 * computes its accessible name from `aria-label`/`accessibilityLabel` — never
 * from `alt` — rendering a hidden `<img alt={ariaLabel || ''}>` under the hood
 * (`react-native-web/dist/exports/Image`). `avatar.native.tsx` forwarded only
 * `alt`, so the native leaf's image came out accessibly *decorative*
 * (`alt=""`) in a browser while the web leaf's `<img>` carried the real name —
 * one design with two different accessible names, which is the exact failure
 * this workbench exists to catch.
 *
 * Note what would NOT have caught it: the leaf was correct for a phone, since
 * RN's own `Image` does map `alt` to the accessibility label. Only the
 * react-native-web rendering diverged, and only a browser shows that. Fixed in
 * 0.8.3 by forwarding `alt` to `accessibilityLabel` as well; both panes now
 * name the image "Maria Chen".
 */
export const WithImage: Story = {
  name: 'With image (src vs source — see note)',
  render: () => (
    <LeafPair
      note="Web Image takes `src`; native Image takes RN's `source={{ uri }}` — a real API divergence between the leaves, not a story artifact."
      web={
        <AvatarWeb.Root size="lg">
          <AvatarWeb.Image src={PIXEL} alt="Maria Chen" />
          <AvatarWeb.Fallback>MC</AvatarWeb.Fallback>
        </AvatarWeb.Root>
      }
      native={
        <AvatarNative.Root size="lg">
          <AvatarNative.Image source={{ uri: PIXEL }} alt="Maria Chen" />
          <AvatarNative.Fallback>MC</AvatarNative.Fallback>
        </AvatarNative.Root>
      }
    />
  ),
};

/**
 * A genuinely broken URL rather than a faked error state — `.invalid` never
 * resolves, so both leaves' real onError handlers fire and the fallback
 * initials stay showing, the same way a client's photo failing to load would
 * behave in either a web or a React Native consumer.
 */
export const FallbackOnError: Story = {
  render: () => (
    <LeafPair
      web={
        <AvatarWeb.Root size="lg">
          <AvatarWeb.Image src={BROKEN_URL} alt="David Okafor" />
          <AvatarWeb.Fallback>DO</AvatarWeb.Fallback>
        </AvatarWeb.Root>
      }
      native={
        <AvatarNative.Root size="lg">
          <AvatarNative.Image source={{ uri: BROKEN_URL }} alt="David Okafor" />
          <AvatarNative.Fallback>DO</AvatarNative.Fallback>
        </AvatarNative.Root>
      }
    />
  ),
};
