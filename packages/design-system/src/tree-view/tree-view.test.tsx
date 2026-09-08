import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TreeView } from './tree-view';
import type { TreeViewRootOwnProps } from './tree-view.props';

// The same three-level file tree the story and the props tests use.
function FileTree(props: Partial<TreeViewRootOwnProps> = {}) {
  return (
    <TreeView.Root label="Project files" defaultExpanded={['src']} {...props}>
      <TreeView.Item value="src" label="src">
        <TreeView.Item value="components" label="components">
          <TreeView.Item value="button.tsx" label="button.tsx" />
        </TreeView.Item>
        <TreeView.Item value="docs" label="docs" />
      </TreeView.Item>
      <TreeView.Item value="package.json" label="package.json" />
    </TreeView.Root>
  );
}

describe('TreeView', () => {
  it('renders tree/treeitem roles with aria-level per nesting depth', () => {
    render(<FileTree />);

    expect(screen.getByRole('tree', { name: 'Project files' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'src' })).toHaveAttribute('aria-level', '1');
    expect(screen.getByRole('treeitem', { name: 'components' })).toHaveAttribute('aria-level', '2');
    expect(screen.getByRole('treeitem', { name: 'package.json' })).toHaveAttribute(
      'aria-level',
      '1',
    );
  });

  it('a leaf item carries no aria-expanded at all', () => {
    render(<FileTree />);

    expect(screen.getByRole('treeitem', { name: 'docs' })).not.toHaveAttribute('aria-expanded');
  });

  it('expands a branch by clicking its row — the chevron sits inside it, not beside it', async () => {
    const user = userEvent.setup();
    render(<FileTree />);

    const components = screen.getByRole('treeitem', { name: 'components' });
    expect(components).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'button.tsx' })).not.toBeInTheDocument();

    await user.click(screen.getByText('components'));

    expect(components).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: 'button.tsx' })).toBeInTheDocument();
  });

  it('clicking a row selects it and fires onSelectedChange', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<FileTree onSelectedChange={onSelectedChange} />);

    await user.click(screen.getByText('docs'));

    expect(onSelectedChange).toHaveBeenCalledExactlyOnceWith('docs');
    expect(screen.getByRole('treeitem', { name: 'docs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('treeitem', { name: 'src' })).toHaveAttribute('aria-selected', 'false');
  });

  it("ArrowDown moves focus down the VISIBLE items only, skipping a collapsed branch's children", async () => {
    const user = userEvent.setup();
    render(<FileTree />);
    // Visible order: src(0, expanded) -> components(1, collapsed) ->
    // docs(1) -> package.json(0). button.tsx never appears — it is inside
    // the still-collapsed `components`.
    screen.getByRole('treeitem', { name: 'src' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'components' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'docs' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'package.json' })).toHaveFocus();

    // The end of the visible list — ArrowDown here is simply a no-op.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'package.json' })).toHaveFocus();
  });

  it('ArrowUp moves focus to the previous visible item', async () => {
    const user = userEvent.setup();
    render(<FileTree />);

    screen.getByRole('treeitem', { name: 'docs' }).focus();
    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('treeitem', { name: 'components' })).toHaveFocus();
  });

  it('ArrowRight expands a closed branch WITHOUT moving focus; a second ArrowRight moves into it', async () => {
    const user = userEvent.setup();
    render(<FileTree />);

    const components = screen.getByRole('treeitem', { name: 'components' });
    components.focus();

    await user.keyboard('{ArrowRight}');
    expect(components).toHaveAttribute('aria-expanded', 'true');
    expect(components).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'button.tsx' })).toHaveFocus();
  });

  it('ArrowLeft collapses an open branch; on a closed branch or a leaf it moves to the parent', async () => {
    const user = userEvent.setup();
    render(<FileTree />);

    const components = screen.getByRole('treeitem', { name: 'components' });
    await user.click(screen.getByText('components')); // opens it
    components.focus();

    await user.keyboard('{ArrowLeft}');
    expect(components).toHaveAttribute('aria-expanded', 'false');
    expect(components).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('treeitem', { name: 'src' })).toHaveFocus();
  });

  it('Home and End jump to the first and last visible items', async () => {
    const user = userEvent.setup();
    render(<FileTree />);

    screen.getByRole('treeitem', { name: 'docs' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('treeitem', { name: 'package.json' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('treeitem', { name: 'src' })).toHaveFocus();
  });

  it('Enter selects without toggling expansion; Space toggles without selecting', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const onExpandedChange = vi.fn();
    render(<FileTree onSelectedChange={onSelectedChange} onExpandedChange={onExpandedChange} />);

    const components = screen.getByRole('treeitem', { name: 'components' });
    components.focus();

    await user.keyboard('{Enter}');
    expect(onSelectedChange).toHaveBeenCalledExactlyOnceWith('components');
    expect(onExpandedChange).not.toHaveBeenCalled();

    await user.keyboard(' ');
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(['src', 'components']);
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
  });

  it('a disabled item cannot be selected or expanded by click, and reports aria-disabled', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const onExpandedChange = vi.fn();
    render(
      <TreeView.Root onSelectedChange={onSelectedChange} onExpandedChange={onExpandedChange}>
        <TreeView.Item value="locked" label="locked" disabled>
          <TreeView.Item value="child" label="child" />
        </TreeView.Item>
      </TreeView.Root>,
    );

    const locked = screen.getByRole('treeitem', { name: 'locked' });
    expect(locked).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByText('locked'));

    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(locked).toHaveAttribute('aria-selected', 'false');
    expect(locked).toHaveAttribute('aria-expanded', 'false');
  });
});
