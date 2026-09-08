// NATIVE-leaf tests — see button.native.test.tsx for how the `native` vitest
// project resolves './rating' to rating.native.tsx and renders it through
// react-native-web, the pair a React Native consumer ships on web.
// `aria-checked`/`aria-disabled` are asserted directly (not
// `accessibilityState`), matching switch.native.test.tsx and
// radio-group.native.tsx's header comment on why that is what actually
// reaches the DOM through react-native-web.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Rating } from './rating';

describe('Rating (native leaf)', () => {
  it('renders one radio per star and presses fire onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Rating defaultValue={null} onValueChange={onValueChange} />);

    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);

    await user.click(screen.getByRole('radio', { name: '4 stars' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  it('reports checked state on the selected star only', async () => {
    const user = userEvent.setup();
    render(<Rating defaultValue={2} />);

    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveAttribute('aria-checked', 'false');

    await user.click(screen.getByRole('radio', { name: '2 stars' }));
    // Re-pressing the checked star clears it — same rule as the web leaf.
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'false');
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time — proven here on the star
  // glyph's own color.
  it('resolves dark colors for a filled star when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(<Rating defaultValue={3} />);

    const firstStar = screen.getByRole('radio', { name: '1 star' });
    const glyph = within(firstStar).getByText('★');
    expect(rgb(getComputedStyle(glyph).color)).toEqual(rgb(colors.dark.primary));
  });
});
