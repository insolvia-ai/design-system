# Skills index

Each skill is a sibling folder holding a `SKILL.md`, discovered one level deep —
`skills/<name>/SKILL.md`. This index is for humans; the filesystem stays flat.

| Skill | Use it for |
| --- | --- |
| `design-system-setup` | Installing the packages: GitHub Packages auth, `.npmrc`, `theme.css` in a Tailwind v4 entrypoint, `@source` so Tailwind sees the package, dark mode per platform. |
| `design-system-catalogue` | Finding the right component and calling it: the five shelves, compound parts, controlled vs uncontrolled, `Field` + `Input`, the four date surfaces. |
| `design-system-theming` | Re-branding: the semantic roles, the two override seams, and why a native hover state does not follow its base colour. |
| `design-system-platforms` | Leaf resolution: `.web` under Vite, `.native` under Metro and under react-native-web, and what each failure symptom means. |

## Adding a skill

1. Create `skills/<name>/SKILL.md`. Frontmatter needs `name` (matching the
   directory) and `description`.
2. Open the description with `Consumer.` — everything in this plugin is for
   someone consuming the packages, and a skill here must NOT set
   `metadata.internal` (that flag is what keeps the contributor skills in
   `.claude/skills/` out of a third party's picker; setting it here would hide
   the skill from the people it is for). Say when to reach for the skill, not
   only what it contains: the description is all an agent sees before loading
   it.
3. Keep the body under 500 lines. Long material belongs in
   `skills/<name>/references/*.md`, loaded only when needed.
4. Bump `version` in all three `plugin.json` manifests.
5. Add a row above, and to the repo README's install command if the skill should
   be installed by default.

`npm run skills:check` enforces 1, 2 and 3.
