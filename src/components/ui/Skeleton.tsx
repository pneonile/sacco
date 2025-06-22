import React from 'react';

interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ height = '1rem', width = '100%', className }) => {
  const style = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  };

  // This component uses Tailwind CSS's `animate-pulse` for a loading effect.
  // For a more advanced "shimmer" effect (where a light band moves across),
  // custom CSS keyframes would typically be defined in `tailwind.config.js`
  // or a global CSS file (e.g., `keyframes: { shimmer: { ... } }` and `animation: { shimmer: 'shimmer 1.5s infinite' }`).
  // Since this component file cannot define global CSS, `animate-pulse` is used
  // as the standard Tailwind way to indicate a loading state.
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 rounded-md ${className || ''} animate-pulse`}
      style={style}
    >
      {/* A true shimmer effect would typically involve a moving linear gradient,
          e.g., via a pseudo-element or an inner div with a custom animation.
          Example (requires global CSS/Tailwind config setup):
          <div className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(to right, #f0f0f0 8%, #e0e0e0 18%, #f0f0f0 33%)',
              backgroundSize: '1200px 100%',
            }}
          />
      */}
    </div>
  );
};

export default Skeleton;
