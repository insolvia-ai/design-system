import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Masonry as MasonryWeb } from '@design-system/masonry/masonry.web.tsx';
import { Masonry as MasonryNative } from '@design-system/masonry/masonry.native.tsx';
import type { MasonryGap } from '@design-system/masonry/masonry.props.ts';
import { useNativeColors } from '@design-system/lib/native-theme';

import { LeafPair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const GAPS = ['none', 'xs', 'sm', 'md', 'lg'] as const satisfies readonly MasonryGap[];

// Nine heights, deliberately varied (40–140px) and in no particular pattern —
// the point of the Basic story is that BOTH panes place index `4` (the
// tallest box) in the same column, which only holds because both leaves fill
// from the same `distribute` function.
const HEIGHTS = [60, 110, 40, 90, 140, 70, 100, 50, 120];

function WebBox({ index }: { index: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-sm border border-line bg-card text-xs text-ink"
      style={{ height: HEIGHTS[index] }}
    >
      {index}
    </div>
  );
}

function NativeBox({ index }: { index: number }) {
  const c = useNativeColors();
  return (
    <View
      style={{
        height: HEIGHTS[index],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: c.card,
        borderRadius: 4,
      }}
    >
      <InkText style={{ fontSize: 12 }}>{index}</InkText>
    </View>
  );
}

type MasonryArgs = {
  columns: number;
  gap: MasonryGap;
  sequential: boolean;
};

/**
 * Children of varying height, packed into columns with no row alignment.
 *
 * Neither leaf measures anything at render time, so there is no "shortest
 * column" logic here — both leaves distribute children into `columns` buckets
 * from the SAME function (`distribute`, in `masonry.props.ts`), which is the
 * only way this package can promise the two panes agree on where an item
 * lands. The default order is round-robin (row-major, item `i` → column
 * `i % columns`); `sequential` switches to column-major, the order CSS
 * multi-column would give for free on web alone.
 *
 * Compare the index labels across panes on every story here — that ordering
 * agreement is the whole thing under test.
 */
const meta = {
  title: 'Data display/Masonry',
  component: MasonryWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    columns: 3,
    gap: 'sm',
    sequential: false,
  },
  argTypes: {
    columns: { control: { type: 'number', min: 1, max: 6, step: 1 } },
    gap: { control: 'inline-radio', options: [...GAPS] },
    sequential: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={
        <MasonryWeb columns={args.columns} gap={args.gap} sequential={args.sequential}>
          {HEIGHTS.map((_, i) => (
            <WebBox key={i} index={i} />
          ))}
        </MasonryWeb>
      }
      native={
        <MasonryNative columns={args.columns} gap={args.gap} sequential={args.sequential}>
          {HEIGHTS.map((_, i) => (
            <NativeBox key={i} index={i} />
          ))}
        </MasonryNative>
      }
    />
  ),
} satisfies Meta<MasonryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/**
 * `sequential` fills column-major instead of the default round-robin:
 * column 0 gets the first three boxes (0, 1, 2), column 1 the next three, and
 * so on — read each column top-to-bottom before moving to the next, instead
 * of reading across the row.
 */
export const Sequential: Story = {
  args: { sequential: true },
};

/**
 * Two columns, then four — the same nine boxes, redistributed. Watch box `4`
 * (the tallest) move columns identically in both panes as the count changes.
 */
export const Columns: Story = {
  render: (args) => (
    <LeafPair
      note="Two columns above, four below — same nine boxes, same order, redistributed."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <MasonryWeb columns={2} gap={args.gap} sequential={args.sequential}>
            {HEIGHTS.map((_, i) => (
              <WebBox key={i} index={i} />
            ))}
          </MasonryWeb>
          <MasonryWeb columns={4} gap={args.gap} sequential={args.sequential}>
            {HEIGHTS.map((_, i) => (
              <WebBox key={i} index={i} />
            ))}
          </MasonryWeb>
        </div>
      }
      native={
        <View style={{ gap: 24 }}>
          <MasonryNative columns={2} gap={args.gap} sequential={args.sequential}>
            {HEIGHTS.map((_, i) => (
              <NativeBox key={i} index={i} />
            ))}
          </MasonryNative>
          <MasonryNative columns={4} gap={args.gap} sequential={args.sequential}>
            {HEIGHTS.map((_, i) => (
              <NativeBox key={i} index={i} />
            ))}
          </MasonryNative>
        </View>
      }
    />
  ),
};

/** Every gap step, three columns, six boxes — small enough to see the step
 * between columns and between items in a column change together. */
export const Gaps: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {GAPS.map((gap) => (
            <MasonryWeb key={gap} columns={3} gap={gap} sequential={args.sequential}>
              {HEIGHTS.slice(0, 6).map((_, i) => (
                <WebBox key={i} index={i} />
              ))}
            </MasonryWeb>
          ))}
        </div>
      }
      native={
        <View style={{ gap: 24 }}>
          {GAPS.map((gap) => (
            <MasonryNative key={gap} columns={3} gap={gap} sequential={args.sequential}>
              {HEIGHTS.slice(0, 6).map((_, i) => (
                <NativeBox key={i} index={i} />
              ))}
            </MasonryNative>
          ))}
        </View>
      }
    />
  ),
};
