import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Slider } from './slider';

// jsdom implements no keyboard behaviour for a range input and has no layout to
// drag across, so the two interactions are driven the way the browser would
// deliver them: `fireEvent.change` for a pointer drag (the browser's own
// dragging produces exactly this), and real key events for the keyboard, which
// this leaf handles itself — see slider.props.ts for why it does.
describe('Slider', () => {
  it('renders a named slider at min by default', () => {
    render(<Slider label="Seek" />);

    // A native range input carries its bounds as `min`/`max`; the accessibility
    // tree derives aria-valuemin/max/now from them, so spelling those out as
    // aria-* props would be duplicating what the element already says. The
    // NATIVE leaf has no such element and does set them by hand.
    const slider = screen.getByRole('slider', { name: 'Seek' });
    expect(slider).toHaveValue('0');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('honours defaultValue and the range', () => {
    render(<Slider label="Seek" defaultValue={30} min={10} max={50} />);

    expect(screen.getByRole('slider')).toHaveValue('30');
  });

  it('drags to a new value and reports it', () => {
    const onValueChange = vi.fn();
    render(<Slider label="Seek" onValueChange={onValueChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '42' } });

    expect(slider).toHaveValue('42');
    expect(onValueChange).toHaveBeenCalledWith(42);
  });

  it('snaps a drag to the step', () => {
    const onValueChange = vi.fn();
    render(<Slider label="Seek" step={10} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '37' } });

    expect(onValueChange).toHaveBeenCalledWith(40);
  });

  it('steps with the arrow keys and jumps with Home/End', () => {
    render(<Slider label="Seek" defaultValue={50} />);

    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveValue('51');

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider).toHaveValue('49');

    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider).toHaveValue('100');

    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveValue('0');
  });

  it('leaves a key it does not claim alone', () => {
    render(<Slider label="Seek" defaultValue={50} />);

    const slider = screen.getByRole('slider');
    const event = fireEvent.keyDown(slider, { key: 'Tab' });

    // fireEvent returns false when a handler prevented the default — Tab must
    // still move focus.
    expect(event).toBe(true);
    expect(slider).toHaveValue('50');
  });

  it('commits on pointer release, once, with the value it landed on', () => {
    const onValueCommit = vi.fn();
    render(<Slider label="Seek" onValueCommit={onValueCommit} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });
    fireEvent.change(slider, { target: { value: '65' } });
    expect(onValueCommit).not.toHaveBeenCalled();

    fireEvent.pointerUp(slider);

    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith(65);
  });

  it('commits on key release, and stays silent when nothing moved', () => {
    const onValueCommit = vi.fn();
    render(<Slider label="Seek" defaultValue={50} onValueCommit={onValueCommit} />);

    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyUp(slider, { key: 'ArrowRight' });
    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(51);

    // A release with no movement behind it — tabbing through, say.
    fireEvent.keyUp(slider, { key: 'Tab' });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  it('paints the fill from the value, and the buffered fill behind it', () => {
    const { rerender } = render(<Slider label="Seek" defaultValue={25} buffered={70} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('data-buffered', '70');
    // The gradient is one string, so this asserts the whole recipe: primary to
    // the value, the mid step to the buffered position, then nothing.
    expect(slider.getAttribute('style')).toContain(
      'var(--color-primary) 0%, var(--color-primary) 25%, var(--color-line) 25%, var(--color-line) 70%, transparent 70%',
    );

    rerender(<Slider label="Seek" defaultValue={25} />);
    expect(screen.getByRole('slider')).not.toHaveAttribute('data-buffered');
  });

  it('never moves when disabled', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <Slider label="Seek" disabled defaultValue={20} {...{ onValueChange, onValueCommit }} />,
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();

    fireEvent.change(slider, { target: { value: '80' } });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.pointerUp(slider);

    expect(slider).toHaveValue('20');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it('follows a controlled value and does not move on its own', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider label="Seek" value={10} onValueChange={onValueChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });

    expect(onValueChange).toHaveBeenCalledWith(80);
    expect(slider).toHaveValue('10');

    rerender(<Slider label="Seek" value={80} onValueChange={onValueChange} />);
    expect(screen.getByRole('slider')).toHaveValue('80');
  });
});
