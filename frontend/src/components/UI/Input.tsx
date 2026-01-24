import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { IconType } from 'react-icons';
import { FaExclamationCircle } from 'react-icons/fa';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

interface InputProps
  extends BaseInputProps,
    InputHTMLAttributes<HTMLInputElement> {}

interface TextareaProps
  extends BaseInputProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputBaseStyles =
      'px-4 py-3 bg-[var(--bg-tertiary)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all duration-200 focus:outline-none';

    const inputStateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-[var(--bg-tertiary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20';

    const widthStyle = fullWidth ? 'w-full' : '';

    const paddingWithIcon =
      Icon && iconPosition === 'left' ? 'pl-11' : Icon ? 'pr-11' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon className="w-5 h-5 text-[var(--text-tertiary)]" />
            </div>
          )}

          <input
            ref={ref}
            className={`${inputBaseStyles} ${inputStateStyles} ${widthStyle} ${paddingWithIcon} ${className}`}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon className="w-5 h-5 text-[var(--text-tertiary)]" />
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <FaExclamationCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaBaseStyles =
      'px-4 py-3 bg-[var(--bg-tertiary)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all duration-200 focus:outline-none resize-none';

    const textareaStateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-[var(--bg-tertiary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20';

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={`${textareaBaseStyles} ${textareaStateStyles} ${widthStyle} ${className}`}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <FaExclamationCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends BaseInputProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function Select({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder,
  fullWidth = true,
  ...props
}: SelectProps) {
  const selectBaseStyles =
    'px-4 py-3 bg-[var(--bg-tertiary)] border rounded-lg text-[var(--text-primary)] transition-all duration-200 focus:outline-none appearance-none cursor-pointer';

  const selectStateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'border-[var(--bg-tertiary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20';

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`${selectBaseStyles} ${selectStateStyles} ${widthStyle}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-[var(--text-tertiary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <FaExclamationCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
          {helperText}
        </p>
      )}
    </div>
  );
}
