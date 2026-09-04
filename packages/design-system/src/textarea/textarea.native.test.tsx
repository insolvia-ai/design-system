// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Field } from '../field/field';
import { Textarea } from './textarea';
import { minHeightForRows } from './textarea.props';

describe('Textarea (native leaf)', () => {
  it('types and reports every change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea aria-label="Log entry" onValueChange={onValueChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Log entry' }), 'Jump');

    expect(onValueChange).toHaveBeenLastCalledWith('Jump');
  });

  it('is named by a surrounding Field label', () => {
    render(
      <Field.Root>
        <Field.Label>Log entry</Field.Label>
        <Textarea />
      </Field.Root>,
    );

    expect(screen.getByRole('textbox', { name: 'Log entry' })).toBeInTheDocument();
  });

  it('sizes itself from `rows` the way the shared arithmetic says', () => {
    // The web leaf hands `rows` to the browser; this leaf has to compute the
    // height, and `minHeightForRows` is what keeps the two the same size.
    render(<Textarea aria-label="Log entry" rows={4} />);

    const textarea = screen.getByRole('textbox', { name: 'Log entry' });
    expect(getComputedStyle(textarea).minHeight).toBe(`${minHeightForRows(4)}px`);
  });

  // `props` is spread LAST onto the TextInput, so a caller's `onFocus` left in
  // there replaced the ring wiring outright: their handler ran and the ring
  // never turned on. Pulled out of the rest object, both happen.
  it('runs a caller’s own onFocus AND still draws the ring', () => {
    setPrefersColorScheme('light');
    const onFocus = vi.fn();
    render(<Textarea aria-label="Log entry" onFocus={onFocus} />);

    const textarea = screen.getByRole('textbox', { name: 'Log entry' });
    act(() => textarea.focus());

    expect(onFocus).toHaveBeenCalledTimes(1);
    const style = getComputedStyle(textarea);
    expect(style.outlineWidth).toBe('2px');
    expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
  });
});
