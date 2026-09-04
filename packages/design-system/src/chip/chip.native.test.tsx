// NATIVE-leaf tests. They run in the vitest `native` project, whose resolver
// is Metro's view of the package (native-first extensions, react-native
// aliased to react-native-web), so the extensionless './chip' below lands on
// chip.native.tsx and renders through the same react-native-web a React Native
// consumer ships on web.
//
// `aria-pressed` rather than `accessibilityState` is what these assert, for the
// reason toggle.native.tsx measured against this repo's pinned
// react-native-web: it does not flatten `accessibilityState` into any `aria-*`
// attribute, so the state exists only if the leaf also forwards the ARIA prop.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Chip } from './chip';

describe('Chip (native leaf)', () => {
  it('renders its label and fires onPress', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    render(<Chip onPress={onPress}>Drafts</Chip>);

    await user.click(screen.getByRole('button', { name: 'Drafts' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders no pressed state at all when `pressed` is omitted', () => {
    render(<Chip>Drafts</Chip>);

    expect(screen.getByRole('button', { name: 'Drafts' })).not.toHaveAttribute('aria-pressed');
  });

  it('forwards the pressed state as aria-pressed for react-native-web', () => {
    render(<Chip pressed>Published</Chip>);

    expect(screen.getByRole('button', { name: 'Published' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  // The whole class of bug this package's native leaves exist to avoid: colours
  // read at MODULE LOAD stay light inside a dark app. Resolved per render here.
  it('follows the colour scheme at render time', () => {
    setPrefersColorScheme('dark');
    const { unmount } = render(<Chip testID="chip">Drafts</Chip>);

    // At rest the border is `line` and the label is `muted`.
    expect(screen.getByTestId('chip')).toHaveStyle({ borderColor: rgb(colors.dark.line) });
    unmount();

    setPrefersColorScheme('light');
    render(<Chip testID="chip">Drafts</Chip>);

    expect(screen.getByTestId('chip')).toHaveStyle({ borderColor: rgb(colors.light.line) });
  });

  // Both states carry a border and only its colour moves, so the box never
  // changes size as it is pressed — chip.props.ts has the why.
  it('keeps its border when pressed, moving only the colour', () => {
    setPrefersColorScheme('light');
    render(
      <Chip pressed testID="chip">
        Published
      </Chip>,
    );

    expect(screen.getByTestId('chip')).toHaveStyle({
      borderColor: rgb(colors.light.primary),
      backgroundColor: rgb(colors.light.primary),
    });
  });

  // A React Native parent defaults to `alignItems: 'stretch'`, so a chip in an
  // ordinary column View stretched edge to edge while the web leaf — which
  // carries `inline-flex shrink-0` — hugged its label. Same family as the
  // 0.12.2 Popover/Tooltip collapse: a native leaf declaring nothing on an
  // axis and inheriting the parent's answer.
  it('shrink-wraps rather than filling its parent', () => {
    setPrefersColorScheme('light');
    render(<Chip testID="chip">Drafts</Chip>);

    expect(screen.getByTestId('chip')).toHaveStyle({ alignSelf: 'flex-start' });
  });
});
