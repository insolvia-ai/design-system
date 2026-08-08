import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Sidebar as SidebarWeb } from '@design-system/sidebar/sidebar.web.tsx';
import { Sidebar as SidebarNative } from '@design-system/sidebar/sidebar.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

type SidebarArgs = {
  title: string;
  navLabel: string;
  sectionTitle: string;
  defaultCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: () => void;
};

const ITEMS = [
  { label: 'Ships', icon: '⛵' },
  { label: 'Routes', icon: '🧭' },
  { label: 'Crew', icon: '👥' },
] as const;

/**
 * The app's main navigation rail, collapsible to a 64px icon strip.
 *
 * ONE landmark, on `Sidebar.Nav`. The Root is deliberately a plain container:
 * a `<nav>` inside an `<aside>` gives a page two overlapping landmarks over
 * the same links, which a screen-reader user experiences as the list appearing
 * twice.
 *
 * The collapse is where the accessibility work is. The Toggle is named for the
 * ACTION — "Collapse sidebar" while it is open — because a button named for
 * its current state reads as a claim about the world rather than an offer. And
 * every item keeps its `label` as its accessible name once the text is gone,
 * or a collapsed rail is a column of unnamed links. Collapse the panes and
 * inspect them with a screen reader: that is the check this story is for.
 *
 * `useSidebar()` is exported for a toggle OUTSIDE the sidebar — a menu button
 * in a top bar. Inside it, `Sidebar.Toggle` already does the work.
 */
const meta = {
  title: 'Overlays/Sidebar',
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Wayfarer',
    navLabel: 'Main',
    sectionTitle: 'Fleet',
    defaultCollapsed: false,
    onCollapsedChange: fn(),
    onNavigate: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    navLabel: { control: 'text' },
    sectionTitle: { control: 'text' },
    // Seeds UNCONTROLLED state, so a control here would do nothing after the
    // first render — the same gap select.stories.tsx notes for `defaultValue`.
    defaultCollapsed: { control: false },
    onCollapsedChange: { control: false },
    onNavigate: { control: false },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={340}
      // Each pane names its landmark differently: both leaves render a
      // `navigation` landmark, <LeafPair> puts two on one page, and with the
      // same name axe's `landmark-unique` fires. Same workbench artifact
      // breadcrumbs.stories.tsx documents; a real app has one sidebar.
      note="Press each Toggle: the rail narrows to 64px, the labels go, and every item keeps its accessible name."
      web={
        <div style={{ height: 320 }}>
          <SidebarWeb.Root
            defaultCollapsed={args.defaultCollapsed}
            onCollapsedChange={args.onCollapsedChange}
          >
            <SidebarWeb.Head>
              <SidebarWeb.Logo>W</SidebarWeb.Logo>
              <SidebarWeb.Title>{args.title}</SidebarWeb.Title>
              <SidebarWeb.Toggle />
            </SidebarWeb.Head>
            <SidebarWeb.Nav label={`${args.navLabel} (web leaf)`}>
              <SidebarWeb.Section title={args.sectionTitle}>
                {ITEMS.map((item, index) => (
                  <SidebarWeb.Item
                    key={item.label}
                    href="#"
                    label={item.label}
                    icon={item.icon}
                    active={index === 0}
                    onClick={(event) => {
                      event.preventDefault();
                      args.onNavigate();
                    }}
                  />
                ))}
              </SidebarWeb.Section>
            </SidebarWeb.Nav>
            <SidebarWeb.Separator />
            <SidebarWeb.Footer>
              <SidebarWeb.Item href="#" label="Settings" icon="⚙" />
            </SidebarWeb.Footer>
          </SidebarWeb.Root>
        </div>
      }
      native={
        <div style={{ height: 320 }}>
          <SidebarNative.Root
            defaultCollapsed={args.defaultCollapsed}
            onCollapsedChange={args.onCollapsedChange}
          >
            <SidebarNative.Head>
              <SidebarNative.Logo>W</SidebarNative.Logo>
              <SidebarNative.Title>{args.title}</SidebarNative.Title>
              <SidebarNative.Toggle />
            </SidebarNative.Head>
            <SidebarNative.Nav label={`${args.navLabel} (native leaf)`}>
              <SidebarNative.Section title={args.sectionTitle}>
                {ITEMS.map((item, index) => (
                  <SidebarNative.Item
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    active={index === 0}
                    onPress={args.onNavigate}
                  />
                ))}
              </SidebarNative.Section>
            </SidebarNative.Nav>
            <SidebarNative.Separator />
            <SidebarNative.Footer>
              <SidebarNative.Item label="Settings" icon="⚙" onPress={args.onNavigate} />
            </SidebarNative.Footer>
          </SidebarNative.Root>
        </div>
      }
    />
  ),
} satisfies Meta<SidebarArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends COLLAPSED in both panes, which is the state worth auditing: it is the
 * one where the visible text is gone and only the accessible names are left.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: the active item is the current page', async () => {
      await expect(web.getByRole('link', { name: 'Ships' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    await step('web leaf: collapsing renames the toggle to its new action', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Collapse sidebar' }));
      await expect(args.onCollapsedChange).toHaveBeenCalledTimes(1);
      await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
      await expect(web.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    });

    await step('web leaf: every item is still named with the text gone', async () => {
      await expect(web.queryByText(args.title)).toBeNull();
      await expect(web.getByRole('link', { name: 'Ships' })).toBeInTheDocument();
      await expect(web.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    });

    await step('native leaf: same collapse, same names', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Collapse sidebar' }));
      await expect(args.onCollapsedChange).toHaveBeenCalledTimes(2);
      await expect(native.queryByText(args.title)).toBeNull();
      await expect(native.getByRole('link', { name: 'Ships' })).toBeInTheDocument();
    });
  },
};

/** Opening already collapsed, for looking at the icon rail on its own. */
export const Collapsed: Story = {
  args: { defaultCollapsed: true },
};
