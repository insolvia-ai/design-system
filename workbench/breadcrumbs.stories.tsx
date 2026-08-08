import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Breadcrumbs as BreadcrumbsWeb } from '@design-system/breadcrumbs/breadcrumbs.web.tsx';
import { Breadcrumbs as BreadcrumbsNative } from '@design-system/breadcrumbs/breadcrumbs.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * `Breadcrumbs` is a parts object (`Root`/`Item`), so no meta `component`.
 *
 * `onNavigate` is the ONE bridging arg this story owns: the web leaf navigates
 * through an `<a href>` and the native leaf through `onPress`, so `render`
 * wires the same handler into each leaf's own prop — the pattern the
 * design-system-component skill prescribes for `onClick`/`onPress` pairs. The
 * web pane's click is prevented so the story never actually navigates.
 */
type BreadcrumbsArgs = {
  separator: string;
  label: string;
  onNavigate: () => void;
};

const TRAIL = ['Fleet', 'Ships', 'Wayfarer'] as const;

/**
 * The trail to where you are, as a named `nav` landmark around a list.
 *
 * Three decisions are shared between the leaves and pinned in
 * `breadcrumbs.props.ts`: the landmark is called "Breadcrumb" (singular, as in
 * the WAI-ARIA practices example), the separators are decorative and hidden
 * from assistive tech, and the last crumb is TEXT rather than a link — a link
 * to where you already are is a documented WCAG annoyance, and
 * `aria-current="page"` conveys the position instead.
 *
 * The separators are injected by the Root, not asked of the caller, which is
 * what makes a trailing separator after the last crumb unreachable.
 *
 * WHY THE TWO PANES ARE NAMED DIFFERENTLY. Both leaves render a `navigation`
 * landmark, and `<LeafPair>` puts two live copies of the component on one
 * page — so with the same name on both, axe's `landmark-unique` fires. That is
 * a workbench artifact, not a component defect: NavBar escapes it only because
 * its native leaf uses a different role, and Footer's story documents the same
 * class of collision for `contentinfo`. Suffixing each pane's `label` is the
 * fix, and it is the same advice a consumer needs the day a page carries two
 * trails — which is exactly why `label` is a prop.
 */
const meta = {
  title: 'Components/Breadcrumbs',
  parameters: { layout: 'fullscreen' },
  args: {
    separator: '/',
    label: 'Breadcrumb',
    onNavigate: fn(),
  },
  argTypes: {
    separator: { control: 'text' },
    label: { control: 'text' },
    onNavigate: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Each pane names its landmark differently — see the doc comment above. A real page shows one trail and takes the default name."
      web={
        <BreadcrumbsWeb.Root label={`${args.label} (web leaf)`} separator={args.separator}>
          {TRAIL.map((crumb, index) =>
            index === TRAIL.length - 1 ? (
              <BreadcrumbsWeb.Item key={crumb} current>
                {crumb}
              </BreadcrumbsWeb.Item>
            ) : (
              <BreadcrumbsWeb.Item
                key={crumb}
                href="#"
                onClick={(event) => {
                  // A story must not navigate the workbench out from under
                  // itself; the arg is what the play counts.
                  event.preventDefault();
                  args.onNavigate();
                }}
              >
                {crumb}
              </BreadcrumbsWeb.Item>
            ),
          )}
        </BreadcrumbsWeb.Root>
      }
      native={
        <BreadcrumbsNative.Root label={`${args.label} (native leaf)`} separator={args.separator}>
          {TRAIL.map((crumb, index) =>
            index === TRAIL.length - 1 ? (
              <BreadcrumbsNative.Item key={crumb} current>
                {crumb}
              </BreadcrumbsNative.Item>
            ) : (
              <BreadcrumbsNative.Item key={crumb} onPress={args.onNavigate}>
                {crumb}
              </BreadcrumbsNative.Item>
            ),
          )}
        </BreadcrumbsNative.Root>
      }
    />
  ),
} satisfies Meta<BreadcrumbsArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both panes drive the same `onNavigate`, so the play counts calls per pane —
 * a pane that dropped the press would otherwise be covered by the other's
 * earlier call.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: crumbs before the last are links', async () => {
      await userEvent.click(web.getByRole('link', { name: 'Fleet' }));
      await expect(args.onNavigate).toHaveBeenCalledTimes(1);
    });

    await step('native leaf: same trail, onPress instead of href', async () => {
      await userEvent.click(native.getByRole('link', { name: 'Fleet' }));
      await expect(args.onNavigate).toHaveBeenCalledTimes(2);
    });

    await step('the current crumb is marked, and is not a link in either pane', async () => {
      await expect(web.getByText('Wayfarer')).toHaveAttribute('aria-current', 'page');
      await expect(native.getByText('Wayfarer')).toHaveAttribute('aria-current', 'page');
      await expect(web.queryByRole('link', { name: 'Wayfarer' })).toBeNull();
      await expect(native.queryByRole('link', { name: 'Wayfarer' })).toBeNull();
    });
  },
};

/**
 * A caller-supplied separator. Any node works on web; the native leaf renders
 * it inside a `Text`, so a string is the portable choice.
 */
export const CustomSeparator: Story = {
  args: { separator: '›' },
};
