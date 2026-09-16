// jsdom never actually loads an <img> (no network stack), so the only way to
// exercise the load/error branches of the status state machine is to fire the
// events on the element directly, as if the browser had.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from './avatar';

describe('Avatar', () => {
  it('shows the fallback before the image has resolved', () => {
    render(
      <Avatar.Root>
        <Avatar.Image src="https://example.com/avatar.jpg" alt="Ada Lovelace" />
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(screen.getByText('AL')).toBeVisible();
  });

  it('hides the fallback once the image reports it loaded', () => {
    render(
      <Avatar.Root>
        <Avatar.Image src="https://example.com/avatar.jpg" alt="Ada Lovelace" />
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    fireEvent.load(screen.getByAltText('Ada Lovelace'));

    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('keeps showing the fallback when the image fails to load', () => {
    render(
      <Avatar.Root>
        <Avatar.Image src="https://example.com/broken.jpg" alt="Ada Lovelace" />
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    fireEvent.error(screen.getByAltText('Ada Lovelace'));

    expect(screen.getByText('AL')).toBeVisible();
  });

  it('shows the fallback when there is no image at all', () => {
    render(
      <Avatar.Root>
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(screen.getByText('AL')).toBeVisible();
  });

  it('stacks a group, names it, and counts the overflow', () => {
    render(
      <Avatar.Group max={2} label="Crew">
        <Avatar.Root>
          <Avatar.Fallback>AB</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>CD</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>EF</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );

    const group = screen.getByRole('group', { name: 'Crew' });
    expect(group).toBeInTheDocument();
    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.queryByText('EF')).not.toBeInTheDocument();
    // Announced, not decorative: "+1" is information about who is missing.
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows every avatar and no counter when max is not reached', () => {
    render(
      <Avatar.Group max={5} label="Crew">
        <Avatar.Root>
          <Avatar.Fallback>AB</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('cascades its size to children that do not set one', () => {
    render(
      <Avatar.Group size="lg" label="Crew">
        <Avatar.Root data-testid="inherits">
          <Avatar.Fallback>AB</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root size="sm" data-testid="explicit">
          <Avatar.Fallback>CD</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );

    // An explicit prop is never silently overruled by the group.
    expect(screen.getByTestId('inherits')).toHaveStyle({ width: '40px' });
    expect(screen.getByTestId('explicit')).toHaveStyle({ width: '24px' });
  });
});
