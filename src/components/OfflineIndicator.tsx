import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-white shadow-xl animate-fadeIn">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — All changes autosaved locally</span>
    </div>
  );
};
