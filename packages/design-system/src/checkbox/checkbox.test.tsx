import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CheckboxGroup } from '../checkbox-group/checkbox-group';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('starts unchecked and toggles checked on click', async () => {
    const user = userEvent.setup();
    render(
      <Checkbox.Root aria-label="Flown in combat before">
        <Checkbox.Indicator>✓</Checkbox.Indicator>
      </Checkbox.Root>,
    );

    const box = screen.getByRole('checkbox', { name: 'Flown in combat before' });
    expect(box).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('✓')).not.toBeInTheDocument();

    await user.click(box);

    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('✓')).toBeVisible();

    await user.click(box);
    expect(box).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles via the keyboard (native button semantics, Space and Enter)', async () => {
    const user = userEvent.setup();
    render(<Checkbox.Root aria-label="Has co-pilot" />);

    const box = screen.getByRole('checkbox', { name: 'Has co-pilot' });
    await user.tab();
    expect(box).toHaveFocus();

    await user.keyboard(' ');
    expect(box).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{Enter}');
    expect(box).toHaveAttribute('aria-checked', 'false');
  });

  it('reports aria-checked="mixed" when indeterminate, and shows the indicator', () => {
    render(
      <Checkbox.Root aria-label="Select all systems" indeterminate>
        <Checkbox.Indicator>—</Checkbox.Indicator>
      </Checkbox.Root>,
    );

    const box = screen.getByRole('checkbox', { name: 'Select all systems' });
    expect(box).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByText('—')).toBeVisible();
  });

  it('a disabled checkbox ignores clicks', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox.Root aria-label="Locked" disabled onCheckedChange={onCheckedChange} />);

    const box = screen.getByRole('checkbox', { name: 'Locked' });
    expect(box).toBeDisabled();

    await user.click(box);

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(box).toHaveAttribute('aria-checked', 'false');
  });

  it('is controlled when given `checked`: clicking reports the change but the caller must apply it', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox.Root aria-label="Controlled" checked={true} onCheckedChange={onCheckedChange} />,
    );

    const box = screen.getByRole('checkbox', { name: 'Controlled' });
    expect(box).toHaveAttribute('aria-checked', 'true');

    await user.click(box);

    expect(onCheckedChange).toHaveBeenCalledWith(false);
    // The parent didn't re-render with a new `checked`, so it stays as given.
    expect(box).toHaveAttribute('aria-checked', 'true');
  });

  it('inside a CheckboxGroup, a value-bearing checkbox toggles group membership', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <CheckboxGroup.Root defaultValue={['cargo']} onValueChange={onValueChange}>
        <Checkbox.Root aria-label="Cargo" value="cargo" />
        <Checkbox.Root aria-label="Fuel" value="fuel" />
      </CheckboxGroup.Root>,
    );

    const cargo = screen.getByRole('checkbox', { name: 'Cargo' });
    const fuel = screen.getByRole('checkbox', { name: 'Fuel' });
    expect(cargo).toHaveAttribute('aria-checked', 'true');
    expect(fuel).toHaveAttribute('aria-checked', 'false');

    await user.click(fuel);

    expect(onValueChange).toHaveBeenCalledWith(['cargo', 'fuel']);
  });
});
