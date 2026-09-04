import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Join the waitlist</Button>);

    const button = screen.getByRole('button', { name: 'Join the waitlist' });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Join the waitlist
      </Button>,
    );

    // The Base UI predecessor asserted `data-disabled`; this leaf is a plain
    // <button>, so the native `disabled` attribute is the contract.
    const button = screen.getByRole('button', { name: 'Join the waitlist' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies the intent and size variant classes', () => {
    render(
      <Button intent="secondary" size="lg">
        Book a demo
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Book a demo' });
    expect(button).toHaveClass('bg-surface-alt');
    expect(button).toHaveClass('h-12');
  });

  // `danger` was deliberately absent until tokens 0.4.0 measured a foreground
  // for a LABEL on the danger fill — button.props.ts carries the rows.
  it('renders a danger intent on the measured danger-text foreground', () => {
    render(
      <Button intent="danger" data-testid="btn">
        Delete 54 files
      </Button>,
    );

    const button = screen.getByTestId('btn');
    expect(button).toHaveClass('bg-danger');
    expect(button).toHaveClass('text-danger-text');
    // Never a hard-coded white: that fails at 2.8:1 on the dark scheme's
    // lifted red, and would have looked right on the light canvas alone.
    expect(button.className).not.toContain('text-white');
  });

  it('is nowrap at a fixed height by default', () => {
    render(<Button data-testid="btn">Save</Button>);

    const button = screen.getByTestId('btn');
    expect(button).toHaveClass('whitespace-nowrap');
    expect(button).toHaveClass('h-11');
  });

  // The failure this exists for: a sentence-length label on a phone ran off
  // the side of the button and gave the page a horizontal scrollbar, because a
  // non-wrapping box simply grows.
  it('trades the fixed height for a minimum when wrapping', () => {
    render(
      <Button wrap data-testid="btn">
        Confirm — delete 54 files
      </Button>,
    );

    const button = screen.getByTestId('btn');
    expect(button).toHaveClass('whitespace-normal');
    expect(button).toHaveClass('min-h-11');
    // The fixed height has to be GONE, not merely overridden — it would clip
    // the second line, and it is in a different merge group from `min-h`.
    expect(button.className).not.toMatch(/(^| )h-11( |$)/);
    expect(button.className).not.toContain('whitespace-nowrap');
  });

  it('keeps the one-line layout identical: min-h equals the old h', () => {
    for (const [size, height] of [
      ['sm', '8'],
      ['md', '11'],
      ['lg', '12'],
    ] as const) {
      const { unmount } = render(
        <Button size={size} wrap data-testid={`btn-${size}`}>
          Label
        </Button>,
      );
      expect(screen.getByTestId(`btn-${size}`)).toHaveClass(`min-h-${height}`);
      unmount();
    }
  });
});
