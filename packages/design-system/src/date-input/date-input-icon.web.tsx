// WEB LEAF (icon) — the calendar and the clock, drawn from bordered boxes.
//
// See `ICON` in date-input.props.ts for why these are boxes rather than an SVG
// or a text glyph. `currentColor` throughout, so the button's own colour and
// its hover state carry straight through without either leaf restating them.
import * as React from 'react';

import { ICON, iconFor, type DateInputMode } from './date-input.props';

export function PickerIcon({ mode }: { mode: DateInputMode }) {
  const box: React.CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    width: ICON.size,
    height: ICON.size,
    border: `${ICON.stroke}px solid currentColor`,
  };

  if (iconFor(mode) === 'clock') {
    return (
      <span style={{ ...box, borderRadius: '50%', display: 'inline-block' }}>
        {/* The long hand, pointing up from the centre. */}
        <span
          style={{
            position: 'absolute',
            left: `calc(50% - ${ICON.handThickness / 2}px)`,
            bottom: '50%',
            width: ICON.handThickness,
            height: ICON.handUp,
            background: 'currentColor',
          }}
        />
        {/* The short one, pointing right. */}
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: `calc(50% - ${ICON.handThickness / 2}px)`,
            width: ICON.handRight,
            height: ICON.handThickness,
            background: 'currentColor',
          }}
        />
      </span>
    );
  }

  return (
    <span style={{ ...box, borderRadius: ICON.radius, display: 'inline-block' }}>
      {/* The binding across the top — what makes a bordered square a calendar. */}
      <span
        style={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: ICON.headerHeight,
          background: 'currentColor',
        }}
      />
    </span>
  );
}
