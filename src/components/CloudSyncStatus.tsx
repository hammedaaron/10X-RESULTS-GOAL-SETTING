import React, { useState } from 'react';
import { Cloud, CloudCheck, CloudOff, Loader2, LogIn, LogOut, Check, Sparkles } from 'lucide-react';
import { User, signInWithGoogle, logOut } from '../utils/firebase';
import { ThemeStyles } from '../utils/theme';
import { CloudSyncStatus } from '../utils/cloudSync';

interface CloudSyncStatusProps {
  user: User | null;
  authLoading: boolean;
  syncStatus: CloudSyncStatus;
  theme: ThemeStyles;
  onSyncAll?: () => void;
  variant?: 'compact' | 'full';
}

export const CloudSyncStatusBadge: React.FC<CloudSyncStatusProps> = ({
  user,
  authLoading,
  syncStatus,
  theme,
  variant = 'compact',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
      setShowModal(false);
    } catch (err) {
      setSignInError('Sign-in cancelled or failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            user
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : `border-neutral-500/30 ${theme.bgSubtle} ${theme.textSecondary} hover:${theme.textPrimary}`
          }`}
          title={user ? `Cloud Synced (${user.email})` : 'Cloud Storage: Sign in to sync'}
        >
          {authLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          ) : user ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden md:inline text-[11px] font-semibold">Cloud Synced</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="hidden md:inline text-[11px]">Save to Cloud</span>
            </>
          )}
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div
              className={`w-full max-w-sm rounded-2xl border ${theme.border} ${theme.bgSurface} p-6 shadow-2xl relative`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <h3 className={`font-bold text-sm ${theme.textPrimary}`}>Google Cloud Storage</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-1 rounded-md ${theme.textMuted} hover:${theme.textPrimary} cursor-pointer`}
                >
                  ✕
                </button>
              </div>

              {user ? (
                <div className="space-y-4">
                  <div className={`p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3`}>
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border border-emerald-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${theme.textPrimary} truncate`}>
                        {user.displayName || 'Google Account'}
                      </p>
                      <p className="text-[11px] text-emerald-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-300">
                    <p className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Permanent Firestore Cloud Database</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Real-time sync across devices and sessions</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Zero data loss guarantee</span>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-500/15">
                    <button
                      onClick={handleSignOut}
                      className={`px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                    Connect with your Google account to store all your goals, battle plans, and entries permanently in the cloud. Your data is privately secured and synced across all your devices.
                  </p>

                  {signInError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                      {signInError}
                    </p>
                  )}

                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-neutral-500">
                    Protected with Zero-Trust Firestore Security Rules.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Full variant for Settings tab
  return (
    <div className={`p-5 rounded-xl border ${user ? 'border-emerald-500/40 bg-emerald-500/5' : theme.border} ${theme.bgSubtle} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${user ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {user ? <CloudCheck className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${theme.textPrimary}`}>Google Cloud Storage</h4>
            <p className={`text-[11px] ${theme.textMuted}`}>
              {user ? `Connected as ${user.email}` : 'Sign in to sync your entries permanently to Google Cloud'}
            </p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Cloud Synced
            </span>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
