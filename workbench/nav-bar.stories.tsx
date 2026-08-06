import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { NavBar as NavBarWeb } from '@design-system/nav-bar/nav-bar.web.tsx';
import { NavBar as NavBarNative } from '@design-system/nav-bar/nav-bar.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/NavBar',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE DIVERGENCE THIS STORY EXISTS TO SHOW.
 *
 * The web Root renders `<nav aria-label="Main">` — a named `navigation`
 * landmark. The native Root sets `accessibilityRole="header"`, which
 * react-native-web maps to role `heading` (with no level) and renders as an
 * `<h1>` — one that wraps the ENTIRE bar, brand, links, and action button all
 * included, because `accessibilityRole` is set on the Root itself and every
 * descendant is its content. Same pixels, opposite semantics: the web pane
 * tells a screen-reader user "here is where navigation lives"; the native pane
 * tells it "here is the page's top heading".
 *
 * Neither pane fails axe. The web landmark is simply named. The native `<h1>`
 * takes its accessible name from its full contents and is the first heading on
 * the page, so `heading-order` passes too — which is exactly why nothing but
 * looking at both panes catches this. Filed as a suspected bug in the
 * workbench report: a native NavBar is not actually a header/banner landmark,
 * and nothing stops a page from having two of them (each becoming its own
 * `<h1>`), which plain `<nav>` would never allow.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      note='Web: `<nav aria-label="Main">`, a navigation landmark. Native: `accessibilityRole="header"` renders as an `<h1>` wrapping the whole bar. Same layout, different semantics — see the doc comment above this story.'
      web={
        <NavBarWeb.Root>
          <NavBarWeb.Brand href="/">Meridian</NavBarWeb.Brand>
          <NavBarWeb.Links>
            <NavBarWeb.Link href="/overview" active>
              Overview
            </NavBarWeb.Link>
            <NavBarWeb.Link href="/documents">Documents</NavBarWeb.Link>
            <NavBarWeb.Link href="/deadlines">Deadlines</NavBarWeb.Link>
          </NavBarWeb.Links>
          <NavBarWeb.Actions>
            <ButtonWeb size="sm" intent="secondary">
              Sign out
            </ButtonWeb>
          </NavBarWeb.Actions>
        </NavBarWeb.Root>
      }
      native={
        <NavBarNative.Root>
          <NavBarNative.Brand>Meridian</NavBarNative.Brand>
          <NavBarNative.Links>
            <NavBarNative.Link active onPress={() => {}}>
              Overview
            </NavBarNative.Link>
            <NavBarNative.Link onPress={() => {}}>Documents</NavBarNative.Link>
            <NavBarNative.Link onPress={() => {}}>Deadlines</NavBarNative.Link>
          </NavBarNative.Links>
          <NavBarNative.Actions>
            <ButtonNative size="sm" intent="secondary" onPress={() => {}}>
              Sign out
            </ButtonNative>
          </NavBarNative.Actions>
        </NavBarNative.Root>
      }
    />
  ),
};
