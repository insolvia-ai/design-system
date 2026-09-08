// NATIVE-leaf tests. Run in the vitest `native` project (Metro's view of the
// package, react-native aliased to react-native-web), so the extensionless
// './tree-view' below resolves to tree-view.native.tsx.
//
// Worth testing separately from `.web`: this leaf expresses select and expand
// through two SEPARATE Pressables instead of one shared row click — a fact
// invisible to the web tests entirely — and reports state through
// `accessibilityState` (mapped to `aria-*` on this DOM) rather than the web
// leaf's own attributes.
//
// Rows are queried by `testID` (`tree-item-<value>`, `tree-item-<value>-
// chevron`) rather than by accessible name: a branch already open (`src`,
// via `defaultExpanded`) and one this test opens itself both read "Collapse"
// at the same time, so `getByRole('button', { name: 'Collapse' })` would find
// two matches the moment more than one branch is open — the same
// disambiguation transfer-list.native.test.tsx reaches for.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { TreeView } from './tree-view';
import type { TreeViewRootOwnProps } from './tree-view.props';

function FileTree(props: Partial<TreeViewRootOwnProps> = {}) {
  return (
    <TreeView.Root label="Project files" defaultExpanded={['src']} {...props}>
      <TreeView.Item value="src" label="src">
        <TreeView.Item value="components" label="components">
          <TreeView.Item value="button.tsx" label="button.tsx" />
        </TreeView.Item>
      </TreeView.Item>
    </TreeView.Root>
  );
}

describe('TreeView (native leaf)', () => {
  it('select and expand fire separately, from two different Pressables', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const onExpandedChange = vi.fn();
    render(<FileTree onSelectedChange={onSelectedChange} onExpandedChange={onExpandedChange} />);

    // Pressing the ROW selects — and must NOT touch expansion.
    await user.click(screen.getByTestId('tree-item-components'));
    expect(onSelectedChange).toHaveBeenCalledExactlyOnceWith('components');
    expect(onExpandedChange).not.toHaveBeenCalled();

    // Pressing the CHEVRON expands — and must NOT touch selection.
    await user.click(screen.getByTestId('tree-item-components-chevron'));
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(['src', 'components']);
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
  });

  it('accessibilityState reflects selection and expansion together', async () => {
    const user = userEvent.setup();
    render(<FileTree selected="components" />);

    const row = screen.getByTestId('tree-item-components');
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(row).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByTestId('tree-item-components-chevron'));

    expect(row).toHaveAttribute('aria-expanded', 'true');
    // Its accessible name now reads "Collapse" — same control, the other
    // state.
    expect(screen.getByTestId('tree-item-components-chevron')).toHaveAccessibleName('Collapse');
  });

  it('a leaf item carries no aria-expanded, and has no chevron to press', () => {
    render(
      <TreeView.Root>
        <TreeView.Item value="readme" label="readme" />
      </TreeView.Root>,
    );

    const leaf = screen.getByTestId('tree-item-readme');
    expect(leaf).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByTestId('tree-item-readme-chevron')).not.toBeInTheDocument();
  });

  it('a disabled item reports aria-disabled, and neither of its Pressables fires', () => {
    const onSelectedChange = vi.fn();
    const onExpandedChange = vi.fn();
    render(
      <TreeView.Root onSelectedChange={onSelectedChange} onExpandedChange={onExpandedChange}>
        <TreeView.Item value="locked" label="locked" disabled>
          <TreeView.Item value="child" label="child" />
        </TreeView.Item>
      </TreeView.Root>,
    );

    // Asserted, not clicked — react-native-web renders a disabled Pressable
    // with `pointer-events: none`, so a real click never lands and proves
    // nothing beyond what the attribute already says (the same call
    // list.native.test.tsx and button.stories.tsx's own Disabled story make).
    const row = screen.getByTestId('tree-item-locked');
    const chevron = screen.getByTestId('tree-item-locked-chevron');
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(chevron).toHaveAttribute('aria-disabled', 'true');
    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('wraps each row in a listitem, nesting a branch as list > listitem > list > listitem', () => {
    render(<FileTree />);

    // axe's `list` rule: a `list`/`role="list"` may only contain `listitem`
    // children. Root is `role="list"`; each item — row Pressables plus its
    // own nested children container — is the `role="listitem"` wrapper.
    const srcItem = screen.getByTestId('tree-item-src').closest('[role="listitem"]');
    expect(srcItem).not.toBeNull();

    const nestedList = within(srcItem as HTMLElement).getByRole('list');
    const componentsItem = within(nestedList).getByRole('listitem');
    expect(componentsItem).toContainElement(screen.getByTestId('tree-item-components'));
  });

  it('resolves the selected row colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');
    render(<FileTree selected="src" />);

    // The colour paints the SHARED row container, not the Pressable alone —
    // it has to cover the chevron's half of the row too.
    const row = screen.getByTestId('tree-item-src').parentElement;
    expect(rgb(getComputedStyle(row!).backgroundColor)).toEqual(rgb(colors.dark.surfaceAlt));
  });
});
