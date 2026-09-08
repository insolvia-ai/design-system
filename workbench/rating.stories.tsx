import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Rating as RatingWeb } from '@design-system/rating/rating.web.tsx';
import { Rating as RatingNative } from '@design-system/rating/rating.native.tsx';
import type { RatingSize } from '@design-system/rating/rating.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly RatingSize[];

/**
 * A row of stars the user picks an integer value from — hover previews the
 * value on web, clicking (pressing, on native) sets it, and clicking the
 * current value again clears it. Only whole stars: half-precision would need
 * pointer-position maths with no honest keyboard or touch equivalent, which
 * `rating.props.ts` argues out in full.
 *
 * The look comes straight from this package's own tokens rather than
 * Material's reference yellow — a filled star is `text-primary`, an empty
 * one is a `text-line` outline. Compare the two panes at every size and in
 * both colour schemes: the filled/empty split should read identically.
 */
type RatingArgs = {
  defaultValue: number | null;
  max: number;
  size: RatingSize;
  readOnly: boolean;
  disabled: boolean;
  label: string;
  onValueChange: (next: number | null) => void;
};

const meta = {
  title: 'Forms/Rating',
  component: RatingWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: null,
    max: 5,
    size: 'md',
    readOnly: false,
    disabled: false,
    label: 'Rating',
    onValueChange: fn(),
  },
  argTypes: {
    // Seeds UNCONTROLLED state — twiddling it after mount changes nothing,
    // same gap select.stories.tsx's `defaultValue` note explains.
    defaultValue: { control: false },
    max: { control: { type: 'number', min: 1, max: 10 } },
    size: { control: 'inline-radio', options: [...SIZES] },
  },
  render: (args) => (
    <LeafPair
      web={
        <RatingWeb
          defaultValue={args.defaultValue}
          max={args.max}
          size={args.size}
          readOnly={args.readOnly}
          disabled={args.disabled}
          label={args.label}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <RatingNative
          defaultValue={args.defaultValue}
          max={args.max}
          size={args.size}
          readOnly={args.readOnly}
          disabled={args.disabled}
          label={args.label}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<RatingArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Clicking (web) / pressing (native) the 4th star sets the value to 4 in
 * both panes, through the one shared `onValueChange` arg.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);

    await userEvent.click(web.getByRole('radio', { name: '4 stars' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(4);
    await expect(web.getByRole('radio', { name: '4 stars' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await userEvent.click(native.getByRole('radio', { name: '4 stars' }));
    // Call COUNTS, not just lastCalledWith — the two panes share one fn()
    // arg, so a pane that silently drops its press would otherwise be
    // vouched for by the other pane's earlier click.
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(4);
    await expect(native.getByRole('radio', { name: '4 stars' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

/**
 * The three star boxes — 20/28/36px — at the same rated value, so only the
 * box and glyph size should change between rows.
 */
export const Sizes: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SIZES.map((size) => (
            <RatingWeb key={size} defaultValue={3} size={size} label={`Rating (${size})`} />
          ))}
        </div>
      }
      native={
        <View style={{ gap: 12 }}>
          {SIZES.map((size) => (
            <RatingNative key={size} defaultValue={3} size={size} label={`Rating (${size})`} />
          ))}
        </View>
      }
    />
  ),
};

/**
 * Display only — a single labelled element per pane (`role="img"` /
 * `accessibilityRole="image"`), no radios, no hover, no press.
 */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 4 },
};

/** Every star disabled; the value never changes. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 2 },
};

/** A longer scale — `max` is not pinned to 5. */
export const Max10: Story = {
  args: { max: 10, defaultValue: 7 },
};
