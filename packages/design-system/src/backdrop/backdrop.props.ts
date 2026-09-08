// SHARED — no react-dom, no react-native import (ESLint-fenced, same as every
// `*.props.ts`). Backdrop has no state machine to share the way Dialog/Drawer
// do: it has no trigger of its own to seed an uncontrolled mode from (see
// `open` below), so there is no `useControllableState` call here and nothing
// else platform-agnostic to centralise beyond this prop contract — `children`
// included, since each leaf declares its own `BackdropProps` on top of this
// (mirroring `DialogRootOwnProps`/`DialogRootProps`). What differs between the
// leaves — portal target, dismissal affordance, scroll lock — is platform
// behavior and lives entirely in `backdrop.web.tsx` / `backdrop.native.tsx`.

/**
 * The scrim that sits above the whole page: a "the app is busy" surface (pair
 * it with a Spinner as `children`) or a "tap anywhere to dismiss" one
 * (`onDismiss`). Dialog and Drawer each paint one of these privately as a
 * part of their own composition; this is the same surface offered standalone,
 * for a caller with no popup card to go around it.
 */
export interface BackdropOwnProps {
  /**
   * Whether the scrim is painted. REQUIRED and CONTROLLED ONLY — unlike
   * Dialog/Drawer, Backdrop has no `Trigger` part of its own to open it, so
   * there is no uncontrolled mode to fall back to: whatever a caller passes
   * here (`open={isBusy}`) has to live in state the caller already owns.
   */
  open: boolean;
  /**
   * Fires when the scrim itself — not its content — is clicked/pressed, or
   * when Escape is pressed while open. Omitted: the scrim still blocks
   * interaction underneath it, but there is no user-initiated way out, which
   * is the correct shape for a "the app is busy" surface with nothing to
   * cancel.
   */
  onDismiss?: (() => void) | undefined;
  /**
   * A transparent scrim that still blocks interaction underneath it —
   * Material calls the same idea `invisible`. For gating input during an
   * async action without visually darkening a page that already reads as
   * "busy" some other way. Defaults to false.
   */
  invisible?: boolean | undefined;
}
