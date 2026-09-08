// WEB LEAF — plain React DOM + Tailwind.
//
// `role="status"` is deliberately absent. That role is for a LIVE region
// announcing a CHANGE — Combobox's inline "No results" message uses it,
// because it appears in response to typing while focus stays in the input.
// An empty state is the opposite: it is static content present on first
// render, exactly like the rest of the page around it, so a plain `<section>`
// labelled by its own title is the correct (and simpler) contract — nothing
// here should interrupt a screen reader or be re-announced on a re-render
// that doesn't change what it says.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  EmptyStateRootContext,
  rootPaddingStyles,
  titleTextStyles,
  useEmptyStateRootContext,
  useEmptyStateRootState,
  type EmptyStateSize,
} from './empty-state.props';

export interface EmptyStateRootProps extends React.ComponentPropsWithoutRef<'section'> {
  /** Scales padding and the title's text size. @default 'md' */
  size?: EmptyStateSize | undefined;
}

const EmptyStateRoot = React.forwardRef<HTMLElement, EmptyStateRootProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const ctx = useEmptyStateRootState(size);
    return (
      <EmptyStateRootContext.Provider value={ctx}>
        <section
          ref={ref}
          aria-labelledby={ctx.titleId}
          className={cn(
            'flex flex-col items-center gap-md text-center',
            rootPaddingStyles[size],
            className,
          )}
          {...props}
        >
          {children}
        </section>
      </EmptyStateRootContext.Provider>
    );
  },
);
EmptyStateRoot.displayName = 'EmptyState.Root';

const EmptyStateIcon = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  // Decorative — the Title/Description text is what a screen reader needs to
  // announce; an icon here is illustration, never the only carrier of what
  // happened. `aria-hidden` matches the native leaf's `accessible={false}`.
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('flex size-12 shrink-0 items-center justify-center text-muted', className)}
      {...props}
    />
  ),
);
EmptyStateIcon.displayName = 'EmptyState.Icon';

const EmptyStateTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h3'>>(
  // `children` threaded explicitly, same reason as `Card.Title`: jsx-a11y
  // needs to see the heading has content, not trust an opaque spread.
  ({ className, children, ...props }, ref) => {
    const { titleId, size } = useEmptyStateRootContext('Title');
    return (
      <h3
        ref={ref}
        id={titleId}
        className={cn('font-heading font-semibold text-ink', titleTextStyles[size], className)}
        {...props}
      >
        {children}
      </h3>
    );
  },
);
EmptyStateTitle.displayName = 'EmptyState.Title';

const EmptyStateDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('max-w-md font-body text-sm text-muted', className)} {...props} />
));
EmptyStateDescription.displayName = 'EmptyState.Description';

const EmptyStateActions = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-row flex-wrap items-center justify-center gap-sm', className)}
      {...props}
    />
  ),
);
EmptyStateActions.displayName = 'EmptyState.Actions';

export const EmptyState = {
  Root: EmptyStateRoot,
  Icon: EmptyStateIcon,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Actions: EmptyStateActions,
};
