// WEB LEAF — plain React DOM + Tailwind. No react-native. Vite resolves this.
import * as React from 'react';

import { buttonClass, type ButtonIntent, type ButtonSize } from './button.props';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  intent?: ButtonIntent;
  size?: ButtonSize;
  /**
   * Let a sentence-length label wrap onto more than one line. Off by default:
   * a button's label is usually a word, and a one-line label lays out
   * identically either way. See `wrapSizeStyles` in button.props.
   */
  wrap?: boolean;
}

// A plain `<button>` for real buttons (form submits). Anything that *navigates*
// is a `<Link>`/`<a>` styled with `buttonClass`, not this. `type` defaults to
// "button" so a button inside a form never submits by accident.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent = 'primary', size = 'md', wrap = false, type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={buttonClass({ intent, size, wrap, className })}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
