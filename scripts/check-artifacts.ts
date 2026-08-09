// RELEASE gate: is the tarball we are about to make permanent correct?
//
// This is a different question from the one the PR workflow's other gates ask,
// and the distinction is the reason this file exists rather than another step
// in pr.yml.
//
// A MERGE gate is diff-relative and addressed to the author — "you changed this
// package and left its version alone". It compares against a PR base, it only
// makes sense before a merge, and failing it costs one more commit.
//
// A RELEASE gate is absolute and addressed to the registry. It asks whether the
// artifact is well-formed, with no reference to what changed, and it is worth
// running at exactly the moment the artifact is built. Failing it after the
// fact costs a burned version: GitHub Packages does not let you take a publish
// back, so the only remedy is a forward bump and a consumer who fetched the bad
// one in between.
//
// So publish.yml runs this immediately before `npm publish`, and pr.yml runs it
// too — the PR copy is there so nobody first discovers a malformed tarball at
// release time, but the copy that BLOCKS is the one attached to the publish.
//
// Everything below reads `npm pack --dry-run`, never the working tree alone.
// That is the whole point: `files`, its negations, and any stray .npmignore all
// apply, so what this inspects is what a consumer would actually extract.
//
// Run with plain `node`, no loader and no build step, like the other scripts
// here: Node >=24 strips TypeScript types natively, so no `enum`, `namespace`
// or parameter properties (`erasableSyntaxOnly` in tsconfig.base.json enforces
// it, via tsconfig.scripts.json).
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');

// The published members, and only those. The root workspace is `private` and
// the plugin is not an npm package at all.
const PACKAGES = ['packages/tokens', 'packages/design-system'];

type Packed = { path: string };

// `npm pack --dry-run --json` writes the tarball manifest to stdout and its
// human summary to stderr, so stdout parses cleanly. --dry-run means no file is
// written; the file LIST is identical to a real pack.
function packedFiles(packageDir: string): string[] {
  const stdout = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packageDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const [pkg] = JSON.parse(stdout) as Array<{ files: Packed[] }>;
  return (pkg?.files ?? []).map((file) => file.path);
}

// `exports` is a tree of conditions whose leaves are all target strings. This
// package's are flat today, but walking it costs three lines and means adding a
// conditional export later does not silently escape the check.
function exportTargets(exports: unknown): string[] {
  if (typeof exports === 'string') return [exports];
  if (exports === null || typeof exports !== 'object') return [];
  return Object.values(exports as Record<string, unknown>).flatMap(exportTargets);
}

// Leaves in the working tree, to compare the tarball against. Deriving the
// expectation from the source rather than hardcoding a count is what makes the
// "a build step collapsed the pairs" check work: if a bundler turned 43 pairs
// into 43 compiled files, the tarball's leaf set goes empty and the tree's does
// not, and an emptiness check that trusted a constant would have to be updated
// by the same person who broke it.
function treeLeaves(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...treeLeaves(path));
    else if (/\.(web|native)\.tsx$/.test(entry.name)) found.push(path);
  }
  return found;
}

const problems: string[] = [];

for (const packageDir of PACKAGES) {
  const before = problems.length;
  const absolute = join(REPO_ROOT, packageDir);
  const manifest = JSON.parse(readFileSync(join(absolute, 'package.json'), 'utf8'));
  const files = packedFiles(absolute);
  const packed = new Set(files);
  const label = `${manifest.name}@${manifest.version}`;

  // 1. Every `exports` target is actually in the tarball.
  //
  // Nothing else in this repo checks this, and nothing else CAN: the workbench
  // reaches past `exports` straight into source (.storybook/main.ts says so),
  // and the tests import by relative path. So renaming src/styles/theme.css
  // leaves `exports["./theme.css"]` pointing at nothing, every gate green, and
  // the failure lands in a consumer's bundler as an unresolved subpath.
  for (const target of exportTargets(manifest.exports)) {
    const path = target.replace(/^\.\//, '');
    if (!packed.has(path)) {
      problems.push(
        `${label}: exports target "${target}" is not in the tarball. \`files\` does not include it — a consumer importing that subpath gets an unresolved module.`,
      );
    }
  }

  // 2. No tests ship. They import devDependencies a consumer does not install,
  // so a leaked test file is a broken module sitting inside a working package.
  const tests = files.filter((path) => /\.test\.tsx?$/.test(path));
  if (tests.length > 0) {
    problems.push(
      `${label}: ${tests.length} test file(s) leaked into the tarball (${tests.slice(0, 3).join(', ')}${tests.length > 3 ? ', …' : ''}). Check the \`files\` negations.`,
    );
  }

  // 3. The platform split survives packing.
  //
  // This package publishes SOURCE so that the CONSUMER's bundler picks the leaf
  // — Vite takes .web.tsx, Metro takes .native.tsx. A package-side build would
  // collapse each pair into one compiled entry and break resolution for
  // everyone, and it would do it silently: every other gate in this repo runs
  // against the working tree, where both leaves still exist.
  const expected = treeLeaves(absolute).map((path) => relative(absolute, path));
  const missing = expected.filter((path) => !packed.has(path));
  if (missing.length > 0) {
    problems.push(
      `${label}: ${missing.length} of ${expected.length} platform leaves are missing from the tarball (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', …' : ''}). Leaf resolution happens in the consumer's bundler, so both .web.tsx and .native.tsx must ship verbatim. If a build step was added, that is the cause — remove it.`,
    );
  }

  // 4. Each leaf still has its sibling. A pair broken by a RENAME rather than
  // by a build is invisible to the check above — nothing is missing relative to
  // the tree, because the tree is unpaired too — and it leaves one import
  // unresolvable on exactly one platform, the failure this repo's web-only CI
  // is worst at seeing.
  //
  // Only when nothing is missing: a build step that stripped every native leaf
  // fails check 3 with one precise line, and would fail this one 43 more times
  // with a worse diagnosis of the same cause.
  const web = new Set(
    files
      .filter((path) => path.endsWith('.web.tsx'))
      .map((path) => path.slice(0, -'.web.tsx'.length)),
  );
  const native = new Set(
    files
      .filter((path) => path.endsWith('.native.tsx'))
      .map((path) => path.slice(0, -'.native.tsx'.length)),
  );
  if (missing.length === 0) {
    for (const base of web) {
      if (!native.has(base)) {
        problems.push(`${label}: ${base}.web.tsx ships with no .native.tsx sibling.`);
      }
    }
    for (const base of native) {
      if (!web.has(base)) {
        problems.push(`${label}: ${base}.native.tsx ships with no .web.tsx sibling.`);
      }
    }
  }

  // 5. The changelog ships.
  //
  // npm carries README.md and package.json into a tarball on its own, but NOT a
  // changelog — with `files: ["src"]` it is simply left behind. That is how this
  // package reached 0.13.0 with no record a consumer could read: the material
  // existed, in pull request bodies, on a host the installed package cannot
  // reach. `files` must name CHANGELOG.md explicitly, and a `files` edit is
  // exactly the kind of change that would quietly undo it.
  //
  // scripts/check-changelog.ts owns whether the changelog SAYS the right thing;
  // this owns whether it is in the box.
  if (!packed.has('CHANGELOG.md')) {
    problems.push(
      `${label}: CHANGELOG.md is not in the tarball. npm does not include a changelog automatically — add "CHANGELOG.md" to \`files\`. Without it a consumer cannot read what changed from inside its own node_modules, which is the only place it is guaranteed to be able to look.`,
    );
  }

  if (problems.length === before) {
    console.log(
      `✓ ${label} — ${files.length} files, ${web.size} leaf pairs, ${exportTargets(manifest.exports).length} exports resolve, changelog ships.`,
    );
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  console.error(`\n${problems.length} problem(s). Nothing should be published in this state.`);
  process.exit(1);
}
