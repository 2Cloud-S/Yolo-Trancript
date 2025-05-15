'use client';

import React from 'react';

interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  type?: 'document' | 'transcript' | 'logo';
}

export default function Icon({ 
  className = '', 
  size = 'md',
  color = 'primary',
  type = 'logo'
}: IconProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-24 w-24'
  };
  
  const colorMap = {
    primary: {
      main: '#FF8C42',
      secondary: '#FFB07C',
      accent: '#333333'
    },
    secondary: {
      main: '#06B6D4',
      secondary: '#67E8F9',
      accent: '#333333'
    },
    accent: {
      main: '#FFD60A',
      secondary: '#FFF066',
      accent: '#333333'
    }
  };

  const renderIcon = () => {
    const colors = colorMap[color];
    
    switch (type) {
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${className} ${sizeClasses[size]}`}>
            <rect x="3" y="2" width="18" height="20" rx="2" fill={colors.main} />
            <rect x="6" y="4" width="12" height="2" rx="1" fill={colors.secondary} />
            <rect x="6" y="8" width="12" height="2" rx="1" fill={colors.secondary} />
            <rect x="6" y="12" width="12" height="2" rx="1" fill={colors.secondary} />
            <rect x="6" y="16" width="8" height="2" rx="1" fill={colors.secondary} />
          </svg>
        );
        
      case 'transcript':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${className} ${sizeClasses[size]}`}>
            <rect x="3" y="2" width="18" height="20" rx="2" fill={colors.main} />
            <path d="M7,8 L17,8 M7,12 L17,12 M7,16 L13,16" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="6" r="3" fill={colors.secondary} />
            <path d="M18,6 L18,18" stroke={colors.secondary} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 2" />
          </svg>
        );
        
      case 'logo':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${className} ${sizeClasses[size]}`}>
            {/* Main circle */}
            <circle cx="12" cy="12" r="10" fill={colors.main} />
            
            {/* Inner circle */}
            <circle cx="12" cy="11" r="6" fill={colors.secondary} />
            
            {/* Sound waves */}
            <path d="M18,8 C19.5,9.5 20,12 19,14.5" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20,6 C22.5,8.5 23,12 21,16" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Waveform in center */}
            <path d="M9,10 L10,12 L11,9 L12,13 L13,10 L14,12 L15,10" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return renderIcon();
} 