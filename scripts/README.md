# scripts

Three entry points a human runs, three gates CI runs, and a deliberate refusal
to add more.

| Script | What it does |
|---|---|
| [`dev-setup.sh`](dev-setup.sh) | Checks Node against `engines.node`, then `npm ci`. `--check` reports without changing anything. |
| [`dev-up.sh`](dev-up.sh) | Starts the component workbench (Storybook) on `http://localhost:6006`. |
| [`capture-stories.ts`](capture-stories.ts) | Screenshots stories from the running workbench — both leaves, both schemes. Run as `npm run screenshots`. |
| [`check-skills.ts`](check-skills.ts) | Gates every `SKILL.md` in the repo. Run as `npm run skills:check`, part of `npm run ci`. |
| [`check-changelog.ts`](check-changelog.ts) | Gates each package's `CHANGELOG.md`, and prints a version's entry for the release notes. Run as `npm run changelog:check`, part of `npm run ci`. |
| [`check-artifacts.ts`](check-artifacts.ts) | Gates the packed tarballs. Run as `npm run artifacts:check`, by both CI workflows. |

None of the checks is a shortcut for anything a human types — they are checks,
reached through `npm run` like every other one. All live here rather than
beside what they check because all span the whole repository: `check-skills.ts`
walks every `SKILL.md`, `.claude/skills` included, which belongs to no package;
the other two work across both published packages. All run under plain `node`
with native type-stripping, like the token generator, and are typechecked by
[`tsconfig.scripts.json`](../tsconfig.scripts.json).

## The changelog gate, and why it is not diff-relative

`check-changelog.ts` completes the version-bump gate in `pr.yml` rather than
duplicating it. That one makes a changed package take a new version; this one
makes the new version say what a consumer gets, by requiring the **top** entry
in `packages/<name>/CHANGELOG.md` to be the version in the manifest.

It asks that question absolutely — no PR base, no git, no network — which is why
it runs identically in `npm run ci` and in CI. Composed with the bump gate the
property falls out, and neither gate has to know about the other.

It checks the `patch`/`minor` label against the version numbers themselves,
because under `0.x` caret rules that label is the one fact a consumer acts on:
`^0.12.0` resolves `<0.13.0`, so a minor does not arrive until someone widens
the range. A minor mislabelled as a patch is a documented failure here — a
consumer once sat five minors behind — so it is checkable and therefore checked.

`--section packages/<name>` prints the current version's entry. `publish.yml`
uses it for the GitHub Release body, so the changelog stays the single owner of
what a version says and the Release quotes it rather than growing a second
description free to drift.

## Merge gates and the release gate

`check-artifacts.ts` is the one check here that is not about whether a change
may merge. It asks whether the **tarball** is well-formed — every `exports`
target present, no tests leaked, every `.web.tsx`/`.native.tsx` pair intact —
by reading `npm pack --dry-run`, so `files` and its negations apply and what it
inspects is what a consumer would actually extract. Every other gate in this
repo runs against the working tree, where a file excluded from the tarball still
looks fine.

That difference is why it runs in **both** workflows. `pr.yml` runs it so a
malformed artifact is found on the PR. `publish.yml` runs it in the same job as
`npm publish`, immediately before it, and that is the copy that matters: a merge
gate that fails costs one more commit, but GitHub Packages will not let a bad
publish be taken back. The version is burned and anyone who installed in between
has it.

It is not part of `npm run ci` — it shells out to `npm pack` twice, and the
local gate is the fast inner loop.

```bash
./scripts/dev-setup.sh
```

```bash
./scripts/dev-up.sh
```

## Capturing a story, and why that earns a script

`capture-stories.ts` is the third human entry point, and it is here rather than
in a contributor's shell history because the evidence it produces is *required*:
`design-system-pr` makes every visual change owe a screenshot of both leaves,
in both schemes when colour moved. That is the one check no test performs, so
the cost of producing it by hand is paid on exactly the PRs that most need it.

```bash
./scripts/dev-up.sh                                  # in one terminal
npm run screenshots -- slider IconButton --sheet wave # in another
```

A target is a story id, a component, or a title, and a component target takes
all of its stories. `--sheet <name>` writes one composite image with light
beside dark, which is what belongs in a PR body — one attachment rather than a
dozen. Output lands in `.screenshots/`, which is gitignored on purpose: a
screenshot committed to a branch dies when the branch does, and
[`design-system-pr`](../.claude/skills/design-system-pr/SKILL.md) records the
merged PR whose seven images that already destroyed. Upload them as repository
attachments instead; that skill owns the how.

Three details it exists to get right, all of which were got wrong by hand
first: Storybook ids do **not** split camelCase (`Forms/IconButton` is
`forms-iconbutton`), so targets are resolved against the workbench's own
`index.json` and a miss lists the candidates; `#storybook-root` fills the
viewport, so the capture is clipped to the union of what actually painted
rather than being a strip on a tall empty canvas; and a story renders in ONE
scheme per load, so each is loaded once per scheme through the same `scheme`
global the Scheme toolbar drives.

It needs the workbench running and says so when it is not. It drives the dev
server rather than building a static Storybook, which would add a minute to
every run, and it adds no dependency — Playwright is already here because the
a11y gate runs stories in a real browser.

## No `dev-test.sh`, deliberately

The consumer repo has one per service, because there "run the tests the way CI
does" means remembering ruff, then mypy, then pytest, in order, with flags.
Here it is already one command:

```bash
npm run ci
```

That is token drift → format → lint → all three typecheck programs → tests, in
the order `.github/workflows/pr.yml` runs them. A script wrapping it would be a
second name for the same thing, and a second place to forget to update.

## No registry token needed

Unlike the consumer repo, nothing here needs a GitHub Packages token.
`@insolvia-ai/tokens` is a workspace member that npm links from source, and
every other dependency is public. Auth is only required to *install* these
packages, which is documented where that happens.

## What the workbench is for

`dev-up.sh` is not a dev server for an app — there is no app here. It renders
**both leaves** of each component side by side: the `.web` leaf a web
consumer resolves, and the `.native` leaf a React Native consumer resolves. That comparison exists
nowhere else in either repo, and it is the only instrument that catches the
class of bug the tests structurally cannot see — wrong colour, wrong place,
painted underneath something. The 0.7.1 Select fix came from a bug report that
opens "invisible to every test in this package".

Read [`.storybook/main.ts`](../.storybook/main.ts) before changing the setup;
it explains why the React Native Web framework is what renders both leaves, and
[`workbench/react-native.ts`](../workbench/react-native.ts) explains the one
export the workbench substitutes and why.
