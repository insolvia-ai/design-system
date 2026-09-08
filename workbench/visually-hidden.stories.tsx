import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pressable, Text, View } from 'react-native';

import { VisuallyHidden as VisuallyHiddenWeb } from '@design-system/visually-hidden/visually-hidden.web.tsx';
import { VisuallyHidden as VisuallyHiddenNative } from '@design-system/visually-hidden/visually-hidden.native.tsx';
import { useNativeColors } from '@design-system/lib/native-theme';

import { LeafPair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

// Named `children`, not `label`, to match `VisuallyHiddenOwnProps` — this is
// the one prop both leaves actually take, and it is what the story hands
// straight to `VisuallyHiddenWeb`/`VisuallyHiddenNative` below.
type VisuallyHiddenArgs = {
  children: string;
};

/**
 * Content that assistive technology reads and sighted users never see. The
 * classic use is right here: an icon-only control drawn as a bare glyph, whose
 * only NAME comes from the `VisuallyHidden` text sitting beside it in the
 * markup — not from `aria-label`, which this story deliberately avoids so the
 * component's own contribution is the thing under test. Turn on a screen
 * reader (or read the a11y panel) and the button announces "Close menu" while
 * showing only "✕".
 */
const meta = {
  title: 'Layout/VisuallyHidden',
  component: VisuallyHiddenWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    children: 'Close menu',
  },
  argTypes: {
    children: { control: 'text' },
  },
  render: (args) => <BasicDemo label={args.children} />,
} satisfies Meta<VisuallyHiddenArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An icon-only button, written inline rather than imported from IconButton —
 * the point of this story is what VisuallyHidden itself contributes to the
 * accessible name, not IconButton's `label` prop doing the same job a second
 * way.
 */
function BasicDemo({ label }: { label: string }) {
  return (
    <LeafPair
      web={
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-pill border border-line bg-surface-alt text-ink"
        >
          <span aria-hidden="true">✕</span>
          <VisuallyHiddenWeb>{label}</VisuallyHiddenWeb>
        </button>
      }
      native={<NativeIconButton label={label} />}
    />
  );
}

function NativeIconButton({ label }: { label: string }) {
  const c = useNativeColors();
  return (
    <Pressable
      accessibilityRole="button"
      style={{
        height: 36,
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: c.surfaceAlt,
      }}
    >
      <Text aria-hidden style={{ color: c.ink }}>
        ✕
      </Text>
      <VisuallyHiddenNative>{label}</VisuallyHiddenNative>
    </Pressable>
  );
}

export const Basic: Story = {};

/**
 * The one case VisuallyHidden takes a prop for: a "skip to content" link that
 * must stay invisible until a keyboard user tabs to it, and then has to become
 * the most visible thing on the page — a sighted keyboard user needs to SEE
 * where focus landed, not just have it announced.
 *
 * `focusable` is WEB ONLY (see the JSDoc on `VisuallyHiddenOwnProps.focusable`
 * and the seam comment in the native leaf) — there is no native reading of
 * "reveal on focus" to give this prop, so the native pane below is a note
 * rather than a second demo pretending otherwise.
 */
export const SkipLink: Story = {
  args: { children: 'Skip to main content' },
  render: (args) => (
    <LeafPair
      note="focusable is web-only — tab into the web pane below to see it. There is nothing to tab to on the native pane; see the note there."
      web={
        <a
          href="#skip-link-target"
          className="rounded-sm bg-primary px-md py-sm font-body text-primary-text no-underline"
        >
          <VisuallyHiddenWeb focusable>{args.children}</VisuallyHiddenWeb>
        </a>
      }
      native={
        <View style={{ padding: 12 }}>
          <InkText>
            `focusable` has no native reading — a device has no keyboard focus to reveal on. See the
            seam comment in visually-hidden.native.tsx.
          </InkText>
        </View>
      }
    />
  ),
};
