// @insolvia-ai/design-system — owned, platform-split UI primitives. The
// original six component names the outgoing web-only package exported, the
// 0.3.0 wave of owned Base-UI-equivalent primitives, and the 0.11.0 wave that
// closed the gap against a mainstream React component library's catalogue; the
// CONSUMER'S bundler picks each component's .web / .native leaf by extension
// (see README.md). Keep this barrel the source of truth for what the package
// exports.
export { Accordion } from './accordion';
export { Backdrop } from './backdrop';
export type { BackdropOwnProps } from './backdrop';
export { ButtonGroup } from './button-group';
export type {
  ButtonGroupIntent,
  ButtonGroupItemProps,
  ButtonGroupOrientation,
  ButtonGroupRootOwnProps,
  ButtonGroupRootProps,
  ButtonGroupSize,
} from './button-group';
export { Alert } from './alert';
export type { AlertIntent } from './alert';
export { AlertDialog } from './alert-dialog';
export { Avatar } from './avatar';
export type { AvatarGroupOwnProps, AvatarSize } from './avatar';
export { Badge } from './badge';
export type { BadgeIntent, BadgeSize } from './badge';
export { BottomNav } from './bottom-nav';
export type { BottomNavItemOwnProps, BottomNavLabels, BottomNavRootOwnProps } from './bottom-nav';
export { Breadcrumbs } from './breadcrumbs';
export { Button, buttonClass } from './button';
export type { ButtonIntent, ButtonSize, ButtonClassOptions } from './button';
export { Calendar } from './calendar';
export type { CalendarValue } from './calendar';
export { Card } from './card';
export type { CardElevation } from './card';
export { Checkbox } from './checkbox';
export { CheckboxGroup } from './checkbox-group';
export { Chip, chipClass } from './chip';
export type { ChipSize, ChipClassOptions } from './chip';
export { Collapsible } from './collapsible';
export { Combobox } from './combobox';
export type { ComboboxOption, ComboboxValue } from './combobox';
// Dates. `DateInput` is the FIELD, and is what most callers want: a masked text
// input with a button that opens a picker. Which picker is ITS choice, and the
// two are alternatives — `picker="wheels"` (the default) opens `DatePicker`'s
// drum, `picker="calendar"` opens `Calendar`'s month grid. Both are exported on
// their own for a surface that is already a picker, and `Wheel` is the
// scrolling column underneath. See date-input.props.ts for why the typed field
// and the picker are both needed and neither replaces the other.
export { DataGrid } from './data-grid';
export type { DataGridColumn, DataGridSort, DataGridSortDirection } from './data-grid';
export { DateInput } from './date-input';
export type { DateInputMode, DateInputPicker, DateStatus } from './date-input';
export { DatePicker } from './date-picker';
export type { DatePickerMode } from './date-picker';
export { Dialog } from './dialog';
export { Drawer } from './drawer';
export type { DrawerSide } from './drawer';
export { EmptyState } from './empty-state';
export type { EmptyStateSize } from './empty-state';
export { Dropdown } from './dropdown';
export { Field } from './field';
export { Footer } from './footer';
export { ImageList } from './image-list';
export type {
  ImageListBarPosition,
  ImageListGap,
  ImageListItemBarOwnProps,
  ImageListItemOwnProps,
  ImageListRootProps,
  ImageListVariant,
} from './image-list';
export { IconButton, iconButtonClass } from './icon-button';
export type { IconButtonIntent, IconButtonSize, IconButtonClassOptions } from './icon-button';
export { Input } from './input';
export type { InputType } from './input';
export { InputGroup } from './input-group';
export { Link } from './link';
export type { LinkProps, LinkTone, LinkUnderline } from './link';
export { List } from './list';
export type {
  ListDividerProps,
  ListItemOwnProps,
  ListItemProps,
  ListRootContextValue,
  ListRootProps,
  ListTextProps,
} from './list';
export { Masonry } from './masonry';
export type { MasonryGap, MasonryProps } from './masonry';
export { Meter } from './meter';
export { NavBar } from './nav-bar';
export { Pagination } from './pagination';
export type { PaginationItem, PaginationProps, PaginationSize } from './pagination';
export { PasswordInput } from './password-input';
export type {
  PasswordInputAutoComplete,
  PasswordInputOwnProps,
  PasswordInputProps,
} from './password-input';
export { PinInput } from './pin-input';
export type { PinInputOwnProps, PinInputProps, PinInputType } from './pin-input';
export { Popover } from './popover';
export { NumberInput } from './number-input';
export type {
  NumberInputOwnProps,
  NumberInputProps,
  NumberInputStepDirection,
} from './number-input';

export { Progress } from './progress';
export { Rating } from './rating';
export type { RatingProps, RatingSize } from './rating';
export { RadioGroup } from './radio-group';
export { Ribbon } from './ribbon';
export type { RibbonPosition, RibbonTone } from './ribbon';
export { Select } from './select';
export type { SelectOption, SelectValue } from './select';
export { Separator } from './separator';
export { Sidebar, useSidebar } from './sidebar';
export { Skeleton } from './skeleton';
export type { SkeletonAnimation, SkeletonProps, SkeletonVariant } from './skeleton';
export { Slider } from './slider';
export type { SliderOwnProps } from './slider';
export { Stack } from './stack';
export type { StackAlign, StackDirection, StackGap, StackJustify, StackProps } from './stack';
export { Spinner } from './spinner';
export type { SpinnerSize } from './spinner';
export { Stepper } from './stepper';
export type { StepProps, StepStatus, StepperOrientation, StepperRootProps } from './stepper';
export { Switch } from './switch';
export { Table } from './table';
export { Tabs } from './tabs';
export { Text } from './text';
export type { TextFamily, TextTone, TextVariant, TextWeight } from './text';
export { Textarea } from './textarea';
// `useToast` is the one imperative handle in the package: a toast is asked for
// from an event handler far from any JSX, so a hook is the only ergonomic API
// for it. See toast.props.ts.
export { Toast, useToast } from './toast';
export type { ToastApi, ToastIntent, ToastOptions } from './toast';
export { Timeline } from './timeline';
export type {
  TimelineIntent,
  TimelineMarkerVariant,
  TimelinePosition,
  TimelineRootOwnProps,
} from './timeline';
export { Toggle } from './toggle';
export type { ToggleSize } from './toggle';
export { ToggleGroup } from './toggle-group';
export { TransferList } from './transfer-list';
export type {
  TransferListLabels,
  TransferListOption,
  TransferListOrientation,
} from './transfer-list';
export { Tooltip } from './tooltip';
export { TreeView } from './tree-view';
export type { TreeViewItemOwnProps, TreeViewRootOwnProps } from './tree-view';
export { VisuallyHidden } from './visually-hidden';
export type { VisuallyHiddenOwnProps, VisuallyHiddenProps } from './visually-hidden';
export { Wheel } from './wheel';
export type { WheelItem } from './wheel';

// Theming. `ThemeProvider` is renderer-free and exported from the shared side
// on purpose, so a cross-platform consumer writes one provider rather than
// branching on platform. On web it is inert — `theme.css`'s custom properties
// are the override seam there — and on native it is the ONLY way to change a
// colour without forking the package. See src/lib/theme.ts.
export { ThemeProvider, useThemeOverrides } from './lib/theme';
export type { ThemeOverrides } from './lib/theme';
