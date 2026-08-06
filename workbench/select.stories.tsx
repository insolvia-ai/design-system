import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Select as SelectWeb } from '@design-system/select/select.web.tsx';
import { Select as SelectNative } from '@design-system/select/select.native.tsx';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const CHAPTERS = [
  { value: 'ch7', label: 'Chapter 7 — liquidation' },
  { value: 'ch13', label: 'Chapter 13 — repayment plan' },
  { value: 'ch11', label: 'Chapter 11 — reorganisation' },
  { value: 'ch12', label: 'Chapter 12 — family farmer', disabled: true },
];

const meta = {
  title: 'Components/Select',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <LeafPair web={<LabelledWeb />} native={<LabelledNative />} />,
};

/**
 * THE REGRESSION STORY. Do not delete this one.
 *
 * 0.7.1 fixed a Select whose open list painted *behind* the content following
 * it in a form — legible enough to look like a rendering glitch, and impossible
 * to click through. It was a `.native` leaf bug, and the report opens: "reported
 * from a real browser, and invisible to every test in this package."
 *
 * It is invisible to tests because nothing about the DOM is wrong. The elements
 * are present, labelled, and in the right order; only the paint order is wrong,
 * and paint order is not something jsdom has. The native test added alongside
 * the fix asserts the elevation prop is set, which pins the mechanism — but it
 * cannot tell you the list is *visible*.
 *
 * So: open both lists here and look. The list must cover the description, the
 * button, and the second field. If it ever slides behind them again, this story
 * is the thing that shows it, in the leaf where it actually happened.
 */
export const OpenInsideAForm: Story = {
  name: 'Open, inside a form (0.7.1 regression)',
  render: () => (
    <LeafPair
      note="Open each list. It must paint OVER the text and the button below it — in BOTH panes. This is the 0.7.1 stacking bug; the native leaf is where it happened."
      web={
        <div style={{ display: 'grid', gap: 12 }}>
          <LabelledWeb />
          <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
            The list above must cover this paragraph when it is open.
          </p>
          <ButtonWeb size="lg">Continue</ButtonWeb>
        </div>
      }
      native={
        <View style={{ gap: 12 }}>
          <LabelledNative />
          <NativeNote />
          <ButtonNative size="lg">Continue</ButtonNative>
        </View>
      }
    />
  ),
};

export const Disabled: Story = {
  render: () => <LeafPair web={<LabelledWeb disabled />} native={<LabelledNative disabled />} />,
};

export const WithSelection: Story = {
  render: () => (
    <LeafPair
      web={<LabelledWeb defaultValue="ch13" />}
      native={<LabelledNative defaultValue="ch13" />}
    />
  ),
};

/**
 * A React Native `Text` rather than a `<p>`, because inside the native pane the
 * surrounding tree is react-native-web — dropping raw DOM in the middle of it
 * would not be what a React Native consumer renders, and this pane's whole job
 * is to be exactly that.
 */
function NativeNote() {
  return (
    <Text style={{ fontSize: 13, opacity: 0.75 }}>
      The list above must cover this paragraph when it is open.
    </Text>
  );
}

/**
 * Every Select in these stories is wrapped in a labelled Field, and that is not
 * decoration.
 *
 * A bare `<Select placeholder="…">` has no accessible name — a placeholder is
 * not a label — so the a11y gate fails it with `aria-input-field-name`. That
 * failure is correct and it is the STORY's fault, not the component's: this
 * package's whole position is that an input is rendered through Field, which is
 * what supplies the label and wires the ids. A story that skips it is showing
 * the component being used wrongly, and would have taught the gate to accept an
 * unlabelled input.
 */
function LabelledWeb(props: Partial<React.ComponentProps<typeof SelectWeb>>) {
  return (
    <FieldWeb.Root>
      <FieldWeb.Label>Chapter</FieldWeb.Label>
      <SelectWeb options={CHAPTERS} placeholder="Choose a chapter" {...props} />
    </FieldWeb.Root>
  );
}

function LabelledNative(props: Partial<React.ComponentProps<typeof SelectNative>>) {
  return (
    <FieldNative.Root>
      <FieldNative.Label>Chapter</FieldNative.Label>
      <SelectNative options={CHAPTERS} placeholder="Choose a chapter" {...props} />
    </FieldNative.Root>
  );
}
