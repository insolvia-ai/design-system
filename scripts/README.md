# scripts

Two scripts, and a deliberate refusal to add more.

| Script | What it does |
|---|---|
| [`dev-setup.sh`](dev-setup.sh) | Checks Node against `engines.node`, then `npm ci`. `--check` reports without changing anything. |
| [`dev-up.sh`](dev-up.sh) | Starts the component workbench (Storybook) on `http://localhost:6006`. |

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
**both leaves** of each component side by side: the `.web` leaf marketing
ships, and the `.native` leaf the Expo app ships. That comparison exists
nowhere else in either repo, and it is the only instrument that catches the
class of bug the tests structurally cannot see — wrong colour, wrong place,
painted underneath something. The 0.7.1 Select fix came from a bug report that
opens "invisible to every test in this package".

Read [`.storybook/main.ts`](../.storybook/main.ts) before changing the setup;
it explains why the React Native Web framework is what renders both leaves, and
[`workbench/react-native.ts`](../workbench/react-native.ts) explains the one
export the workbench substitutes and why.
