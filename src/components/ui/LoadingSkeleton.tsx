'use client';

import React from 'react';

type SkeletonType = 'text' | 'avatar' | 'card' | 'button' | 'input' | 'table-row';
type SkeletonSize = 'sm' | 'md' | 'lg' | 'full';

interface LoadingSkeletonProps {
  type?: SkeletonType;
  size?: SkeletonSize;
  className?: string;
  count?: number;
}

export default function LoadingSkeleton({
  type = 'text',
  size = 'md',
  className = '',
  count = 1
}: LoadingSkeletonProps) {
  const baseClass = "animate-pulse bg-gray-200 rounded";
  
  const sizeMap = {
    sm: 'h-4 w-16',
    md: 'h-4 w-32',
    lg: 'h-4 w-48',
    full: 'h-4 w-full'
  };
  
  const typeMap = {
    text: `${sizeMap[size]}`,
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-32 w-full rounded-lg',
    button: 'h-10 w-24 rounded-md',
    input: 'h-10 w-full rounded-md',
    'table-row': 'h-12 w-full rounded-md'
  };
  
  const skeletonClass = `${baseClass} ${typeMap[type]} ${className}`;
  
  // Render multiple elements if count > 1
  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={skeletonClass}></div>
        ))}
      </div>
    );
  }
  
  return <div className={skeletonClass}></div>;
} 