import React from 'react';
import { LucideIcon, AlertCircle, RefreshCw, X } from 'lucide-react';

// ============================================================================
// BUTTON
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[48px]'
  };

  const variantClasses = {
    primary: 'bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 shadow-xs border border-amber-600/30',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80',
    outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-xs',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-xs'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin text-current" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
    </button>
  );
};

// ============================================================================
// CARD
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 transition-all duration-200 ${
        elevated ? 'shadow-xs hover:shadow-md' : 'shadow-2xs'
      } ${hoverable ? 'hover:border-slate-300 hover:translate-y-[-1px]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// BADGE
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'amber';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-300'
  };

  const dotStyles = {
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
    amber: 'bg-amber-600'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />}
      <span className="truncate">{children}</span>
    </span>
  );
};

// ============================================================================
// METRIC CARD
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'amber' | 'emerald' | 'blue' | 'indigo' | 'rose';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'amber',
  onClick
}) => {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200'
  };

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`p-4 flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">{title}</span>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/60 flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

export const LoadingSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = 'h-16'
}) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-slate-200/80 rounded-2xl w-full ${className}`} />
      ))}
    </div>
  );
};

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry
}) => {
  return (
    <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 text-center max-w-md mx-auto my-6">
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900 mb-1">{title}</h4>
      <p className="text-xs text-rose-700 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
          Retry Operation
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// MODAL DIALOG
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg'
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl border border-slate-200 shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
