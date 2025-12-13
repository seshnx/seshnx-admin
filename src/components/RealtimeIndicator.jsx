import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function RealtimeIndicator({ isLive = false, lastUpdate = null }) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (!isLive && !lastUpdate) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {isLive ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff size={12} />
          <span>Last updated {timeSinceUpdate}</span>
        </>
      )}
    </div>
  );
}

