// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// This leaf has no `<nav>`, no `<ol>` and no `<a>` to inherit semantics from:
// the landmark, the link role and `aria-current` are all things it asserts by
// hand, which makes them exactly what a native test has to pin.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Breadcrumbs } from './breadcrumbs';
import { DEFAULT_BREADCRUMBS_LABEL } from './breadcrumbs.props';

describe('Breadcrumbs (native leaf)', () => {
  it('is a named navigation landmark', () => {
    render(
      <Breadcrumbs.Root>
        <Breadcrumbs.Item current>Wayfarer</Breadcrumbs.Item>
      </Breadcrumbs.Root>,
    );

    expect(screen.getByRole('navigation', { name: DEFAULT_BREADCRUMBS_LABEL })).toBeInTheDocument();
  });

  it('navigates through onPress, the RN counterpart of the web leaf href', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Breadcrumbs.Root>
        <Breadcrumbs.Item onPress={onPress}>Fleet</Breadcrumbs.Item>
        <Breadcrumbs.Item current>Wayfarer</Breadcrumbs.Item>
      </Breadcrumbs.Root>,
    );

    await user.click(screen.getByRole('link', { name: 'Fleet' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks the current crumb and stops it being a link', () => {
    render(
      <Breadcrumbs.Root>
        <Breadcrumbs.Item onPress={() => {}}>Fleet</Breadcrumbs.Item>
        <Breadcrumbs.Item current onPress={() => {}}>
          Wayfarer
        </Breadcrumbs.Item>
      </Breadcrumbs.Root>,
    );

    expect(screen.getByText('Wayfarer')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Wayfarer' })).not.toBeInTheDocument();
  });
});
