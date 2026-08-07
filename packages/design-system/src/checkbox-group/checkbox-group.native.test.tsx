// NATIVE-leaf tests — resolves './checkbox-group' to checkbox-group.native.tsx
// and './checkbox' to checkbox.native.tsx (both leaves), rendered through
// react-native-web the same way a React Native consumer ships on web. Pins the role="group"
// wiring and that group membership actually reaches each checkbox's
// aria-checked state, not just its own props.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Checkbox } from '../checkbox/checkbox';
import { CheckboxGroup } from './checkbox-group';

describe('CheckboxGroup (native leaf)', () => {
  it('renders a role="group" wrapper', () => {
    render(
      <CheckboxGroup.Root aria-label="Cargo manifest">
        <Checkbox.Root aria-label="Spice crates" value="spice" />
      </CheckboxGroup.Root>,
    );

    expect(screen.getByRole('group', { name: 'Cargo manifest' })).toBeInTheDocument();
  });

  it('honours defaultValue and updates a member on press', async () => {
    const user = userEvent.setup();

    render(
      <CheckboxGroup.Root aria-label="Cargo manifest" defaultValue={['spice']}>
        <Checkbox.Root aria-label="Spice crates" value="spice" />
        <Checkbox.Root aria-label="Bacta tanks" value="bacta" />
      </CheckboxGroup.Root>,
    );

    const spice = screen.getByRole('checkbox', { name: 'Spice crates' });
    const bacta = screen.getByRole('checkbox', { name: 'Bacta tanks' });
    expect(spice).toHaveAttribute('aria-checked', 'true');
    expect(bacta).toHaveAttribute('aria-checked', 'false');

    await user.click(bacta);

    expect(bacta).toHaveAttribute('aria-checked', 'true');
  });

  it('disables every member checkbox when the group is disabled', () => {
    render(
      <CheckboxGroup.Root aria-label="Cargo manifest" disabled>
        <Checkbox.Root aria-label="Spice crates" value="spice" />
      </CheckboxGroup.Root>,
    );

    // react-native-web renders `disabled` as a div with `aria-disabled`, not
    // a real `<button disabled>` — see checkbox.native.test.tsx for the same
    // note on `toBeDisabled()` not applying here.
    expect(screen.getByRole('checkbox', { name: 'Spice crates' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
