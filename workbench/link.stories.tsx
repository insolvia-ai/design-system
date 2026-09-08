import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Link as LinkWeb } from '@design-system/link/link.web.tsx';
import { Link as LinkNative } from '@design-system/link/link.native.tsx';
import type { LinkTone, LinkUnderline } from '@design-system/link/link.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const TONES = ['primary', 'ink', 'muted'] as const satisfies readonly LinkTone[];
const UNDERLINES = ['always', 'hover', 'none'] as const satisfies readonly LinkUnderline[];

/**
 * Args are typed against the SHARED props surface (`link.props.ts`), not
 * against either leaf, and threaded explicitly into both — see the
 * design-system-component skill and `button.stories.tsx` for why. The two
 * leaves disagree on the handler name (web `onClick`, native `onPress`), so
 * `onPress` is the one bridging arg; `render` wires it into each leaf's own
 * prop, and the web wiring calls `event.preventDefault()` first so a click
 * anywhere in this file never actually navigates the workbench away.
 *
 * `openOnPress` defaults to `false` for the same reason on the native side:
 * without it, clicking the native pane calls `Linking.openURL`, which
 * react-native-web resolves to `window.open` and would leave Storybook.
 */
type LinkArgs = {
  href: string;
  tone: LinkTone;
  underline: LinkUnderline;
  external: boolean;
  disabled: boolean;
  openOnPress: boolean;
  children: string;
  onPress: () => void;
};

/**
 * A navigation link — `href` plus an anchor on web, `Linking.openURL` on
 * native. This package knows nothing about routers: there is no client-side
 * navigation here, no interception of the click/press, and no opinion about
 * what a "route" is. A consumer wanting client-side routing wraps `Link` with
 * their own router's `<Link>` (Next's, React Router's), which still works
 * because the web leaf never calls `preventDefault` on its own.
 */
const meta = {
  title: 'Layout/Link',
  component: LinkWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    href: 'https://example.com/',
    tone: 'primary',
    underline: 'always',
    external: false,
    disabled: false,
    openOnPress: false,
    children: 'Read the documentation',
    onPress: fn(),
  },
  argTypes: {
    href: { control: 'text' },
    tone: { control: 'inline-radio', options: [...TONES] },
    underline: { control: 'inline-radio', options: [...UNDERLINES] },
    external: { control: 'boolean' },
    disabled: { control: 'boolean' },
    openOnPress: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={
        <LinkWeb
          href={args.href}
          tone={args.tone}
          underline={args.underline}
          external={args.external}
          disabled={args.disabled}
          onClick={(event) => {
            // A story must not navigate the workbench out from under itself;
            // the arg is what the play counts.
            event.preventDefault();
            args.onPress();
          }}
        >
          {args.children}
        </LinkWeb>
      }
      native={
        <LinkNative
          href={args.href}
          tone={args.tone}
          underline={args.underline}
          external={args.external}
          disabled={args.disabled}
          openOnPress={args.openOnPress}
          onPress={args.onPress}
        >
          {args.children}
        </LinkNative>
      }
    />
  ),
} satisfies Meta<LinkArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play proves the wiring, not
 * the styling: one activation per leaf, and the shared `onPress` arg must
 * fire for both — a leaf that renders but swallows its handler looks
 * identical until something counts.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf fires the handler', async () => {
      await userEvent.click(web.getByRole('link', { name: args.children }));
      await expect(args.onPress).toHaveBeenCalledTimes(1);
    });

    await step('native leaf fires the same handler', async () => {
      await userEvent.click(native.getByRole('link', { name: args.children }));
      await expect(args.onPress).toHaveBeenCalledTimes(2);
    });
  },
};

/**
 * `primary` gets a real colour change on hover (it has its own hover token);
 * `ink` and `muted` don't, so they nudge `underline-offset` instead — see the
 * WHY comment in `link.props.ts`. Hover a pane's links to compare.
 */
export const Tones: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {TONES.map((tone) => (
            <LinkWeb key={tone} href={args.href} tone={tone}>
              {tone}
            </LinkWeb>
          ))}
        </div>
      }
      native={
        <InkText>
          {TONES.map((tone, index) => (
            <React.Fragment key={tone}>
              {index > 0 ? '   ' : null}
              <LinkNative href={args.href} tone={tone} openOnPress={false}>
                {tone}
              </LinkNative>
            </React.Fragment>
          ))}
        </InkText>
      }
    />
  ),
};

/**
 * `always` and `none` are unconditional; `hover` shows nothing at rest. There
 * is no pointer on a touchscreen, so the native leaf reads `'hover'` the same
 * as `'always'` — see the platform note in `link.native.tsx`.
 */
export const Underline: Story = {
  render: (args) => (
    <LeafPair
      note="Native has no pointer to hover with, so its 'hover' pane reads the same as 'always' — see link.native.tsx."
      web={
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {UNDERLINES.map((underline) => (
            <LinkWeb key={underline} href={args.href} underline={underline}>
              {underline}
            </LinkWeb>
          ))}
        </div>
      }
      native={
        <InkText>
          {UNDERLINES.map((underline, index) => (
            <React.Fragment key={underline}>
              {index > 0 ? '   ' : null}
              <LinkNative href={args.href} underline={underline} openOnPress={false}>
                {underline}
              </LinkNative>
            </React.Fragment>
          ))}
        </InkText>
      }
    />
  ),
};

/**
 * `external` adds `target="_blank" rel="noopener noreferrer"` plus a
 * decorative "↗" on web, aria-hidden, with a screen-reader-only "(opens in a
 * new tab)" carrying the same information in words. Neither has a native
 * reading — `Linking.openURL` always leaves the app, there is no second tab
 * to warn about — so the native pane renders identically to a non-external
 * link; that is the platform seam, not a missing feature.
 */
export const External: Story = {
  args: { external: true, children: 'Pricing (opens on our marketing site)' },
  play: async ({ canvasElement }) => {
    const { web } = pair(canvasElement);
    await expect(web.getByText('(opens in a new tab)')).toHaveClass('sr-only');
  },
};

/**
 * A link inside running text — the shape it is used in most often. Web gets
 * a plain `<p>`; native nests the `Link` inside another `Text`, which is what
 * makes it inherit the surrounding prose's size and colour instead of setting
 * its own — see the sizing note at the top of `link.native.tsx`.
 */
export const InParagraph: Story = {
  render: (args) => (
    <LeafPair
      web={
        <p className="max-w-sm font-body text-sm text-ink">
          Every component in this package ships as a platform-split pair. Read the{' '}
          <LinkWeb href={args.href}>full documentation</LinkWeb> before opening a leaf you have not
          touched before.
        </p>
      }
      native={
        <InkText style={{ maxWidth: 320 }}>
          Every component in this package ships as a platform-split pair. Read the{' '}
          <LinkNative href={args.href} openOnPress={false}>
            full documentation
          </LinkNative>{' '}
          before opening a leaf you have not touched before.
        </InkText>
      }
    />
  ),
};

/**
 * Disabled is asserted, not activated: the web leaf drops `href` entirely
 * (an `<a>` with no `href` is not part of the tab order, which is the
 * correct disabled anchor), the native leaf sets
 * `accessibilityState={{ disabled: true }}`. Neither leaf is clicked here —
 * the interesting claim is what the accessibility tree says, the same
 * argument `button.stories.tsx`'s `Disabled` story makes.
 */
export const Disabled: Story = {
  args: { disabled: true, children: 'Read the documentation' },
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);
    // Not `getByRole('link', …)` on the web side: an `<a>` with no `href`
    // carries no implicit link role at all (HTML-AAM), which is exactly what
    // makes it the correct disabled anchor — see the JSDoc on `disabled`.
    const webLink = web.getByText(args.children);
    const nativeLink = native.getByRole('link', { name: args.children });

    await expect(webLink).not.toHaveAttribute('href');
    await expect(webLink).toHaveAttribute('aria-disabled', 'true');
    await expect(nativeLink).toHaveAttribute('aria-disabled', 'true');
  },
};
