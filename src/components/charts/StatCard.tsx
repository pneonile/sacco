import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { clsx } from 'clsx';
import { Skeleton } from '../ui/Skeleton';

interface StatCardProps {
  title: string;
  value: string | ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  isImportant?: boolean;
  animationDelay?: number;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary-600',
  isImportant = false,
  animationDelay = 0,
  loading = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState<string | ReactNode>('0');
  const cardRef = useRef<HTMLDivElement>(null);

  // Safely parse numeric value only if value is a string
  const numericValue = !loading && typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) || 0 : 0;

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-secondary-600',
  };

  const changeIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '•',
  };

  const iconGradients = {
    'text-green-600': 'bg-gradient-to-br from-green-50 to-green-100',
    'text-blue-600': 'bg-gradient-to-br from-blue-50 to-blue-100',
    'text-purple-600': 'bg-gradient-to-br from-purple-50 to-purple-100',
    'text-orange-600': 'bg-gradient-to-br from-orange-50 to-orange-100',
    'text-primary-600': 'bg-gradient-to-br from-primary-50 to-primary-100',
    'text-red-600': 'bg-gradient-to-br from-red-50 to-red-100',
  };

  const gradientClass = iconGradients[iconColor as keyof typeof iconGradients] || iconGradients['text-primary-600'];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  useEffect(() => {
    if (loading) {
      setDisplayValue(<Skeleton height={28} width={120} />);
      return;
    }

    if (isVisible && typeof value === 'string') {
      let startValue = 0;
      const duration = 1500;
      const startTime = Date.now();

      const updateValue = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          const progress = 1 - Math.pow(1 - elapsed / duration, 3);
          const current = Math.floor(progress * numericValue);

          const formatted = value.replace(/\d[\d,.]*/, current.toLocaleString());
          setDisplayValue(formatted);

          requestAnimationFrame(updateValue);
        } else {
          setDisplayValue(value);
        }
      };

      requestAnimationFrame(updateValue);
    } else {
      setDisplayValue(value);
    }
  }, [isVisible, loading, numericValue, value]);

  return (
    <div
      ref={cardRef}
      className={clsx(
        'transform transition-all duration-700 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      )}
    >
      <Card
        interactive
        variant={isImportant ? 'gradient' : 'default'}
        glow={isImportant}
        glowColor={changeType === 'positive' ? 'success' : changeType === 'negative' ? 'danger' : 'primary'}
        className="overflow-hidden"
      >
        <div className="flex items-center justify-between p-5">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-secondary-600 tracking-wide uppercase">{title}</p>
            <div className="text-2xl font-bold text-secondary-900 tracking-tight h-8 flex items-center">
              {displayValue}
            </div>
            {change && !loading && (
              <div className="flex items-center space-x-1 mt-2">
                <span className={`text-sm font-medium ${changeColors[changeType]}`}>{changeIcons[changeType]}</span>
                <span className={`text-sm ${changeColors[changeType]}`}>{change}</span>
              </div>
            )}
          </div>
          <div className={clsx(
            'p-4 rounded-xl transition-all duration-300 group-hover:scale-110',
            gradientClass
          )}>
            <Icon className={clsx(
              'h-7 w-7 transition-transform duration-300',
              iconColor,
              'group-hover:scale-110 group-hover:rotate-3'
            )} />
          </div>
        </div>

        <div className={clsx(
          'h-1 w-full',
          loading ? 'bg-gray-200' :
          changeType === 'positive' ? 'bg-green-500' :
          changeType === 'negative' ? 'bg-red-500' :
          'bg-primary-500'
        )}></div>
      </Card>
    </div>
  );
};
