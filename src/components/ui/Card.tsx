import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient';
  interactive?: boolean;
  glow?: boolean;
  glowColor?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  gradientDirection?: 'top-to-bottom' | 'left-to-right' | 'diagonal';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  padding = 'md',
  variant = 'default',
  interactive = false,
  glow = false,
  glowColor = 'primary',
  gradientDirection = 'top-to-bottom'
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const glowStyles = {
    primary: 'before:shadow-[0_0_15px_2px_rgba(79,70,229,0.4)]',
    success: 'before:shadow-[0_0_15px_2px_rgba(34,197,94,0.4)]',
    info: 'before:shadow-[0_0_15px_2px_rgba(59,130,246,0.4)]',
    warning: 'before:shadow-[0_0_15px_2px_rgba(234,179,8,0.4)]',
    danger: 'before:shadow-[0_0_15px_2px_rgba(239,68,68,0.4)]',
  };

  const gradientDirections = {
    'top-to-bottom': 'bg-gradient-to-b',
    'left-to-right': 'bg-gradient-to-r',
    'diagonal': 'bg-gradient-to-br',
  };

  const variantStyles = {
    default: 'bg-white border border-secondary-200 shadow-sm',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-sm',
    elevated: 'bg-white border border-secondary-100 shadow-md',
    outlined: 'bg-transparent border-2 border-secondary-300',
    gradient: `${gradientDirections[gradientDirection]} from-primary-50 to-secondary-50 border border-white/10`,
  };

  const interactiveClasses = interactive 
    ? 'transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]' 
    : 'transition-shadow duration-200 hover:shadow-md';

  const glowClasses = glow 
    ? `relative before:absolute before:inset-0 before:rounded-xl before:z-[-1] ${glowStyles[glowColor]}` 
    : '';

  return (
    <div className={clsx(
      'rounded-xl overflow-hidden',
      variantStyles[variant],
      paddingStyles[padding],
      interactiveClasses,
      glowClasses,
      className
    )}>
      {children}
    </div>
  );
};
