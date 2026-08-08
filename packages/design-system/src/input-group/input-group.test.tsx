import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '../input/input';
import { InputGroup } from './input-group';

describe('InputGroup', () => {
  it('strips the control’s own box so the row draws one border', () => {
    // The defect this prevents is a double border, which reads as "the design
    // system is sloppy" rather than "this call site is wrong" — which is why
    // the group asserts it through context instead of asking the caller.
    render(
      <InputGroup.Root>
        <InputGroup.Text>https://</InputGroup.Text>
        <Input aria-label="Domain" data-testid="input" />
      </InputGroup.Root>,
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-0');
    expect(input).toHaveClass('bg-transparent');
  });

  it('leaves a standalone control with its own border', () => {
    render(<Input aria-label="Domain" data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-line');
    expect(input).not.toHaveClass('border-0');
  });

  it('is the same 40px box a standalone control draws', () => {
    // There is no size scale to reconcile any more: one height, shared with
    // Field.Control, so a group and a bare Input cannot come out different
    // heights. See input.props.ts.
    render(
      <InputGroup.Root data-testid="row">
        <Input aria-label="Domain" />
      </InputGroup.Root>,
    );

    expect(screen.getByTestId('row')).toHaveClass('h-10');
  });

  it('renders the addon text without making it the control’s name', () => {
    // An addon reading "https://" does not name the field; a Field.Label does.
    render(
      <InputGroup.Root>
        <InputGroup.Text>https://</InputGroup.Text>
        <Input aria-label="Domain" />
      </InputGroup.Root>,
    );

    expect(screen.getByText('https://')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Domain' })).toBeInTheDocument();
  });

  it('carries the invalid state on the row', () => {
    render(
      <InputGroup.Root invalid data-testid="row">
        <Input aria-label="Domain" />
      </InputGroup.Root>,
    );

    expect(screen.getByTestId('row')).toHaveClass('border-danger');
  });
});
