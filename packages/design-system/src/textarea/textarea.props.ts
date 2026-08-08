// SHARED — no renderer import. Reuses `Input`'s state hook rather than
// declaring a second controlled/uncontrolled split: a textarea is an input
// that wraps, and the two must not drift on when `onValueChange` fires.
export { useInputState as useTextareaState } from '../input/input.props';

/** Line height used to turn `rows` into a native `minHeight`. */
const LINE_HEIGHT = 20;
/** Vertical padding, top and bottom together. */
const VERTICAL_PADDING = 16;

/**
 * The pixel height `rows` means on native.
 *
 * The web leaf just sets `rows` and lets the browser do this arithmetic. React
 * Native has no `rows` — `numberOfLines` is Android-only for sizing and does
 * nothing on iOS — so the height has to be computed, and it is computed HERE
 * so the two leaves cannot disagree about how tall a 4-row textarea is.
 *
 * `LINE_HEIGHT` is 20 to match `textScale.sm`, which is what both leaves render
 * their body text at.
 */
export function minHeightForRows(rows: number): number {
  return rows * LINE_HEIGHT + VERTICAL_PADDING;
}

export interface TextareaOwnProps {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  /** Visible lines before scrolling. Defaults to 3. */
  rows?: number | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  name?: string | undefined;
}
