# scripts

Two entry points a human runs, two gates CI runs, and a deliberate refusal to
add more.

| Script | What it does |
|---|---|
| [`dev-setup.sh`](dev-setup.sh) | Checks Node against `engines.node`, then `npm ci`. `--check` reports without changing anything. |
| [`dev-up.sh`](dev-up.sh) | Starts the component workbench (Storybook) on `http://localhost:6006`. |
| [`check-skills.ts`](check-skills.ts) | Gates every `SKILL.md` in the repo. Run as `npm run skills:check`, part of `npm run ci`. |
| [`check-artifacts.ts`](check-artifacts.ts) | Gates the packed tarballs. Run as `npm run artifacts:check`, by both CI workflows. |

Neither check is a shortcut for anything a human types — they are checks,
reached through `npm run` like every other one. Both live here rather than
beside what they check because both span the whole repository: `check-skills.ts`
walks every `SKILL.md`, `.claude/skills` included, which belongs to no package;
`check-artifacts.ts` packs both published packages. Both run under plain `node`
with native type-stripping, like the token generator, and are typechecked by
[`tsconfig.scripts.json`](../tsconfig.scripts.json).

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
