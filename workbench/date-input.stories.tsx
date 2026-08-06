import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { DateInput as DateInputWeb } from '@design-system/date-input/date-input.web.tsx';
import { DateInput as DateInputNative } from '@design-system/date-input/date-input.native.tsx';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/DateInput',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <LeafPair
      note="The native control is 44dp tall — the WCAG 2.5.5 target-size floor, since a date field is reached by tap far more often than a long-form text field. The web control stays at Field's usual 40dp. Deliberate; see date-input.native.tsx."
      web={<LabelledWeb />}
      native={<LabelledNative />}
    />
  ),
};

export const WithValue: Story = {
  render: () => (
    <LeafPair
      web={<LabelledWeb defaultValue="2019-02-14" />}
      native={<LabelledNative defaultValue="2019-02-14" />}
    />
  ),
};

/**
 * No typing and no play function needed to reach this state.
 *
 * `defaultValue="2019-02-30"` is eight digits, so `dateStatus` runs the
 * calendar check on first render — and February never has 30 days, so it
 * comes back `invalid` without a `Date` ever being constructed (`isRealDate`
 * in date-input.props.ts works from the plain numbers). That is what puts
 * `aria-invalid` and the danger border on screen immediately, in both panes.
 */
export const InvalidDate: Story = {
  render: () => (
    <LeafPair
      web={<LabelledWeb defaultValue="2019-02-30" />}
      native={<LabelledNative defaultValue="2019-02-30" />}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<LabelledWeb disabled defaultValue="2016-11-03" />}
      native={<LabelledNative disabled defaultValue="2016-11-03" />}
    />
  ),
};

/**
 * Every DateInput in these stories is wrapped in a labelled Field, and that is
 * not decoration — the identical note in select.stories.tsx applies verbatim
 * here. A bare `<DateInput placeholder="…">` has no accessible name, so the
 * a11y gate fails it with `aria-input-field-name`; that failure is correct,
 * and it is the STORY's fault for skipping Field, not the component's.
 */
function LabelledWeb(props: Partial<React.ComponentProps<typeof DateInputWeb>>) {
  return (
    <FieldWeb.Root>
      <FieldWeb.Label>Date debt incurred</FieldWeb.Label>
      <DateInputWeb {...props} />
    </FieldWeb.Root>
  );
}

function LabelledNative(props: Partial<React.ComponentProps<typeof DateInputNative>>) {
  return (
    <FieldNative.Root>
      <FieldNative.Label>Date debt incurred</FieldNative.Label>
      <DateInputNative {...props} />
    </FieldNative.Root>
  );
}
