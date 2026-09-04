// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The point of pinning this leaf: it delegates to RN's ActivityIndicator, so
// the a11y wiring is the ONLY part this package still owns. If the role or the
// label stopped surviving react-native-web's mapping, a busy indicator would
// go silent and nothing else here would notice.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './spinner';
import { DEFAULT_SPINNER_LABEL } from './spinner.props';

describe('Spinner (native leaf)', () => {
  it('announces as a progressbar under the same default name as the web leaf', () => {
    render(<Spinner />);

    expect(screen.getByRole('progressbar', { name: DEFAULT_SPINNER_LABEL })).toBeInTheDocument();
  });

  it('takes a caller-supplied name', () => {
    render(<Spinner label="Plotting jump" />);

    expect(screen.getByRole('progressbar', { name: 'Plotting jump' })).toBeInTheDocument();
  });

  // A React Native parent defaults to `alignItems: 'stretch'`, and
  // ActivityIndicator puts `size` on the ring rather than the box around it, so
  // a spinner in an ordinary column View stretched edge to edge while the web
  // leaf — which carries `inline-flex` — was as wide as its ring. Same family
  // as the 0.12.2 Popover/Tooltip collapse: a native leaf declaring nothing on
  // an axis and inheriting the parent's answer.
  it('shrink-wraps rather than filling its parent', () => {
    render(<Spinner />);

    expect(screen.getByRole('progressbar', { name: DEFAULT_SPINNER_LABEL })).toHaveStyle({
      alignSelf: 'flex-start',
    });
  });
});
