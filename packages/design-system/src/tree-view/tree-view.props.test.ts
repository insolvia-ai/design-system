// Direct unit tests for the shared, renderer-agnostic pieces this module
// exposes — the part BOTH leaves execute, so pinning their edge cases once
// here covers both platforms instead of duplicating them per leaf.
import { describe, expect, it } from 'vitest';

import { isTreeItemTabbable, visibleOrder, type TreeRegistryEntry } from './tree-view.props';

// The same three-level file tree the story and the behavioural tests use:
//
//   src
//     components
//       button.tsx
//     docs
//   package.json
const REGISTRY: TreeRegistryEntry[] = [
  { value: 'src', parentValue: null, depth: 0 },
  { value: 'components', parentValue: 'src', depth: 1 },
  { value: 'button.tsx', parentValue: 'components', depth: 2 },
  { value: 'docs', parentValue: 'src', depth: 1 },
  { value: 'package.json', parentValue: null, depth: 0 },
];

describe('visibleOrder', () => {
  it('lists only root items when nothing is expanded', () => {
    expect(visibleOrder(REGISTRY, [])).toEqual(['src', 'package.json']);
  });

  it('walks into an expanded branch, keeping its children contiguous', () => {
    expect(visibleOrder(REGISTRY, ['src'])).toEqual(['src', 'components', 'docs', 'package.json']);
  });

  it('keeps expanding recursively down nested branches', () => {
    expect(visibleOrder(REGISTRY, ['src', 'components'])).toEqual([
      'src',
      'components',
      'button.tsx',
      'docs',
      'package.json',
    ]);
  });

  it('does not surface a nested branch expanded while its own parent stays closed', () => {
    // `components` being in `expanded` is meaningless while `src` — its
    // parent — is not; nothing under `src` is reachable at all.
    expect(visibleOrder(REGISTRY, ['components'])).toEqual(['src', 'package.json']);
  });

  it('tolerates registry order that is not tree order, as real mounts produce', () => {
    // React's mount effects fire children-before-their-own-parent (a
    // postorder), which is what a real <TreeView.Root> registers in — this
    // pins the doc comment's claim that only SIBLING relative order matters.
    const postorder: TreeRegistryEntry[] = [
      { value: 'button.tsx', parentValue: 'components', depth: 2 },
      { value: 'components', parentValue: 'src', depth: 1 },
      { value: 'docs', parentValue: 'src', depth: 1 },
      { value: 'src', parentValue: null, depth: 0 },
      { value: 'package.json', parentValue: null, depth: 0 },
    ];
    expect(visibleOrder(postorder, ['src', 'components'])).toEqual([
      'src',
      'components',
      'button.tsx',
      'docs',
      'package.json',
    ]);
  });

  it('returns an empty list for an empty registry', () => {
    expect(visibleOrder([], [])).toEqual([]);
  });
});

describe('isTreeItemTabbable', () => {
  it('is the selected item once one exists, before anything has been focused', () => {
    expect(isTreeItemTabbable('docs', null, 'docs', false)).toBe(true);
    expect(isTreeItemTabbable('src', null, 'docs', false)).toBe(false);
  });

  it('falls back to the first item when nothing is focused or selected', () => {
    expect(isTreeItemTabbable('src', null, null, true)).toBe(true);
    expect(isTreeItemTabbable('docs', null, null, false)).toBe(false);
  });

  it('the last actually-focused item wins over selection', () => {
    expect(isTreeItemTabbable('components', 'components', 'docs', false)).toBe(true);
    expect(isTreeItemTabbable('docs', 'components', 'docs', false)).toBe(false);
  });
});
