import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={
          className ||
          (variant === 'compact'
            ? 'p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer'
            : 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md cursor-pointer')
        }
        title="Install 10X RESULTS App"
        aria-label="Install App"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit beforeinstallprompt fallback)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={
            className ||
            (variant === 'compact'
              ? 'p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer'
              : 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 transition-colors cursor-pointer')
          }
          title="Install on iPhone / iPad"
          aria-label="Install on iOS"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-black border border-emerald-500/40 flex items-center justify-center shadow-md">
                  <span className="font-black text-sm">
                    <span className="text-white">10</span>
                    <span className="text-emerald-400">X</span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Install 10X RESULTS</h3>
                  <p className="text-[11px] text-neutral-400">Add to iPhone / iPad Home Screen</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-neutral-300 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-neutral-800 text-blue-400 shrink-0 mt-0.5">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    1. Tap the <strong>Share</strong> icon in the Safari bottom bar.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-neutral-800 text-emerald-400 shrink-0 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
