import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * Field is a parts object (Root/Label/Control/Description/Error), so args
 * cover the CONTENT and state threaded into the composition — the same
 * reasoning dialog.stories.tsx gives for its own args — not each part's
 * props individually; there is no meta `component` because no single
 * component owns this surface. `description`/`errorText` double as whether
 * that part renders at all: `''` means "don't render it" (see
 * `fieldWebNode`/`fieldNativeNode` below), which is why they get no special
 * argType — an empty string is itself a meaningful state, not a placeholder.
 * The two leaves disagree on how a read-only control is even SPELLED — the
 * web `Control` takes `disabled`, the native one takes `editable` — so
 * `readOnly` is the one bridging arg the render below fans out to each
 * leaf's own prop, the same shape Button's bridging `onPress` takes for a
 * naming mismatch, here for a whole prop's existence.
 */
type FieldArgs = {
  label: string;
  placeholder: string;
  /** The web `Control`'s HTML `type` — native has no equivalent notion, so it
   *  is threaded to the web leaf only. */
  type: string;
  description: string;
  errorText: string;
  invalid: boolean;
  readOnly: boolean;
  defaultValue: string;
  onValueChange: (next: string) => void;
};

const meta = {
  title: 'Components/Field',
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Case number',
    placeholder: 'e.g. 24-10456',
    type: 'text',
    description: 'Assigned by the clerk’s office once filed.',
    errorText: '',
    invalid: false,
    readOnly: false,
    defaultValue: '',
    onValueChange: fn(),
  },
  argTypes: {
    // Seeds UNCONTROLLED text (`Field.Control`'s own `defaultValue`) —
    // twiddling it after mount changes nothing on screen, the same
    // reasoning select.stories.tsx gives its own `defaultValue`.
    defaultValue: { control: false },
  },
  render: (args) => <LeafPair web={fieldWebNode(args)} native={fieldNativeNode(args)} />,
} satisfies Meta<FieldArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Description` and `Error` are DIRECT children of `Root` in every story
 * below, never wrapped in a `div`/`View`. Both leaves compute
 * `aria-describedby` from a `React.Children.forEach` identity scan against
 * their own `Description`/`Error` — a wrapper defeats that scan and silently
 * drops the id from the association, even though the text still renders.
 *
 * The play checks the two wirings that note protects: clicking the web
 * label moves focus to the control it names (a real `<label htmlFor>`, the
 * same as any HTML form), and the control's accessible description matches
 * the rendered `Description` text in both panes. Typing into the control
 * also proves the shared `onValueChange` reaches both leaves — `onChange` +
 * `event.target.value` on web, `onChangeText` directly on native — which is
 * why that handler needed no bridging arg even though `readOnly` did.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web: the label focuses the control, and describes it', async () => {
      const control = web.getByLabelText(args.label);
      await expect(control).toHaveAccessibleDescription(args.description);
      await userEvent.click(web.getByText(args.label));
      await expect(control).toHaveFocus();
      await userEvent.type(control, 'X');
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    });

    await step('native: the same association, without a real <label> to click', async () => {
      // react-native-web's Label is a plain Text carrying `nativeID`, not an
      // HTML `<label for>` — the control finds it purely through
      // `aria-labelledby`, so there is no click-to-focus to assert here,
      // only the naming and the description.
      const control = native.getByLabelText(args.label);
      await expect(control).toHaveAccessibleDescription(args.description);
      await userEvent.type(control, 'X');
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
    });
  },
};

/**
 * The web `Control`'s `aria-invalid` and the error's `aria-describedby`
 * association both come from the same `Root invalid` + `Error` pairing
 * `Basic`'s header comment describes — this story is that pairing with a
 * real error message, and the play checks both leaves actually WIRE it, not
 * just render it next to the control.
 */
export const Invalid: Story = {
  args: {
    label: 'Client email',
    placeholder: 'you@firm.com',
    type: 'email',
    defaultValue: 'not-an-email',
    invalid: true,
    description: '',
    errorText: 'Enter a valid email address.',
  },
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);

    const webControl = web.getByLabelText(args.label);
    await expect(webControl).toHaveAttribute('aria-invalid', 'true');
    await expect(webControl).toHaveAccessibleDescription(args.errorText);

    const nativeControl = native.getByLabelText(args.label);
    await expect(nativeControl).toHaveAttribute('aria-invalid', 'true');
    await expect(nativeControl).toHaveAccessibleDescription(args.errorText);
  },
};

/**
 * The two leaves take a read-only control through DIFFERENT props, not just
 * different spellings of the same one: the web `Control` is an `<input>` and
 * takes the standard `disabled`; the native `Control` is a `TextInput` and
 * has no `disabled` — it takes `editable={false}` instead (the native leaf
 * derives `accessibilityState.disabled` from that itself). A call site that
 * only sets `disabled` on both, expecting one prop name to work everywhere,
 * silently leaves the native field editable.
 *
 * The play pins the DOM consequence of that split: the web control is a real
 * disabled `<input>` (`toBeDisabled`), but the native leaf never sets
 * `aria-disabled` at all — only `editable={false}`, which react-native-web
 * renders as the `readonly` attribute instead, because `accessibilityState`
 * is not one of the props react-native-web forwards to the DOM on its own
 * (contrast radio-group.native.tsx, whose header comment explains why THAT
 * leaf sets `aria-disabled` explicitly). `toBeDisabled` would simply be the
 * wrong assertion on the native pane.
 */
export const ReadOnly: Story = {
  name: 'Disabled / read-only',
  args: {
    label: 'Filed by',
    defaultValue: 'Alex Rivera, Esq.',
    readOnly: true,
    description: '',
    errorText: '',
  },
  render: (args) => (
    <LeafPair
      note="Different contracts, not different spellings: web `Control` takes `disabled`; native `Control` takes `editable={false}`."
      web={fieldWebNode(args)}
      native={fieldNativeNode(args)}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByLabelText(args.label)).toBeDisabled();
    await expect(native.getByLabelText(args.label)).toHaveAttribute('readonly');
  },
};

/** Composes the web pane from `FieldArgs`, threading each prop by name onto
 *  the actual leaf parts — never `{...args}` — so `typecheck:workbench`
 *  checks every prop NAME against `field.web.tsx` itself. */
function fieldWebNode(args: FieldArgs) {
  return (
    <FieldWeb.Root invalid={args.invalid}>
      <FieldWeb.Label>{args.label}</FieldWeb.Label>
      <FieldWeb.Control
        type={args.type}
        placeholder={args.placeholder}
        defaultValue={args.defaultValue}
        disabled={args.readOnly}
        onChange={(event) => args.onValueChange(event.target.value)}
      />
      {args.description ? <FieldWeb.Description>{args.description}</FieldWeb.Description> : null}
      {args.errorText ? <FieldWeb.Error>{args.errorText}</FieldWeb.Error> : null}
    </FieldWeb.Root>
  );
}

/** The native pane's mirror of `fieldWebNode` — same explicit, per-prop
 *  threading, onto `field.native.tsx`'s own contract. */
function fieldNativeNode(args: FieldArgs) {
  return (
    <FieldNative.Root invalid={args.invalid}>
      <FieldNative.Label>{args.label}</FieldNative.Label>
      <FieldNative.Control
        placeholder={args.placeholder}
        defaultValue={args.defaultValue}
        editable={!args.readOnly}
        onChangeText={args.onValueChange}
      />
      {args.description ? (
        <FieldNative.Description>{args.description}</FieldNative.Description>
      ) : null}
      {args.errorText ? <FieldNative.Error>{args.errorText}</FieldNative.Error> : null}
    </FieldNative.Root>
  );
}
