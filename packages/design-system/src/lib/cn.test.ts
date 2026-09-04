import { describe, expect, it } from 'vitest';

import { cn } from './cn';

// The bug this file pins: `tailwind-merge`'s built-in theme is Tailwind's
// NUMERIC spacing scale, so this package's t-shirt steps were unrecognised
// words and both sides of a conflict survived the merge — which left the
// winner to stylesheet order and made a consumer's `className` override of a
// component's padding impossible. See cn.ts for the measurement.
describe('cn — the package spacing scale', () => {
  it('lets a later t-shirt spacing utility win, as a numeric one already did', () => {
    expect(cn('p-lg gap-sm', 'p-0 gap-0')).toBe('p-0 gap-0');
    expect(cn('p-6 gap-2', 'p-0 gap-0')).toBe('p-0 gap-0');
  });

  it('resolves a t-shirt step against a numeric one in either direction', () => {
    expect(cn('gap-sm', 'gap-md')).toBe('gap-md');
    expect(cn('px-sm', 'px-4')).toBe('px-4');
    expect(cn('px-4', 'px-sm')).toBe('px-sm');
  });

  it('merges every spacing axis a component actually emits', () => {
    expect(cn('py-xs', 'py-0')).toBe('py-0');
    expect(cn('mt-lg', 'mt-0')).toBe('mt-0');
    expect(cn('mx-lg', 'mx-auto')).toBe('mx-auto');
  });

  // An axis-specific override narrows one side and must NOT drop the shorthand
  // — `p-lg px-0` is padding on three sides plus none on the fourth.
  it('keeps a shorthand when only one axis is overridden', () => {
    expect(cn('p-lg', 'px-0')).toBe('p-lg px-0');
  });

  // The four scales that share these six names live in their own class groups.
  // Extending `spacing` must not reach them; cn.ts states this and this is
  // where it is held up.
  it('leaves the built-in scales that share these names alone', () => {
    expect(cn('max-w-sm', 'max-w-md')).toBe('max-w-md');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    expect(cn('shadow-sm', 'shadow-lg')).toBe('shadow-lg');
    expect(cn('rounded-sm', 'rounded-lg')).toBe('rounded-lg');
  });

  // Colours and radii needed no config entry — cn.ts records why. If a future
  // tailwind-merge stops accepting an arbitrary name in the value position,
  // this is the test that says so.
  it('already merged the semantic colour and radius roles', () => {
    expect(cn('bg-surface-alt text-ink', 'bg-danger text-primary-text')).toBe(
      'bg-danger text-primary-text',
    );
    expect(cn('rounded-md', 'rounded-none')).toBe('rounded-none');
  });
});

// The second bug this file pins: `text-wrap: balance` resets `text-wrap-mode`
// to `wrap`, so it beat `truncate`'s `white-space: nowrap` — and the two
// utilities sat in different tailwind-merge groups, so neither displaced the
// other and the stylesheet decided. See cn.ts.
describe('cn — truncate versus text-balance', () => {
  it('lets a later truncate displace an earlier text-balance', () => {
    expect(cn('text-balance', 'truncate')).toBe('truncate');
    expect(cn('font-heading text-3xl text-balance', 'truncate')).toBe(
      'font-heading text-3xl truncate',
    );
  });

  it('does not delete a text-overflow utility when a text-wrap one follows', () => {
    // The reverse entry is deliberately absent: `text-ellipsis text-nowrap` is
    // a normal pairing and must survive intact.
    expect(cn('text-ellipsis', 'text-nowrap')).toBe('text-ellipsis text-nowrap');
  });

  it('leaves unrelated utilities on a balanced heading alone', () => {
    expect(cn('text-balance text-ink', 'text-3xl')).toBe('text-balance text-ink text-3xl');
  });
});
