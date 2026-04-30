import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/classNames';

type DateInputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: React.InputHTMLAttributes<HTMLInputElement>['value'];
  onChange?: (event: DateInputChangeEvent) => void;
  error?: string;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value?: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value?: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return '';
  }

  return `${`${parsed.getDate()}`.padStart(2, '0')}-${`${parsed.getMonth() + 1}`.padStart(2, '0')}-${parsed.getFullYear()}`;
}

function normalizeDateValue(value: React.InputHTMLAttributes<HTMLInputElement>['value']) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(left: Date | null, right: Date | null) {
  return Boolean(
    left &&
      right &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
  );
}

function isBeforeDay(left: Date, right: Date) {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
}

function isAfterDay(left: Date, right: Date) {
  return startOfDay(left).getTime() > startOfDay(right).getTime();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildCalendarDays(viewDate: Date) {
  const monthStart = startOfMonth(viewDate);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value = '',
      onChange,
      className,
      disabled,
      readOnly,
      placeholder = 'dd-mm-yyyy',
      min,
      max,
      name,
      id,
      error,
      onBlur,
      onFocus,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const dateValue = normalizeDateValue(value);
    const minValue = normalizeDateValue(min);
    const maxValue = normalizeDateValue(max);
    const selectedDate = useMemo(() => parseIsoDate(dateValue), [dateValue]);
    const minDate = useMemo(() => parseIsoDate(minValue), [minValue]);
    const maxDate = useMemo(() => parseIsoDate(maxValue), [maxValue]);
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate ?? new Date()));
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handlePointerDown = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.focus();
        }
      };

      window.addEventListener('mousedown', handlePointerDown);
      window.addEventListener('keydown', handleEscape);

      return () => {
        window.removeEventListener('mousedown', handlePointerDown);
        window.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const emitChange = (nextValue: string) => {
      if (!onChange) {
        return;
      }

      const event = {
        target: { value: nextValue, name },
        currentTarget: { value: nextValue, name },
      } as DateInputChangeEvent;

      onChange(event);
    };

    const canSelectDate = (date: Date) => {
      if (minDate && isBeforeDay(date, minDate)) {
        return false;
      }

      if (maxDate && isAfterDay(date, maxDate)) {
        return false;
      }

      return true;
    };

    const selectDate = (date: Date) => {
      if (!canSelectDate(date)) {
        return;
      }

      emitChange(toIsoDate(date));
      setIsOpen(false);
      inputRef.current?.focus();
    };

    const goToMonth = (monthOffset: number) => {
      setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + monthOffset, 1));
    };

    const openCalendar = () => {
      setViewDate(startOfMonth(selectedDate ?? new Date()));
      setIsOpen(true);
    };

    const today = startOfDay(new Date());
    const days = buildCalendarDays(viewDate);
    const isInteractive = !disabled && !readOnly;

    return (
      <div ref={rootRef} className={cn('date-picker', isOpen && 'date-picker--open')}>
        <div className="date-picker__control-wrap">
          <input
            ref={setRefs}
            {...props}
            id={id}
            name={name}
            type="text"
            value={formatDisplayDate(dateValue)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-invalid={Boolean(error)}
            className={cn('field-control date-picker__control', error && 'field-control--error', className)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented || !isInteractive) {
                return;
              }
              if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                event.preventDefault();
                openCalendar();
              }
            }}
            onClick={() => isInteractive && openCalendar()}
          />
          <button
            type="button"
            className="date-picker__trigger"
            aria-label="Open date picker"
            disabled={!isInteractive}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                openCalendar();
              }
            }}
            tabIndex={-1}
          >
            <CalendarDays size={16} aria-hidden="true" />
          </button>
        </div>

        {isOpen && isInteractive && (
          <div className="date-picker__popover" role="dialog" aria-label="Choose date">
            <div className="date-picker__header">
              <div className="date-picker__month-label" aria-live="polite">
                {monthFormatter.format(viewDate)}
              </div>
              <div className="date-picker__nav">
                <button type="button" className="date-picker__nav-button" aria-label="Previous month" onClick={() => goToMonth(-1)}>
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button type="button" className="date-picker__nav-button" aria-label="Next month" onClick={() => goToMonth(1)}>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="date-picker__weekdays" aria-hidden="true">
              {weekdayLabels.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="date-picker__grid">
              {days.map((date) => {
                const isoDate = toIsoDate(date);
                const isOutsideMonth = date.getMonth() !== viewDate.getMonth();
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                const isDisabled = !canSelectDate(date);

                return (
                  <button
                    key={isoDate}
                    type="button"
                    className={cn(
                      'date-picker__day',
                      isOutsideMonth && 'date-picker__day--muted',
                      isToday && 'date-picker__day--today',
                      isSelected && 'date-picker__day--selected'
                    )}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    onClick={() => selectDate(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="date-picker__footer">
              <button type="button" className="date-picker__footer-action" onClick={() => emitChange('')}>
                Clear
              </button>
              <button type="button" className="date-picker__footer-action" onClick={() => selectDate(today)}>
                Today
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
