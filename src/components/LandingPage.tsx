import React from 'react';
import { UserRole } from '../types';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  CreditCard,
  CheckCircle2,
  Lock,
  WifiOff,
  Clock,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onSelectPortal: (role: UserRole | 'mobile_hub', destinationView: string) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectPortal,
  onOpenAuth,
}) => {
  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 p-8 sm:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>TiketiPass • High-Concurrency Ticketing & Gate Verification</span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-[1.15]">
            Secure Event Ticketing &{' '}
            <span className="bg-gradient-to-r from-amber-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              Sub-Second Gate Verification
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Engineered for high-traffic ticket drops and stadium gates. Powered by cryptographic HMAC-SHA256 signed QR codes, Safaricom M-Pesa STK Push, 10-minute inventory holds, and offline venue verification.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm flex items-center space-x-2 shadow-xl shadow-emerald-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

          </div>

          {/* Quick Metrics */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80">
            <div>
              <p className="text-2xl font-black text-amber-400">&lt; 0.8s</p>
              <p className="text-xs text-slate-400 mt-0.5">Verification Scan Latency</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">HMAC Anti-Counterfeit</p>
            </div>
            <div>
              <p className="text-2xl font-black text-violet-400">10-Min</p>
              <p className="text-xs text-slate-400 mt-0.5">Anti-Overselling Cart Lock</p>
            </div>
            <div>
              <p className="text-2xl font-black text-cyan-400">Offline</p>
              <p className="text-xs text-slate-400 mt-0.5">Cached Stadium Sync</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-violet-400">
            Next-Generation Ticketing Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Built for Scale, Speed & Security
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            From viral on-sale traffic spikes to stadium gates with thousands of attendees entering per hour.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">M-Pesa STK Push</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless Kenyan mobile money checkout. Prompts your phone directly with instant reference validation and automated digital pass generation.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Confirmation</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">HMAC-SHA256 Anti-Fraud</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cryptographically signed rotating QR passes. Dynamic verification blocks screenshots, duplicated tickets, and counterfeit passes.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-violet-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tamper-Proof Passes</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Sub-Second Gate Scan</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-throughput optical scanning with audio and haptic indicators. Supports offline manifest syncing for venues with zero cellular reception.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>&lt;0.8s Entry Throughput</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">10-Min Hold Locking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic concurrency lock reserves tickets during checkout to prevent double-booking and cart racing during viral event sales drops.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Overselling</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-violet-400">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Three Steps to the Event
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-lg shadow-violet-600/30">
              1
            </div>
            <h3 className="text-base font-bold text-white">Discover & Select Passes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browse concerts, conferences, and festivals. Pick your preferred tier—from Early Bird to VIP Hospitality—with real-time schedule and venue details.
            </p>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-lg shadow-violet-600/30">
              2
            </div>
            <h3 className="text-base font-bold text-white">Instant M-Pesa STK Checkout</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your Safaricom mobile number and approve the PIN prompt on your phone. Your passes are instantly locked and reserved.
            </p>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-lg shadow-violet-600/30">
              3
            </div>
            <h3 className="text-base font-bold text-white">Sub-Second Gate Entry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Show your cryptographic QR code at the turnstile or gate scanner. Enjoy instant entry with verified anti-counterfeit clearance.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 border border-violet-700/40 p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl sm:text-3xl font-black">Ready to Experience Live Events?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Create your account to secure verified passes, receive start alerts, and store your tickets in one wallet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenAuth('signup')}
            className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-100 transition shadow-lg cursor-pointer"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};
