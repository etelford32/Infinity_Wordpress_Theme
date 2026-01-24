import { ReactNode, ButtonHTMLAttributes } from 'react';
import { IconType } from 'react-icons';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'outline';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] shadow-md hover:shadow-lg',
  secondary:
    'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:opacity-80',
  tertiary:
    'bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10',
  success:
    'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
  warning:
    'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hover:shadow-lg',
  ghost:
    'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
  outline:
    'bg-transparent text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed';

  const widthStyle = fullWidth ? 'w-full' : '';

  const hoverScale =
    !disabled && !loading && variant !== 'ghost' && variant !== 'tertiary'
      ? 'hover:scale-105 active:scale-95'
      : '';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${hoverScale} ${className}`;

  return (
    <button
      className={combinedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className={`spinner border-2 ${iconSizeStyles[size]}`}></div>
      )}

      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={iconSizeStyles[size]} />
      )}

      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSizeStyles[size]} />
      )}
    </button>
  );
}
