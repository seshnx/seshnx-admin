import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function RefreshButton({ onRefresh, disabled = false, size = 'default' }) {
  const [rotating, setRotating] = useState(false);

  const handleClick = async () => {
    if (disabled || rotating) return;
    
    setRotating(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRotating(false), 500);
    }
  };

  const sizeClasses = {
    small: 'p-1.5',
    default: 'p-2',
    large: 'p-3'
  };

  const iconSizes = {
    small: 14,
    default: 18,
    large: 20
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || rotating}
      className={`bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors disabled:opacity-50 ${sizeClasses[size]}`}
      title="Refresh data"
    >
      <RefreshCw 
        size={iconSizes[size]} 
        className={rotating ? 'animate-spin' : ''} 
      />
    </button>
  );
}

