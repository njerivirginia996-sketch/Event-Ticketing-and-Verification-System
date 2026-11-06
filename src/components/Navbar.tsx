import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  Ticket,
  ChevronDown,
  LogIn,
  LogOut,
  Bell,
  BellRing,
  Mail,
  Phone
} from 'lucide-react';

interface NavbarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onSignOut?: () => void;
  currentUser?: Pick<User, 'name' | 'email' | 'phone' | 'role'> | null;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenAuth,
  onSignOut,
  currentUser,
  onOpenNotifications,
  unreadNotificationCount = 0,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const accountButton = currentUser ? (
    <div className="relative">
      <button
        onClick={() => setProfileOpen((open) => !open)}
        aria-expanded={profileOpen}
        aria-label="Open account profile"
        className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 rounded-2xl transition group cursor-pointer shadow-sm"
      >
        <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
          <p className="text-[10px] text-slate-400 leading-none">{currentUser.role.replace('_', ' ')}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white ml-1 transition" />
      </button>

      {profileOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl z-50">
          <div className="border-b border-slate-800 pb-3 mb-3">
            <p className="text-sm font-bold text-white">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{currentUser.role.replace('_', ' ')}</p>
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <a href={`tel:${currentUser.phone}`} className="flex items-center gap-2 hover:text-white">
              <Phone className="w-3.5 h-3.5 text-violet-400" />
              <span>{currentUser.phone}</span>
            </a>
            <a href={`mailto:${currentUser.email}`} className="flex items-center gap-2 hover:text-white break-all">
              <Mail className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span>{currentUser.email}</span>
            </a>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                setProfileOpen(false);
                onSignOut?.();
              }}
              className="w-full px-3 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  ) : onOpenAuth ? (
    <button
      onClick={() => onOpenAuth('login')}
      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-500 text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-md shadow-violet-600/30 transition cursor-pointer"
      title="Sign in to TiketiPass"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Sign In</span>
    </button>
  ) : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Tiketi<span className="text-violet-400">Pass</span>
              </span>
            </div>
          </div>

          {/* Right Action Items */}
          {activeView === 'landing' ? (
            <div className="flex items-center">
              {accountButton}
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Browser & In-App Notification Bell */}
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                  title="Browser notifications and real-time alerts"
                >
                  {unreadNotificationCount > 0 ? (
                    <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : (
                    <Bell className="w-4 h-4 text-slate-300" />
                  )}
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-violet-600 text-white text-[10px] font-black rounded-full ring-2 ring-slate-900">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
              )}

              {accountButton}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
