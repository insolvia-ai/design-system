import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Skeleton as SkeletonWeb } from '@design-system/skeleton/skeleton.web.tsx';
import { Skeleton as SkeletonNative } from '@design-system/skeleton/skeleton.native.tsx';
import {
  DEFAULT_CIRCLE_SIZE,
  type SkeletonAnimation,
  type SkeletonVariant,
} from '@design-system/skeleton/skeleton.props.ts';

import { LeafPair } from './leaf-pair.tsx';

const VARIANTS = ['text', 'circle', 'rect'] as const satisfies readonly SkeletonVariant[];
const ANIMATIONS = ['pulse', 'none'] as const satisfies readonly SkeletonAnimation[];

type SkeletonArgs = {
  variant: SkeletonVariant;
  lines: number;
  animation: SkeletonAnimation;
};

/**
 * A placeholder that reserves the space of content still loading — a filled
 * `surface-alt` box shaped like what's coming: a `text` line (or a stack of
 * them), a `circle` avatar, or a `rect` media block. Material UI's own
 * Skeleton is the behavioural reference this component follows; the LOOK is
 * this package's own throughout — `surface-alt`, this package's radii, no
 * Material styling anywhere.
 *
 * Skeleton is decorative end to end: `aria-hidden`/`accessible={false}` on
 * both leaves, because an empty box has nothing worth announcing. The
 * CONTAINER a consumer wraps real, still-loading content in is what should
 * carry `aria-busy` — Skeleton itself stays silent.
 *
 * Flip the Scheme toolbar and watch the pulse: both panes should shimmer in
 * sync, and both should go still the moment the OS/browser "reduce motion"
 * setting is on — the native pane through its own `AccessibilityInfo` check,
 * the web pane through `motion-reduce:animate-none`.
 */
const meta = {
  title: 'Data display/Skeleton',
  component: SkeletonWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    variant: 'text',
    lines: 1,
    animation: 'pulse',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: [...VARIANTS] },
    lines: { control: { type: 'number', min: 1, max: 6 } },
    animation: { control: 'inline-radio', options: [...ANIMATIONS] },
  },
  render: (args) => (
    <LeafPair
      web={<SkeletonWeb variant={args.variant} lines={args.lines} animation={args.animation} />}
      native={
        <SkeletonNative variant={args.variant} lines={args.lines} animation={args.animation} />
      }
    />
  ),
} satisfies Meta<SkeletonArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/**
 * All three shapes at once — a single `text` line, a `circle` avatar, and a
 * `rect` media block, laid out in a row.
 *
 * EVERY ITEM IN THIS ROW CARRIES AN EXPLICIT WIDTH, and that is the story's
 * doing rather than the component's. `text` and `rect` both default to
 * `width: '100%'` (see `defaultWidth` in `skeleton.props.ts`), which is the
 * right default — a skeleton standing in for a paragraph or a media block
 * should fill whatever box a consumer puts it in. It is only a ROW of them
 * that makes three `100%` items fight over one line, and the two platforms
 * resolve that fight differently: web flexbox shrinks a `width: 100%` item to
 * fit (`flex-shrink: 1` is the CSS default), React Native's does not
 * (`flexShrink: 0` is its default), so on native the text bar took the whole
 * container and pushed the circle and the rect off the visible pane. Same
 * component, same props, two panes that disagreed — which is the one thing a
 * `LeafPair` story exists to catch, and here it was the composition lying.
 *
 * Sizing the items is the fix rather than `flexShrink: 1` on the native row's
 * children, because a shrunk-to-fit item is sized by whatever the pane happens
 * to be wide, and this story is a comparison of SHAPES: each variant wants a
 * width it reads well at, identical in both panes, at any canvas width. `rect`
 * keeps its default 120 height so it still reads as a media block.
 *
 * The row TOP-ALIGNS rather than centres, for a related reason on the other
 * axis. The native leaf gives `circle` — and only `circle` — an
 * `alignSelf: 'flex-start'` (see `styles.circle` in `skeleton.native.tsx`),
 * the sizing seam that lets a circle hug its own box instead of stretching to
 * a parent the way `text` and `rect` are meant to. `alignSelf` beats a
 * parent's `alignItems`, so an `alignItems: 'center'` row centres all three
 * items on web and centres two of three on native, leaving the circle riding
 * the top of the row in one pane only. `flex-start` is the alignment BOTH
 * platforms can actually honour, which makes the panes agree by construction
 * rather than by luck.
 */
const VARIANT_WIDTH: Record<SkeletonVariant, number> = {
  text: 100,
  circle: DEFAULT_CIRCLE_SIZE,
  rect: 80,
};

export const Variants: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {VARIANTS.map((variant) => (
            <SkeletonWeb
              key={variant}
              variant={variant}
              width={VARIANT_WIDTH[variant]}
              animation={args.animation}
            />
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
          {VARIANTS.map((variant) => (
            <SkeletonNative
              key={variant}
              variant={variant}
              width={VARIANT_WIDTH[variant]}
              animation={args.animation}
            />
          ))}
        </View>
      }
    />
  ),
};

/** `lines: 4` — the last line renders at 60% width, so the block reads as a
 * paragraph's ragged right edge rather than four identical bars. */
export const Paragraph: Story = {
  args: { variant: 'text', lines: 4 },
};

/**
 * A `circle` beside two stacked `text` lines — the shape an avatar-and-title
 * row takes while it loads. Composed from Skeleton alone: no Avatar or Card
 * leaf is imported here, only differently-sized Skeletons laid out by hand,
 * which is exactly what a consumer reaching for this pattern would do too.
 */
export const CardPlaceholder: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SkeletonWeb variant="circle" animation={args.animation} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 160 }}>
            <SkeletonWeb variant="text" width={120} animation={args.animation} />
            <SkeletonWeb variant="text" width={160} animation={args.animation} />
          </div>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonNative variant="circle" animation={args.animation} />
          <View style={{ flexDirection: 'column', gap: 8, width: 160 }}>
            <SkeletonNative variant="text" width={120} animation={args.animation} />
            <SkeletonNative variant="text" width={160} animation={args.animation} />
          </View>
        </View>
      }
    />
  ),
};
