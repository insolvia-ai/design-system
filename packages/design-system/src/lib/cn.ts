import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The package's spacing scale, as tailwind-merge needs to hear it.
 *
 * WHY THIS LIST EXISTS. `tailwind-merge` resolves a conflict by recognising
 * the VALUE half of a utility, and its built-in theme is Tailwind's own
 * numeric spacing scale. This package's scale is t-shirt-sized —
 * `tokens.json`'s 4pt grid emits `--spacing-xs … --spacing-xxl` — so
 * `p-lg` and `gap-sm` were words the merge had never heard of. It kept BOTH
 * sides:
 *
 *   twMerge('p-lg gap-sm', 'p-0 gap-0')   → 'p-lg gap-sm p-0 gap-0'   ❌
 *   twMerge('p-6 gap-2',   'p-0 gap-0')   → 'p-0 gap-0'               ✅
 *
 * Which one painted was then decided by stylesheet order rather than by the
 * caller, so a consumer could not override a component's padding with a
 * `className` at all and had to reach for an inline `style` instead. Naming
 * the six steps here is what makes a t-shirt override behave exactly like the
 * numeric one already did.
 *
 * The names are LITERAL rather than imported from `@insolvia-ai/tokens`. That
 * package is deliberately undeclared here (see package.json's `//` block), and
 * `src/lib/` may not grow a dependency to hold six strings that have not moved
 * since the grid was drawn. `tokens.test.ts` in the tokens package is what
 * guards the scale itself; a step added there and forgotten here degrades to
 * the pre-existing behaviour — both classes survive — rather than to a crash.
 */
const SPACING_SCALE = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

/**
 * WHY ONLY `spacing`, AND NOT THE RADIUS OR COLOUR SCALES.
 *
 * They need no entry — measured against tailwind-merge 2.6.1 rather than
 * assumed. Its colour and radius groups accept an ARBITRARY name in the value
 * position, because a colour cannot be enumerated the way a numeric scale can,
 * so this package's own names already merge:
 *
 *   twMerge('bg-surface-alt text-ink', 'bg-danger text-primary-text')
 *     → 'bg-danger text-primary-text'      ✅ already
 *   twMerge('rounded-md', 'rounded-none')  → 'rounded-none'   ✅ already
 *
 * Spacing is the one scale it validates against a list, which is exactly why
 * it is the one scale that broke. Listing the others would be config that
 * changes no output and would still have to be maintained — and would suggest,
 * wrongly, that a role added to `tokens.json` has to be repeated here.
 *
 * The built-in scales that share these six names are untouched: `max-w-sm`,
 * `shadow-lg`, `text-sm`, `rounded-lg` and `blur-sm` live in their own class
 * groups and merge exactly as before. `max-w-md` appears in this package's own
 * class strings and is Tailwind's 28rem, not `--spacing-md`; it still resolves
 * against the maxWidth scale.
 */
/**
 * WHY `truncate` HAS TO BEAT `text-balance`, AND WHY THAT IS A MERGE RULE.
 *
 * `text-wrap: balance` is a SHORTHAND. It sets `text-wrap-style: balance` and
 * resets `text-wrap-mode: wrap` — and that second half is what runs over
 * `truncate`'s `white-space: nowrap`. So a heading carrying `text-balance`
 * (every `display`/`title` this package renders) wrapped onto three lines
 * instead of eliding, and the caller had no way to say otherwise.
 *
 * `tailwind-merge` could not settle it either, because the two utilities are
 * in DIFFERENT class groups — `truncate` is `text-overflow`, `text-balance` is
 * `text-wrap` — and a group only ever displaces itself:
 *
 *   twMerge('text-balance', 'truncate')  → 'text-balance truncate'   ❌ both
 *
 * Both survived, the stylesheet decided, and `balance` won. The consumer's
 * escape was an inline `style={{ textWrap: 'nowrap' }}`, which is the one
 * thing that outranks a stylesheet — a workaround whose only merit was that it
 * could not be merged away.
 *
 * Stating the conflict here fixes it once for every component, and — the part
 * that matters — fixes it identically for `<Text truncate>` and for a bare
 * `className="truncate"`. The prop emits the same utility a caller would
 * write, so there is no second code path that could behave differently.
 *
 * ONE DIRECTION ONLY, DELIBERATELY. The reverse entry (`text-wrap` displacing
 * `text-overflow`) would be wrong: `text-ellipsis` and `text-nowrap` are a
 * normal pairing — nowrap is half of what makes an ellipsis appear — and
 * teaching the merge to delete one when it sees the other would break the
 * combination this rule exists to protect.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { spacing: [...SPACING_SCALE] },
    conflictingClassGroups: { 'text-overflow': ['text-wrap'] },
  },
});

/** Merge Tailwind class lists, letting later utilities win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
