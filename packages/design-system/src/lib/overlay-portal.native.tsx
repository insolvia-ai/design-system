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

const web = globalThis as {
  document?: { body: unknown };
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
 * `position: fixed` at viewport coordinates, matching what `useOverlayAnchor`
 * measures. RN's style types admit only 'absolute' | 'relative' — react-native-web
 * accepts and emits 'fixed', and the portal target (document.body) is exactly
 * where fixed and absolute-in-body agree anyway; the cast is contained here.
 *
 * zIndex 30 for the same reason the inline overlays' roots use 30: it has to
 * beat sibling page content, never a Dialog or AlertDialog, which render
 * through RN's Modal (itself portaled by react-native-web) and mount later in
 * document order.
 */
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
    zIndex: 30,
  };
}

/**
 * Renders its children as the last child of `document.body`, where no
 * consumer stacking context can reach them. React portals keep the React
 * tree: context, state and event bubbling all behave as if the overlay were
 * still inline — which is what preserves the leaves' focus-stays-on-trigger
 * wiring unchanged.
 */
export function OverlayPortal({ children }: { children: React.ReactNode }): React.ReactElement {
  if (!overlayPortalEnabled()) return <>{children}</>;
  // The container parameter's DOM type is unresolvable in the native program
  // (no DOM lib); the value really is document.body.
  return <>{createPortal(children, web.document!.body as never)}</>;
}
