'use client';

import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';

interface AnimatedTextProps {
  className?: string;
  wrapperClassName?: string;
}

export default function AnimatedText({ className = '', wrapperClassName = '' }: AnimatedTextProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'} ${wrapperClassName}`}>
      <div className="animate-slideInLeft">
        <TypeAnimation
          sequence={[
            'Turn Audio', 
            1000,
            'Turn Video',
            1000, 
            'Turn Podcasts',
            1000,
            'Turn Meetings',
            1000,
            'Turn Interviews',
            1000,
            'Turn Lectures',
            1000,
            'Turn Recordings',
            1000,
            'Turn Audio & Video',
            2000,
          ]}
          wrapper="span"
          speed={50}
          style={{ display: 'block', fontSize: 'inherit', fontWeight: 'inherit' }}
          className={`${className} text-gray-900`}
          repeat={Infinity}
          cursor={true}
        />
      </div>
      <div className="animate-slideInRight">
        <span className="block text-indigo-600 mt-2 md:mt-3">Into Text</span>
      </div>
    </div>
  );
} 