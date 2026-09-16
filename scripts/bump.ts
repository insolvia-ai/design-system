// Renumber a PR against main: set a package's version to main's plus a bump,
// and put this PR's CHANGELOG.md entry at the top with a heading to match.
//
//   npm run bump -- design-system patch
//   npm run bump -- tokens minor --base origin/main
//
// WHY THIS EXISTS. The PR chooses the version number, so two PRs open at once
// choose the same one, and whichever merges second has to renumber. That is a
// two-line edit, but the reasoning around it — which number is free now, where
// the entry goes, what the "widen your range" line should point at — is where
// an author (or an agent) stalls. This script makes it one command, run after
// `git rebase`. It is equally the right first step on a fresh branch: it writes
// the heading and leaves a TODO body the changelog gate refuses to merge.
//
// What it does, and deliberately nothing else:
//   1. Reads the version at --base (default origin/main, else main) and adds
//      the bump. Never fills a gap: a number claimed by a branch that lost the
//      race is simply skipped, since npm does not require contiguity and the
//      gate only requires descending order.
//   2. Rewrites `version` in the manifest, touching no other byte.
//   3. Finds this PR's entry — the one whose heading carries the version the
//      manifest held before this run — moves it above every other entry,
//      renumbers its heading, and fixes the `^x.y.x` reference in a minor's
//      first line. If there is no such entry, it writes a stub.
//
// Runs under plain `node` with native type-stripping, like every script here.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const PACKAGES: Record<string, string> = {
  tokens: 'packages/tokens',
  'design-system': 'packages/design-system',
};
const TYPES = ['major', 'minor', 'patch'] as const;
type Type = (typeof TYPES)[number];

// Same heading the changelog gate parses: `## 0.13.0 — minor`.
const HEADING = /^##\s+(\d+\.\d+\.\d+)\s+—\s+(major|minor|patch)\s*$/;
const ANY_ENTRY = /^##\s+/;
const WIDEN = /^\*\*Widen your range to take this:\*\*/;

function usage(message: string): never {
  console.error(
    `✗ ${message}\n  usage: npm run bump -- <tokens|design-system> <patch|minor|major> [--base <ref>]`,
  );
  process.exit(2);
}

function git(...args: string[]): string {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

const args = process.argv.slice(2);
const baseFlag = args.indexOf('--base');
let base = baseFlag === -1 ? undefined : args.splice(baseFlag, 2)[1];
const [pkgArg, typeArg] = args;

const pkgKey = Object.keys(PACKAGES).find(
  (key) => pkgArg === key || pkgArg === PACKAGES[key] || pkgArg === `@insolvia-ai/${key}`,
);
if (!pkgKey)
  usage(`unknown package \`${pkgArg ?? ''}\`. One of: ${Object.keys(PACKAGES).join(', ')}.`);
if (!TYPES.includes(typeArg as Type))
  usage(`unknown release type \`${typeArg ?? ''}\`. One of: ${TYPES.join(', ')}.`);
const type = typeArg as Type;
const pkgDir = PACKAGES[pkgKey]!;

if (!base) {
  for (const candidate of ['origin/main', 'main']) {
    try {
      git('rev-parse', '--verify', `${candidate}^{commit}`);
      base = candidate;
      break;
    } catch {
      // try the next one
    }
  }
}
if (!base) usage('neither origin/main nor main exists; pass --base <ref>.');

const manifestPath = join(REPO_ROOT, pkgDir, 'package.json');
const changelogPath = join(REPO_ROOT, pkgDir, 'CHANGELOG.md');

const baseVersion: string = JSON.parse(git('show', `${base}:${pkgDir}/package.json`)).version;
const manifest = readFileSync(manifestPath, 'utf8');
const current: string = JSON.parse(manifest).version;

const [major, minor, patch] = baseVersion.split('.').map(Number) as [number, number, number];
const next =
  type === 'major'
    ? `${major + 1}.0.0`
    : type === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

// 2. The manifest, by textual replacement so its comment block and formatting
// survive — JSON.stringify would rewrite the whole file.
const versionField = /^(\s*"version":\s*")([^"]+)(")/m;
if (!versionField.test(manifest)) {
  console.error(`✗ ${pkgDir}/package.json: no "version" field found.`);
  process.exit(1);
}
writeFileSync(manifestPath, manifest.replace(versionField, `$1${next}$3`));
console.log(
  `· ${pkgDir}/package.json — ${current} -> ${next} (${type} on ${base}'s ${baseVersion}).`,
);

// 3. The changelog.
const lines = readFileSync(changelogPath, 'utf8').split('\n');
const headings = lines
  .map((line, index) => ({ index, match: HEADING.exec(line) }))
  .filter((entry) => entry.match !== null);

// Block boundaries: an entry runs from its heading to the line before the next
// `## ` of any kind, or to the end of the file.
function blockEnd(start: number): number {
  for (let i = start + 1; i < lines.length; i++) if (ANY_ENTRY.test(lines[i]!)) return i;
  return lines.length;
}

// Ours is the entry for the version the manifest held before this run — unless
// that is base's version, in which case this branch has not claimed one yet.
const ours =
  current === baseVersion ? undefined : headings.find((entry) => entry.match![1] === current);

let block: string[];
if (ours) {
  block = lines.splice(ours.index, blockEnd(ours.index) - ours.index);
  while (block.length > 0 && block.at(-1)!.trim() === '') block.pop();
  block[0] = `## ${next} — ${type}`;

  // The minor's first line names the range that will NOT resolve it, which
  // is base's major.minor — so it moves when base does.
  const widenLine = `**Widen your range to take this:** \`^${major}.${minor}.x\` will not resolve it.`;
  const widenAt = block.findIndex((line) => WIDEN.test(line));
  if (type === 'minor' && widenAt !== -1) block[widenAt] = widenLine;
  else if (type === 'minor') block.splice(1, 0, '', widenLine);
  else if (widenAt !== -1) {
    block.splice(widenAt, 1);
    if (block[1] === '' && block[2] === '') block.splice(1, 1);
  }
  console.log(`· ${pkgDir}/CHANGELOG.md — moved the ${current} entry to the top as ${next}.`);
} else {
  block = [`## ${next} — ${type}`, ''];
  if (type === 'minor')
    block.push(
      `**Widen your range to take this:** \`^${major}.${minor}.x\` will not resolve it.`,
      '',
    );
  block.push(
    'TODO: what a consumer gets, in their terms — then the PR link on its own line. The changelog gate refuses this line.',
  );
  console.log(
    `· ${pkgDir}/CHANGELOG.md — wrote a ${next} stub at the top; replace the TODO before opening the PR.`,
  );
}

// Above every existing entry, below the preamble.
const first = lines.findIndex((line) => ANY_ENTRY.test(line));
const at = first === -1 ? lines.length : first;
lines.splice(at, 0, ...block, '');
writeFileSync(changelogPath, lines.join('\n'));

console.log('\nNow: npm run changelog:check');
