// WEB LEAF — plain React DOM + Tailwind.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  CARD_IMAGE_HEIGHT,
  elevationStyles,
  type CardElevation,
  type CardImageOwnProps,
} from './card.props';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  elevation?: CardElevation;
}

// A card is pure surface, no behaviour, so it is a plain element styled straight
// off the semantic tokens.
const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 'flat', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-sm rounded-lg border border-line bg-card p-lg text-ink',
        elevationStyles[elevation],
        className,
      )}
      {...props}
    />
  ),
);
CardRoot.displayName = 'Card.Root';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h3'>>(
  // `children` is threaded explicitly rather than left to the spread so
  // jsx-a11y can see the heading has content.
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-heading text-lg font-semibold text-ink', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'Card.Title';

const CardBody = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('font-body text-sm text-muted', className)} {...props} />
  ),
);
CardBody.displayName = 'Card.Body';

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-sm pt-sm', className)} {...props} />
  ),
);
CardFooter.displayName = 'Card.Footer';

export interface CardImageProps
  extends
    Omit<React.ComponentPropsWithoutRef<'img'>, 'alt' | 'src' | 'height'>,
    CardImageOwnProps {}

/**
 * A full-bleed image at the top of the card.
 *
 * The negative margins are what make it full-bleed: `Card.Root` owns `p-lg`,
 * and an image inset by 24px on three sides reads as a picture that has been
 * dropped into a card rather than as part of it. That also means this belongs
 * FIRST inside the Root — `-mt-lg` against a sibling above it would pull that
 * sibling's text under the image.
 */
const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, src, alt, caption, height = CARD_IMAGE_HEIGHT, ...props }, ref) => {
    const image = (
      <img
        ref={ref}
        src={src}
        alt={alt}
        style={{ height }}
        className={cn('w-full rounded-t-lg object-cover', className)}
        {...props}
      />
    );

    // No caption, no `<figure>`: an empty figure is a wrapper that adds a
    // grouping role and says nothing, which is noise in the accessibility tree.
    if (caption === undefined) return <div className="-mx-lg -mt-lg">{image}</div>;

    return (
      <figure className="-mx-lg -mt-lg">
        {image}
        <figcaption className="px-lg pt-sm font-body text-xs text-muted">{caption}</figcaption>
      </figure>
    );
  },
);
CardImage.displayName = 'Card.Image';

export const Card = {
  Root: CardRoot,
  Image: CardImage,
  Title: CardTitle,
  Body: CardBody,
  Footer: CardFooter,
};
