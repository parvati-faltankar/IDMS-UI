import React from 'react';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Check, Search, X } from 'lucide-react';
import { AppInputPrimitive, AppSelectPrimitive, AppTextareaPrimitive } from '../app/AppFormPrimitives';
import { cn } from '../../utils/classNames';
import { DatePicker } from './DatePicker';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  help?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, required, children, help }) => (
  <div className="flex flex-col gap-2">
    <label className="field-label">
      {label}
      {required && <span className="field-label__required ml-1">*</span>}
    </label>
    {children}
    {help && <p className="field-helper">{help}</p>}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

function getDerivedTabIndex(
  tabIndex: number | undefined,
  shouldSkipTabOrder: boolean
): number | undefined {
  if (tabIndex !== undefined) {
    return tabIndex;
  }

  return shouldSkipTabOrder ? -1 : undefined;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, readOnly, disabled, tabIndex, type, ...props }, ref) => {
    if (type === 'date') {
      return (
        <DatePicker
          ref={ref}
          {...props}
          error={error}
          readOnly={readOnly}
          disabled={disabled}
          tabIndex={getDerivedTabIndex(tabIndex, Boolean(readOnly || disabled))}
          className={className}
        />
      );
    }

    return (
      <AppInputPrimitive
        ref={ref}
        {...props}
        type={type}
        hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
        readOnly={readOnly}
        disabled={disabled}
        tabIndex={getDerivedTabIndex(tabIndex, Boolean(readOnly || disabled))}
        className={cn('field-control', error && 'field-control--error', className)}
      />
    );
  }
);

Input.displayName = 'Input';

type SelectOption = { value: string; label: string; disabled?: boolean };

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: string;
  mobileLookup?: boolean;
  lookupTitle?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  emptyLabel?: string;
}

function getStringSelectValue(value: SelectProps['value'] | SelectProps['defaultValue']): string {
  if (Array.isArray(value)) {
    return value[0] ? String(value[0]) : '';
  }

  return value === undefined || value === null ? '' : String(value);
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      error,
      className,
      children,
      mobileLookup = false,
      lookupTitle = 'Select option',
      searchPlaceholder = 'Search options',
      searchable,
      emptyLabel,
      disabled,
      value,
      defaultValue,
      onChange,
      onBlur,
      onClick,
      onMouseDown,
      onTouchStart,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const selectRef = React.useRef<HTMLSelectElement | null>(null);
    const searchInputRef = React.useRef<HTMLInputElement | null>(null);
    const titleId = React.useId();
    const isMobileLookupViewport = useMediaQuery('(max-width: 640px)');
    const [isLookupOpen, setIsLookupOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const setCombinedRef = React.useCallback(
      (element: HTMLSelectElement | null) => {
        selectRef.current = element;

        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLSelectElement | null>).current = element;
        }
      },
      [ref]
    );

    const lookupOptions = React.useMemo(
      () =>
        (options ?? [])
          .filter((option) => option.value !== '' || Boolean(emptyLabel))
          .map((option) => (option.value === '' && emptyLabel ? { ...option, label: emptyLabel } : option)),
      [emptyLabel, options]
    );
    const selectedValue = getStringSelectValue(value ?? defaultValue);
    const shouldUseMobileLookup = Boolean(mobileLookup && isMobileLookupViewport && !disabled && lookupOptions.length > 0);
    const shouldShowSearch = searchable ?? lookupOptions.length > 7;
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredLookupOptions = React.useMemo(() => {
      if (!normalizedSearchTerm) {
        return lookupOptions;
      }

      return lookupOptions.filter((option) => {
        const label = option.label.toLowerCase();
        const optionValue = option.value.toLowerCase();
        return label.includes(normalizedSearchTerm) || optionValue.includes(normalizedSearchTerm);
      });
    }, [lookupOptions, normalizedSearchTerm]);

    React.useEffect(() => {
      if (!isLookupOpen || !shouldShowSearch || searchable !== true || lookupOptions.length <= 7) {
        return;
      }

      window.setTimeout(() => searchInputRef.current?.focus(), 120);
    }, [isLookupOpen, lookupOptions.length, searchable, shouldShowSearch]);

    const openLookup = () => {
      setSearchTerm('');
      setIsLookupOpen(true);
    };

    const closeLookup = () => {
      setIsLookupOpen(false);
      setSearchTerm('');
    };

    const handleLookupSelect = (option: SelectOption) => {
      if (option.disabled) {
        return;
      }

      const selectElement = selectRef.current;

      if (selectElement) {
        selectElement.value = option.value;
      }

      onChange?.({
        target: selectElement ?? ({ value: option.value } as HTMLSelectElement),
        currentTarget: selectElement ?? ({ value: option.value } as HTMLSelectElement),
      } as React.ChangeEvent<HTMLSelectElement>);

      if (selectElement) {
        onBlur?.({
          target: selectElement,
          currentTarget: selectElement,
        } as React.FocusEvent<HTMLSelectElement>);
      }

      closeLookup();
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLSelectElement>) => {
      if (shouldUseMobileLookup) {
        event.preventDefault();
        event.stopPropagation();
        openLookup();
        return;
      }

      onMouseDown?.(event);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLSelectElement>) => {
      if (shouldUseMobileLookup) {
        event.preventDefault();
        event.stopPropagation();
        openLookup();
        return;
      }

      onTouchStart?.(event);
    };

    const handleClick = (event: React.MouseEvent<HTMLSelectElement>) => {
      if (shouldUseMobileLookup) {
        event.preventDefault();
        event.stopPropagation();
        openLookup();
        return;
      }

      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>) => {
      if (shouldUseMobileLookup && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        openLookup();
        return;
      }

      onKeyDown?.(event);
    };

    return (
      <>
        <AppSelectPrimitive
          ref={setCombinedRef}
          {...props}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          hasError={Boolean(error)}
          aria-haspopup={shouldUseMobileLookup ? 'dialog' : undefined}
          aria-expanded={shouldUseMobileLookup ? isLookupOpen : undefined}
          aria-invalid={Boolean(error)}
          onChange={onChange}
          onBlur={onBlur}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onKeyDown={handleKeyDown}
          className={cn('field-select appearance-none', error && 'field-select--error', className)}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </AppSelectPrimitive>

        {shouldUseMobileLookup && (
          <Drawer
            anchor="bottom"
            open={isLookupOpen}
            onClose={closeLookup}
            ModalProps={{ keepMounted: true }}
            aria-labelledby={titleId}
            slotProps={{
              paper: {
                className: 'mobile-lookup-sheet__paper',
                sx: {
                  width: '100vw',
                  maxWidth: '100vw',
                  maxHeight: '86dvh',
                  m: 0,
                  borderRadius: '20px 20px 0 0',
                  backgroundImage: 'none',
                  overflow: 'hidden',
                },
              },
            }}
          >
            <section className="mobile-lookup-sheet" aria-labelledby={titleId}>
              <header className="mobile-lookup-sheet__header">
                <h2 id={titleId} className="mobile-lookup-sheet__title">
                  {lookupTitle}
                </h2>
                <button type="button" className="mobile-lookup-sheet__close" onClick={closeLookup} aria-label="Close lookup">
                  <X size={18} aria-hidden="true" />
                </button>
              </header>

              <div className="mobile-lookup-sheet__content">
                {shouldShowSearch && (
                  <div className="mobile-lookup-sheet__search-wrap">
                    <div className="mobile-lookup-sheet__search-shell">
                      <Search size={16} className="mobile-lookup-sheet__search-icon" aria-hidden="true" />
                      <input
                        ref={searchInputRef}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="mobile-lookup-sheet__search-input"
                        placeholder={searchPlaceholder}
                        type="search"
                      />
                    </div>
                  </div>
                )}

                <div className="mobile-lookup-sheet__list" role="listbox" aria-label={lookupTitle}>
                  {filteredLookupOptions.length === 0 ? (
                    <div className="mobile-lookup-sheet__empty" role="status">
                      No results found
                    </div>
                  ) : (
                    filteredLookupOptions.map((option) => {
                      const isSelected = option.value === selectedValue;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          onClick={() => handleLookupSelect(option)}
                          className={cn(
                            'mobile-lookup-sheet__option',
                            isSelected && 'mobile-lookup-sheet__option--selected'
                          )}
                        >
                          <span className="mobile-lookup-sheet__option-label">{option.label}</span>
                          {isSelected && <Check size={17} className="mobile-lookup-sheet__check" aria-hidden="true" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </Drawer>
        )}
      </>
    );
  }
);

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, readOnly, disabled, tabIndex, ...props }, ref) => (
    <AppTextareaPrimitive
      ref={ref}
      {...props}
      hasError={Boolean(error)}
      aria-invalid={Boolean(error)}
      readOnly={readOnly}
      disabled={disabled}
      tabIndex={getDerivedTabIndex(tabIndex, Boolean(readOnly || disabled))}
      className={cn('field-textarea', error && 'field-textarea--error', className)}
    />
  )
);

Textarea.displayName = 'Textarea';