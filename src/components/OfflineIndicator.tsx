import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium bg-[#1e2229] border border-stone-600 text-stone-200 shadow-md">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Modalità Offline • Fogli salvati in cache</span>
    </div>
  );
};
