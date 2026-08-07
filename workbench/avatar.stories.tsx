import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Avatar as AvatarWeb } from '@design-system/avatar/avatar.web.tsx';
import { Avatar as AvatarNative } from '@design-system/avatar/avatar.native.tsx';
import type { AvatarSize } from '@design-system/avatar/avatar.props.ts';

import { LeafPair } from './leaf-pair.tsx';

// The three sizes that EXIST — tied to `AvatarSize` with `satisfies` so a
// typo here is a `typecheck:workbench` failure, not a size button that quietly
// renders nothing (the same reasoning as `button.stories.tsx`'s `INTENTS`).
const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly AvatarSize[];

/**
 * Args cover `Root`'s `size` and the initials `Fallback` shows while no image
 * has loaded — the two props a docs-page reader would actually reach for.
 * There is no meta `component`: `Avatar` is a parts object
 * (`Root`/`Image`/`Fallback`), the same shape as `Card`, and the loaded- and
 * broken-image states below are real API divergences (`src` vs `source`) that
 * only make sense as their own stories, not as something a control can drive.
 */
type AvatarArgs = {
  size: AvatarSize;
  initials: string;
};

/**
 * A fixed-size circular identity badge: initials until an image loads, then
 * the image. `Root` owns the size and the image-load state machine
 * (`avatar.props.ts`'s `useAvatarImageStatus`); `Image` and `Fallback` both
 * read it, which is why `Fallback` alone is enough to show the default state.
 */
const meta = {
  title: 'Components/Avatar',
  parameters: { layout: 'fullscreen' },
  args: {
    size: 'md',
    initials: 'LO',
  },
  argTypes: {
    size: { control: 'inline-radio', options: [...SIZES] },
  },
  render: (args) => (
    <LeafPair
      web={
        <AvatarWeb.Root size={args.size}>
          <AvatarWeb.Fallback>{args.initials}</AvatarWeb.Fallback>
        </AvatarWeb.Root>
      }
      native={
        <AvatarNative.Root size={args.size}>
          <AvatarNative.Fallback>{args.initials}</AvatarNative.Fallback>
        </AvatarNative.Root>
      }
    />
  ),
} satisfies Meta<AvatarArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing: no image, so both leaves fall back to initials —
 * the state every avatar starts in before an image resolves one way or the
 * other.
 */
export const Basic: Story = {};

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
 * name the image "Leia Organa".
 */
export const WithImage: Story = {
  name: 'With image (src vs source — see note)',
  render: () => (
    <LeafPair
      note="Web Image takes `src`; native Image takes RN's `source={{ uri }}` — a real API divergence between the leaves, not a story artifact."
      web={
        <AvatarWeb.Root size="lg">
          <AvatarWeb.Image src={PIXEL} alt="Leia Organa" />
          <AvatarWeb.Fallback>MC</AvatarWeb.Fallback>
        </AvatarWeb.Root>
      }
      native={
        <AvatarNative.Root size="lg">
          <AvatarNative.Image source={{ uri: PIXEL }} alt="Leia Organa" />
          <AvatarNative.Fallback>MC</AvatarNative.Fallback>
        </AvatarNative.Root>
      }
    />
  ),
};

/**
 * A genuinely broken URL rather than a faked error state — `.invalid` never
 * resolves, so both leaves' real onError handlers fire and the fallback
 * initials stay showing, the same way a pilot's photo failing to load would
 * behave in either a web or a React Native consumer.
 */
export const FallbackOnError: Story = {
  render: () => (
    <LeafPair
      web={
        <AvatarWeb.Root size="lg">
          <AvatarWeb.Image src={BROKEN_URL} alt="Lando Calrissian" />
          <AvatarWeb.Fallback>DO</AvatarWeb.Fallback>
        </AvatarWeb.Root>
      }
      native={
        <AvatarNative.Root size="lg">
          <AvatarNative.Image source={{ uri: BROKEN_URL }} alt="Lando Calrissian" />
          <AvatarNative.Fallback>DO</AvatarNative.Fallback>
        </AvatarNative.Root>
      }
    />
  ),
};
