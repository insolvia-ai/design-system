import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ToggleGroup } from '../toggle-group';
import { Toggle } from './toggle';

describe('Toggle', () => {
  it('starts unpressed and flips aria-pressed on activation', async () => {
    const user = userEvent.setup();

    render(<Toggle>Bold</Toggle>);

    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('honours defaultPressed', () => {
    render(<Toggle defaultPressed>Bold</Toggle>);

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('is controlled when pressed is supplied: clicking does not change the DOM until the prop changes', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();

    const { rerender } = render(
      <Toggle pressed={false} onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );

    const toggle = screen.getByRole('button', { name: 'Bold' });
    await user.click(toggle);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <Toggle pressed={true} onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not activate or fire onPressedChange when disabled', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();

    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );

    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toBeDisabled();

    await user.click(toggle);

    expect(onPressedChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  // A two-item group at the default size measured about 157px, which is 44% of
  // a 390px row before the rest of a toolbar has asked for anything — which is
  // why a consumer had to hide a sort control below `sm`.
  it('takes its size from the enclosing group', () => {
    render(
      <ToggleGroup.Root size="sm" aria-label="View">
        <Toggle value="folders">Folders</Toggle>
        <Toggle value="media">Media</Toggle>
      </ToggleGroup.Root>,
    );

    expect(screen.getByRole('button', { name: 'Folders' })).toHaveClass('h-8');
    expect(screen.getByRole('button', { name: 'Media' })).toHaveClass('h-8');
  });

  it("lets a member override the group's size", () => {
    render(
      <ToggleGroup.Root size="sm" aria-label="View">
        <Toggle value="folders">Folders</Toggle>
        <Toggle value="media" size="md">
          Media
        </Toggle>
      </ToggleGroup.Root>,
    );

    expect(screen.getByRole('button', { name: 'Folders' })).toHaveClass('h-8');
    expect(screen.getByRole('button', { name: 'Media' })).toHaveClass('h-11');
  });

  // `md` set no height at all and landed at 36px from its padding, while every
  // other `md` control in the package is 44 — the WCAG 2.5.5 floor they each
  // cite. Bottom-aligned in a form row that put two labels on two lines.
  it('defaults to the 44px height every other md control holds', () => {
    render(<Toggle>Bold</Toggle>);

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveClass('h-11');
  });

  // An icon-only toggle has no text for the name-from-content rule to read, so
  // `label` is REQUIRED by the type when `iconOnly` is set — this asserts the
  // name actually lands, and the union is what stops the other case compiling.
  it('names an icon-only toggle from its label, and squares the box', () => {
    render(
      <Toggle iconOnly label="Grid view" size="sm">
        ▦
      </Toggle>,
    );

    const button = screen.getByRole('button', { name: 'Grid view' });
    expect(button).toHaveClass('size-8');
    expect(button).toHaveAttribute('title', 'Grid view');
    // 32dp is under the target-size floor, so the coarse-pointer overlay is on.
    expect(button).toHaveClass('pointer-coarse:after:size-11');
  });

  it('leaves a text toggle its name-from-content, with no empty aria-label', () => {
    render(<Toggle>Italic</Toggle>);

    expect(screen.getByRole('button', { name: 'Italic' })).not.toHaveAttribute('aria-label');
  });
});
