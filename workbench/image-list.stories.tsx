import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { ImageList as ImageListWeb } from '@design-system/image-list/image-list.web.tsx';
import { ImageList as ImageListNative } from '@design-system/image-list/image-list.native.tsx';
import type { ImageListGap, ImageListVariant } from '@design-system/image-list/image-list.props.ts';

import { LeafPair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const GAPS = ['none', 'xs', 'sm', 'md'] as const satisfies readonly ImageListGap[];
const VARIANTS = ['standard', 'quilted'] as const satisfies readonly ImageListVariant[];

// An inline data URI per tile, not a hosted placeholder — the workbench and
// its a11y gate render with no network, and a story that silently shows a
// broken image is worse than one that shows none (the same reasoning
// `card.stories.tsx`'s `SHIP_IMAGE` documents). Plain safe hex values here
// ONLY: a story is not a leaf, so it never has to go through the semantic
// token layer the components themselves are held to.
function swatch(seed: number, hex: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">` +
      `<rect width="300" height="300" fill="${hex}"/>` +
      `<text x="150" y="168" font-family="Georgia, serif" font-size="64" fill="#FFFFFF" text-anchor="middle">${seed}</text>` +
      `</svg>`,
  )}`;
}

const HEXES = ['#0B2A4A', '#7A2E2E', '#2E5B3E', '#5B3E7A', '#7A5B2E', '#2E5B7A'];
const COLOR_NAMES = ['Navy', 'Maroon', 'Green', 'Purple', 'Amber', 'Teal'];
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

// `alt` describes the picture; `title` (used by `WithBars` below) names the
// item. The two must never be the same string — axe's `image-redundant-alt`
// flags an <img> whose alt text duplicates adjacent visible text, which an
// `ItemBar` right next to the image is. See the note on `ImageListItemOwnProps.alt`
// in image-list.props.ts.
const TILES = HEXES.map((hex, i) => ({
  src: swatch(i + 1, hex),
  alt: `${COLOR_NAMES[i]} square with the number ${i + 1}`,
  title: `${ORDINALS[i]} tile`,
}));

type ImageListArgs = {
  columns: number;
  gap: ImageListGap;
  variant: ImageListVariant;
};

/**
 * A grid of images, laid out with CSS Grid on web and a wrapping flex row on
 * native — see `image-list.props.ts` for why the two platforms need a shared
 * `columns`/`variant` context rather than each leaf inventing its own.
 *
 * `ImageList` is a parts object (`Root`/`Item`/`ItemBar`), so there is no
 * single `component` for the docs table to point at — the args below cover
 * `Root`'s own three props, threaded into a fixed set of tiles.
 */
const meta = {
  title: 'Data display/ImageList',
  parameters: { layout: 'fullscreen' },
  args: {
    columns: 3,
    gap: 'sm',
    variant: 'standard',
  },
  argTypes: {
    columns: { control: { type: 'number', min: 1, max: 6, step: 1 } },
    gap: { control: 'inline-radio', options: [...GAPS] },
    variant: { control: 'inline-radio', options: [...VARIANTS] },
  },
  render: (args) => (
    <LeafPair
      web={
        <ImageListWeb.Root columns={args.columns} gap={args.gap} variant={args.variant}>
          {TILES.map((tile) => (
            <ImageListWeb.Item key={tile.alt} src={tile.src} alt={tile.alt} />
          ))}
        </ImageListWeb.Root>
      }
      native={
        <ImageListNative.Root columns={args.columns} gap={args.gap} variant={args.variant}>
          {TILES.map((tile) => (
            <ImageListNative.Item key={tile.alt} src={tile.src} alt={tile.alt} />
          ))}
        </ImageListNative.Root>
      }
    />
  ),
} satisfies Meta<ImageListArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Six square tiles in the default `standard` variant, three columns, small gap. */
export const Basic: Story = {};

/**
 * `variant="quilted"` lets an `Item` span more than one row or column —
 * `Item.rows`/`Item.cols` become `grid-row`/`grid-column` spans on the web
 * pane. The native pane widens the same tile by `cols` (a wider share of the
 * flex row) and cannot honour `rows` at all — a wrapping flex row has no row
 * track to span, so the tall tile on the web pane shows up merely WIDE on
 * the native one. That gap is the point of pairing the two leaves here.
 */
export const Quilted: Story = {
  args: { variant: 'quilted' },
  render: (args) => (
    <LeafPair
      note="The first tile spans 2 rows and 2 columns on web; the native pane can only widen it, never make it taller — see the doc comment above this story."
      web={
        <ImageListWeb.Root columns={args.columns} gap={args.gap} variant="quilted">
          <ImageListWeb.Item src={TILES[0]!.src} alt={TILES[0]!.alt} rows={2} cols={2} />
          <ImageListWeb.Item src={TILES[1]!.src} alt={TILES[1]!.alt} />
          <ImageListWeb.Item src={TILES[2]!.src} alt={TILES[2]!.alt} />
          <ImageListWeb.Item src={TILES[3]!.src} alt={TILES[3]!.alt} cols={2} />
          <ImageListWeb.Item src={TILES[4]!.src} alt={TILES[4]!.alt} />
          <ImageListWeb.Item src={TILES[5]!.src} alt={TILES[5]!.alt} />
        </ImageListWeb.Root>
      }
      native={
        <ImageListNative.Root columns={args.columns} gap={args.gap} variant="quilted">
          <ImageListNative.Item src={TILES[0]!.src} alt={TILES[0]!.alt} rows={2} cols={2} />
          <ImageListNative.Item src={TILES[1]!.src} alt={TILES[1]!.alt} />
          <ImageListNative.Item src={TILES[2]!.src} alt={TILES[2]!.alt} />
          <ImageListNative.Item src={TILES[3]!.src} alt={TILES[3]!.alt} cols={2} />
          <ImageListNative.Item src={TILES[4]!.src} alt={TILES[4]!.alt} />
          <ImageListNative.Item src={TILES[5]!.src} alt={TILES[5]!.alt} />
        </ImageListNative.Root>
      }
    />
  ),
};

/**
 * `ImageList.ItemBar` overlays a caption on a tile — `bg-overlay-scrim` under
 * `text-overlay-ink`/`text-overlay-muted`, the one pair of tokens this
 * package keeps identical in both colour schemes so it stays legible over an
 * arbitrary photograph regardless of the page's own scheme. Flip the Scheme
 * toolbar: the tiles' chrome changes, the bars do not.
 */
export const WithBars: Story = {
  render: (args) => (
    <LeafPair
      web={
        <ImageListWeb.Root columns={args.columns} gap={args.gap} variant={args.variant}>
          {TILES.map((tile, i) => (
            <ImageListWeb.Item key={tile.alt} src={tile.src} alt={tile.alt}>
              <ImageListWeb.ItemBar
                title={tile.title}
                subtitle={i % 2 === 0 ? 'Docked at Ganymede' : undefined}
                position={i % 3 === 0 ? 'top' : 'bottom'}
              />
            </ImageListWeb.Item>
          ))}
        </ImageListWeb.Root>
      }
      native={
        <ImageListNative.Root columns={args.columns} gap={args.gap} variant={args.variant}>
          {TILES.map((tile, i) => (
            <ImageListNative.Item key={tile.alt} src={tile.src} alt={tile.alt}>
              <ImageListNative.ItemBar
                title={tile.title}
                subtitle={i % 2 === 0 ? 'Docked at Ganymede' : undefined}
                position={i % 3 === 0 ? 'top' : 'bottom'}
              />
            </ImageListNative.Item>
          ))}
        </ImageListNative.Root>
      }
    />
  ),
};

/**
 * The same six tiles at 2, 3 and 4 columns, stacked so the column count is
 * the only thing changing between them.
 */
export const Columns: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[2, 3, 4].map((columns) => (
            <div key={columns}>
              <p style={{ margin: '0 0 8px', fontSize: 13 }}>{columns} columns</p>
              <ImageListWeb.Root columns={columns} gap={args.gap} variant={args.variant}>
                {TILES.map((tile) => (
                  <ImageListWeb.Item key={tile.alt} src={tile.src} alt={tile.alt} />
                ))}
              </ImageListWeb.Root>
            </div>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 24 }}>
          {[2, 3, 4].map((columns) => (
            <View key={columns}>
              <InkText style={{ marginBottom: 8, fontSize: 13 }}>{columns} columns</InkText>
              <ImageListNative.Root columns={columns} gap={args.gap} variant={args.variant}>
                {TILES.map((tile) => (
                  <ImageListNative.Item key={tile.alt} src={tile.src} alt={tile.alt} />
                ))}
              </ImageListNative.Root>
            </View>
          ))}
        </View>
      }
    />
  ),
};
