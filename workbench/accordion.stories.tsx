import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Accordion as AccordionWeb } from '@design-system/accordion/accordion.web.tsx';
import { Accordion as AccordionNative } from '@design-system/accordion/accordion.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Accordion',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

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
 * Every trigger label below is distinct. The web `Panel` is
 * `role="region" aria-labelledby={triggerId}` — a landmark — and a duplicate
 * role+name across landmarks is what `landmark-unique` fires on. Three
 * chapters, three different names, keeps this green; reusing "Details" for
 * every item would not.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      web={
        <AccordionWeb.Root defaultValue={['ch13']}>
          {CHAPTERS.map((c) => (
            <AccordionWeb.Item key={c.value} value={c.value}>
              <AccordionWeb.Header>
                <AccordionWeb.Trigger>{c.trigger}</AccordionWeb.Trigger>
              </AccordionWeb.Header>
              <AccordionWeb.Panel>{c.panel}</AccordionWeb.Panel>
            </AccordionWeb.Item>
          ))}
        </AccordionWeb.Root>
      }
      native={
        <AccordionNative.Root defaultValue={['ch13']}>
          {CHAPTERS.map((c) => (
            <AccordionNative.Item key={c.value} value={c.value}>
              <AccordionNative.Header>
                <AccordionNative.Trigger>{c.trigger}</AccordionNative.Trigger>
              </AccordionNative.Header>
              <AccordionNative.Panel>{c.panel}</AccordionNative.Panel>
            </AccordionNative.Item>
          ))}
        </AccordionNative.Root>
      }
    />
  ),
};

/**
 * `openMultiple` defaults to `true` — `Default` above already exercises that
 * by leaving room to open a second chapter alongside Chapter 13. This story
 * is the other end: `openMultiple={false}` means opening one item closes
 * whichever was open, so at most one chapter's detail is ever visible.
 */
export const SingleOpen: Story = {
  name: 'Single open (openMultiple=false)',
  render: () => (
    <LeafPair
      note="openMultiple={false} — opening a chapter here closes whichever one was open. Try opening a second one."
      web={
        <AccordionWeb.Root defaultValue={['ch7']} openMultiple={false}>
          {CHAPTERS.map((c) => (
            <AccordionWeb.Item key={c.value} value={c.value}>
              <AccordionWeb.Header>
                <AccordionWeb.Trigger>{c.trigger}</AccordionWeb.Trigger>
              </AccordionWeb.Header>
              <AccordionWeb.Panel>{c.panel}</AccordionWeb.Panel>
            </AccordionWeb.Item>
          ))}
        </AccordionWeb.Root>
      }
      native={
        <AccordionNative.Root defaultValue={['ch7']} openMultiple={false}>
          {CHAPTERS.map((c) => (
            <AccordionNative.Item key={c.value} value={c.value}>
              <AccordionNative.Header>
                <AccordionNative.Trigger>{c.trigger}</AccordionNative.Trigger>
              </AccordionNative.Header>
              <AccordionNative.Panel>{c.panel}</AccordionNative.Panel>
            </AccordionNative.Item>
          ))}
        </AccordionNative.Root>
      }
    />
  ),
};
