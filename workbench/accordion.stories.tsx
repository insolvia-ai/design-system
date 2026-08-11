import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent } from 'storybook/test';

import { Accordion as AccordionWeb } from '@design-system/accordion/accordion.web.tsx';
import { Accordion as AccordionNative } from '@design-system/accordion/accordion.native.tsx';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';
import { Input as InputWeb } from '@design-system/input/input.web.tsx';
import { Input as InputNative } from '@design-system/input/input.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { MutedText } from './ink-text.tsx';

const STARSHIPS = [
  {
    value: 'xwing',
    trigger: 'X-wing — starfighter',
    panel: 'A single-seat fighter with S-foils that lock into attack position before a run.',
  },
  {
    value: 'freighter',
    trigger: 'YT-1300 — light freighter',
    panel: 'A stock Corellian hauler, modified well past its original specification for speed.',
  },
  {
    value: 'destroyer',
    trigger: 'Star Destroyer — capital ship',
    panel: 'A wedge-shaped capital ship, over a mile long, built to be seen before it is fought.',
  },
] as const;

/**
 * Args cover the accordion's only two external knobs, both from
 * `accordion.props.ts`. There is no `onChange`-shaped arg here the way
 * Select/Dialog/Collapsible have one: `AccordionRootOwnProps` is
 * uncontrolled-only — `defaultValue` seeds the open set and nothing lets a
 * caller drive it from outside — so no `fn()` handler exists to wire up.
 * `defaultValue` itself gets no control, for the same reason as Select's:
 * it seeds state at mount, and a control that "changes" it afterwards would
 * do nothing visible.
 *
 * No meta `component` either — `Accordion` is a parts object
 * (Root/Item/Header/Trigger/Panel), the same reason `dialog.stories.tsx` has
 * none.
 */
type AccordionArgs = {
  defaultValue: string[];
  openMultiple: boolean;
};

const meta = {
  title: 'Data display/Accordion',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: ['freighter'],
    openMultiple: true,
  },
  argTypes: {
    // Seeds which items start open; uncontrolled, so twiddling this after
    // mount changes nothing already on screen — same reasoning as Select's
    // `defaultValue`.
    defaultValue: { control: false },
    openMultiple: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={
        <StarshipsAccordionWeb defaultValue={args.defaultValue} openMultiple={args.openMultiple} />
      }
      native={
        <StarshipsAccordionNative
          defaultValue={args.defaultValue}
          openMultiple={args.openMultiple}
        />
      }
    />
  ),
} satisfies Meta<AccordionArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every trigger label below is distinct. The web `Panel` is
 * `role="region" aria-labelledby={triggerId}` — a landmark — and a duplicate
 * role+name across landmarks is what `landmark-unique` fires on. Three
 * ships, three different names, keeps this green; reusing "Details" for
 * every item would not.
 *
 * The play opens a SECOND ship alongside the one `defaultValue` already
 * opens — `openMultiple` defaults to `true`, so both stay open — and checks
 * each leaf reports it the way its own a11y wiring does: `aria-expanded` on
 * the trigger in both, a named `region` landmark on the web panel (native has
 * no such role — the panel is a plain, unmounted-when-closed `View`, checked
 * by its text instead).
 */
export const Basic: Story = {
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: opening a second ship leaves both expanded', async () => {
      const xwing = web.getByRole('button', { name: 'X-wing — starfighter' });
      await userEvent.click(xwing);
      await expect(xwing).toHaveAttribute('aria-expanded', 'true');
      await expect(web.getByRole('region', { name: 'X-wing — starfighter' })).toBeVisible();
      // YT-1300, opened by `defaultValue`, is still open too.
      await expect(web.getByRole('button', { name: 'YT-1300 — light freighter' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    await step('native leaf: same toggle, reported through accessibilityState', async () => {
      const xwing = native.getByRole('button', { name: 'X-wing — starfighter' });
      await userEvent.click(xwing);
      await expect(xwing).toHaveAttribute('aria-expanded', 'true');
      await expect(
        native.getByText(
          'A single-seat fighter with S-foils that lock into attack position before a run.',
        ),
      ).toBeVisible();
    });
  },
};

/**
 * `openMultiple` defaults to `true` — `Basic` above already exercises that
 * by leaving room to open a second ship alongside the YT-1300. This story
 * is the other end: `openMultiple={false}` means opening one item closes
 * whichever was open, so at most one ship's detail is ever visible. The
 * play opens the YT-1300 and checks the X-wing (open by `defaultValue`) closes
 * with it, in both leaves.
 */
export const SingleOpen: Story = {
  name: 'Single open (openMultiple=false)',
  args: { defaultValue: ['xwing'], openMultiple: false },
  render: (args) => (
    <LeafPair
      note="openMultiple={false} — opening a ship here closes whichever one was open. Try opening a second one."
      web={
        <StarshipsAccordionWeb defaultValue={args.defaultValue} openMultiple={args.openMultiple} />
      }
      native={
        <StarshipsAccordionNative
          defaultValue={args.defaultValue}
          openMultiple={args.openMultiple}
        />
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: opening the YT-1300 closes the X-wing', async () => {
      await userEvent.click(web.getByRole('button', { name: 'YT-1300 — light freighter' }));
      await expect(web.getByRole('button', { name: 'YT-1300 — light freighter' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await expect(web.getByRole('button', { name: 'X-wing — starfighter' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    await step('native leaf: same exclusivity', async () => {
      await userEvent.click(native.getByRole('button', { name: 'YT-1300 — light freighter' }));
      await expect(
        native.getByRole('button', { name: 'YT-1300 — light freighter' }),
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(native.getByRole('button', { name: 'X-wing — starfighter' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  },
};

/**
 * PERMANENT REGRESSION STORY (0.15.0). A panel holding a form control rather
 * than prose.
 *
 * The native panel used to force-wrap every child in a `Text`. On a device
 * that nesting is invalid outright; through react-native-web it failed
 * quietly, which is why it survived so long — the wrapper carries
 * `display: inline` and sets the text-ancestor context, so the field's layout
 * collapsed into inline flow and its label came out as a `<span>` inheriting
 * the panel's muted colour instead of keeping its own.
 *
 * Both panes must show the same thing: a label above a full-width box, ink on
 * the label, not muted. That is a difference no jsdom assertion can see, which
 * is exactly what this story is for — keep it after the bug feels ancient.
 */
export const PanelHoldsAControl: Story = {
  name: 'Panel holds a control',
  render: () => (
    <LeafPair
      note="A panel is a container, not a paragraph. Both panes should lay the field out identically, with the label in ink rather than the panel's muted colour."
      web={
        <AccordionWeb.Root defaultValue={['berth']}>
          <AccordionWeb.Item value="berth">
            <AccordionWeb.Header>
              <AccordionWeb.Trigger>Berth assignment</AccordionWeb.Trigger>
            </AccordionWeb.Header>
            <AccordionWeb.Panel>
              <FieldWeb.Root name="berth-web">
                <FieldWeb.Label>Docking bay</FieldWeb.Label>
                <InputWeb placeholder="94" />
              </FieldWeb.Root>
            </AccordionWeb.Panel>
          </AccordionWeb.Item>
        </AccordionWeb.Root>
      }
      native={
        <AccordionNative.Root defaultValue={['berth']}>
          <AccordionNative.Item value="berth">
            <AccordionNative.Header>
              <AccordionNative.Trigger>Berth assignment</AccordionNative.Trigger>
            </AccordionNative.Header>
            <AccordionNative.Panel>
              <FieldNative.Root name="berth-native">
                <FieldNative.Label>Docking bay</FieldNative.Label>
                <InputNative placeholder="94" />
              </FieldNative.Root>
            </AccordionNative.Panel>
          </AccordionNative.Item>
        </AccordionNative.Root>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    // Typing is the proof that matters: a control the panel had turned into
    // inline text would still be FOUND by role, but it would not accept input
    // as its own labelled field. Ends expanded, so axe audits the open state.
    await step('web leaf: the field inside the panel takes input', async () => {
      const box = web.getByRole('textbox', { name: 'Docking bay' });
      await userEvent.type(box, '327');
      await expect(box).toHaveValue('327');
    });

    await step('native leaf: same field, same input', async () => {
      const box = native.getByRole('textbox', { name: 'Docking bay' });
      await userEvent.type(box, '327');
      await expect(box).toHaveValue('327');
    });
  },
};

function StarshipsAccordionWeb({
  defaultValue,
  openMultiple,
}: {
  defaultValue: string[];
  openMultiple: boolean;
}) {
  return (
    <AccordionWeb.Root defaultValue={defaultValue} openMultiple={openMultiple}>
      {STARSHIPS.map((c) => (
        <AccordionWeb.Item key={c.value} value={c.value}>
          <AccordionWeb.Header>
            <AccordionWeb.Trigger>{c.trigger}</AccordionWeb.Trigger>
          </AccordionWeb.Header>
          <AccordionWeb.Panel>{c.panel}</AccordionWeb.Panel>
        </AccordionWeb.Item>
      ))}
    </AccordionWeb.Root>
  );
}

function StarshipsAccordionNative({
  defaultValue,
  openMultiple,
}: {
  defaultValue: string[];
  openMultiple: boolean;
}) {
  return (
    <AccordionNative.Root defaultValue={defaultValue} openMultiple={openMultiple}>
      {STARSHIPS.map((c) => (
        <AccordionNative.Item key={c.value} value={c.value}>
          <AccordionNative.Header>
            <AccordionNative.Trigger>{c.trigger}</AccordionNative.Trigger>
          </AccordionNative.Header>
          {/* Native `Panel` is a bare `View` and styles nothing inside it; the
              web `Panel` mutes its prose by cascade. `MutedText` is what keeps
              the two panes the same colour. */}
          <AccordionNative.Panel>
            <MutedText>{c.panel}</MutedText>
          </AccordionNative.Panel>
        </AccordionNative.Item>
      ))}
    </AccordionNative.Root>
  );
}
