import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Stack as StackWeb } from '@design-system/stack/stack.web.tsx';
import { Stack as StackNative } from '@design-system/stack/stack.native.tsx';
import type {
  StackAlign,
  StackDirection,
  StackGap,
  StackJustify,
} from '@design-system/stack/stack.props.ts';

import { LeafPair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const DIRECTIONS = ['row', 'column'] as const satisfies readonly StackDirection[];
const GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const satisfies readonly StackGap[];
const ALIGNS = ['start', 'center', 'end', 'stretch'] as const satisfies readonly StackAlign[];
const JUSTIFIES = ['start', 'center', 'end', 'between'] as const satisfies readonly StackJustify[];

/**
 * Stack takes no handler and nothing controlled, so args are typed straight
 * off `stack.props.ts`'s four axis unions plus the one boolean — both leaves
 * take every one of them under an identical name, so no bridging arg is
 * needed the way Field/Select need one for their differently-named handlers.
 */
type StackArgs = {
  direction: StackDirection;
  gap: StackGap;
  align: StackAlign;
  justify: StackJustify;
  wrap: boolean;
};

/** A plain bordered box standing in for whatever content a consumer stacks. */
function WebBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid rgba(128,128,128,0.5)',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}

function NativeBox({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.5)',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <InkText style={{ fontSize: 14 }}>{children}</InkText>
    </View>
  );
}

/**
 * A flex container that spaces its children with the package's spacing
 * tokens — `gap-xs`…`gap-xxl` on web, `spacing.xs`… (dp numbers) on native —
 * keyed off the same gap NAME, so a consumer picks one token and both
 * platforms land on the matching pixels. Compare how each pane's spacing
 * moves together as the `gap` control changes.
 */
const meta = {
  title: 'Layout/Stack',
  // The web leaf, for the docs-page props table only (best-effort react-docgen
  // — see the addon-docs note in .storybook/main.ts). Controls never rely on
  // it: they are declared by hand in `argTypes` below.
  component: StackWeb,
  args: {
    direction: 'column',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: false,
  },
  argTypes: {
    direction: { control: 'inline-radio', options: [...DIRECTIONS] },
    gap: { control: 'inline-radio', options: [...GAPS] },
    align: { control: 'inline-radio', options: [...ALIGNS] },
    justify: { control: 'inline-radio', options: [...JUSTIFIES] },
    wrap: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={
        <StackWeb
          direction={args.direction}
          gap={args.gap}
          align={args.align}
          justify={args.justify}
          wrap={args.wrap}
        >
          <WebBox>One</WebBox>
          <WebBox>Two</WebBox>
          <WebBox>Three</WebBox>
        </StackWeb>
      }
      native={
        <StackNative
          direction={args.direction}
          gap={args.gap}
          align={args.align}
          justify={args.justify}
          wrap={args.wrap}
        >
          <NativeBox>One</NativeBox>
          <NativeBox>Two</NativeBox>
          <NativeBox>Three</NativeBox>
        </StackNative>
      }
    />
  ),
} satisfies Meta<StackArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three boxes in the default column, `md` gap, stretched to fill the pane. */
export const Basic: Story = {};

/** The same three boxes, lined up horizontally instead of stacked. */
export const Row: Story = {
  args: { direction: 'row' },
};

/**
 * Every gap step, stacked and labelled, so the space between two boxes at
 * adjacent steps is easy to compare at a glance — `none` touching, `xxl`
 * wide apart.
 */
export const Gaps: Story = {
  render: () => (
    <LeafPair
      note="Each row is a two-box Stack at one gap step. Watch the space between the boxes grow from `none` to `xxl`."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {GAPS.map((gap) => (
            <div key={gap} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{gap}</span>
              <StackWeb direction="row" gap={gap}>
                <WebBox>A</WebBox>
                <WebBox>B</WebBox>
              </StackWeb>
            </div>
          ))}
        </div>
      }
      native={
        <View style={{ gap: 20 }}>
          {GAPS.map((gap) => (
            <View key={gap} style={{ gap: 6 }}>
              <InkText style={{ fontSize: 12, fontWeight: '600' }}>{gap}</InkText>
              <StackNative direction="row" gap={gap}>
                <NativeBox>A</NativeBox>
                <NativeBox>B</NativeBox>
              </StackNative>
            </View>
          ))}
        </View>
      }
    />
  ),
};

/**
 * `divider` renders between every pair of children — here a thin line built
 * inline in the story, not imported from `Separator`: Stack has no opinion
 * on what a divider looks like, and any `Separator`-like element works.
 */
export const WithDivider: Story = {
  render: () => (
    <LeafPair
      note="The divider is a plain 1px line written inline in this story — Stack itself never imports Separator."
      web={
        <StackWeb divider={<div style={{ height: 1, background: 'rgba(128,128,128,0.5)' }} />}>
          <WebBox>One</WebBox>
          <WebBox>Two</WebBox>
          <WebBox>Three</WebBox>
        </StackWeb>
      }
      native={
        <StackNative
          divider={<View style={{ height: 1, backgroundColor: 'rgba(128,128,128,0.5)' }} />}
        >
          <NativeBox>One</NativeBox>
          <NativeBox>Two</NativeBox>
          <NativeBox>Three</NativeBox>
        </StackNative>
      }
    />
  ),
};

/**
 * Six boxes in a row too narrow to hold them — `wrap` lets the extras flow
 * onto additional lines instead of overflowing or being squeezed thin.
 */
export const Wrap: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ width: 220 }}>
          <StackWeb direction="row" wrap gap="sm">
            {Array.from({ length: 6 }, (_, i) => (
              <WebBox key={i}>{i + 1}</WebBox>
            ))}
          </StackWeb>
        </div>
      }
      native={
        <View style={{ width: 220 }}>
          <StackNative direction="row" wrap gap="sm">
            {Array.from({ length: 6 }, (_, i) => (
              <NativeBox key={i}>{i + 1}</NativeBox>
            ))}
          </StackNative>
        </View>
      }
    />
  ),
};
