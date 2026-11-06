import React, { useState } from 'react';
import { REACT_NATIVE_EXPO_CODE, SUPABASE_SQL_SCHEMA } from '../utils/mobileExport';
import {
  Smartphone,
  Database,
  Copy,
  Check,
  Code2,
  Layers,
  Zap,
  Shield,
  Download,
  Terminal
} from 'lucide-react';

export const ReactNativeHub: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'react_native' | 'supabase_sql' | 'architecture'>('react_native');
  const [copied, setCopied] = useState<string | null>(null);

  // Phone simulator state
  const [phoneScreen, setPhoneScreen] = useState<'scanner' | 'tickets'>('scanner');
  const [simScanResult, setSimScanResult] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Mobile Infrastructure Hub
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">React Native & Supabase Real-Time Stack</h1>
          <p className="text-xs text-slate-400">
            Exportable React Native (Expo) code and production PostgreSQL schema for high-concurrency ticket traffic.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCopy(REACT_NATIVE_EXPO_CODE, 'rn')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
          >
            {copied === 'rn' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied === 'rn' ? 'Code Copied!' : 'Copy React Native Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Mobile Phone Simulator + Code Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Mobile Phone Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-slate-950 border-4 border-slate-800 rounded-[48px] p-4 shadow-2xl shadow-cyan-950/30 relative">
            {/* Phone Notch */}
            <div className="w-32 h-5 bg-slate-800 rounded-b-2xl mx-auto mb-3 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
              <div className="w-10 h-1.5 rounded-full bg-slate-900" />
            </div>

            {/* Mobile App Header */}
            <div className="px-3 pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400">
                  TIKETIPASS MOBILE
                </span>
                <p className="text-xs font-extrabold text-white">Gate A - Main Entrance</p>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                100%
              </span>
            </div>

            {/* Mobile Viewport Screen */}
            <div className="my-3 min-h-[380px] bg-slate-900 rounded-3xl p-4 flex flex-col justify-between overflow-hidden relative border border-slate-800">
              {phoneScreen === 'scanner' ? (
                <div className="space-y-4">
                  {/* Viewfinder Target */}
                  <div className="relative w-48 h-48 mx-auto mt-4 border-2 border-dashed border-emerald-500/50 rounded-2xl flex items-center justify-center bg-slate-950/80">
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    <Smartphone className="w-10 h-10 text-emerald-400/50 animate-pulse" />
                  </div>

                  <p className="text-center text-[11px] text-slate-400 font-medium">
                    Center attendee's QR code in the viewfinder
                  </p>

                  {/* Simulate Scans */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setSimScanResult('VALID')}
                      className="p-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold text-center active:scale-95 transition"
                    >
                      Test Pass (Green)
                    </button>
                    <button
                      onClick={() => setSimScanResult('USED')}
                      className="p-2 rounded-xl bg-amber-600 text-white text-[11px] font-bold text-center active:scale-95 transition"
                    >
                      Test Duplicate
                    </button>
                  </div>

                  {simScanResult && (
                    <div
                      className={`p-3 rounded-2xl text-center text-xs font-bold ${
                        simScanResult === 'VALID'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {simScanResult === 'VALID' ? 'ENTRY APPROVED ✓' : 'ALREADY SCANNED ⚠️'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-violet-400">TKP-SOL-88219</span>
                    <h5 className="text-xs font-bold text-white">Sol Generation Fest</h5>
                    <p className="text-[10px] text-slate-400">VIP Golden Circle Pass</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-violet-400">TKP-TECH-10992</span>
                    <h5 className="text-xs font-bold text-white">Silicon Savannah Summit</h5>
                    <p className="text-[10px] text-slate-400">Delegate Admission</p>
                  </div>
                </div>
              )}

              {/* Bottom Nav on Mobile */}
              <div className="pt-3 border-t border-slate-800 flex justify-around">
                <button
                  onClick={() => setPhoneScreen('scanner')}
                  className={`text-[11px] font-bold ${
                    phoneScreen === 'scanner' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  Scanner
                </button>
                <button
                  onClick={() => setPhoneScreen('tickets')}
                  className={`text-[11px] font-bold ${
                    phoneScreen === 'tickets' ? 'text-violet-400' : 'text-slate-500'
                  }`}
                >
                  My Passes
                </button>
              </div>
            </div>

            {/* Phone Home Bar */}
            <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto mt-2" />
          </div>
        </div>

        {/* Right Column: Code Viewer & Architecture Tabs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex border-b border-slate-800 space-x-4">
            <button
              onClick={() => setActiveCodeTab('react_native')}
              className={`pb-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
                activeCodeTab === 'react_native'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>React Native (Expo) Code</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('supabase_sql')}
              className={`pb-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
                activeCodeTab === 'supabase_sql'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase / PostgreSQL Schema</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('architecture')}
              className={`pb-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
                activeCodeTab === 'architecture'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Concurrency Architecture</span>
            </button>
          </div>

          {/* TAB 1: REACT NATIVE CODE */}
          {activeCodeTab === 'react_native' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  GateScannerApp.tsx (Expo Camera + Audio + Haptics)
                </span>
                <button
                  onClick={() => handleCopy(REACT_NATIVE_EXPO_CODE, 'rn_code')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  {copied === 'rn_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'rn_code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed">
                {REACT_NATIVE_EXPO_CODE}
              </pre>
            </div>
          )}

          {/* TAB 2: SUPABASE SQL */}
          {activeCodeTab === 'supabase_sql' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  supabase_schema.sql (Atomic Locks & RLS Policies)
                </span>
                <button
                  onClick={() => handleCopy(SUPABASE_SQL_SCHEMA, 'sql_code')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  {copied === 'sql_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'sql_code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[460px] leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {/* TAB 3: HIGH CONCURRENCY ARCHITECTURE */}
          {activeCodeTab === 'architecture' && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
              <h4 className="text-base font-extrabold text-white">
                How TiketiPass Handles High-Concurrency & High-Velocity Traffic
              </h4>

              <div className="space-y-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="font-bold text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>1. 10-Minute Cart Lock & Row-Level Inventory Reservation</span>
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    During blockbuster ticket drops (like Sol Fest early bird passes), thousands of buyers attempt checkout simultaneously. The system provisions a 10-minute hold reservation with atomic database decrements, preventing overselling even during massive traffic spikes.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
                  <span className="font-bold text-white flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>2. Sub-Second HMAC Signature Gate Validation</span>
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Gate scanning uses constant-time HMAC-SHA256 signature verification. No forged QR codes or screenshots can pass. Even if internet fails at the stadium, gate staff download the SHA-256 hashed ticket manifest before gates open for 100% offline verification.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
