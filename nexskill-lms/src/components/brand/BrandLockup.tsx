import React from 'react';
import BrandLogo from './BrandLogo';

interface BrandLockupProps {
  orientation?: 'vertical' | 'horizontal';
  variant?: 'default' | 'dark';
  className?: string;
}

const BrandLockup: React.FC<BrandLockupProps> = ({
  orientation = 'vertical',
  variant = 'default',
  className = '',
}) => {
  const isDark = variant === 'dark';
  const sloganColor = isDark ? 'text-gray-400' : 'text-slate-600';
  const dividerColor = isDark ? 'bg-white/20' : 'bg-slate-300';
  const logoVariant = isDark ? 'white' : 'primary';

  if (orientation === 'horizontal') {
    return (
      <div className={`flex items-center gap-6 ${className}`}>
        <BrandLogo size="lg" showText={true} direction="row" variant={logoVariant} />
        <div className={`h-8 w-px ${dividerColor}`} />
        <p className={`text-sm ${sloganColor} font-medium`}>
          Master Your Skill. Build Your Future.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <BrandLogo size="lg" showText={true} direction="column" variant={logoVariant} />
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'} text-center font-medium`}>
        Master Your Skill. Build Your Future.
      </p>
    </div>
  );
};

export default BrandLockup;
