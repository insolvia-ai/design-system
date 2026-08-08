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
  title: 'Data display/Avatar',
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

/**
 * `Avatar.Group` — a crew, the people on a thread.
 *
 * Three things are decided in `avatar.props.ts` rather than in either leaf.
 * The group carries the SIZE, so a row cannot come out ragged (a child that
 * names its own size still wins — an explicit prop should never be silently
 * overruled). The overlap is one shared number, so the two panes stack by the
 * same amount. And `splitGroup` does the `+N` arithmetic, because "+2" on one
 * platform and "+3" on the other for the same list is precisely the divergence
 * this workbench exists to catch.
 *
 * The group is a labelled `group`, not a bare row: a screen reader reading
 * five names with no word for what they are is announcing a list of strangers.
 * The `+1` chip is announced too — it is information about who is missing, not
 * decoration.
 */
export const Group: Story = {
  render: (args) => (
    <LeafPair
      note="Count the avatars and the +N chip in each pane, and check the overlap and the ring are the same."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AvatarWeb.Group label="Crew" size={args.size}>
            {['AB', 'CD', 'EF'].map((initials) => (
              <AvatarWeb.Root key={initials}>
                <AvatarWeb.Fallback>{initials}</AvatarWeb.Fallback>
              </AvatarWeb.Root>
            ))}
          </AvatarWeb.Group>
          <AvatarWeb.Group label="Crew, capped at two" size={args.size} max={2}>
            {['AB', 'CD', 'EF', 'GH'].map((initials) => (
              <AvatarWeb.Root key={initials}>
                <AvatarWeb.Fallback>{initials}</AvatarWeb.Fallback>
              </AvatarWeb.Root>
            ))}
          </AvatarWeb.Group>
        </div>
      }
      native={
        <View style={{ gap: 16 }}>
          <AvatarNative.Group label="Crew" size={args.size}>
            {['AB', 'CD', 'EF'].map((initials) => (
              <AvatarNative.Root key={initials}>
                <AvatarNative.Fallback>{initials}</AvatarNative.Fallback>
              </AvatarNative.Root>
            ))}
          </AvatarNative.Group>
          <AvatarNative.Group label="Crew, capped at two" size={args.size} max={2}>
            {['AB', 'CD', 'EF', 'GH'].map((initials) => (
              <AvatarNative.Root key={initials}>
                <AvatarNative.Fallback>{initials}</AvatarNative.Fallback>
              </AvatarNative.Root>
            ))}
          </AvatarNative.Group>
        </View>
      }
    />
  ),
};
