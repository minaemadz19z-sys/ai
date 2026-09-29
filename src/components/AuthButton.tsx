import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, User, Database, CheckCircle2, ChevronDown } from 'lucide-react';

export const AuthButton: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google sign-in closed or failed:', err);
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={signingIn}
        title="Sign in with Google to sync voice conversations with Cloud SQL"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/80 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
      >
        <LogIn className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden xs:inline">{signingIn ? 'Connecting...' : 'Sign In'}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer text-xs text-neutral-300"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-5 h-5 rounded-full border border-purple-500/40 object-cover"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-[10px]">
            {user.email ? user.email[0].toUpperCase() : 'U'}
          </div>
        )}
        <span className="max-w-[80px] sm:max-w-[120px] truncate text-neutral-200 font-medium hidden sm:inline">
          {user.displayName || user.email?.split('@')[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl animate-fade-in text-neutral-200">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-9 h-9 rounded-full border border-neutral-700 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user.displayName || 'Authenticated User'}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
            </div>
          </div>

          <div className="py-2.5 space-y-1.5 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Synced with Firebase Auth</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>Cloud SQL & Firestore Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Google Drive & Classroom Scopes Active</span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
