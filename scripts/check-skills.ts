// Gate for every SKILL.md in this repository — the shipped plugin's and the
// contributor-only ones alike.
//
// Run with plain `node`, no loader and no build step, exactly like the token
// generator: Node >=24 strips TypeScript types natively. Type-stripping cannot
// execute `enum`, `namespace` or parameter properties, so this file must avoid
// all three (`erasableSyntaxOnly` in tsconfig.base.json enforces it, via
// tsconfig.scripts.json).
//
// TWO AUDIENCES, AND THE FLAG THAT KEEPS THEM APART
//
// This repo holds two sets of skills. `plugins/design-system/skills/` is for a
// THIRD PARTY whose app consumes the published packages. `.claude/skills/` is
// for someone working in this repo, and those never need installing at all — a
// contributor has already cloned.
//
// They leaked into each other. Every skills installer walks a fixed list of
// container directories, `.claude/skills` among them, so
// `npx skills add insolvia-ai/design-system` offered a third party all eight
// skills in one picker: "how to open a PR here" and "how to publish these
// packages" beside the four they came for, each instructing their agent to act
// on a repository it does not have.
//
// The Agent Skills spec has a field for precisely this: `metadata.internal:
// true` hides a skill from discovery unless `INSTALL_INTERNAL_SKILLS=1` is set.
// Claude Code ignores the key, so a contributor's skills still load from a
// checkout. This script makes that structural rather than remembered — a
// skill's LOCATION decides the audience it must declare, and every
// `.claude/skills` entry must carry the flag.
//
// The `Consumer.` / `Contributor.` prefix stays as the human-readable half: it
// sits in the always-loaded description, so anyone who does set
// INSTALL_INTERNAL_SKILLS still sees which side a skill is on.
//
// WHY THE LENGTH LIMITS
//
// A description is always in context; a body is loaded on demand. An overlong
// description costs every session, and an overlong body means the material that
// should have been progressively disclosed in `references/` was not.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const MAX_DESCRIPTION = 1024;
const MAX_BODY_LINES = 500;
const AUDIENCES = ['Consumer.', 'Contributor.'];

// Directories that are not this repository's own source: dependency trees,
// build output, and agent worktrees — the last of which is a FULL checkout, so
// walking it would report every skill twice.
const SKIP_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'coverage',
  'storybook-static',
  'worktrees',
]);

function findSkillFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      found.push(...findSkillFiles(path));
    } else if (entry.name === 'SKILL.md') {
      found.push(path);
    }
  }
  return found;
}

// Frontmatter is read with a regex rather than a YAML parser on purpose: this
// script has no dependencies, and the two fields it needs are the two fields
// the Agent Skills spec requires.
function parse(
  content: string,
): { name: string; description: string; internal: boolean; bodyLines: number } | null {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(content);
  if (!match) return null;

  const [, frontmatter = '', body = ''] = match;
  const name = /^name:[ \t]*(.*)$/m.exec(frontmatter)?.[1]?.trim() ?? '';

  // `description:` may be a plain scalar or a folded block (`>-`), which is how
  // every skill here is written. Both collapse to one line of prose.
  const description = /^description:[ \t]*(>-|>|\|-|\|)?[ \t]*\n?([\s\S]*?)(?=\n[a-zA-Z_-]+:|$)/m
    .exec(frontmatter)?.[2]
    ?.split('\n')
    .map((line) => line.trim())
    .join(' ')
    .replace(/^["']|["']$/g, '')
    .trim();

  // `metadata.internal` is nested, so match the key only where it is indented
  // under a `metadata:` line rather than anywhere in the frontmatter.
  const internal = /^metadata:[ \t]*\n(?:[ \t]+.*\n)*?[ \t]+internal:[ \t]*true[ \t]*$/m.test(
    frontmatter,
  );

  return {
    name,
    description: description ?? '',
    internal,
    bodyLines: body.trimEnd().split('\n').length,
  };
}

// A skill's location decides its audience. `.claude/skills/` is a directory
// every installer scans, so anything living there is contributor-only AND must
// be hidden from discovery; the plugin's tree is the published surface and must
// not be.
function expectationsFor(where: string): { audience: string; internal: boolean; why: string } {
  if (where.startsWith(`.claude${sep}skills${sep}`)) {
    return {
      audience: 'Contributor.',
      internal: true,
      why: 'every skills installer scans .claude/skills, so a skill here reaches third parties unless it is marked internal',
    };
  }
  return {
    audience: 'Consumer.',
    internal: false,
    why: 'this is the published plugin surface',
  };
}

const problems: string[] = [];
const files = findSkillFiles(REPO_ROOT).sort();

for (const file of files) {
  const where = relative(REPO_ROOT, file);
  const parsed = parse(readFileSync(file, 'utf8'));

  if (parsed === null) {
    problems.push(`${where}: no YAML frontmatter — a skill needs \`name\` and \`description\`.`);
    continue;
  }

  const directory = where.split(sep).at(-2) ?? '';

  if (parsed.name === '') {
    problems.push(`${where}: frontmatter has no \`name\`.`);
  } else if (parsed.name !== directory) {
    problems.push(
      `${where}: \`name: ${parsed.name}\` does not match its directory \`${directory}\`. Agents invoke the directory name.`,
    );
  }

  const expected = expectationsFor(where);

  if (parsed.internal !== expected.internal) {
    problems.push(
      expected.internal
        ? `${where}: frontmatter needs a \`metadata\` block setting \`internal: true\` — ${expected.why}.`
        : `${where}: must not set \`metadata.internal\` — ${expected.why}, and an internal skill is invisible to the people it is written for.`,
    );
  }

  if (parsed.description === '') {
    problems.push(`${where}: frontmatter has no \`description\`. It is all an agent sees.`);
  } else {
    if (!parsed.description.startsWith(expected.audience)) {
      const found = AUDIENCES.find((prefix) => parsed.description.startsWith(prefix));
      problems.push(
        found === undefined
          ? `${where}: description must open with \`${expected.audience}\` — see plugins/design-system/README.md for why.`
          : `${where}: description opens with \`${found}\` but its location says \`${expected.audience}\`. Move the skill or fix the prefix.`,
      );
    }
    if (parsed.description.length > MAX_DESCRIPTION) {
      problems.push(
        `${where}: description is ${parsed.description.length} chars, over the ${MAX_DESCRIPTION} limit. It is always in context.`,
      );
    }
  }

  if (parsed.bodyLines > MAX_BODY_LINES) {
    problems.push(
      `${where}: body is ${parsed.bodyLines} lines, over the ${MAX_BODY_LINES} limit. Move detail into references/ so it loads on demand.`,
    );
  }
}

// The plugin's three manifests are one version in three files. They drift
// silently — nothing else reads more than one of them — and a stale Cursor or
// Codex manifest means those users never see an update.
const MANIFESTS = [
  'plugins/design-system/.claude-plugin/plugin.json',
  'plugins/design-system/.codex-plugin/plugin.json',
  'plugins/design-system/.cursor-plugin/plugin.json',
];

const versions = MANIFESTS.map((manifest) => {
  const path = join(REPO_ROOT, manifest);
  try {
    statSync(path);
  } catch {
    problems.push(`${manifest}: missing.`);
    return null;
  }
  const version: unknown = JSON.parse(readFileSync(path, 'utf8')).version;
  if (typeof version !== 'string') {
    problems.push(`${manifest}: no \`version\`.`);
    return null;
  }
  return version;
});

if (new Set(versions.filter((v) => v !== null)).size > 1) {
  problems.push(
    `Plugin manifests disagree on \`version\`: ${MANIFESTS.map((m, i) => `${m} = ${versions[i]}`).join(', ')}. All three describe one plugin.`,
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  console.error(`\n${problems.length} problem(s) across ${files.length} skill(s).`);
  process.exit(1);
}

console.log(`✓ ${files.length} skills OK (${MANIFESTS.length} manifests at ${versions[0]}).`);
