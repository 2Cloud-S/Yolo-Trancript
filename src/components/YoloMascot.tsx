'use client';

import React from 'react';

interface MascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  pose?: 'waving' | 'listening' | 'pointing' | 'coding';
  animated?: boolean;
}

export default function YoloMascot({ 
  className = '', 
  size = 'md', 
  pose = 'waving',
  animated = true
}: MascotProps) {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-32 w-32',
    lg: 'h-48 w-48'
  };

  const renderMascot = () => {
    switch (pose) {
      case 'waving':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={`${className} ${sizeClasses[size]}`}>
            {/* Fox body */}
            <circle cx="100" cy="100" r="70" fill="#FF8C42" />
            
            {/* Fox face */}
            <circle cx="100" cy="90" r="50" fill="#FFB07C" />
            
            {/* Eyes */}
            <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="80" cy="75" r="4" fill="#333333" />
            <circle cx="120" cy="75" r="4" fill="#333333" />
            
            {/* Nose */}
            <circle cx="100" cy="90" r="5" fill="#333333" />
            
            {/* Mouth */}
            <path d="M90,100 Q100,110 110,100" stroke="#333333" strokeWidth="2" fill="none" />
            
            {/* Ears */}
            <path d="M70,40 L60,80 L90,65 Z" fill="#FF8C42" />
            <path d="M130,40 L140,80 L110,65 Z" fill="#FF8C42" />
            
            {/* Waving arm */}
            <g className={animated ? "animate-bounce-slow" : ""}>
              <path d="M60,130 Q40,110 30,120 Q20,130 25,140 Q30,150 40,145" stroke="#FF8C42" strokeWidth="12" fill="none" strokeLinecap="round" />
            </g>
            
            {/* Headphones */}
            <path d="M60,65 Q50,30 100,30 Q150,30 140,65" stroke="#444" strokeWidth="4" fill="none" />
            <circle cx="60" cy="65" r="10" fill="#444" />
            <circle cx="140" cy="65" r="10" fill="#444" />
          </svg>
        );

      case 'listening':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={`${className} ${sizeClasses[size]}`}>
            {/* Fox body */}
            <circle cx="100" cy="100" r="70" fill="#FF8C42" />
            
            {/* Fox face */}
            <circle cx="100" cy="90" r="50" fill="#FFB07C" />
            
            {/* Eyes */}
            <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="80" cy="75" r="4" fill="#333333" />
            <circle cx="120" cy="75" r="4" fill="#333333" />
            
            {/* Nose */}
            <circle cx="100" cy="90" r="5" fill="#333333" />
            
            {/* Mouth */}
            <path d="M85,100 Q100,95 115,100" stroke="#333333" strokeWidth="2" fill="none" />
            
            {/* Ears - perked up */}
            <path d="M70,35 L60,70 L90,55 Z" fill="#FF8C42" />
            <path d="M130,35 L140,70 L110,55 Z" fill="#FF8C42" />
            
            {/* Headphones */}
            <path d="M60,65 Q50,30 100,30 Q150,30 140,65" stroke="#444" strokeWidth="4" fill="none" />
            <circle cx="60" cy="65" r="10" fill="#444" />
            <circle cx="140" cy="65" r="10" fill="#444" />
            
            {/* Note symbols */}
            <g className={animated ? "animate-bounce-slow" : ""}>
              <path d="M150,50 L155,40 L160,48 L165,38" stroke="#FFD60A" strokeWidth="2" fill="none" />
              <path d="M160,70 L165,60 L170,68 L175,58" stroke="#FFD60A" strokeWidth="2" fill="none" />
            </g>
          </svg>
        );

      case 'pointing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={`${className} ${sizeClasses[size]}`}>
            {/* Fox body */}
            <circle cx="100" cy="100" r="70" fill="#FF8C42" />
            
            {/* Fox face */}
            <circle cx="100" cy="90" r="50" fill="#FFB07C" />
            
            {/* Eyes */}
            <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="80" cy="75" r="4" fill="#333333" />
            <circle cx="120" cy="75" r="4" fill="#333333" />
            
            {/* Nose */}
            <circle cx="100" cy="90" r="5" fill="#333333" />
            
            {/* Mouth */}
            <path d="M90,100 Q100,110 110,100" stroke="#333333" strokeWidth="2" fill="none" />
            
            {/* Ears */}
            <path d="M70,40 L60,80 L90,65 Z" fill="#FF8C42" />
            <path d="M130,40 L140,80 L110,65 Z" fill="#FF8C42" />
            
            {/* Pointing arm */}
            <g className={animated ? "animate-bounce-slow" : ""}>
              <path d="M150,120 L170,90" stroke="#FF8C42" strokeWidth="12" fill="none" strokeLinecap="round" />
              <circle cx="175" cy="85" r="5" fill="#FFB07C" />
            </g>
          </svg>
        );

      case 'coding':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={`${className} ${sizeClasses[size]}`}>
            {/* Fox body */}
            <circle cx="100" cy="100" r="70" fill="#FF8C42" />
            
            {/* Fox face */}
            <circle cx="100" cy="90" r="50" fill="#FFB07C" />
            
            {/* Eyes */}
            <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="80" cy="75" r="4" fill="#333333" />
            <circle cx="120" cy="75" r="4" fill="#333333" />
            
            {/* Glasses */}
            <rect x="70" y="70" width="20" height="15" rx="5" fill="none" stroke="#333" strokeWidth="2" />
            <rect x="110" y="70" width="20" height="15" rx="5" fill="none" stroke="#333" strokeWidth="2" />
            <line x1="90" y1="75" x2="110" y2="75" stroke="#333" strokeWidth="2" />
            
            {/* Nose */}
            <circle cx="100" cy="90" r="5" fill="#333333" />
            
            {/* Mouth - focused expression */}
            <path d="M95,100 L105,100" stroke="#333333" strokeWidth="2" fill="none" />
            
            {/* Ears */}
            <path d="M70,40 L60,80 L90,65 Z" fill="#FF8C42" />
            <path d="M130,40 L140,80 L110,65 Z" fill="#FF8C42" />
            
            {/* Laptop */}
            <g className={animated ? "animate-fadeIn" : ""}>
              <rect x="70" y="120" width="60" height="40" rx="5" fill="#444" />
              <rect x="75" y="125" width="50" height="30" rx="2" fill="#6EE7B7" />
              <path d="M80,135 L95,135 M80,140 L90,140 M80,145 L85,145" stroke="#444" strokeWidth="2" />
              <rect x="65" y="160" width="70" height="5" rx="2" fill="#333" />
            </g>
          </svg>
        );

      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={`${className} ${sizeClasses[size]}`}>
            {/* Default fox */}
            <circle cx="100" cy="100" r="70" fill="#FF8C42" />
            <circle cx="100" cy="90" r="50" fill="#FFB07C" />
            <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="80" cy="75" r="4" fill="#333333" />
            <circle cx="120" cy="75" r="4" fill="#333333" />
            <circle cx="100" cy="90" r="5" fill="#333333" />
            <path d="M90,100 Q100,110 110,100" stroke="#333333" strokeWidth="2" fill="none" />
            <path d="M70,40 L60,80 L90,65 Z" fill="#FF8C42" />
            <path d="M130,40 L140,80 L110,65 Z" fill="#FF8C42" />
          </svg>
        );
    }
  };

  return renderMascot();
} 