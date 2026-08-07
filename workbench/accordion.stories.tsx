import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent } from 'storybook/test';

import { Accordion as AccordionWeb } from '@design-system/accordion/accordion.web.tsx';
import { Accordion as AccordionNative } from '@design-system/accordion/accordion.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const CHAPTERS = [
  {
    value: 'ch7',
    trigger: 'Chapter 7 — liquidation',
    panel:
      'A trustee sells non-exempt assets to pay creditors; most cases close in three to five months.',
  },
  {
    value: 'ch13',
    trigger: 'Chapter 13 — repayment plan',
    panel:
      'The debtor keeps assets and repays creditors from income over a three- to five-year plan.',
  },
  {
    value: 'ch11',
    trigger: 'Chapter 11 — reorganisation',
    panel:
      'Typically a business continues operating while it renegotiates debts under court supervision.',
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
  title: 'Components/Accordion',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: ['ch13'],
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
        <ChaptersAccordionWeb defaultValue={args.defaultValue} openMultiple={args.openMultiple} />
      }
      native={
        <ChaptersAccordionNative
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
 * chapters, three different names, keeps this green; reusing "Details" for
 * every item would not.
 *
 * The play opens a SECOND chapter alongside the one `defaultValue` already
 * opens — `openMultiple` defaults to `true`, so both stay open — and checks
 * each leaf reports it the way its own a11y wiring does: `aria-expanded` on
 * the trigger in both, a named `region` landmark on the web panel (native has
 * no such role — the panel is a plain, unmounted-when-closed `View`, checked
 * by its text instead).
 */
export const Basic: Story = {
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: opening a second chapter leaves both expanded', async () => {
      const ch7 = web.getByRole('button', { name: 'Chapter 7 — liquidation' });
      await userEvent.click(ch7);
      await expect(ch7).toHaveAttribute('aria-expanded', 'true');
      await expect(web.getByRole('region', { name: 'Chapter 7 — liquidation' })).toBeVisible();
      // Chapter 13, opened by `defaultValue`, is still open too.
      await expect(
        web.getByRole('button', { name: 'Chapter 13 — repayment plan' }),
      ).toHaveAttribute('aria-expanded', 'true');
    });

    await step('native leaf: same toggle, reported through accessibilityState', async () => {
      const ch7 = native.getByRole('button', { name: 'Chapter 7 — liquidation' });
      await userEvent.click(ch7);
      await expect(ch7).toHaveAttribute('aria-expanded', 'true');
      await expect(
        native.getByText(
          'A trustee sells non-exempt assets to pay creditors; most cases close in three to five months.',
        ),
      ).toBeVisible();
    });
  },
};

/**
 * `openMultiple` defaults to `true` — `Basic` above already exercises that
 * by leaving room to open a second chapter alongside Chapter 13. This story
 * is the other end: `openMultiple={false}` means opening one item closes
 * whichever was open, so at most one chapter's detail is ever visible. The
 * play opens Chapter 13 and checks Chapter 7 (open by `defaultValue`) closes
 * with it, in both leaves.
 */
export const SingleOpen: Story = {
  name: 'Single open (openMultiple=false)',
  args: { defaultValue: ['ch7'], openMultiple: false },
  render: (args) => (
    <LeafPair
      note="openMultiple={false} — opening a chapter here closes whichever one was open. Try opening a second one."
      web={
        <ChaptersAccordionWeb defaultValue={args.defaultValue} openMultiple={args.openMultiple} />
      }
      native={
        <ChaptersAccordionNative
          defaultValue={args.defaultValue}
          openMultiple={args.openMultiple}
        />
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: opening Chapter 13 closes Chapter 7', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Chapter 13 — repayment plan' }));
      await expect(
        web.getByRole('button', { name: 'Chapter 13 — repayment plan' }),
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(web.getByRole('button', { name: 'Chapter 7 — liquidation' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    await step('native leaf: same exclusivity', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Chapter 13 — repayment plan' }));
      await expect(
        native.getByRole('button', { name: 'Chapter 13 — repayment plan' }),
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(native.getByRole('button', { name: 'Chapter 7 — liquidation' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  },
};

function ChaptersAccordionWeb({
  defaultValue,
  openMultiple,
}: {
  defaultValue: string[];
  openMultiple: boolean;
}) {
  return (
    <AccordionWeb.Root defaultValue={defaultValue} openMultiple={openMultiple}>
      {CHAPTERS.map((c) => (
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

function ChaptersAccordionNative({
  defaultValue,
  openMultiple,
}: {
  defaultValue: string[];
  openMultiple: boolean;
}) {
  return (
    <AccordionNative.Root defaultValue={defaultValue} openMultiple={openMultiple}>
      {CHAPTERS.map((c) => (
        <AccordionNative.Item key={c.value} value={c.value}>
          <AccordionNative.Header>
            <AccordionNative.Trigger>{c.trigger}</AccordionNative.Trigger>
          </AccordionNative.Header>
          <AccordionNative.Panel>{c.panel}</AccordionNative.Panel>
        </AccordionNative.Item>
      ))}
    </AccordionNative.Root>
  );
}
