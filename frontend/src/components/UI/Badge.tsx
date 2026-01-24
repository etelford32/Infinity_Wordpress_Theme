import { ReactNode } from 'react';
import { IconType } from 'react-icons';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: IconType;
  rounded?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--bg-tertiary)]',
  primary:
    'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
  success:
    'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
  warning:
    'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30',
  danger:
    'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const iconSizeStyles: Record<BadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function Badge({
  variant = 'default',
  size = 'md',
  icon: Icon,
  rounded = false,
  className = '',
  children,
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-semibold whitespace-nowrap';

  const roundedStyle = rounded ? 'rounded-full' : 'rounded-md';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyle} ${className}`;

  return (
    <span className={combinedClassName}>
      {Icon && <Icon className={iconSizeStyles[size]} />}
      {children}
    </span>
  );
}
