---
name: design-system-screenshots
description: >-
  Contributor. How to SEE a component and capture it — both leaves, both colour
  schemes — using `npm run screenshots`. Use this whenever a task needs a
  picture of what a component looks like: "screenshot the new component",
  "show me both leaves", "attach evidence to the PR", "does this look right in
  dark mode", or any visual change to packages/design-system, workbench/ or the
  tokens that paint them. Read it BEFORE driving Storybook by hand or writing
  throwaway Playwright — there is a script, and it already solves the three
  things that go wrong: Storybook story ids do not split camelCase, a naive
  capture is mostly empty canvas, and a story renders in only ONE scheme per
  page load. Pair it with `design-system-pr`, which owns getting the resulting
  image into GitHub.
metadata:
  internal: true
---

# Capturing a component

Everything else in this repo is blind. Vitest renders into jsdom and asserts on
roles and labels; tsc checks types. Neither can see that something is the wrong
colour, in the wrong place, or painted underneath the thing below it — and that
last one shipped as the 0.7.1 Select bug. The workbench is the only instrument
that sees, and this is how you point it at something.

## The command

```bash
./scripts/dev-up.sh
```

Leave that running. Then, in another terminal:

```bash
npm run screenshots -- slider IconButton --sheet media-wave
```

Targets are a story id (`forms-slider--buffered`), a component (`slider`,
`IconButton`, `toggle-group`), or a title (`Forms/Slider`). A component target
takes every story it has. Output lands in `.screenshots/`.

| Flag | What it does |
|---|---|
| `--sheet <name>` | Also writes `<name>.png` — one composite, light beside dark. This is what goes in a PR body. |
| `--scheme light\|dark\|both` | Default `both`. |
| `--list` | Print every story id and exit. |
| `--out <dir>` | Default `.screenshots/`. |
| `--url <url>` | Default `http://localhost:6006`. |

## Read the image before you attach it

The script produces evidence, it does not evaluate it. **Look at what came
back** — that is the entire point of the exercise, and an unexamined screenshot
attached to a PR is worse than none, because it claims a check that nobody
performed.

What you are looking for, in order:

1. **Do the two leaves agree?** They are two implementations of one design, and
   the workbench putting them side by side is the only place that claim is
   checkable at all.
2. **Does the dark tile differ from the light one in the ways it should, and
   only those?** A role that did not move when the scheme did is usually a
   hard-coded colour in a native leaf — those must resolve the scheme at RENDER
   time, never `colors.light` at module load.
3. **Is anything clipped, overlapping, or invisible?**

When the two leaves genuinely disagree, find out whether that is known before
reporting it as a regression. Some divergences are documented in the story
itself — `workbench/button.stories.tsx` explains at length why its `Wrapping`
story's top row differs between platforms, and it is the argument for the prop
rather than a bug. Read the story's doc comment first.

Beware of reading a **story's own scaffolding** as a component divergence. A
story that stands in for media or a backdrop often does so differently per
platform (a CSS gradient on web, a flat `backgroundColor` on native). The
component is what you are inspecting; the tile around it is not.

## Getting it into a PR

`design-system-pr` owns that, including the token-based upload, the 404 that
makes a successful upload look broken, and why pushing images to a branch has
already destroyed one merged PR's evidence. Do not commit captures —
`.screenshots/` is gitignored for that reason.

## When the script is not enough

It captures static stories. It cannot capture a hover, a focus ring, or an open
overlay, because those need interaction before the shot. If that is what the
change is about, drive the page yourself with the browser tools against the
same running workbench, and say in the PR body that the capture was manual.

Two limits worth knowing: there is **no visual-regression tooling here**, so
nothing compares a capture to the previous release — the image is a record, not
a gate. And react-native-web is not a device: the native leaf you are looking at
is what a *web* consumer of that leaf renders, so anything genuinely
platform-specific (`hitSlop`, a `pointer: coarse` media query) cannot be
verified this way. Say so rather than implying it was checked.
