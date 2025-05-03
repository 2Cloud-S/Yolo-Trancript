'use client';

import { useState } from 'react';

interface DebugInfoProps {
  data: any;
  title?: string;
}

export default function DebugInfo({ data, title = 'Debug Information' }: DebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-md p-4 my-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <button 
          onClick={toggleExpand}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {isExpanded ? (
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-xs text-gray-500">Click 'Expand' to view details</p>
      )}
    </div>
  );
} 