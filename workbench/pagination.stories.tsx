import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Pagination as PaginationWeb } from '@design-system/pagination/pagination.web.tsx';
import { Pagination as PaginationNative } from '@design-system/pagination/pagination.native.tsx';
import type { PaginationSize } from '@design-system/pagination/pagination.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const SIZES = ['sm', 'md'] as const satisfies readonly PaginationSize[];

/**
 * Args are typed against `pagination.props.ts`'s `PaginationOwnProps`, not
 * either leaf — both leaves take every one of these under the same name, so
 * no bridging arg is needed. `defaultPage` gets no control: it seeds
 * UNCONTROLLED state, so twiddling it after mount changes nothing.
 */
type PaginationArgs = {
  count: number;
  defaultPage: number;
  siblingCount: number;
  boundaryCount: number;
  showFirstLast: boolean;
  size: PaginationSize;
  disabled: boolean;
  onPageChange: (next: number) => void;
};

/**
 * Page navigation for a table or list. The page RANGE — which numbers show,
 * where the ellipses fall, and when a one-page gap collapses into a number
 * instead of an ellipsis — is `paginationItems` in `pagination.props.ts`,
 * ported from Material UI's `usePagination`; both leaves render whatever
 * list it returns.
 *
 * Both panes should show the same numbers in the same order, at every count,
 * page and size — that agreement is the whole point of standing them side by
 * side.
 */
const meta = {
  title: 'Layout/Pagination',
  component: PaginationWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    count: 10,
    defaultPage: 5,
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: false,
    size: 'md',
    disabled: false,
    onPageChange: fn(),
  },
  argTypes: {
    count: { control: { type: 'number', min: 1 } },
    defaultPage: { control: false },
    siblingCount: { control: { type: 'number', min: 0 } },
    boundaryCount: { control: { type: 'number', min: 0 } },
    showFirstLast: { control: 'boolean' },
    size: { control: 'inline-radio', options: [...SIZES] },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={
        <PaginationWeb
          count={args.count}
          defaultPage={args.defaultPage}
          siblingCount={args.siblingCount}
          boundaryCount={args.boundaryCount}
          showFirstLast={args.showFirstLast}
          size={args.size}
          disabled={args.disabled}
          onPageChange={args.onPageChange}
        />
      }
      native={
        <PaginationNative
          count={args.count}
          defaultPage={args.defaultPage}
          siblingCount={args.siblingCount}
          boundaryCount={args.boundaryCount}
          showFirstLast={args.showFirstLast}
          size={args.size}
          disabled={args.disabled}
          onPageChange={args.onPageChange}
        />
      }
    />
  ),
} satisfies Meta<PaginationArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ten pages, starting on page 5 — enough to show an ellipsis on both sides of
 * the sibling window. Clicking/pressing page 6 in each pane moves
 * `aria-current` there and fires `onPageChange` once per pane; the two panes
 * are separate uncontrolled instances, so each only moves when its own pane
 * is driven.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);

    await userEvent.click(web.getByRole('button', { name: 'Go to page 6' }));
    await expect(args.onPageChange).toHaveBeenCalledTimes(1);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(6);
    await expect(web.getByRole('button', { name: 'Page 6' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(native.getByRole('button', { name: 'Go to page 6' }));
    await expect(args.onPageChange).toHaveBeenCalledTimes(2);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(6);
    await expect(native.getByRole('button', { name: 'Page 6' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

/** A wider sibling window and two boundary pages held at each end. */
export const Boundaries: Story = {
  args: { siblingCount: 2, boundaryCount: 2 },
};

/** « and » jump straight to the first/last page; ‹ › are always shown. */
export const FirstLast: Story = {
  args: { showFirstLast: true },
};

/** Each size's landmark name — see `Sizes` below for why this exists. */
const SIZE_LABEL: Record<PaginationSize, string> = {
  sm: 'Pagination, small',
  md: 'Pagination, medium',
};

/**
 * The two sizes — 32px and 40px items — stacked for comparison. Both web
 * instances render a real `<nav>` landmark into the SAME pane, so each needs
 * its own `aria-label` or axe's `landmark-unique` fires — the native pane's
 * `View` carries `accessibilityRole="none"`, not a landmark, so its two
 * copies never collide, but it takes the same distinct labels anyway so the
 * two panes stay comparable.
 */
export const Sizes: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SIZES.map((size) => (
            <PaginationWeb
              key={size}
              count={args.count}
              defaultPage={args.defaultPage}
              size={size}
              label={SIZE_LABEL[size]}
            />
          ))}
        </div>
      }
      native={
        <View style={{ gap: 12 }}>
          {SIZES.map((size) => (
            <PaginationNative
              key={size}
              count={args.count}
              defaultPage={args.defaultPage}
              size={size}
              label={SIZE_LABEL[size]}
            />
          ))}
        </View>
      }
    />
  ),
};

/** A short trail: every page fits, and no ellipsis ever appears. */
export const Few: Story = {
  args: { count: 3, defaultPage: 1 },
};

/** Every item disabled at once — the ends and the middle alike. */
export const Disabled: Story = {
  args: { disabled: true, showFirstLast: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);

    await expect(web.getByRole('button', { name: 'Page 5' })).toBeDisabled();
    await expect(web.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(native.getByRole('button', { name: 'Page 5' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(native.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
