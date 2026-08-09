// MERGE gate: does the version this PR ships tell a consumer what it gets?
//
// The problem this exists to close is not that changes go unrecorded — the pull
// request bodies in this repo are unusually complete. It is that a PR body is
// reachable only by someone who already knows the number. A consumer holds an
// installed package: `node_modules/@insolvia-ai/design-system/`, offline, with
// no GitHub in reach. Whatever it needs to know has to be IN the tarball, which
// is why CHANGELOG.md is listed in each package's `files` and why this gate
// exists to keep it honest.
//
// This is deliberately NOT diff-relative, unlike the version-bump gates in
// pr.yml that it completes. It asks one absolute question — does the version
// currently in the manifest have an entry? — which needs no PR base, no git, and
// no network, so it runs identically in `npm run ci` and in CI. Composed with
// the bump gate the property falls out: a changed package must bump its version,
// and a bumped version must have an entry. Neither gate has to know about the
// other.
//
// It also serves the release notes. `--section <package dir>` prints the entry
// for that package's current version, which publish.yml puts in the GitHub
// Release body — so the changelog is the single owner of what a version says,
// and the Release quotes it rather than restating it.
//
// Run with plain `node`, no loader and no build step, like the other scripts
// here: Node >=24 strips TypeScript types natively, so no `enum`, `namespace`
// or parameter properties (`erasableSyntaxOnly` in tsconfig.base.json enforces
// it, via tsconfig.scripts.json).
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');

// The published members, and only those — the same list check-artifacts.ts
// works from. The root workspace is `private` and the plugin is not an npm
// package, so neither reaches a consumer and neither owes a changelog.
const PACKAGES = ['packages/tokens', 'packages/design-system'];

// `## 0.13.0 — minor`. The em dash is what the repo's prose already uses; the
// type is required rather than optional because it is the one fact a consumer
// has to ACT on (see releaseType below).
const HEADING = /^##\s+(\d+\.\d+\.\d+)\s+—\s+(major|minor|patch)\s*$/;

// Any `## …` that is not a well-formed entry heading. Without this, a typo'd
// heading is not "wrong", it is INVISIBLE — the file parses, the entry silently
// does not exist, and the gate passes for the version below it.
const ANY_HEADING = /^##\s+/;

type Entry = { version: string; type: string; line: number; body: string };

function parse(markdown: string): { entries: Entry[]; malformed: number[] } {
  const lines = markdown.split('\n');
  const entries: Entry[] = [];
  const malformed: number[] = [];

  lines.forEach((line, index) => {
    const match = HEADING.exec(line);
    if (match) {
      entries.push({ version: match[1]!, type: match[2]!, line: index + 1, body: '' });
    } else if (ANY_HEADING.test(line)) {
      malformed.push(index + 1);
    }
  });

  // Each entry's body runs to the next entry heading, or to the end of file.
  entries.forEach((entry, index) => {
    const start = entry.line;
    const end = index + 1 < entries.length ? entries[index + 1]!.line - 1 : lines.length;
    entry.body = lines.slice(start, end).join('\n').trim();
  });

  return { entries, malformed };
}

function parts(version: string): [number, number, number] {
  const [major, minor, patch] = version.split('.').map(Number);
  return [major!, minor!, patch!];
}

// Descending order, so `entries[0]` is always the newest.
function isDescending(newer: string, older: string): boolean {
  const a = parts(newer);
  const b = parts(older);
  for (let i = 0; i < 3; i++) {
    if (a[i]! !== b[i]!) return a[i]! > b[i]!;
  }
  return false;
}

// The release type a version's own numbers imply, given the one before it.
//
// This is checkable rather than a matter of taste, and it is worth checking
// because the label is the part a consumer acts on. Under npm's `0.x` caret
// rules `^0.12.0` resolves `<0.13.0`, so a MINOR does not reach anyone until
// the range is widened where the dependency is declared — a consumer once sat
// five minors behind with nothing anywhere surfacing it. A patch mislabelled as
// a minor is noise; a minor mislabelled as a patch is that failure again.
function releaseType(version: string, previous: string): string {
  const [major, minor] = parts(version);
  const [previousMajor, previousMinor] = parts(previous);
  if (major !== previousMajor) return 'major';
  if (minor !== previousMinor) return 'minor';
  return 'patch';
}

function changelogFor(packageDir: string): {
  label: string;
  version: string;
  path: string;
  entries: Entry[];
  malformed: number[];
} {
  const absolute = join(REPO_ROOT, packageDir);
  const manifest = JSON.parse(readFileSync(join(absolute, 'package.json'), 'utf8'));
  const path = join(absolute, 'CHANGELOG.md');
  let markdown: string;
  try {
    markdown = readFileSync(path, 'utf8');
  } catch {
    console.error(
      `✗ ${packageDir}/CHANGELOG.md does not exist. It ships inside the package, so it is the only record a consumer can read without leaving its own project.`,
    );
    process.exit(1);
  }
  const { entries, malformed } = parse(markdown);
  return {
    label: `${manifest.name}@${manifest.version}`,
    version: manifest.version,
    path,
    entries,
    malformed,
  };
}

// --section <package dir>: print the current version's entry, for publish.yml
// to use as the GitHub Release body. Exits non-zero rather than printing
// nothing, so a release never quietly ships with empty notes.
const sectionFlag = process.argv.indexOf('--section');
if (sectionFlag !== -1) {
  const packageDir = process.argv[sectionFlag + 1];
  if (!packageDir) {
    console.error('✗ --section needs a package directory, e.g. --section packages/tokens');
    process.exit(1);
  }
  const { version, entries } = changelogFor(packageDir);
  const entry = entries.find((candidate) => candidate.version === version);
  if (!entry || entry.body === '') {
    console.error(`✗ ${packageDir}/CHANGELOG.md has no entry for ${version}.`);
    process.exit(1);
  }
  console.log(`**${entry.type} release**\n\n${entry.body}`);
  process.exit(0);
}

const problems: string[] = [];

for (const packageDir of PACKAGES) {
  const before = problems.length;
  const { label, version, entries, malformed } = changelogFor(packageDir);
  const file = `${packageDir}/CHANGELOG.md`;

  for (const line of malformed) {
    problems.push(
      `${file}:${line}: heading is not a valid entry. An entry heading is exactly \`## <version> — <major|minor|patch>\`, e.g. \`## ${version} — patch\`. A malformed one is not an error to the parser, it is an entry that silently does not exist.`,
    );
  }

  if (entries.length === 0) {
    problems.push(`${file}: no version entries at all.`);
  }

  // 1. The newest entry IS the version being shipped.
  //
  // Stronger than "an entry exists somewhere", and deliberately so: there is no
  // Unreleased section in this repo and there cannot be one, because merging to
  // main publishes. Anything written at the top of this file is, by the time it
  // lands, released. Pinning the top entry to the manifest also means the
  // release-notes extraction above can never pick the wrong section.
  const newest = entries[0];
  if (newest && newest.version !== version) {
    problems.push(
      `${file}: the newest entry is ${newest.version} but package.json says ${version}. Add a \`## ${version} — <type>\` entry at the top — merging to main publishes, so there is no unreleased state to park it in.`,
    );
  }

  // 2. Every entry says something. An empty one passes every other check here
  // and tells a consumer nothing, which is the situation this gate exists to end.
  for (const entry of entries) {
    if (entry.body === '') {
      problems.push(`${file}:${entry.line}: the ${entry.version} entry is empty.`);
    }
  }

  // 3. Newest first, no repeats. Both are assumed by the extraction above, and a
  // duplicated version would make "the entry for 0.13.0" ambiguous.
  for (let i = 1; i < entries.length; i++) {
    const newerEntry = entries[i - 1]!;
    const olderEntry = entries[i]!;
    if (newerEntry.version === olderEntry.version) {
      problems.push(
        `${file}:${olderEntry.line}: ${olderEntry.version} appears twice. One version, one entry.`,
      );
    } else if (!isDescending(newerEntry.version, olderEntry.version)) {
      problems.push(
        `${file}:${olderEntry.line}: ${olderEntry.version} is listed after ${newerEntry.version}. Entries run newest first.`,
      );
    }
  }

  // 4. The declared type matches what the numbers actually did. The oldest entry
  // has nothing to compare against, so it is taken as declared.
  for (let i = 0; i < entries.length - 1; i++) {
    const entry = entries[i]!;
    const previous = entries[i + 1]!;
    const expected = releaseType(entry.version, previous.version);
    if (entry.type !== expected) {
      problems.push(
        `${file}:${entry.line}: ${entry.version} is declared \`${entry.type}\` but is a ${expected} against ${previous.version}. Under 0.x caret rules a minor does not reach a consumer until the range is widened there, so this is the line they act on.`,
      );
    }
  }

  if (problems.length === before) {
    console.log(`✓ ${label} — ${entries.length} entries, newest is ${newest?.version}.`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  console.error(
    `\n${problems.length} problem(s). A published version with no entry is one a consumer cannot read from inside its own node_modules.`,
  );
  process.exit(1);
}
