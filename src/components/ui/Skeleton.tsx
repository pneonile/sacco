import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  /**
   * The variant of skeleton to display
   */
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'custom';
  
  /**
   * Width of the skeleton
   */
  width?: string | number;
  
  /**
   * Height of the skeleton
   */
  height?: string | number;
  
  /**
   * Border radius of the skeleton
   */
  borderRadius?: string | number;
  
  /**
   * Animation type
   */
  animation?: 'pulse' | 'wave' | 'none';
  
  /**
   * Number of lines for text variant
   */
  lines?: number;
  
  /**
   * Size preset for common elements
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * For custom shapes and layouts
   */
  children?: React.ReactNode;
}

/**
 * Skeleton component for loading states with configurable variants and animations
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  borderRadius,
  animation = 'pulse',
  lines = 1,
  size = 'md',
  className,
  children,
}) => {
  // Size presets
  const sizePresets = {
    sm: { text: 'h-3', avatar: 'h-8 w-8', button: 'h-8 w-20', card: 'h-24' },
    md: { text: 'h-4', avatar: 'h-12 w-12', button: 'h-10 w-24', card: 'h-32' },
    lg: { text: 'h-5', avatar: 'h-16 w-16', button: 'h-12 w-32', card: 'h-48' },
    xl: { text: 'h-6', avatar: 'h-24 w-24', button: 'h-14 w-40', card: 'h-64' },
  };

  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  // Base styles for all skeletons
  const baseStyles = clsx(
    'bg-gradient-to-r from-secondary-100 via-secondary-50 to-secondary-100 bg-[length:400%_100%]',
    animation === 'wave' && 'animate-shimmer',
    animation === 'pulse' && 'animate-pulse',
    'rounded'
  );

  // Get preset dimensions based on variant and size
  const getPresetDimensions = () => {
    if (variant === 'custom') return '';
    return sizePresets[size][variant as keyof typeof sizePresets[typeof size]] || '';
  };

  // Custom styles based on props
  const customStyles = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : '',
    borderRadius: borderRadius ? (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius) : '',
  };

  // Render different variants
  const renderVariant = () => {
    switch (variant) {
      case 'text':
        return (
          <div className="space-y-2 w-full">
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className={clsx(
                  baseStyles,
                  getPresetDimensions(),
                  index === lines - 1 && lines > 1 ? 'w-4/5' : 'w-full',
                )}
                style={customStyles}
              />
            ))}
          </div>
        );
      
      case 'avatar':
        return (
          <div
            className={clsx(
              baseStyles,
              getPresetDimensions(),
              'rounded-full'
            )}
            style={customStyles}
          />
        );
      
      case 'button':
        return (
          <div
            className={clsx(
              baseStyles,
              getPresetDimensions(),
              'rounded-lg'
            )}
            style={customStyles}
          />
        );
      
      case 'card':
        return (
          <div
            className={clsx(
              baseStyles,
              getPresetDimensions(),
              'w-full rounded-xl'
            )}
            style={customStyles}
          >
            {children}
          </div>
        );
      
      case 'custom':
        return (
          <div
            className={clsx(baseStyles)}
            style={customStyles}
          >
            {children}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={clsx('skeleton', className)}>
      {renderVariant()}
    </div>
  );
};

// Add this to your global CSS or index.css
// @keyframes shimmer {
//   0% { background-position: 100% 0; }
//   100% { background-position: -100% 0; }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }
