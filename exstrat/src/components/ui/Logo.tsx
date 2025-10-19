import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'light' | 'dark';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto'
  };

  const getLogoSrc = () => {
    switch (variant) {
      case 'icon':
        return '/logo_dark.svg';
      case 'light':
        return '/logo_light.svg';
      case 'dark':
        return '/logo_dark.svg';
      case 'full':
      default:
        return '/Full_logo.svg';
    }
  };

  const getDimensions = () => {
    switch (variant) {
      case 'icon':
      case 'light':
      case 'dark':
        return size === 'sm' ? { width: 24, height: 24 } :
               size === 'md' ? { width: 32, height: 32 } :
               { width: 48, height: 48 };
      case 'full':
      default:
        return size === 'sm' ? { width: 100, height: 22 } :
               size === 'md' ? { width: 120, height: 26 } :
               { width: 150, height: 32 };
    }
  };

  const dimensions = getDimensions();

  return (
    <Image
      src={getLogoSrc()}
      alt="ExStrat"
      width={dimensions.width}
      height={dimensions.height}
      className={`${sizeClasses[size]} ${className}`}
      priority
    />
  );
};

export { Logo };
