import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Text, View } from 'react-native';

import { Select as SelectWeb } from '@design-system/select/select.web.tsx';
import { Select as SelectNative } from '@design-system/select/select.native.tsx';
import type { SelectOption, SelectValue } from '@design-system/select/select.props.ts';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const CHAPTERS = [
  { value: 'ch7', label: 'Chapter 7 — liquidation' },
  { value: 'ch13', label: 'Chapter 13 — repayment plan' },
  { value: 'ch11', label: 'Chapter 11 — reorganisation' },
  { value: 'ch12', label: 'Chapter 12 — family farmer', disabled: true },
] satisfies readonly SelectOption[];

/**
 * Args live on the shared surface (`select.props.ts`): both leaves take
 * `onValueChange`, so unlike Button no bridging name is needed. `defaultValue`
 * gets no control — it seeds UNCONTROLLED state, so twiddling it after mount
 * would change nothing and a control that does nothing teaches the wrong
 * lesson about the prop.
 */
type SelectArgs = {
  options: readonly SelectOption[];
  placeholder: string;
  disabled: boolean;
  defaultValue: SelectValue;
  onValueChange: (next: string) => void;
};

const meta = {
  title: 'Components/Select',
  component: SelectWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    options: CHAPTERS,
    placeholder: 'Choose a chapter',
    disabled: false,
    defaultValue: null,
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <LabelledWeb
          options={args.options}
          placeholder={args.placeholder}
          disabled={args.disabled}
          defaultValue={args.defaultValue}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <LabelledNative
          options={args.options}
          placeholder={args.placeholder}
          disabled={args.disabled}
          defaultValue={args.defaultValue}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<SelectArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The play walks the whole select-only-combobox contract in each pane: click
 * opens the listbox, arrows move the highlight (click-open highlights nothing,
 * so two ArrowDowns land on the second option), Enter commits it, the list
 * closes and the trigger shows the choice. The keyboard grammar itself is
 * unit-tested in `select.props.test.ts`; this proves each LEAF's wiring of it.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: open, arrow to an option, commit', async () => {
      await userEvent.click(web.getByRole('combobox'));
      await expect(web.getByRole('listbox')).toBeVisible();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      // Call COUNTS, not just lastCalledWith — the two panes share one fn()
      // arg, so a pane that silently drops its keystrokes would otherwise be
      // vouched for by the other pane's earlier call.
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('ch13');
      await waitFor(() => expect(web.queryByRole('listbox')).not.toBeInTheDocument());
      await expect(web.getByRole('combobox')).toHaveTextContent('Chapter 13 — repayment plan');
    });

    await step('native leaf: arrows move the highlight, a press commits', async () => {
      const trigger = native.getByRole('combobox');
      await userEvent.click(trigger);
      await expect(native.getByRole('listbox')).toBeVisible();
      // Focused explicitly: react-native-web's Pressable opens on the click
      // without taking focus from it, and `userEvent.keyboard` types into
      // whatever is focused.
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await expect(trigger.getAttribute('aria-activedescendant')).toMatch(/option-ch13$/);
      // Commit by PRESSING the option, not Enter — deliberately, twice over.
      // A press is the interaction a real native consumer has (a phone has no
      // arrow keys), and Enter currently trips a real leaf bug: react-native-web
      // synthesizes an onPress from the Enter key, so the commit's close is
      // immediately toggled back open by the trigger's own onPress. That fix is
      // a packages/ change with its own release; when it lands, this step
      // should go back to committing with {Enter} to pin it.
      await userEvent.click(native.getByRole('option', { name: 'Chapter 13 — repayment plan' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('ch13');
      await waitFor(() => expect(native.queryByRole('listbox')).not.toBeInTheDocument());
      await expect(native.getByRole('combobox')).toHaveTextContent('Chapter 13 — repayment plan');
    });
  },
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
 * So: open each list and look. The list must cover the description, the
 * button, and the second field. If it ever slides behind them again, this story
 * is the thing that shows it, in the leaf where it actually happened.
 *
 * The play exercises the web list, closes it, then leaves the NATIVE list open
 * — deliberately in that order, and deliberately not both. Both cannot be open
 * at once even by hand: the web leaf closes on any outside mousedown and the
 * native leaf closes on trigger blur, so opening the second always closes the
 * first. Ending open on the native side puts the leaf where the bug lived in
 * front of both the human eye and the axe pass, which runs AFTER the play and
 * so audits the open-listbox state on every CI run.
 */
/**
 * Assert the open list actually PAINTS over what is under it — not merely that
 * it is in the document.
 *
 * `toBeVisible()` cannot see this. It checks `display`, `visibility`, `opacity`
 * and attachment, all of which a list buried under a sibling still passes, so
 * the 0.7.1 stacking bug was free to return the moment the Select was wrapped
 * in a Field and nothing failed. axe has no opinion about paint order either.
 * `elementFromPoint` is the only instrument here that does, and it needs real
 * layout — which is why this lives in the browser-run workbench rather than
 * beside the leaf in jsdom, where it would silently pass forever.
 *
 * Sampled down the list rather than at one point: the bug hid the TOP of the
 * list under the paragraph and the middle under the submit button, while the
 * tail below both stayed clear. A single probe picks a winner by luck.
 */
function expectPaintsOnTop(list: HTMLElement): void {
  const box = list.getBoundingClientRect();
  const covered = [0.1, 0.35, 0.6, 0.85]
    .map((fraction) => {
      const y = box.top + box.height * fraction;
      const hit = document.elementFromPoint(box.left + box.width / 2, y);
      return hit?.closest('[role="listbox"]') ? null : `${Math.round(fraction * 100)}%`;
    })
    .filter(Boolean);

  if (covered.length > 0) {
    throw new Error(
      `The open listbox is painted OVER at ${covered.join(', ')} of its height. ` +
        'Something after the Field is on top of it — the 0.7.1 stacking bug. ' +
        "Check that Field.Root still elevates while its control is open (field.props.ts's `controlOpen`).",
    );
  }
}

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
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web list opens over the form, then closes', async () => {
      await userEvent.click(web.getByRole('combobox'));
      await expect(web.getByRole('listbox')).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(web.queryByRole('listbox')).not.toBeInTheDocument());
    });

    await step('native list opens and STAYS open for axe and the eye', async () => {
      await userEvent.click(native.getByRole('combobox'));
      await expect(native.getByRole('listbox')).toBeVisible();
      expectPaintsOnTop(native.getByRole('listbox'));
    });
  },
};

/**
 * Disabled is asserted, not clicked: the web trigger is a real disabled
 * `<button>`, the native one can only speak ARIA through react-native-web.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('combobox')).toBeDisabled();
    await expect(native.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
  },
};

export const WithSelection: Story = {
  args: { defaultValue: 'ch13' },
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
