import { ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

interface CardProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  clickable?: boolean;
  gradient?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)]',
  elevated:
    'bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] shadow-lg',
  outlined: 'bg-transparent border-2 border-[var(--accent-primary)]',
  glass:
    'bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-white/10',
};

const paddingStyles: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  gradient = false,
  className = '',
  children,
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-200';

  const hoverStyles = hoverable
    ? 'hover:shadow-glow-md hover:border-[var(--accent-primary)] hover:scale-[1.02]'
    : '';

  const cursorStyle = clickable ? 'cursor-pointer' : '';

  const gradientStyle = gradient
    ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]'
    : '';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${cursorStyle} ${gradientStyle} ${className}`;

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`text-[var(--text-primary)] ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

export function CardFooter({
  children,
  className = '',
  bordered = true,
}: CardFooterProps) {
  const borderStyle = bordered ? 'border-t border-[var(--bg-tertiary)] pt-4' : '';

  return (
    <div className={`flex items-center gap-3 mt-4 ${borderStyle} ${className}`}>
      {children}
    </div>
  );
}
