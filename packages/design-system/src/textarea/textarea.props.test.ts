// Direct unit test for the one piece of arithmetic the leaves cannot share by
// rendering: the web leaf sets `rows` and lets the browser size the box, while
// React Native has no `rows` at all (`numberOfLines` sizes on Android and does
// nothing on iOS). If these two ever disagree, a 4-row textarea is a different
// height on each platform and only the workbench could see it.
import { describe, expect, it } from 'vitest';

import { minHeightForRows } from './textarea.props';

describe('minHeightForRows', () => {
  it('grows one line height per row', () => {
    expect(minHeightForRows(2) - minHeightForRows(1)).toBe(20);
    expect(minHeightForRows(5) - minHeightForRows(4)).toBe(20);
  });

  it('includes the vertical padding once, not once per row', () => {
    expect(minHeightForRows(1)).toBe(36);
    expect(minHeightForRows(3)).toBe(76);
  });
});
