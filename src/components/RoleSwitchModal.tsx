import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  Compass,
  LayoutDashboard,
  QrCode,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  X,
  Home,
  UserCheck,
} from 'lucide-react';

interface RoleOption {
  role: UserRole | 'mobile_hub';
  roleTitle: string;
  badgeColor: string;
  description: string;
  icon: React.ReactNode;
  destinationView: string;
}

interface RoleSwitchModalProps {
  currentRole: UserRole | 'mobile_hub';
  currentUserRole: UserRole | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole | 'mobile_hub', destinationView: string) => void;
  onGoHome: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  currentRole,
  currentUserRole,
  isOpen,
  onClose,
  onSelectRole,
  onGoHome,
  onOpenAuth,
}) => {
  const [accessNotice, setAccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const roles: RoleOption[] = [
    {
      role: 'attendee',
      roleTitle: 'Attendee / Buyer',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      description: 'Browse live events, buy tickets, and manage digital passes.',
      icon: <Compass className="w-5 h-5 text-violet-400" />,
      destinationView: 'events',
    },
    {
      role: 'organizer',
      roleTitle: 'Event Organizer',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Create events, track sales, and manage event operations.',
      icon: <LayoutDashboard className="w-5 h-5 text-amber-400" />,
      destinationView: 'organizer',
    },
    {
      role: 'gate_staff',
      roleTitle: 'Gate Verifier',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Verify tickets and manage gate check-ins.',
      icon: <QrCode className="w-5 h-5 text-emerald-400" />,
      destinationView: 'scanner',
    },
    {
      role: 'super_admin',
      roleTitle: 'Super Admin',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      description: 'Manage platform governance, payouts, and audit records.',
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      destinationView: 'admin',
    },
    {
      role: 'mobile_hub',
      roleTitle: 'React Native & Supabase Hub',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Explore the mobile simulator and developer resources.',
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
      destinationView: 'mobile',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Choose a portal</h3>
              <p className="text-xs text-slate-400">Staff portals require a matching signed-in account.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close portal selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {accessNotice && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs">
            {accessNotice}
          </div>
        )}

        <div className="space-y-2.5">
          {roles.map((option) => {
            const isActive = currentRole === option.role;
            const isPrivileged =
              option.role === 'organizer' || option.role === 'gate_staff' || option.role === 'super_admin';

            return (
              <button
                key={option.role}
                type="button"
                onClick={() => {
                  if (isPrivileged && currentUserRole !== option.role) {
                    setAccessNotice(`Sign in with an authorized ${option.roleTitle} account to open this portal.`);
                    return;
                  }
                  setAccessNotice(null);
                  onSelectRole(option.role, option.destinationView);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between ${
                  isActive
                    ? 'bg-violet-950/40 border-violet-500 ring-1 ring-violet-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-start space-x-3">
                  <span className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {option.icon}
                  </span>
                  <span className="space-y-1">
                    <span className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-white">{option.roleTitle}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${option.badgeColor}`}>
                        {option.roleTitle}
                      </span>
                    </span>
                    <span className="block text-[11px] text-slate-400 leading-snug">{option.description}</span>
                  </span>
                </span>
                {isActive && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-2 mt-1" />}
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => {
              onGoHome();
              onClose();
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition border border-slate-700"
          >
            <Home className="w-4 h-4 text-violet-400" />
            <span>Landing Page</span>
          </button>

          <div className="flex items-center space-x-2">
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="px-3.5 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-bold rounded-xl transition border border-violet-500/30 cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
