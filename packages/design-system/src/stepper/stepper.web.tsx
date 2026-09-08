// WEB LEAF — plain React DOM + Tailwind. An `<ol>` of steps: a circle per
// step joined by a hairline connector, with a label under (horizontal) or
// beside (vertical) each. `role="list"` is explicit rather than left to the
// implicit `<ol>` role, same reasoning as Timeline's Root: this list carries
// no bullets or numbers (the circle IS the marker), `list-none` strips
// Tailwind's default styling for it, and Safari drops the implicit list
// semantics the moment `list-style: none` applies.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  DEFAULT_STEPPER_LABEL,
  StepperItemContext,
  StepperRootContext,
  deriveStatus,
  isStepClickable,
  stepIndicatorClass,
  stepLabelClass,
  stepSrSuffix,
  useStepperItemContext,
  useStepperRootContext,
  useStepperState,
  type StepOwnProps,
  type StepperOrientation,
  type StepperRootOwnProps,
  type StepStatus,
} from './stepper.props';

// `defaultValue`-style requiredness note doesn't apply here — `activeStep`
// defaults to 0 inside `useStepperState`, so an uncontrolled Root with
// nothing supplied still starts somewhere sane (step 0), unlike Tabs.
export interface StepperRootProps
  extends React.ComponentPropsWithoutRef<'ol'>, StepperRootOwnProps {}

const StepperRoot = React.forwardRef<HTMLOListElement, StepperRootProps>(
  (
    {
      className,
      activeStep,
      defaultActiveStep = 0,
      onActiveStepChange,
      orientation = 'horizontal',
      linear = true,
      interactive = false,
      label = DEFAULT_STEPPER_LABEL,
      children,
      ...props
    },
    ref,
  ) => {
    const [current, setCurrent] = useStepperState(
      activeStep,
      defaultActiveStep,
      onActiveStepChange,
    );
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const count = items.length;

    return (
      <StepperRootContext.Provider
        value={{ activeStep: current, setActiveStep: setCurrent, orientation, linear, interactive }}
      >
        <ol
          ref={ref}
          role="list"
          aria-label={label}
          className={cn(
            'list-none',
            orientation === 'horizontal' ? 'flex flex-row items-start' : 'flex flex-col',
            className,
          )}
          {...props}
        >
          {items.map((item, index) => (
            <StepperItemContext.Provider
              key={item.key ?? index}
              value={{ index, last: index === count - 1 }}
            >
              {item}
            </StepperItemContext.Provider>
          ))}
        </ol>
      </StepperRootContext.Provider>
    );
  },
);
StepperRoot.displayName = 'Stepper.Root';

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** What the circle draws. `completed`/`error` always win over a caller's
 * `icon` — see `StepOwnProps.icon`'s note on why that is not a bug. */
function indicatorContent(status: StepStatus, index: number, icon: React.ReactNode | undefined) {
  if (status === 'completed') return <CheckGlyph />;
  if (status === 'error') return <span aria-hidden="true">!</span>;
  return icon ?? index + 1;
}

const connectorClass = (filled: boolean, orientation: StepperOrientation) =>
  cn(
    orientation === 'horizontal' ? 'mt-4 h-px flex-1 shrink-0' : 'ml-4 w-px min-h-8',
    filled ? 'bg-primary' : 'bg-line',
  );

export interface StepProps
  extends Omit<React.ComponentPropsWithoutRef<'li'>, 'onClick'>, StepOwnProps {}

const Step = React.forwardRef<HTMLLIElement, StepProps>(
  (
    { className, label, description, status: statusProp, optional = false, icon, ...props },
    ref,
  ) => {
    const { activeStep, setActiveStep, orientation, linear, interactive } =
      useStepperRootContext('Step');
    const { index, last } = useStepperItemContext();
    const status = statusProp ?? deriveStatus(index, activeStep);
    const allowed = isStepClickable(status, interactive, linear);
    const active = status === 'active';
    const horizontal = orientation === 'horizontal';
    const srSuffix = stepSrSuffix(status);

    const indicator = (
      <span
        aria-hidden="true"
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-pill font-body text-sm font-semibold',
          stepIndicatorClass[status],
        )}
      >
        {indicatorContent(status, index, icon)}
      </span>
    );

    const labelBlock = (
      <span
        className={cn(
          'flex flex-col',
          horizontal ? 'items-center text-center' : 'items-start text-left',
        )}
      >
        <span className={cn('font-body text-sm', stepLabelClass[status])}>
          {label}
          {optional ? <span className="ml-1 font-body text-xs text-muted">(Optional)</span> : null}
          {srSuffix ? (
            // The accessible-name algorithm trims each element's OWN text
            // before concatenating it into its parent's name — so a leading
            // space living only inside this span (as `srSuffix` carries it)
            // is discarded, and "Account" + "(completed)" lands with no
            // space between them. A literal `{' '}` text node, a SIBLING of
            // this span rather than part of its content, is what survives
            // that trim; see `link.web.tsx`'s external-hint span for the
            // same shape.
            <>
              {' '}
              <span className="sr-only">{srSuffix}</span>
            </>
          ) : null}
        </span>
        {description ? <span className="font-body text-xs text-muted">{description}</span> : null}
      </span>
    );

    // The clickable target wraps the circle AND its label — never the
    // connector, which stays decorative chrome outside it either way.
    const content = allowed ? (
      <button
        type="button"
        onClick={() => setActiveStep(index)}
        className={cn(
          'flex gap-xs rounded-sm',
          horizontal ? 'flex-col items-center' : 'flex-row items-center',
          focusRing,
          'touch-manipulation',
        )}
      >
        {indicator}
        {labelBlock}
      </button>
    ) : (
      <div
        className={cn(
          'flex gap-xs',
          horizontal ? 'flex-col items-center' : 'flex-row items-center',
        )}
      >
        {indicator}
        {labelBlock}
      </div>
    );

    return (
      <li
        ref={ref}
        aria-current={active ? 'step' : undefined}
        data-state={status}
        className={cn(horizontal ? 'flex flex-1 flex-row items-start' : 'flex flex-col', className)}
        {...props}
      >
        {content}
        {/* The connector lives INSIDE its own (non-last) Step rather than as
            a sibling list item — Root computes `last`, Step is what acts on
            it, so the line always ends cleanly with no separate part for a
            consumer to place themselves. See stepper.props.ts's header. */}
        {last ? null : (
          <span
            aria-hidden="true"
            className={connectorClass(status === 'completed', orientation)}
          />
        )}
      </li>
    );
  },
);
Step.displayName = 'Stepper.Step';

export const Stepper = {
  Root: StepperRoot,
  Step,
};
