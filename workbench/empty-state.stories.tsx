import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pressable, Text, View } from 'react-native';

import { EmptyState as EmptyStateWeb } from '@design-system/empty-state/empty-state.web.tsx';
import { EmptyState as EmptyStateNative } from '@design-system/empty-state/empty-state.native.tsx';
import type { EmptyStateSize } from '@design-system/empty-state/empty-state.props.ts';
import { buttonClass } from '@design-system/button/button.props.ts';
import { useNativeColors } from '@design-system/lib/native-theme';

import { LeafPair } from './leaf-pair.tsx';
import { MutedText } from './ink-text.tsx';

const SIZES = ['sm', 'md'] as const satisfies readonly EmptyStateSize[];

/**
 * The web icon: a plain circle-slash glyph, drawn with `stroke="currentColor"`
 * so it picks up `EmptyState.Icon`'s `text-muted`, exactly the way a consumer's
 * own SVG icon would. Decoration only — `EmptyState.Icon` already sets
 * `aria-hidden`.
 */
function NoDataGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={28}
      height={28}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M6 6 L18 18" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A `<button>` styled with `buttonClass` — the same Tailwind string
 * `Button.web` composes off, so the action reads as a real Button without this
 * story importing the component (leaves may not import another leaf).
 */
function WebAction({ children }: { children: string }) {
  return (
    <button type="button" className={buttonClass({ size: 'sm' })}>
      {children}
    </button>
  );
}

/**
 * The native counterpart, hand-built the same way `visually-hidden.stories.tsx`
 * builds its icon button: a `Pressable` filled with `c.primary`, labelled with
 * `c.primaryText` — the two tokens `Button.native` itself paints its primary
 * intent with.
 */
function NativeAction({ children }: { children: string }) {
  const c = useNativeColors();
  return (
    <Pressable
      accessibilityRole="button"
      style={{
        height: 32,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: c.primary,
      }}
    >
      <Text style={{ color: c.primaryText, fontSize: 14, fontWeight: '500' }}>{children}</Text>
    </Pressable>
  );
}

type EmptyStateArgs = {
  size: EmptyStateSize;
  title: string;
  description: string;
  action: string;
};

/**
 * What a screen, table, or list shows when there is nothing in it: an
 * optional icon, a title, a description, and an optional action. `Combobox`
 * already has a one-line empty message for an open listbox — this is the
 * block-level version for a whole screen or panel, built the same way `Card`
 * and `Dialog` are: a parts object threaded explicitly through both leaves,
 * no single `component` for autodocs to point at.
 *
 * The web `Root` is a plain labelled `<section>`, not a live region —
 * `role="status"` is for a message that appears in RESPONSE to something,
 * which is exactly what Combobox's inline message is and this is not.
 */
const meta = {
  title: 'Data display/EmptyState',
  parameters: { layout: 'fullscreen' },
  args: {
    size: 'md',
    title: 'No results',
    description: 'Try a different search term, or clear your filters to see everything.',
    action: 'Clear filters',
  },
  argTypes: {
    size: { control: 'inline-radio', options: [...SIZES] },
    title: { control: 'text' },
    description: { control: 'text' },
    action: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      web={
        <EmptyStateWeb.Root size={args.size}>
          <EmptyStateWeb.Icon>
            <NoDataGlyph />
          </EmptyStateWeb.Icon>
          <EmptyStateWeb.Title>{args.title}</EmptyStateWeb.Title>
          <EmptyStateWeb.Description>{args.description}</EmptyStateWeb.Description>
          <EmptyStateWeb.Actions>
            <WebAction>{args.action}</WebAction>
          </EmptyStateWeb.Actions>
        </EmptyStateWeb.Root>
      }
      native={
        <EmptyStateNative.Root size={args.size}>
          <EmptyStateNative.Icon>
            <MutedText style={{ fontSize: 28 }}>{'⊘'}</MutedText>
          </EmptyStateNative.Icon>
          <EmptyStateNative.Title>{args.title}</EmptyStateNative.Title>
          <EmptyStateNative.Description>{args.description}</EmptyStateNative.Description>
          <EmptyStateNative.Actions>
            <NativeAction>{args.action}</NativeAction>
          </EmptyStateNative.Actions>
        </EmptyStateNative.Root>
      }
    />
  ),
} satisfies Meta<EmptyStateArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/**
 * `sm` and `md` side by side. Only the padding and the title's text size move
 * between them — the gap, the icon box, and the description's size stay fixed,
 * so `sm` reads as a denser version of the same block rather than a smaller
 * component.
 */
export const Sizes: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={280}
      web={
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <div key={size} style={{ width: 260, border: '1px solid rgba(128,128,128,0.25)' }}>
              <EmptyStateWeb.Root size={size}>
                <EmptyStateWeb.Icon>
                  <NoDataGlyph />
                </EmptyStateWeb.Icon>
                <EmptyStateWeb.Title>{size === 'sm' ? 'Small' : 'Medium'}</EmptyStateWeb.Title>
                <EmptyStateWeb.Description>{args.description}</EmptyStateWeb.Description>
              </EmptyStateWeb.Root>
            </div>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {SIZES.map((size) => (
            <View
              key={size}
              style={{ width: 260, borderWidth: 1, borderColor: 'rgba(128,128,128,0.25)' }}
            >
              <EmptyStateNative.Root size={size}>
                <EmptyStateNative.Icon>
                  <MutedText style={{ fontSize: 28 }}>{'⊘'}</MutedText>
                </EmptyStateNative.Icon>
                <EmptyStateNative.Title>
                  {size === 'sm' ? 'Small' : 'Medium'}
                </EmptyStateNative.Title>
                <EmptyStateNative.Description>{args.description}</EmptyStateNative.Description>
              </EmptyStateNative.Root>
            </View>
          ))}
        </View>
      }
    />
  ),
};

/**
 * No `Icon` at all — it is optional, and a title/description pair reads fine
 * on its own for a lighter-weight empty state (a single empty field, rather
 * than a whole empty screen).
 */
export const NoIcon: Story = {
  render: (args) => (
    <LeafPair
      web={
        <EmptyStateWeb.Root size={args.size}>
          <EmptyStateWeb.Title>{args.title}</EmptyStateWeb.Title>
          <EmptyStateWeb.Description>{args.description}</EmptyStateWeb.Description>
        </EmptyStateWeb.Root>
      }
      native={
        <EmptyStateNative.Root size={args.size}>
          <EmptyStateNative.Title>{args.title}</EmptyStateNative.Title>
          <EmptyStateNative.Description>{args.description}</EmptyStateNative.Description>
        </EmptyStateNative.Root>
      }
    />
  ),
};

/**
 * The common placement: inside a bordered panel standing in for a table or
 * list's body — a plain `div`/`View` border, not `Card`, since a data table's
 * own container usually already owns the border and `EmptyState` just fills
 * the space where rows would be.
 */
export const InsideACard: Story = {
  args: {
    title: 'No rows yet',
    description: 'Data will show up here once your first sync completes.',
    action: 'Start a sync',
  },
  render: (args) => (
    <LeafPair
      web={
        <div style={{ maxWidth: 420, border: '1px solid rgba(128,128,128,0.3)', borderRadius: 8 }}>
          <EmptyStateWeb.Root size={args.size}>
            <EmptyStateWeb.Icon>
              <NoDataGlyph />
            </EmptyStateWeb.Icon>
            <EmptyStateWeb.Title>{args.title}</EmptyStateWeb.Title>
            <EmptyStateWeb.Description>{args.description}</EmptyStateWeb.Description>
            <EmptyStateWeb.Actions>
              <WebAction>{args.action}</WebAction>
            </EmptyStateWeb.Actions>
          </EmptyStateWeb.Root>
        </div>
      }
      native={
        <View
          style={{
            maxWidth: 420,
            borderWidth: 1,
            borderColor: 'rgba(128,128,128,0.3)',
            borderRadius: 8,
          }}
        >
          <EmptyStateNative.Root size={args.size}>
            <EmptyStateNative.Icon>
              <MutedText style={{ fontSize: 28 }}>{'⊘'}</MutedText>
            </EmptyStateNative.Icon>
            <EmptyStateNative.Title>{args.title}</EmptyStateNative.Title>
            <EmptyStateNative.Description>{args.description}</EmptyStateNative.Description>
            <EmptyStateNative.Actions>
              <NativeAction>{args.action}</NativeAction>
            </EmptyStateNative.Actions>
          </EmptyStateNative.Root>
        </View>
      }
    />
  ),
};
