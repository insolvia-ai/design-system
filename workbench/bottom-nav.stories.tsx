// The "phone" frame around each pane is workbench-only chrome — BottomNav
// itself has no idea it is inside one; it just renders a block bar (or, with
// `fixed`, an absolutely/`fixed`-positioned one). The frame exists so `fixed`
// has something honest to pin ITSELF against: a CSS `transform` on the frame
// (an identity one is enough — `translateZ(0)`) establishes a new containing
// block for `position: fixed` descendants, so the web bar pins to the
// FRAME's bottom edge instead of the Storybook canvas's — the same relationship
// a real device's root view gives an RN consumer for free (see
// bottom-nav.props.ts's `fixed` doc). Content scrolls behind the bar in both
// panes; the bar stays put.
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { BottomNav as BottomNavWeb } from '@design-system/bottom-nav/bottom-nav.web.tsx';
import { BottomNav as BottomNavNative } from '@design-system/bottom-nav/bottom-nav.native.tsx';
import type { BottomNavLabels } from '@design-system/bottom-nav/bottom-nav.props.ts';
import { useNativeColors } from '@design-system/lib/native-theme';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const SHOW_LABELS = ['always', 'selected'] as const satisfies readonly BottomNavLabels[];
const DISABLED_ITEM = ['none', 'home', 'search', 'alerts', 'profile'] as const;
type DisabledItem = (typeof DISABLED_ITEM)[number];

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

// `currentColor` is why these need no `selected` prop of their own — the
// button already paints `text-primary`/`text-muted` around them, and the
// stroke inherits it for free. There is no native counterpart to that trick;
// see NATIVE_GLYPH below.
const HOME_ICON = (
  <IconBase>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </IconBase>
);
const SEARCH_ICON = (
  <IconBase>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </IconBase>
);
const ALERTS_ICON = (
  <IconBase>
    <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </IconBase>
);
const PROFILE_ICON = (
  <IconBase>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </IconBase>
);

// React Native has no `currentColor` and `icon` is a plain `ReactNode`, not a
// render prop (bottom-nav.props.ts explains why) — so a real consumer's icon
// set takes its own `color` prop and resolves it itself. A story can't do
// that on the caller's behalf either, so these glyphs stay one neutral,
// scheme-aware colour via `InkText` regardless of selection — a real platform
// seam, not a story shortcut.
const NATIVE_GLYPH: Record<Exclude<DisabledItem, 'none'>, string> = {
  home: '⌂',
  search: '⚲',
  alerts: '🔔',
  profile: '☺',
};

function NativeGlyph({ item }: { item: Exclude<DisabledItem, 'none'> }) {
  return <InkText style={{ fontSize: 18, lineHeight: 22 }}>{NATIVE_GLYPH[item]}</InkText>;
}

const PHONE_SIZE = { width: 390, height: 640 };

function WebPhone({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        ...PHONE_SIZE,
        overflow: 'hidden',
        transform: 'translateZ(0)',
      }}
      className="rounded-lg border border-line bg-bg"
    >
      {children}
    </div>
  );
}

function WebContent() {
  return (
    <div className="h-full space-y-sm overflow-y-auto p-md pb-20 font-body text-sm">
      <p className="font-medium text-ink">Destination content</p>
      <p className="text-muted">
        Scrolls behind the bar below — the bar stays pinned to the bottom of this frame, not the
        page.
      </p>
      {Array.from({ length: 8 }, (_, i) => (
        <p key={i} className="text-muted">
          Row {i + 1} of placeholder content.
        </p>
      ))}
    </div>
  );
}

function NativePhone({ children }: { children: React.ReactNode }) {
  const c = useNativeColors();
  return (
    <View
      style={{
        position: 'relative',
        ...PHONE_SIZE,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: c.line,
        borderRadius: 12,
        backgroundColor: c.bg,
      }}
    >
      {children}
    </View>
  );
}

function NativeContent() {
  return (
    <View style={{ flex: 1, padding: 16, paddingBottom: 80, gap: 8 }}>
      <InkText style={{ fontWeight: '500' }}>Destination content</InkText>
      {Array.from({ length: 8 }, (_, i) => (
        <InkText
          key={i}
          style={{ opacity: 0.75 }}
        >{`Row ${i + 1} of placeholder content.`}</InkText>
      ))}
    </View>
  );
}

/**
 * `BottomNav` is a parts object (`Root`/`Item`), so meta carries no
 * `component` — same reason `tabs.stories.tsx` and `dialog.stories.tsx` have
 * none. `defaultValue` is required on `Root` (see `bottom-nav.props.ts`'s file
 * header for why) and gets no control: it only seeds uncontrolled state at
 * mount, so a control that "changed" it afterwards would do nothing visible —
 * the same gap `select.stories.tsx`'s `defaultValue` note explains.
 *
 * Every story renders the same four destinations inside a 390px "phone"
 * frame (`minPaneWidth={390}` on `<LeafPair>` below) so `fixed` has an honest
 * edge to pin against — see the file header.
 *
 * WHY THE TWO PANES ARE NAMED DIFFERENTLY. Both leaves render a `navigation`
 * landmark (web `<nav>`, native `role="navigation"`), and `<LeafPair>` puts two
 * live copies on one page — so with the same `label` on both, axe's
 * `landmark-unique` fires on every story, not just a multi-instance one.
 * `breadcrumbs.stories.tsx` documents the identical collision and fix:
 * suffixing each pane's `label` with which leaf it is. That is a workbench
 * artifact, not a component defect — a real page shows one bar and takes the
 * default name, which is exactly why `label` is a prop.
 */
type BottomNavArgs = {
  defaultValue: string;
  showLabels: BottomNavLabels;
  label: string;
  fixed: boolean;
  insetBottom: number;
  disabledItem: DisabledItem;
  onValueChange: (next: string) => void;
};

const meta = {
  title: 'Layout/BottomNav',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: 'home',
    showLabels: 'always',
    label: 'Primary',
    fixed: true,
    insetBottom: 0,
    disabledItem: 'none',
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
    showLabels: { control: 'inline-radio', options: [...SHOW_LABELS] },
    label: { control: 'text' },
    fixed: { control: 'boolean' },
    insetBottom: { control: { type: 'number', min: 0, max: 48, step: 4 } },
    disabledItem: { control: 'inline-radio', options: [...DISABLED_ITEM] },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={390}
      note="Both panes sit inside a 390px phone frame. `fixed` (on by default here) pins the bar to the FRAME's bottom edge, not the Storybook canvas's — see the file header. Each pane also names its landmark differently (a `(web leaf)`/`(native leaf)` suffix on `label`) since both leaves render a real `navigation` landmark and `<LeafPair>` puts both on one page at once — a real page has only one bar and takes the default name."
      web={
        <WebPhone>
          <WebContent />
          <BottomNavWeb.Root
            defaultValue={args.defaultValue}
            showLabels={args.showLabels}
            label={`${args.label} (web leaf)`}
            fixed={args.fixed}
            insetBottom={args.insetBottom}
            onValueChange={args.onValueChange}
          >
            <BottomNavWeb.Item
              value="home"
              label="Home"
              icon={HOME_ICON}
              disabled={args.disabledItem === 'home'}
            />
            <BottomNavWeb.Item
              value="search"
              label="Search"
              icon={SEARCH_ICON}
              disabled={args.disabledItem === 'search'}
            />
            <BottomNavWeb.Item
              value="alerts"
              label="Alerts"
              icon={ALERTS_ICON}
              disabled={args.disabledItem === 'alerts'}
            />
            <BottomNavWeb.Item
              value="profile"
              label="Profile"
              icon={PROFILE_ICON}
              disabled={args.disabledItem === 'profile'}
            />
          </BottomNavWeb.Root>
        </WebPhone>
      }
      native={
        <NativePhone>
          <NativeContent />
          <BottomNavNative.Root
            defaultValue={args.defaultValue}
            showLabels={args.showLabels}
            label={`${args.label} (native leaf)`}
            fixed={args.fixed}
            insetBottom={args.insetBottom}
            onValueChange={args.onValueChange}
          >
            <BottomNavNative.Item
              value="home"
              label="Home"
              icon={<NativeGlyph item="home" />}
              disabled={args.disabledItem === 'home'}
            />
            <BottomNavNative.Item
              value="search"
              label="Search"
              icon={<NativeGlyph item="search" />}
              disabled={args.disabledItem === 'search'}
            />
            <BottomNavNative.Item
              value="alerts"
              label="Alerts"
              icon={<NativeGlyph item="alerts" />}
              disabled={args.disabledItem === 'alerts'}
            />
            <BottomNavNative.Item
              value="profile"
              label="Profile"
              icon={<NativeGlyph item="profile" />}
              disabled={args.disabledItem === 'profile'}
            />
          </BottomNavNative.Root>
        </NativePhone>
      }
    />
  ),
} satisfies Meta<BottomNavArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Four destinations, labels always shown, pinned to the bottom of the phone
 * frame. The play selects "Search" in each pane in turn and checks the
 * shared `onValueChange` arg's call count, ending with Search selected in
 * both — the state the axe pass after the play then audits.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);

    await userEvent.click(web.getByRole('button', { name: 'Search' }));
    await expect(web.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);

    await userEvent.click(native.getByRole('button', { name: 'Search' }));
    await expect(native.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
  },
};

/**
 * `showLabels="selected"`: only the active item's label is drawn — Home's,
 * at mount. The other three keep their label in the tree (`sr-only` on web,
 * simply unrendered on native, since RN's `accessibilityLabel` already
 * supplies the name) so each button still has an accessible name.
 */
export const SelectedLabelsOnly: Story = {
  args: { showLabels: 'selected' },
};

/**
 * `insetBottom={24}` — the extra padding a real device's home indicator or
 * on-screen nav bar would otherwise sit under. The web leaf folds it into
 * `env(safe-area-inset-bottom)`; a native consumer would pass its own
 * safe-area reading here instead (RN core has none built in — see
 * `bottom-nav.props.ts`).
 */
export const WithInset: Story = {
  args: { insetBottom: 24 },
};

/**
 * "Alerts" is disabled: no press, no focus, no selection, on either leaf.
 */
export const Disabled: Story = {
  args: { disabledItem: 'alerts' },
};
