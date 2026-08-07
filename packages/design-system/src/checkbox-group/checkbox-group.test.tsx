import * as React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '../checkbox/checkbox';
import { CheckboxGroup } from './checkbox-group';

function CargoManifest(props: React.ComponentProps<typeof CheckboxGroup.Root>) {
  return (
    <CheckboxGroup.Root aria-label="Cargo manifest" {...props}>
      <Checkbox.Root aria-label="Spice crates" value="spice" />
      <Checkbox.Root aria-label="Bacta tanks" value="bacta" />
      <Checkbox.Root aria-label="Proton torpedoes" value="torpedoes" />
    </CheckboxGroup.Root>
  );
}

describe('CheckboxGroup', () => {
  it('renders a role="group" wrapper', () => {
    render(<CargoManifest />);
    expect(screen.getByRole('group', { name: 'Cargo manifest' })).toBeInTheDocument();
  });

  it('starts empty without a defaultValue and checks members on click', async () => {
    const user = userEvent.setup();
    render(<CargoManifest />);

    const spice = screen.getByRole('checkbox', { name: 'Spice crates' });
    const bacta = screen.getByRole('checkbox', { name: 'Bacta tanks' });
    expect(spice).toHaveAttribute('aria-checked', 'false');
    expect(bacta).toHaveAttribute('aria-checked', 'false');

    await user.click(spice);

    expect(spice).toHaveAttribute('aria-checked', 'true');
    expect(bacta).toHaveAttribute('aria-checked', 'false');
  });

  it('honours defaultValue and lets a later toggle remove a member', async () => {
    const user = userEvent.setup();
    render(<CargoManifest defaultValue={['spice', 'bacta']} />);

    const spice = screen.getByRole('checkbox', { name: 'Spice crates' });
    const bacta = screen.getByRole('checkbox', { name: 'Bacta tanks' });
    expect(spice).toHaveAttribute('aria-checked', 'true');
    expect(bacta).toHaveAttribute('aria-checked', 'true');

    await user.click(bacta);

    expect(bacta).toHaveAttribute('aria-checked', 'false');
    expect(spice).toHaveAttribute('aria-checked', 'true');
  });

  it('is controlled when given `value`: toggling reports the change but the caller must apply it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CargoManifest value={['spice']} onValueChange={onValueChange} />);

    const studentLoan = screen.getByRole('checkbox', { name: 'Proton torpedoes' });
    await user.click(studentLoan);

    expect(onValueChange).toHaveBeenCalledWith(['spice', 'torpedoes']);
    // The parent didn't re-render with a new `value`, so nothing changed yet.
    expect(studentLoan).toHaveAttribute('aria-checked', 'false');
  });

  it('disables every member checkbox when the group is disabled', () => {
    render(<CargoManifest disabled />);

    for (const name of ['Spice crates', 'Bacta tanks', 'Proton torpedoes']) {
      expect(screen.getByRole('checkbox', { name })).toBeDisabled();
    }
  });
});
