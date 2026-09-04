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
  truncate: boolean;
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
    truncate: false,
    content: 'Nav computer, star charts, and jump solutions, from one console.',
  },
  argTypes: {
    variant: { control: 'select', options: [...VARIANTS] },
    tone: { control: 'select', options: [...TONES] },
    weight: { control: 'inline-radio', options: [...WEIGHTS] },
    truncate: { control: 'boolean' },
    content: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      web={
        <TextWeb
          variant={args.variant}
          tone={args.tone}
          weight={args.weight}
          truncate={args.truncate}
        >
          {args.content}
        </TextWeb>
      }
      native={
        <TextNative
          variant={args.variant}
          tone={args.tone}
          weight={args.weight}
          truncate={args.truncate}
        >
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

/**
 * `truncate`, and the bug it exists for.
 *
 * Heading variants carry `text-balance`. `text-wrap: balance` is a SHORTHAND
 * that also resets `text-wrap-mode: wrap`, so it ran over `truncate`'s
 * `white-space: nowrap` — and the two utilities sat in different
 * tailwind-merge groups, so both survived the merge and the stylesheet
 * decided. A consumer's only escape was an inline `style={{ textWrap:
 * 'nowrap' }}`, whose sole merit was that nothing could merge it away.
 *
 * Both panes are capped at 220px, which is the only way to see this at all.
 * Look for: the top line wrapping onto three, the bottom one eliding. On the
 * native leaf `truncate` is `numberOfLines={1}` rather than a class — a
 * `className="truncate"` would have done nothing there, which is the other
 * half of why this became a prop.
 */
export const Truncating: Story = {
  render: () => (
    <LeafPair
      note='Capped at 220px. The prop emits the same utility a caller would write, so `truncate` and `className="truncate"` now behave identically.'
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 220 }}>
          <TextWeb variant="display">Ships in the Corellian registry</TextWeb>
          <TextWeb variant="display" truncate>
            Ships in the Corellian registry
          </TextWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 12, width: 220 }}>
          <TextNative variant="display">Ships in the Corellian registry</TextNative>
          <TextNative variant="display" truncate>
            Ships in the Corellian registry
          </TextNative>
        </View>
      }
    />
  ),
};

/**
 * `caption` lays out as a block now, and `inline` is how to ask for the old
 * behaviour.
 *
 * It used to be inline by default, so two captions — or a caption under a body
 * line — ran onto ONE line with nothing between them, and a card read
 * `Name0 references · 54 files`. `truncate` did nothing on one either, because
 * an inline box has no width to elide against. A consumer that swept its own
 * captions found nine of eighty-eight were genuinely inline: the default was
 * the exception.
 *
 * The element is still a `<span>` — a caption often sits inside running text,
 * and `<p>` cannot nest inside `<p>`. Only the display moved.
 */
export const Captions: Story = {
  render: () => (
    <LeafPair
      note="Top: two captions, each on its own line, which is the default now. Bottom: `inline`, running together — the case that used to be the default."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <TextWeb variant="title">Corellian YT-1300</TextWeb>
            <TextWeb variant="caption" tone="muted">
              0 references
            </TextWeb>
            <TextWeb variant="caption" tone="muted">
              54 files
            </TextWeb>
          </div>
          <div>
            <TextWeb variant="caption" tone="muted" inline>
              0 references
            </TextWeb>{' '}
            <TextWeb variant="caption" tone="muted" inline>
              · 54 files
            </TextWeb>
          </div>
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 16 }}>
          <View>
            <TextNative variant="title">Corellian YT-1300</TextNative>
            <TextNative variant="caption" tone="muted">
              0 references
            </TextNative>
            <TextNative variant="caption" tone="muted">
              54 files
            </TextNative>
          </View>
          {/* `inline` is web-only: an RN <Text> inside a <View> is already a
              block-level flex item and one nested inside another <Text> is
              already inline, so the caller says it by where the element goes.
              This pane shows that nesting, which is the native spelling. */}
          <TextNative variant="caption" tone="muted">
            0 references · 54 files
          </TextNative>
        </View>
      }
    />
  ),
};
