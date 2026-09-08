import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { TreeView as TreeViewWeb } from '@design-system/tree-view/tree-view.web.tsx';
import { TreeView as TreeViewNative } from '@design-system/tree-view/tree-view.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * A hierarchical list whose branches expand and collapse, with single
 * selection — Material UI's SimpleTreeView/TreeItem is the reference, and
 * WAI-ARIA APG's "Tree View" pattern is the a11y contract. `TreeView` is a
 * parts object (`Root`/`Item`), so there is no meta `component`.
 *
 * The two leaves genuinely diverge on WHERE a tap lands: the web leaf's row
 * is one click target that both selects and toggles a branch, because a mouse
 * is precise enough to hit either half. The native leaf splits that into two
 * SEPARATE Pressables — the row selects, its own chevron expands — because a
 * finger is not. Compare the panes by pressing "components" in each: one tap
 * does both on web; two separate taps do one each on native.
 */
type TreeViewArgs = {
  defaultExpanded: string[];
  onExpandedChange: (next: string[]) => void;
  onSelectedChange: (next: string | null) => void;
};

const meta = {
  title: 'Data display/TreeView',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultExpanded: ['src'],
    onExpandedChange: fn(),
    onSelectedChange: fn(),
  },
  argTypes: {
    // Seeds UNCONTROLLED state at mount — a control that "changes" it
    // afterwards would do nothing visible, same reasoning as Select's and
    // Tabs's own `defaultValue`.
    defaultExpanded: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Web: one click on a row both selects it and toggles its branch. Native: the row selects, a SEPARATE chevron Pressable expands — try both."
      web={
        <TreeViewWeb.Root
          label="Project files"
          defaultExpanded={args.defaultExpanded}
          onExpandedChange={args.onExpandedChange}
          onSelectedChange={args.onSelectedChange}
        >
          <TreeViewWeb.Item value="src" label="src">
            <TreeViewWeb.Item value="components" label="components">
              <TreeViewWeb.Item value="button.tsx" label="button.tsx" />
            </TreeViewWeb.Item>
            <TreeViewWeb.Item value="docs" label="docs" />
          </TreeViewWeb.Item>
          <TreeViewWeb.Item value="package.json" label="package.json" />
        </TreeViewWeb.Root>
      }
      native={
        <TreeViewNative.Root
          label="Project files"
          defaultExpanded={args.defaultExpanded}
          onExpandedChange={args.onExpandedChange}
          onSelectedChange={args.onSelectedChange}
        >
          <TreeViewNative.Item value="src" label="src">
            <TreeViewNative.Item value="components" label="components">
              <TreeViewNative.Item value="button.tsx" label="button.tsx" />
            </TreeViewNative.Item>
            <TreeViewNative.Item value="docs" label="docs" />
          </TreeViewNative.Item>
          <TreeViewNative.Item value="package.json" label="package.json" />
        </TreeViewNative.Root>
      }
    />
  ),
} satisfies Meta<TreeViewArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The play drives each leaf's OWN interaction on the same row, "components",
 * and shows the platform split the file header describes: one web click does
 * both jobs, so both shared `fn()` args advance together; the native leaf
 * needs two separate presses, one per job, so the SAME two args advance one
 * step apart. Ends with "components" expanded in both panes, for axe and the
 * eye.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: one click on a row selects it AND toggles its branch', async () => {
      await userEvent.click(web.getByText('components'));
      // Call COUNTS, not just lastCalledWith — the two panes share one fn()
      // arg each, so a pane that silently drops the interaction would
      // otherwise be vouched for by the other pane's later call.
      await expect(args.onSelectedChange).toHaveBeenCalledTimes(1);
      await expect(args.onSelectedChange).toHaveBeenLastCalledWith('components');
      await expect(args.onExpandedChange).toHaveBeenCalledTimes(1);
      await expect(args.onExpandedChange).toHaveBeenLastCalledWith(['src', 'components']);
      await expect(web.getByRole('treeitem', { name: 'components' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    await step(
      'native leaf: pressing the row selects, pressing its chevron expands — separately',
      async () => {
        await userEvent.click(native.getByRole('button', { name: 'components' }));
        await expect(args.onSelectedChange).toHaveBeenCalledTimes(2);
        await expect(args.onSelectedChange).toHaveBeenLastCalledWith('components');
        // A press on the ROW alone must not touch expansion — the count below
        // stays at 1 until the chevron itself is pressed.
        await expect(args.onExpandedChange).toHaveBeenCalledTimes(1);

        await userEvent.click(native.getByRole('button', { name: 'Expand' }));
        await expect(args.onExpandedChange).toHaveBeenCalledTimes(2);
        await expect(args.onExpandedChange).toHaveBeenLastCalledWith(['src', 'components']);
      },
    );
  },
};

/** Nothing expanded on first render — every branch starts closed. */
export const Collapsed: Story = {
  args: { defaultExpanded: [] },
};

/**
 * A leading, decorative `icon` slot per item — a folder/file glyph here, never
 * the accessible name (the visible `label` still is, on both leaves).
 */
export const WithIcons: Story = {
  render: (args) => (
    <LeafPair
      web={
        <TreeViewWeb.Root label="Project files" defaultExpanded={args.defaultExpanded}>
          <TreeViewWeb.Item value="src" label="src" icon="📁">
            <TreeViewWeb.Item value="components" label="components" icon="📁">
              <TreeViewWeb.Item value="button.tsx" label="button.tsx" icon="📄" />
            </TreeViewWeb.Item>
            <TreeViewWeb.Item value="docs" label="docs" icon="📁" />
          </TreeViewWeb.Item>
          <TreeViewWeb.Item value="package.json" label="package.json" icon="📄" />
        </TreeViewWeb.Root>
      }
      native={
        <TreeViewNative.Root label="Project files" defaultExpanded={args.defaultExpanded}>
          <TreeViewNative.Item value="src" label="src" icon="📁">
            <TreeViewNative.Item value="components" label="components" icon="📁">
              <TreeViewNative.Item value="button.tsx" label="button.tsx" icon="📄" />
            </TreeViewNative.Item>
            <TreeViewNative.Item value="docs" label="docs" icon="📁" />
          </TreeViewNative.Item>
          <TreeViewNative.Item value="package.json" label="package.json" icon="📄" />
        </TreeViewNative.Root>
      }
    />
  ),
};

/**
 * One item disabled — it renders dimmed, cannot be selected or expanded, and
 * (on native) neither of its two Pressables responds to a press.
 */
export const Disabled: Story = {
  render: (args) => (
    <LeafPair
      web={
        <TreeViewWeb.Root label="Project files" defaultExpanded={args.defaultExpanded}>
          <TreeViewWeb.Item value="src" label="src">
            <TreeViewWeb.Item value="components" label="components">
              <TreeViewWeb.Item value="button.tsx" label="button.tsx" />
            </TreeViewWeb.Item>
            <TreeViewWeb.Item value="docs" label="docs" disabled />
          </TreeViewWeb.Item>
          <TreeViewWeb.Item value="package.json" label="package.json" />
        </TreeViewWeb.Root>
      }
      native={
        <TreeViewNative.Root label="Project files" defaultExpanded={args.defaultExpanded}>
          <TreeViewNative.Item value="src" label="src">
            <TreeViewNative.Item value="components" label="components">
              <TreeViewNative.Item value="button.tsx" label="button.tsx" />
            </TreeViewNative.Item>
            <TreeViewNative.Item value="docs" label="docs" disabled />
          </TreeViewNative.Item>
          <TreeViewNative.Item value="package.json" label="package.json" />
        </TreeViewNative.Root>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    // Asserted, not clicked: both leaves have already committed to disabled
    // meaning "no press lands here" in the behavioural tests — this only
    // checks each leaf ANNOUNCES it, matching Select's own Disabled story.
    await expect(web.getByRole('treeitem', { name: 'docs' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(native.getByRole('button', { name: 'docs' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
