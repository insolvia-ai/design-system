// NATIVE-leaf tests — see button.native.test.tsx for how the `native` vitest
// project resolves './list' to list.native.tsx and renders it through
// react-native-web, the pair a React Native consumer ships on web.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { ThemeProvider } from '../lib/theme';
import { List } from './list';

describe('List (native leaf)', () => {
  it('renders a list with accessibilityRole="list"', () => {
    render(
      <List.Root>
        <List.Item>
          <List.Text primary="Alpha" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('fires onPress for a pressable row', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <List.Root>
        <List.Item onPress={onPress}>
          <List.Text primary="Notifications" />
        </List.Item>
      </List.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a row with no onPress/href as a non-pressable view', () => {
    render(
      <List.Root>
        <List.Item>
          <List.Text primary="Read-only" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Read-only')).toBeInTheDocument();
  });

  it('reports selected and disabled through accessibilityState', () => {
    render(
      <List.Root>
        <List.Item onPress={vi.fn()} selected disabled>
          <List.Text primary="Archived" />
        </List.Item>
      </List.Root>,
    );

    // Asserted, not clicked — react-native-web renders a disabled Pressable
    // with `pointer-events: none`, so a real click never lands and proves
    // nothing beyond what the attribute already says (the same call
    // `button.stories.tsx`'s `Disabled` story makes).
    //
    // `aria-current`, not `aria-selected` — `aria-selected` is invalid on
    // `role="button"` (axe's `aria-allowed-attr`); see the leaf's comment on
    // `ListItem` for why `aria-current="true"` is the substitute here.
    const row = screen.getByRole('button', { name: 'Archived' });
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(row).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks a selected link row with aria-current="page", not "true"', () => {
    render(
      <List.Root>
        <List.Item href="/inbox" selected>
          <List.Text primary="Inbox" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.getByRole('button', { name: 'Inbox' })).toHaveAttribute('aria-current', 'page');
  });

  it('wraps every direct child of Root in a listitem, including Subheader and Divider', () => {
    render(
      <List.Root>
        <List.Subheader>Recent</List.Subheader>
        <List.Item>
          <List.Text primary="Row" />
        </List.Item>
        <List.Divider />
      </List.Root>,
    );

    // The axe `list` rule this pins: `role="list"` may only contain
    // `listitem` children, so every direct child — including the ones with
    // no interaction at all — needs its own `listitem` wrapper.
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('resolves the primary text colour from the active scheme', () => {
    setPrefersColorScheme('dark');
    render(
      <List.Root>
        <List.Item>
          <List.Text primary="Inbox" />
        </List.Item>
      </List.Root>,
    );

    const text = screen.getByText('Inbox');
    expect(rgb(text.style.color)).toEqual(rgb(colors.dark.ink));
  });

  // The body-family seam on a leaf with THREE texts of its own — the primary
  // and secondary lines and the section subheader — so one provider reaches
  // all of them, or none. The default stays the absence of a family: with no
  // provider every row renders in the platform sans exactly as it did.
  it('sets no body family on its texts with no provider', () => {
    render(
      <List.Root>
        <List.Subheader>Today</List.Subheader>
        <List.Item>
          <List.Text primary="Inbox" secondary="3 unread" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.getByText('Today').style.fontFamily).toBe('');
    expect(screen.getByText('Inbox').style.fontFamily).toBe('');
    expect(screen.getByText('3 unread').style.fontFamily).toBe('');
  });

  it('takes the body family a ThemeProvider names on every text it renders', () => {
    render(
      <ThemeProvider theme={{ fonts: { body: 'BrandSans' } }}>
        <List.Root>
          <List.Subheader>Today</List.Subheader>
          <List.Item>
            <List.Text primary="Inbox" secondary="3 unread" />
          </List.Item>
        </List.Root>
      </ThemeProvider>,
    );

    expect(screen.getByText('Today').style.fontFamily).toBe('BrandSans');
    expect(screen.getByText('Inbox').style.fontFamily).toBe('BrandSans');
    expect(screen.getByText('3 unread').style.fontFamily).toBe('BrandSans');
  });
});
