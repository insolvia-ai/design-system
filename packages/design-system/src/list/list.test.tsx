import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { List } from './list';

describe('List', () => {
  it('renders a list of items', () => {
    render(
      <List.Root>
        <List.Item>
          <List.Text primary="Alpha" />
        </List.Item>
        <List.Item>
          <List.Text primary="Beta" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('wraps a pressable row in a real button and fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <List.Root>
        <List.Item onClick={onClick}>
          <List.Text primary="Notifications" />
        </List.Item>
      </List.Root>,
    );

    const row = screen.getByRole('button', { name: 'Notifications' });
    expect(row.tagName).toBe('BUTTON');
    await user.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders an href row as a real anchor, never an <li onClick>', () => {
    const onClick = vi.fn();
    render(
      <List.Root>
        <List.Item href="/settings" onClick={onClick}>
          <List.Text primary="Settings" />
        </List.Item>
      </List.Root>,
    );

    const row = screen.getByRole('link', { name: 'Settings' });
    expect(row.tagName).toBe('A');
    expect(row).toHaveAttribute('href', '/settings');
  });

  it('renders a row with no onClick/href as a plain, non-interactive listitem', () => {
    render(
      <List.Root>
        <List.Item>
          <List.Text primary="Read-only" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Read-only');
  });

  it('disables a pressable row through the real disabled attribute', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <List.Root>
        <List.Item onClick={onClick} disabled>
          <List.Text primary="Archived" />
        </List.Item>
      </List.Root>,
    );

    const row = screen.getByRole('button', { name: 'Archived' });
    expect(row).toBeDisabled();
    await user.click(row);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('drops href from a disabled link row instead of a disabled attribute', () => {
    render(
      <List.Root>
        <List.Item href="/archived" disabled>
          <List.Text primary="Archived" />
        </List.Item>
      </List.Root>,
    );

    const row = screen.getByText('Archived').closest('a');
    expect(row).not.toHaveAttribute('href');
    expect(row).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks a selected pressable row with data-state', () => {
    render(
      <List.Root>
        <List.Item onClick={vi.fn()} selected>
          <List.Text primary="Inbox" />
        </List.Item>
      </List.Root>,
    );

    expect(screen.getByRole('button', { name: 'Inbox' })).toHaveAttribute('data-state', 'selected');
  });

  it('marks a selected link row with both data-state and aria-current', () => {
    render(
      <List.Root>
        <List.Item href="/inbox" selected>
          <List.Text primary="Inbox" />
        </List.Item>
      </List.Root>,
    );

    const row = screen.getByRole('link', { name: 'Inbox' });
    expect(row).toHaveAttribute('data-state', 'selected');
    expect(row).toHaveAttribute('aria-current', 'page');
  });

  it('truncates the primary and secondary text', () => {
    render(<List.Text primary="Primary text" secondary="Secondary text" />);

    expect(screen.getByText('Primary text')).toHaveClass('truncate');
    expect(screen.getByText('Secondary text')).toHaveClass('truncate');
  });

  it('hides Leading from assistive tech and keeps Trailing exposed', () => {
    render(
      <List.Root>
        <List.Item>
          <List.Leading>*</List.Leading>
          <List.Text primary="Row" />
          <List.Trailing>›</List.Trailing>
        </List.Item>
      </List.Root>,
    );

    const item = screen.getByRole('listitem');
    expect(item.querySelector('[aria-hidden="true"]')).toHaveTextContent('*');
    expect(screen.getByText('›')).not.toHaveAttribute('aria-hidden');
  });
});
