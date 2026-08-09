// Gate for every SKILL.md in this repository — the shipped plugin's and the
// contributor-only ones alike.
//
// Run with plain `node`, no loader and no build step, exactly like the token
// generator: Node >=24 strips TypeScript types natively. Type-stripping cannot
// execute `enum`, `namespace` or parameter properties, so this file must avoid
// all three (`erasableSyntaxOnly` in tsconfig.base.json enforces it, via
// tsconfig.scripts.json).
//
// WHY THE AUDIENCE PREFIX IS CHECKED
//
// The skills CLI (`npx skills add <owner>/<repo>`) discovers SKILL.md files
// across a whole repository — the well-known agent directories, `.claude/skills`
// among them, plus any paths a plugin manifest declares. This repo's
// `.claude/skills` holds contributor-only skills about opening PRs here and
// publishing these packages. A consumer installing with a wildcard sweeps those
// into their own project, where every one of them is wrong: it would tell their
// agent to bump versions in a repo they do not have.
//
// Publishing the explicit `--skill <name>` form is the first defence. This
// prefix is the second: `Consumer.` or `Contributor.` sits in the description,
// which is metadata an agent always has loaded, so the boundary is visible even
// when a wildcard install got past the first.
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
function parse(content: string): { name: string; description: string; bodyLines: number } | null {
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

  return { name, description: description ?? '', bodyLines: body.trimEnd().split('\n').length };
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

  if (parsed.description === '') {
    problems.push(`${where}: frontmatter has no \`description\`. It is all an agent sees.`);
  } else {
    if (!AUDIENCES.some((prefix) => parsed.description.startsWith(prefix))) {
      problems.push(
        `${where}: description must open with ${AUDIENCES.join(' or ')} — see plugins/design-system/README.md for why.`,
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
