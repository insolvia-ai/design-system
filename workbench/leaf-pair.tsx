import * as React from 'react';

/**
 * Render both leaves of a component side by side.
 *
 * This is the workbench's reason to exist. Every component here is two
 * implementations of one design — a `.web.tsx` leaf of React DOM + Tailwind and
 * a `.native.tsx` leaf of React Native primitives — and the package's central
 * claim is that they agree. Until this existed, nothing in the repo could show
 * whether they did: the tests render one leaf at a time into jsdom and assert
 * on roles, which is exactly the wrong instrument for "these two look
 * different".
 *
 * Both panes are live and interactive, in one page, under one colour scheme.
 * Open a Select in each and you are looking at the two things the app and the
 * marketing site actually render.
 *
 * A story that renders only ONE leaf is fine when the point is a state rather
 * than a comparison (an errored Field, a disabled Button) — but a component's
 * default story should pair them, because divergence is the failure this file
 * is here to catch.
 */
export function LeafPair({
  web,
  native,
  note,
}: {
  web: React.ReactNode;
  native: React.ReactNode;
  /** Optional: say what to look at, when the difference is subtle. */
  note?: string;
}) {
  return (
    <div style={styles.wrap}>
      {note ? <p style={styles.note}>{note}</p> : null}
      <div style={styles.panes}>
        <Pane label="web leaf" sub="React DOM + Tailwind — what marketing renders">
          {web}
        </Pane>
        <Pane label="native leaf" sub="RN primitives via react-native-web — what the app renders">
          {native}
        </Pane>
      </div>
    </div>
  );
}

function Pane({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <section style={styles.pane}>
      <header style={styles.header}>
        <span style={styles.label}>{label}</span>
        <span style={styles.sub}>{sub}</span>
      </header>
      {/* The frame is deliberately plain: no background, no card, nothing that
          could be mistaken for part of the component being shown. */}
      <div style={styles.stage}>{children}</div>
    </section>
  );
}

/**
 * Inline styles, and no Tailwind — deliberately.
 *
 * The chrome must not depend on the thing under test. If the workbench frame
 * were built from the same utilities the `.web` leaves use, a broken Tailwind
 * pipeline would take the frame down with the component and the failure would
 * read as "Storybook is broken" instead of "the styles did not generate".
 * Plain inline styles always render, so a naked component inside an intact
 * frame points straight at the `@source` line in `workbench/tailwind.css`.
 */
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 24,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
  note: {
    margin: '0 0 16px',
    padding: '8px 12px',
    borderLeft: '3px solid currentColor',
    fontSize: 13,
    lineHeight: 1.5,
  },
  panes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  pane: {
    border: '1px solid rgba(128,128,128,0.35)',
    borderRadius: 8,
    // NEVER `overflow: hidden` here, however tidy it looks.
    //
    // It clips anything the component paints outside its own box — an open
    // Select list, a Dialog, a tooltip. The first draft of this file had it,
    // and it cropped the open listbox in the 0.7.1 regression story: the exact
    // overlay whose stacking that story exists to inspect, hidden by the frame
    // built to inspect it. An overlay spilling past the frame is correct and
    // informative; a frame that swallows it is a lie.
    overflow: 'visible',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 12px',
    borderBottom: '1px solid rgba(128,128,128,0.25)',
    background: 'rgba(128,128,128,0.06)',
    // Matches the pane's radius by hand, since `overflow: hidden` is not
    // available to do it for us (see above).
    borderRadius: '7px 7px 0 0',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // NO `opacity` on any text in this frame, however much nicer the muted look
  // is. The a11y gate (`a11y.test: 'error'` in preview.tsx) runs axe over the
  // whole story, chrome included, and `opacity: 0.6` on 11px grey scored 4.45
  // against the 4.5:1 threshold — so the frame failed every story and buried
  // whatever the components were doing.
  //
  // Auditing the harness is arguably noise, and the tempting fix is to exclude
  // this chrome from axe. That is the wrong lever: an exclusion silently covers
  // real findings the day something moves inside it, whereas a frame that is
  // simply accessible cannot mask anything. It also keeps the rule honest — a
  // package that exists to make accessible markup the default should not ship a
  // workbench that fails its own gate.
  sub: { fontSize: 11 },

  stage: { padding: 20 },
};
