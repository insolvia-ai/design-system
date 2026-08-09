# Changelog — `@insolvia-ai/tokens`

Every version that reached the registry, newest first. This file ships **inside
the package**, so it can be read at `node_modules/@insolvia-ai/tokens/CHANGELOG.md`
without leaving the consuming project.

**Read the release type before the entry.** These are `0.x` packages, and npm's
caret rules for `0.x` are narrower than they look: `^0.2.0` resolves
`>=0.2.0 <0.3.0`. So a **patch** arrives on your next install, and a **minor**
does not arrive at all until the range is widened where the dependency is
declared. Every minor below says so.

Each entry links the pull request that shipped it. The entry is what changed;
the PR is why, what was rejected, and how it was verified.

> `0.1.x` is absent because it was never published — the package was
> `private: true` while every consumer resolved it from the same workspace.

## 0.3.1 — patch

- **This file, and it now ships inside the package.** `CHANGELOG.md` is listed
  in `files`, so it can be read at
  `node_modules/@insolvia-ai/tokens/CHANGELOG.md` without leaving the consuming
  project. npm does not include a changelog automatically; before this, the
  tarball carried `src/`, `tokens.json`, `README.md` and `package.json` and
  nothing else.
- Entries are backfilled to 0.2.0, the first published version.
- Each published version now also gets a git tag and a GitHub Release.
- No token value changed.

## 0.3.0 — minor

**Widen your range to take this:** `^0.2.x` will not resolve it.

- New palette entries `dangerBright` (`#E27F79`) and `successBright` (`#39B17E`),
  aliased from the **dark scheme only**. The light scheme is byte-identical to
  0.2.2.
- Fixes a real accessibility defect rather than a preference: `danger` and
  `success` had aliased the same palette value in both schemes, and a
  mid-lightness hue that clears WCAG AA on a paper surface cannot clear it on a
  deep one. Measured at 14px, `danger` was **2.9:1** and `success` **3.5:1**
  against a 4.5:1 floor.
- Both new values clear 4.5:1 against **all three** dark surfaces — background,
  card and the worst case, `surfaceAlt` (`#0B2A4A`), where they land at 5.2 and
  5.4. A semantic colour does not know which surface it lands on, so measuring
  against the background alone would have been the same mistake in a new place.

[#10](https://github.com/insolvia-ai/design-system/pull/10)

## 0.2.2 — patch

- Documentation only; **no token value changed**. The `fonts` comment now states
  that the family stack is authored for the web surfaces, that React Native
  resolves a single registered family rather than a stack — so the native leaves
  map the heading role onto each platform's own serif — and that no font file
  ships from here. Registering one is the consuming app's job.

[#2](https://github.com/insolvia-ai/design-system/pull/2)

## 0.2.1 — patch

- Documentation only; **no token value changed**. Token descriptions and the
  generator's output banners no longer describe the repository this package was
  extracted from.

[#1](https://github.com/insolvia-ai/design-system/pull/1)

## 0.2.0 — minor

First published version. Through `0.1.x` this package was `private: true`,
because every consumer resolved it from the same workspace by symlink and there
was nothing to publish. Consumers are across a repository boundary now, so the
registry is the only way to reach them.

- Adds `src/colors.json`. Node refuses to strip types for any file under
  `node_modules`, so a plain-`node` script in a consuming project cannot import
  `tokens.ts` at all; the JSON is the escape hatch for tools with no compiler.
- The generator loses its third output, which used to write into a directory
  belonging to a consumer. A published package cannot depend on a consumer's
  layout, so that half stays behind and is reconciled against the published
  tokens instead.
