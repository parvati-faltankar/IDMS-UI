import React from 'react';
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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Array<{ value: string; label: string }>;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, className, children, ...props }, ref) => (
    <AppSelectPrimitive
      ref={ref}
      {...props}
      hasError={Boolean(error)}
      aria-invalid={Boolean(error)}
      className={cn('field-select appearance-none', error && 'field-select--error', className)}
    >
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </AppSelectPrimitive>
  )
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
