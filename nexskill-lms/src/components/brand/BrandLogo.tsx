import React from 'react';
import logoImage from '../../assets/branding/nexskill-logo.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  direction?: 'row' | 'column';
  variant?: 'primary' | 'white';
  onClick?: () => void;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  direction = 'row',
  variant = 'primary',
  onClick,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const containerClasses = direction === 'row'
    ? 'flex items-center gap-3'
    : 'flex flex-col items-center gap-2';

  const Component = onClick ? 'button' : 'div';

  const textColor = variant === 'white' ? 'text-white' : 'text-brand-primary';

  return (
    <Component
      onClick={onClick}
      className={`${containerClasses} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={logoImage}
        alt="NexSkill logo"
        className={`${sizeClasses[size]} object-contain rounded-xl`}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold ${textColor} leading-tight`}>
          NEXSKILL
        </span>
      )}
    </Component>
  );
};

export default BrandLogo;
