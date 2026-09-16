// NATIVE-LEAF LIB — the escape hatch from consumer stacking contexts, for the
// anchored overlays (Select's list, DateInput's picker) that deliberately do
// not use RN's Modal because their pattern keeps focus on the trigger.
//
// THE PROBLEM THIS KILLS. react-native-web gives every View
// `position: relative; z-index: 0`, so every consumer wrapper is its own
// stacking context. z-index only orders SIBLINGS, so elevation applied inside
// the component — the open root's zIndex, the enclosing Field elevating on
// `controlOpen` — dies at the first wrapper the consumer adds around the
// Field. Every screen wrapper re-created the 0.7.1 "list paints behind what
// follows the form" bug one level up, and the only consumer-side cure was
// spreading `zIndex: 'auto'` onto every wrapper between the control and the
// siblings its overlay must cover. A portal is the class-killing fix: rendered
// as the LAST child of `document.body`, the overlay has no consumer ancestor
// left to paint under.
//
// ON A REAL NATIVE DEVICE all of this is inert: `useOverlayAnchor` returns
// null, `overlayPortalEnabled()` is false, and the leaves keep their inline
// absolutely-positioned overlays (elevation + Field `controlOpen` still carry
// them past the Field). A Modal-based overlay is the change to make when a
// native client exists — same note as the leaves' headers.
//
// WHY A STATIC `react-dom` IMPORT IS SAFE HERE. react-dom is this package's
// optional peer, and every consumer that can reach this branch has it:
// react-native-web itself requires react-dom, so a React Native consumer
// rendering these leaves in a browser is guaranteed both. On a real device
// the import never has work to do — `Platform.OS` gates every call — and its
// only cost is dead bytes in a native bundle, acceptable for a client that
// does not exist and revisitable when one does. A guarded `require()` was
// rejected because three of the four environments that execute this file
// (Vite's workbench, both vitest projects) run it as ESM where `require` is
// undefined, which would silently disable the portal exactly where it is
// tested and looked at.
//
// A `.ts` file, not `.tsx`, ON PURPOSE: the publish gate holds every
// `.native.tsx` under src/ to the leaf-pair invariant (a `.web.tsx` sibling),
// and this is not a leaf pair — the web leaves never had the stacking problem.
// `OverlayPortal` therefore returns nodes without JSX.
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Platform, type View, type ViewStyle } from 'react-native';

/** The anchor's border box in VIEWPORT coordinates — the space `position:
 * fixed` positions in, and what `getBoundingClientRect` measures. */
export interface OverlayAnchor {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

// The native typecheck program deliberately has no DOM lib (its whole point is
// that shipped native leaves compile against React Native's types alone), so
// the web globals this file touches are typed STRUCTURALLY — just the members
// used, reached through globalThis. skipLibCheck is what lets the react-dom
// import above coexist with that; these locals are what keep our own code
// honest instead of `any`.
interface DomRectLike {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface DomWindowLike {
  addEventListener(
    type: string,
    listener: () => void,
    options?: { capture?: boolean; passive?: boolean },
  ): void;
  removeEventListener(type: string, listener: () => void, options?: { capture?: boolean }): void;
}

interface DomDocumentLike {
  body: unknown;
  addEventListener(type: string, listener: (event: { target: unknown }) => void): void;
  removeEventListener(type: string, listener: (event: { target: unknown }) => void): void;
}

const web = globalThis as {
  document?: DomDocumentLike;
  window?: DomWindowLike;
};

/**
 * True when overlays should portal: rendering through react-native-web in a
 * real (or jsdom) document. On a real native device this is false and the
 * leaves keep their inline overlays.
 */
export function overlayPortalEnabled(): boolean {
  return Platform.OS === 'web' && web.document !== undefined;
}

/** A react-native-web View ref is the DOM element itself, with RN's imperative
 * methods mixed in — measured synchronously when it is, with `measureInWindow`
 * kept as the asynchronous fallback for any host that is not. */
function measureNode(node: View | null, set: (anchor: OverlayAnchor | null) => void): void {
  if (node === null) {
    set(null);
    return;
  }
  const domNode = node as unknown as { getBoundingClientRect?: () => DomRectLike };
  if (typeof domNode.getBoundingClientRect === 'function') {
    const rect = domNode.getBoundingClientRect();
    set({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });
    return;
  }
  node.measureInWindow((x, y, width, height) => {
    set({ top: y, left: x, width, height, bottom: y + height, right: x + width });
  });
}

function sameAnchor(a: OverlayAnchor | null, b: OverlayAnchor | null): boolean {
  if (a === null || b === null) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/**
 * The anchor rect for an open overlay, or null — null meaning "render inline":
 * on a real native device always, on web only for the instant before the
 * first measurement lands (a layout effect, so the inline frame is never
 * painted).
 *
 * While open it follows the anchor through scroll and resize. The scroll
 * listener is `capture: true` deliberately: scroll events do not bubble, so a
 * scrolling ANCESTOR of the anchor (a form inside a scrollable pane) is only
 * observable on the way down.
 */
export function useOverlayAnchor(
  open: boolean,
  anchorRef: React.RefObject<View | null>,
): OverlayAnchor | null {
  const [anchor, setAnchor] = React.useState<OverlayAnchor | null>(null);
  const enabled = overlayPortalEnabled();

  React.useLayoutEffect(() => {
    if (!enabled || !open) {
      setAnchor(null);
      return undefined;
    }
    const update = () => {
      measureNode(anchorRef.current, (next) => {
        // Compared, not just set: scroll fires per frame, and a fresh object
        // for an unmoved anchor would re-render the open list on every tick.
        setAnchor((previous) => (sameAnchor(previous, next) ? previous : next));
      });
    };
    update();
    const win = web.window;
    win?.addEventListener('scroll', update, { capture: true, passive: true });
    win?.addEventListener('resize', update);
    return () => {
      win?.removeEventListener('scroll', update, { capture: true });
      win?.removeEventListener('resize', update);
    };
  }, [enabled, open, anchorRef]);

  return enabled && open ? anchor : null;
}

/**
 * Dismiss an open overlay when a press lands outside every node it owns.
 *
 * THE PORTAL IS WHY THIS TAKES A LIST. Once the surface renders as a child of
 * `document.body` it is no longer a DOM descendant of the anchor, so the
 * single `root.contains(target)` check a `.web` leaf gets away with would
 * treat every press on the overlay's own contents as a press outside — and
 * close it before the press could land. The anchor AND the surface both have
 * to be asked.
 *
 * `mousedown`, not `click`, for the reason the web leaves record: a press that
 * starts outside and ends inside should still count as leaving.
 *
 * ON A REAL NATIVE DEVICE this is inert — there is no document to listen to,
 * which is the limitation Popover's native leaf documents. It is live exactly
 * where the portal is, and that is the environment the gap was reachable in:
 * a React Native consumer rendering through react-native-web, where every
 * other control on the page dismisses this way and this one did not.
 */
export function useOverlayOutsidePress(
  open: boolean,
  within: ReadonlyArray<React.RefObject<View | null>>,
  onOutside: () => void,
): void {
  const enabled = overlayPortalEnabled();
  // Read through a ref rather than listed as dependencies: `within` is an
  // array literal at every call site and `onOutside` a fresh closure, so
  // depending on them would tear the listener down and rebuild it on every
  // render of an open overlay. Assigned during render, as select.native.tsx
  // does with its active-option ref.
  const latest = React.useRef({ within, onOutside });
  latest.current = { within, onOutside };

  React.useEffect(() => {
    if (!enabled || !open) return undefined;
    const onMouseDown = (event: { target: unknown }) => {
      const inside = latest.current.within.some((ref) => {
        // A react-native-web View ref IS the DOM node; `contains` is the
        // structural shape asked for, since the native program has no DOM lib.
        const node = ref.current as unknown as { contains?: (other: unknown) => boolean } | null;
        return node?.contains?.(event.target) === true;
      });
      if (!inside) latest.current.onOutside();
    };
    const doc = web.document;
    doc?.addEventListener('mousedown', onMouseDown);
    return () => doc?.removeEventListener('mousedown', onMouseDown);
  }, [enabled, open]);
}

/**
 * `position: fixed` at viewport coordinates, matching what `useOverlayAnchor`
 * measures. RN's style types admit only 'absolute' | 'relative' — react-native-web
 * accepts and emits 'fixed', and the portal target (document.body) is exactly
 * where fixed and absolute-in-body agree anyway; the cast is contained here.
 *
 * ABOVE react-native-web's Modal, not merely above page content. Dialog,
 * AlertDialog and Drawer all render through RN's Modal, and react-native-web
 * paints that as a `position: fixed` container at **`z-index: 9999`**
 * (`ModalAnimation.js`). 0.23.0 and earlier used 30 here, reasoning that a
 * Modal "mounts later in document order" — and document order is exactly what
 * a z-index overrides. Measured in a real browser: a Select inside a Drawer
 * opened its list to `document.body` at 30 and the Drawer painted over it,
 * so the control looked cut off and offered no options. A Modal traps focus,
 * so an overlay open at the same time as one is always an overlay INSIDE it;
 * there is no case where a portaled list should sit under a Modal.
 */
export const OVERLAY_PORTAL_Z_INDEX = 10_000;

export function overlayPortalPosition(place: {
  top: number;
  left: number;
  width?: number;
}): ViewStyle {
  return {
    position: 'fixed' as unknown as 'absolute',
    top: place.top,
    left: place.left,
    ...(place.width === undefined ? {} : { width: place.width }),
    zIndex: OVERLAY_PORTAL_Z_INDEX,
  };
}

/**
 * Renders its children as the last child of `document.body`, where no
 * consumer stacking context can reach them. React portals keep the React
 * tree: context, state and event bubbling all behave as if the overlay were
 * still inline — which is what preserves the leaves' focus-stays-on-trigger
 * wiring unchanged.
 */
export function OverlayPortal({ children }: { children: React.ReactNode }): React.ReactNode {
  if (!overlayPortalEnabled()) return children;
  // The container parameter's DOM type is unresolvable in the native program
  // (no DOM lib); the value really is document.body.
  return createPortal(children, web.document!.body as never);
}
