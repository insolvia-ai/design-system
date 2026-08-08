import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Text as TextWeb } from '@design-system/text/text.web.tsx';
import { Text as TextNative } from '@design-system/text/text.native.tsx';
import type { TextTone, TextVariant, TextWeight } from '@design-system/text/text.props.ts';

import { LeafPair } from './leaf-pair.tsx';

// Tied to the props types with `satisfies`, so a typo here is a
// `typecheck:workbench` failure rather than a run of text that silently
// renders unstyled — the same drift guard as `button.stories.tsx`'s `INTENTS`.
const VARIANTS = [
  'display',
  'heading',
  'title',
  'body',
  'caption',
] as const satisfies readonly TextVariant[];
const TONES = ['ink', 'muted', 'primary'] as const satisfies readonly TextTone[];
const WEIGHTS = ['regular', 'medium', 'semibold'] as const satisfies readonly TextWeight[];

type TextArgs = {
  variant: TextVariant;
  tone: TextTone;
  weight: TextWeight;
  content: string;
};

/**
 * The typography primitive: five sizes, six tones, three weights.
 *
 * The divergence worth watching here is structural, not visual. The web leaf
 * turns a heading variant into a real `<h2>`/`<h3>`/`<h4>`; the native leaf has
 * no elements and says `accessibilityRole="header"` instead, which
 * react-native-web renders as an `<h1>`. Both panes announce a heading — at
 * different levels — which is the same trade `Card.Title` documents.
 */
const meta = {
  title: 'Data display/Text',
  component: TextWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    variant: 'body',
    tone: 'ink',
    weight: 'regular',
    content: 'Nav computer, star charts, and jump solutions, from one console.',
  },
  argTypes: {
    variant: { control: 'select', options: [...VARIANTS] },
    tone: { control: 'select', options: [...TONES] },
    weight: { control: 'inline-radio', options: [...WEIGHTS] },
    content: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      web={
        <TextWeb variant={args.variant} tone={args.tone} weight={args.weight}>
          {args.content}
        </TextWeb>
      }
      native={
        <TextNative variant={args.variant} tone={args.tone} weight={args.weight}>
          {args.content}
        </TextNative>
      }
    />
  ),
} satisfies Meta<TextArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/**
 * All five sizes stacked, largest first.
 *
 * Read DOWN each pane, then across: the two leaves should step through the
 * same rhythm. The native leaf sets `display`/`heading` by hand because the
 * shared `textScale` stops at `lg` — this is the story where a drift between
 * that hand-written block and Tailwind's scale becomes visible.
 */
export const Variants: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {VARIANTS.map((variant) => (
            <TextWeb key={variant} variant={variant} tone={args.tone}>
              {variant}
            </TextWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 12 }}>
          {VARIANTS.map((variant) => (
            <TextNative key={variant} variant={variant} tone={args.tone}>
              {variant}
            </TextNative>
          ))}
        </View>
      }
    />
  ),
};

/**
 * The three tones on body copy — and the interesting thing is which tones are
 * missing.
 *
 * There is no `danger`, `success` or `warning` here. `text.props.ts` carries
 * the measurements: on `bg` at 14px, `warning` is 3.1:1 in light and `danger`
 * 2.9:1 in dark, so each fails in exactly the scheme its author was not
 * looking at. That first number came from this gate — the component shipped
 * six tones, `test:a11y` returned 3.06:1 for `warning`, and the tone set was
 * cut to what actually reads.
 *
 * Flip the Scheme toolbar: all three should hold in both.
 */
export const Tones: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TONES.map((tone) => (
            <TextWeb key={tone} tone={tone}>
              {tone}
            </TextWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 8 }}>
          {TONES.map((tone) => (
            <TextNative key={tone} tone={tone}>
              {tone}
            </TextNative>
          ))}
        </View>
      }
    />
  ),
};
