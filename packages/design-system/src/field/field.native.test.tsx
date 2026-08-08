// NATIVE-leaf tests — see button.native.test.tsx for how the `native` vitest
// project resolves './field' to field.native.tsx and renders it through
// react-native-web, the pair a React Native consumer ships on web. These assertions are the
// native mirror of field.test.tsx: an unlabelled input is the exact defect the
// Field pattern exists to prevent, so the association must hold on BOTH leaves.
import { render, screen } from '@testing-library/react';
import { TextInput } from 'react-native';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Field } from './field';

describe('Field (native leaf)', () => {
  it('associates the label with the control so the input is reachable by name', () => {
    render(
      <Field.Root>
        <Field.Label>Work email</Field.Label>
        <Field.Control render={<TextInput placeholder="you@firm.com" />} />
      </Field.Root>,
    );

    // getByLabelText only resolves if nativeID + aria-labelledby produce a
    // real association in the emitted DOM.
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
  });

  it('links its description to the control via aria-describedby', () => {
    render(
      <Field.Root>
        <Field.Label>Work email</Field.Label>
        <Field.Control render={<TextInput />} />
        <Field.Description>We only use this to send your invite.</Field.Description>
      </Field.Root>,
    );

    expect(screen.getByLabelText('Work email')).toHaveAccessibleDescription(
      'We only use this to send your invite.',
    );
  });

  it('marks the control invalid and points it at the rendered error', () => {
    render(
      <Field.Root invalid>
        <Field.Label>Work email</Field.Label>
        <Field.Control render={<TextInput />} />
        <Field.Error>Enter your work email.</Field.Error>
      </Field.Root>,
    );

    const input = screen.getByLabelText('Work email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter your work email.');
  });

  it('resolves dark colors when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(
      <Field.Root>
        <Field.Label>Work email</Field.Label>
        <Field.Control render={<TextInput />} />
      </Field.Root>,
    );

    const input = screen.getByLabelText('Work email');
    expect(rgb(input.style.backgroundColor)).toEqual(rgb(colors.dark.card));
  });

  it('greys a read-only control the way the web leaf greys a disabled one', () => {
    // `editable={false}` is the native spelling of the web `disabled`, and the
    // two have to LOOK the same. This leaf painted card/ink regardless, so a
    // read-only native field was indistinguishable from an editable one while
    // the web pane beside it was visibly greyed.
    setPrefersColorScheme('light');
    render(
      <Field.Root>
        <Field.Label>Logged by</Field.Label>
        <Field.Control render={<TextInput editable={false} defaultValue="Wedge Antilles" />} />
      </Field.Root>,
    );

    const control = screen.getByLabelText('Logged by');
    const style = getComputedStyle(control);
    expect(rgb(style.backgroundColor)).toEqual(rgb(colors.light.surfaceAlt));
    expect(rgb(style.color)).toEqual(rgb(colors.light.muted));
  });
});
