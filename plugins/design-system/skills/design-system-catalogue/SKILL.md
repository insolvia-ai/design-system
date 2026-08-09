---
name: design-system-catalogue
description: >-
  Consumer. Find the right component in @insolvia-ai/design-system and call it
  the way the package expects — the five shelves it is organised into, compound
  components that export their parts under one name, the controlled and
  uncontrolled pair every input supports, why Field composes with Input rather
  than rendering one, and which of the four date surfaces to reach for. Use
  before writing a screen with these components, when unsure whether the
  package already has something, when a compound part cannot be imported, and
  when choosing between DateInput, DatePicker, Calendar and Wheel.
---

# Choosing and calling a component

## Where the catalogue actually lives

Two sources, both authoritative, neither of them this file:

- **`node_modules/@insolvia-ai/design-system/README.md`** — ships in the
  tarball, so it matches the version you installed exactly. Read it for the
  full component list and the reasoning behind each shelf.
- **The published workbench**, <https://insolvia-ai.github.io/design-system/> —
  every component rendered with its **web leaf and native leaf side by side**,
  with its props documented. It is the only place the two implementations
  can be compared, and the only check that catches wrong colour, wrong
  position, or one element painted under another.

Reach for the README first when the question is "does this exist and what is it
called", and the workbench when the question is "what does it look like".

This skill deliberately does not restate the component list. A second copy of
the catalogue would drift from the one that ships.

## The five shelves

Components are shelved by what you reach for them **for**, and the workbench
sidebar uses the same five groups in the same order:

| Shelf | What lives there |
| --- | --- |
| **Data display** | What shows something — accordions, alerts, avatars, badges, cards, tables, tabs, text, progress and meters. |
| **Overlays** | What floats above the page — dialogs, drawers, dropdowns, popovers, sidebars, toasts, tooltips. |
| **Forms** | What takes input — buttons, checkboxes, comboboxes, fields, inputs, selects, switches, textareas, toggles. |
| **Dates** | The four date surfaces. See below. |
| **Layout** | Page furniture — footer, nav bar, separator. |

Everything is exported from the package root. There are no deep import paths to
learn:

```tsx
import { Button, Dialog, Field, Input } from '@insolvia-ai/design-system';
```

## Two conventions that run through everything

**Compound components export their parts under one name.** There is no
`DialogTrigger` export; it is `Dialog.Trigger`.

```tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>…</Dialog.Content>
</Dialog.Root>
```

If a part will not import, you are almost certainly reaching for it as a
top-level export. Import the parent and read the part off it.

**Every input-taking component supports both modes.** Uncontrolled through
`default*`, controlled through the value prop plus its change callback. Pick
one; supplying both is the usual cause of a component that will not update.

```tsx
<Select defaultValue="eur" />
<Select value={value} onValueChange={setValue} />
```

## Field composes with a control — it does not render one

`Field.Control` **does not render a control.** Put one inside the field, and it
reads the field's id, name, description and invalid state from context:

```tsx
<Field.Root name="callsign" invalid={hasError}>
  <Field.Label>Callsign</Field.Label>
  <Input />
  <Field.Error>Required</Field.Error>
</Field.Root>
```

`Field.Control` remains as the escape hatch for a control this package does
*not* own, and takes it through a required `render` prop —
`<Field.Control render={<TheirInput />} />` — because a third-party widget
cannot read the field context itself.

A bare `<Field.Control />` is a type error naming its replacement.

## The four date surfaces

`DateInput` is the one most callers want: a masked text field with a button that
opens a picker.

- **`DateInput`** — the field. `picker="wheels"` (default) or
  `picker="calendar"` chooses the instrument; they are alternatives, never both
  at once. `mode="date" | "time" | "datetime"` and `format` control what it
  accepts and how it reads, while it still stores one ISO value.
- **`DatePicker`** — the wheels alone, for a surface that is already a picker.
- **`Calendar`** — the month grid alone, same situation.
- **`Wheel`** — the scrolling column underneath.

Choosing between the two instruments: typing wins for a date the user already
knows, the grid wins whenever the weekday matters, and the wheels are the only
one that can express a time — so `time` and `datetime` use them whatever
`picker` says.

`DateInput`'s change callback takes a second argument, a status. An empty string
alone cannot distinguish "cleared" from "still typing", and an autosaving caller
that ignores the status will wipe saved dates on that ambiguity.

## What is deliberately absent

Desktop-menu surfaces (menubar, navigation menu), preview card, number field,
scroll area and context menu are not in the package: each needs a desktop-first
interaction model with no touch counterpart. Don't wait for them — compose from
what is there, or raise it upstream.
