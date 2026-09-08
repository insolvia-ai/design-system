import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Stepper as StepperWeb } from '@design-system/stepper/stepper.web.tsx';
import { Stepper as StepperNative } from '@design-system/stepper/stepper.native.tsx';
import type { StepperOrientation } from '@design-system/stepper/stepper.props.ts';
import { stepAccessibilityLabel, stepSrSuffix } from '@design-system/stepper/stepper.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const ORIENTATIONS = ['horizontal', 'vertical'] as const satisfies readonly StepperOrientation[];

/**
 * `Stepper` is a parts object (`Root`/`Step`), so there is no meta `component`
 * for the docs-page props table — the same reason Tabs and Dialog have none.
 * Progress through a flow: a numbered circle per step, joined by a hairline
 * connector, with a label under (horizontal) or beside (vertical) each.
 *
 * Args are typed against the shared surface (`stepper.props.ts`), never
 * against either leaf. The four steps (Account/Profile/Review/Done) are fixed
 * composition, the same way Dialog's content is fixed and only its text args
 * vary — every status a step can show is DERIVED from `activeStep`, so moving
 * that one number is enough to walk the whole flow through every state.
 */
type StepperArgs = {
  defaultActiveStep: number;
  orientation: StepperOrientation;
  linear: boolean;
  interactive: boolean;
  onActiveStepChange: (next: number) => void;
};

const meta = {
  title: 'Layout/Stepper',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultActiveStep: 1,
    orientation: 'horizontal',
    linear: true,
    interactive: true,
    onActiveStepChange: fn(),
  },
  argTypes: {
    // Seeds UNCONTROLLED state at mount — twiddling it afterwards would
    // change nothing, so it gets no control, the same reasoning Select's
    // `defaultValue` and Tabs' `defaultValue` document.
    defaultActiveStep: { control: false },
    orientation: { control: 'inline-radio', options: [...ORIENTATIONS] },
    linear: { control: 'boolean' },
    interactive: { control: 'boolean' },
    onActiveStepChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <StepperWeb.Root
          defaultActiveStep={args.defaultActiveStep}
          orientation={args.orientation}
          linear={args.linear}
          interactive={args.interactive}
          onActiveStepChange={args.onActiveStepChange}
        >
          <StepperWeb.Step label="Account" />
          <StepperWeb.Step label="Profile" />
          <StepperWeb.Step label="Review" />
          <StepperWeb.Step label="Done" />
        </StepperWeb.Root>
      }
      native={
        <StepperNative.Root
          defaultActiveStep={args.defaultActiveStep}
          orientation={args.orientation}
          linear={args.linear}
          interactive={args.interactive}
          onActiveStepChange={args.onActiveStepChange}
        >
          <StepperNative.Step label="Account" />
          <StepperNative.Step label="Profile" />
          <StepperNative.Step label="Review" />
          <StepperNative.Step label="Done" />
        </StepperNative.Root>
      }
    />
  ),
} satisfies Meta<StepperArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `defaultActiveStep={1}` puts "Account" at completed, "Profile" active, the
 * rest upcoming. The play clicks/presses the completed "Account" step in each
 * pane — the one step linear mode already allows without changing anything
 * else — and asserts the shared `onActiveStepChange` arg's call COUNT, since
 * the two panes share one `fn()` and a pane that silently dropped the press
 * would otherwise be vouched for by the other pane's earlier call.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step(
      'web leaf: the completed step is a button; clicking it jumps back to it',
      async () => {
        await userEvent.click(
          web.getByRole('button', { name: `Account${stepSrSuffix('completed') ?? ''}` }),
        );
        await expect(args.onActiveStepChange).toHaveBeenCalledTimes(1);
        await expect(args.onActiveStepChange).toHaveBeenLastCalledWith(0);
      },
    );

    await step('native leaf: same completed step, pressed instead of clicked', async () => {
      await userEvent.click(
        native.getByRole('button', { name: stepAccessibilityLabel(0, 'Account', 'completed') }),
      );
      await expect(args.onActiveStepChange).toHaveBeenCalledTimes(2);
      await expect(args.onActiveStepChange).toHaveBeenLastCalledWith(0);
    });
  },
};

/**
 * A column instead of a row: the label sits beside its circle rather than
 * under it, and the connector runs top-to-bottom between circles instead of
 * left-to-right.
 */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

/**
 * A line of detail under each label — `description` on `Step`, rendered
 * muted beneath the label on both leaves. "Review" also carries `optional`,
 * which adds its own muted "(Optional)" caption next to the label.
 */
export const WithDescriptions: Story = {
  render: () => (
    <LeafPair
      web={
        <StepperWeb.Root defaultActiveStep={1}>
          <StepperWeb.Step label="Account" description="Email and password" />
          <StepperWeb.Step label="Profile" description="Name and photo" />
          <StepperWeb.Step label="Review" description="Confirm before submitting" optional />
          <StepperWeb.Step label="Done" description="Nothing left to do" />
        </StepperWeb.Root>
      }
      native={
        <StepperNative.Root defaultActiveStep={1}>
          <StepperNative.Step label="Account" description="Email and password" />
          <StepperNative.Step label="Profile" description="Name and photo" />
          <StepperNative.Step label="Review" description="Confirm before submitting" optional />
          <StepperNative.Step label="Done" description="Nothing left to do" />
        </StepperNative.Root>
      }
    />
  ),
};

/**
 * `status="error"` overrides derivation on one step — the only value worth
 * passing explicitly, since every other value is exactly what derivation
 * would have produced anyway. "Review" shows the `!` glyph and
 * `border-danger text-danger` in place of whatever its index would have
 * derived, and the a11y gate never sees `danger` text on `bg`/`card` here:
 * only the circle's border and glyph carry the color, never the label.
 */
export const Error: Story = {
  render: () => (
    <LeafPair
      web={
        <StepperWeb.Root defaultActiveStep={1}>
          <StepperWeb.Step label="Account" />
          <StepperWeb.Step label="Profile" />
          <StepperWeb.Step label="Review" status="error" />
          <StepperWeb.Step label="Done" />
        </StepperWeb.Root>
      }
      native={
        <StepperNative.Root defaultActiveStep={1}>
          <StepperNative.Step label="Account" />
          <StepperNative.Step label="Profile" />
          <StepperNative.Step label="Review" status="error" />
          <StepperNative.Step label="Done" />
        </StepperNative.Root>
      }
    />
  ),
};

/**
 * `linear={false}` drops the "no skipping ahead" rule entirely — every step,
 * whatever its status, becomes clickable/pressable. Look for "Done", two
 * steps past the active one, rendering as a button/Pressable here where the
 * default story leaves it a plain `div`/`View`.
 */
export const NonLinear: Story = {
  args: { linear: false },
};

/**
 * `interactive={false}`, the default — a Stepper that only ever DISPLAYS
 * progress, driven by whatever else on the page moves `activeStep` (a "Next"
 * button elsewhere). Every step renders as a plain `div`/`View`, none of them
 * focusable, because a Stepper that looks clickable and does nothing is worse
 * than one that plainly does not.
 */
export const Static: Story = {
  args: { interactive: false },
};
