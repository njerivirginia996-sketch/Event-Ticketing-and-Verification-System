import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { sound } from '../utils/sound';
import { EventItem, ScanLog, Ticket } from '../types';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  History,
  ShieldAlert,
  ArrowRight,
  Database,
  Smartphone
} from 'lucide-react';

interface GateScannerProps {
  events: EventItem[];
  currentStaffName?: string;
}

export const GateScanner: React.FC<GateScannerProps> = ({
  events,
  currentStaffName = 'Kiprono Gate Warden',
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedGate, setSelectedGate] = useState<string>('Gate A - Main Entrance');

  // Scanner Mode
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Sound & Vibration Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Scan Results
  const [latestResult, setLatestResult] = useState<{
    status: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'TRANSFERRED' | 'WRONG_EVENT';
    title: string;
    message: string;
    holderName?: string;
    ticketNumber?: string;
    ticketType?: string;
    firstScan?: { checkedInAt?: string; gate?: string };
    reentry?: boolean;
  } | null>(null);

  // Real-time Counters
  const [validCount, setValidCount] = useState<number>(0);
  const [blockedCount, setBlockedCount] = useState<number>(0);

  // Offline Mode State (FR28)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineManifest, setOfflineManifest] = useState<any[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Manual Search State (FR29)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual' | 'history'>('scanner');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Load Scan History from server
  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/verify/logs?eventId=${selectedEventId}&limit=25`);
      const data = await res.json();
      if (data.success) {
        setScanHistory(data.logs);
      }
    } catch {}
  };

  useEffect(() => {
    loadHistory();
  }, [selectedEventId]);

  // Download Offline Manifest (FR28)
  const downloadOfflineManifest = async () => {
    try {
      setSyncStatus('Downloading hashed ticket database...');
      const res = await fetch(`/api/verify/offline-manifest/${selectedEventId}`);
      const data = await res.json();
      if (data.success) {
        setOfflineManifest(data.manifest);
        setSyncStatus(`Offline mode ready: ${data.totalTickets} tickets cached in secure phone storage.`);
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch {
      setSyncStatus('Failed to download offline database');
    }
  };

  // Sync Offline Queue Back to Server (FR28)
  const syncOfflineScans = async () => {
    if (offlineQueue.length === 0) return;
    setSyncStatus(`Syncing ${offlineQueue.length} offline scans to cloud...`);

    try {
      const res = await fetch('/api/verify/offline-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scans: offlineQueue }),
      });
      const data = await res.json();
      if (data.success) {
        setOfflineQueue([]);
        setSyncStatus(`Successfully synchronized ${data.processedCount} scans.`);
        loadHistory();
        setTimeout(() => setSyncStatus(null), 3500);
      }
    } catch {
      setSyncStatus('Sync failed: Network unreachable. Scans remain safely queued.');
    }
  };

  // Process a QR code payload or test simulation
  const processScan = async (qrData: string) => {
    // 1. If Offline Mode is Active
    if (isOfflineMode) {
      handleOfflineScan(qrData);
      return;
    }

    // 2. Real-time Server API verification
    try {
      const res = await fetch('/api/verify/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData,
          eventId: selectedEventId,
          gate: selectedGate,
          staffName: currentStaffName,
          deviceId: 'Mobile-Gate-Scanner-01',
        }),
      });

      const data = await res.json();

      if (data.result === 'VALID') {
        if (soundEnabled) sound.playSuccess();
        setValidCount((prev) => prev + 1);
        setLatestResult({
          status: 'VALID',
          title: data.reentry ? 'VALID RE-ENTRY' : 'ENTRY APPROVED',
          message: data.message,
          holderName: data.ticket?.holderName,
          ticketNumber: data.ticket?.ticketNumber,
          ticketType: data.ticket?.ticketTypeName,
          reentry: data.reentry,
        });
      } else if (data.result === 'ALREADY_USED') {
        if (soundEnabled) sound.playWarning();
        setBlockedCount((prev) => prev + 1);
        setLatestResult({
          status: 'ALREADY_USED',
          title: 'ALREADY CHECKED IN',
          message: data.message,
          holderName: data.ticket?.holderName,
          ticketNumber: data.ticket?.ticketNumber,
          firstScan: data.firstScan,
        });
      } else {
        if (soundEnabled) sound.playError();
        setBlockedCount((prev) => prev + 1);
        setLatestResult({
          status: data.result || 'INVALID',
          title: data.title || 'ENTRY REJECTED',
          message: data.message || 'Invalid or unverified ticket pass.',
          holderName: data.ticket?.holderName,
          ticketNumber: data.ticket?.ticketNumber,
        });
      }

      loadHistory();
    } catch {
      if (soundEnabled) sound.playError();
      setLatestResult({
        status: 'INVALID',
        title: 'NETWORK ERROR',
        message: 'Could not connect to verification server. Switch to Offline Mode if network is down.',
      });
    }
  };

  // Offline Verification Handler (FR28)
  const handleOfflineScan = (qrData: string) => {
    let ticketNumber = qrData;
    let ticketId = qrData;

    try {
      let jsonStr = qrData;
      if (qrData.startsWith('ey') || !qrData.startsWith('{')) {
        jsonStr = atob(qrData);
      }
      const parsed = JSON.parse(jsonStr);
      ticketNumber = parsed.ticketNumber;
      ticketId = parsed.ticketId;
    } catch {}

    const matched = offlineManifest.find(
      (m) => m.ticketNumber === ticketNumber || m.id === ticketId
    );

    const now = new Date().toISOString();

    if (!matched) {
      if (soundEnabled) sound.playError();
      setBlockedCount((p) => p + 1);
      setLatestResult({
        status: 'INVALID',
        title: 'OFFLINE REJECT: NOT FOUND',
        message: 'Ticket is not in the cached event manifest.',
      });
      return;
    }

    if (matched.status === 'USED') {
      if (soundEnabled) sound.playWarning();
      setBlockedCount((p) => p + 1);
      setLatestResult({
        status: 'ALREADY_USED',
        title: 'OFFLINE: ALREADY SCANNED',
        message: `Ticket ${matched.ticketNumber} was already scanned locally.`,
        holderName: matched.holderName,
        ticketNumber: matched.ticketNumber,
      });
      return;
    }

    // Mark used locally and queue for sync
    matched.status = 'USED';
    setOfflineManifest([...offlineManifest]);

    const queuedScan = {
      ticketId: matched.id,
      ticketNumber: matched.ticketNumber,
      eventId: selectedEventId,
      gate: selectedGate,
      timestamp: now,
      staffId: 'staff_offline',
      staffName: currentStaffName,
      deviceId: 'Mobile-Offline-Terminal',
    };

    setOfflineQueue((prev) => [...prev, queuedScan]);
    setValidCount((p) => p + 1);
    if (soundEnabled) sound.playSuccess();

    setLatestResult({
      status: 'VALID',
      title: 'OFFLINE ENTRY APPROVED',
      message: `Verified against cached manifest. Queued for server sync (${offlineQueue.length + 1} pending).`,
      holderName: matched.holderName,
      ticketNumber: matched.ticketNumber,
      ticketType: matched.ticketTypeName,
    });
  };

  // Toggle Camera
  useEffect(() => {
    if (isCameraActive && activeTab === 'scanner') {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            processScan(decodedText);
          },
          () => {}
        )
        .catch((err) => {
          console.warn('Camera failed:', err);
          setCameraError('Camera access not granted or not available on this device.');
          setIsCameraActive(false);
        });

      return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [isCameraActive, activeTab]);

  // Manual Search Execution (FR29)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/verify/search?q=${encodeURIComponent(searchQuery.trim())}&eventId=${selectedEventId}`
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch {
      console.error('Search error');
    } finally {
      setIsSearching(false);
    }
  };

  // Quick Simulation Scenarios for Instant Validation
  const simulateScanScenario = (scenario: 'valid' | 'used' | 'counterfeit' | 'transferred') => {
    if (scenario === 'valid') {
      processScan('TKP-SOL-88219');
    } else if (scenario === 'used') {
      processScan('TKP-SOL-44102');
    } else if (scenario === 'transferred') {
      processScan('TKP-TECH-10992');
    } else {
      // Counterfeit
      processScan(
        JSON.stringify({
          ticketId: 'fake_999',
          eventId: selectedEventId,
          ticketNumber: 'TKP-FAKE-000',
          ts: Date.now(),
          sig: '0000000000000000000000000000000000000000000000000000000000000000',
        })
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header & Mobile Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Gate Verification Terminal
            </span>
          </div>
          <h1 className="text-xl font-black text-white mt-0.5">Staff Verifier: {currentStaffName}</h1>
        </div>

        {/* Gate & Event Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option>Gate A - Main Entrance</option>
            <option>Gate B - VIP Express</option>
            <option>Gate C - Media & Backstage</option>
          </select>

          {/* Audio Feedback Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={soundEnabled ? 'Audio Chime Enabled' : 'Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real-time Tally Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Valid Entries</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{validCount}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Blocked / Duplicate</p>
            <p className="text-2xl font-black text-red-400 mt-0.5">{blockedCount}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500/30" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Current Gate</p>
            <p className="text-sm font-extrabold text-white mt-1 truncate max-w-[120px]">
              {selectedGate.split(' - ')[0]}
            </p>
          </div>
          <QrCode className="w-8 h-8 text-violet-500/30" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Offline Queue</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{offlineQueue.length}</p>
          </div>
          <Database className="w-8 h-8 text-amber-500/30" />
        </div>
      </div>

      {/* Offline Mode Alert & Controls (FR28) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isOfflineMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <div>
            <p className="text-xs font-extrabold text-white">
              {isOfflineMode ? '⚡ OFFLINE MODE ACTIVE' : '🌐 REAL-TIME CLOUD MODE ACTIVE'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isOfflineMode
                ? 'Verifying against local manifest cache. Zero internet required.'
                : 'Direct cloud server HMAC verification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={downloadOfflineManifest}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Download Manifest</span>
          </button>

          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition ${
              isOfflineMode
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOfflineMode ? 'Offline On' : 'Go Offline'}</span>
          </button>

          {offlineQueue.length > 0 && (
            <button
              onClick={syncOfflineScans}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center space-x-1 shadow-md shadow-emerald-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sync {offlineQueue.length} Scans</span>
            </button>
          )}
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-violet-950/60 border border-violet-700/50 rounded-xl text-violet-300 text-xs font-semibold">
          {syncStatus}
        </div>
      )}

      {/* Tabs: Camera Scanner | Manual Search | History */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'scanner'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>QR Scanner & Test Bench</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Manual Search Fallback</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Scan Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: SCANNER VIEW */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Main Dark-mode Viewport (High-contrast for phone screens) */}
          <div className="relative bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden min-h-[340px] flex flex-col items-center justify-center p-6 shadow-2xl">
            {isCameraActive ? (
              <div className="w-full max-w-sm relative">
                <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" />
                <button
                  onClick={() => setIsCameraActive(false)}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Camera
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Camera className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Live Camera QR Scanner</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Point camera at attendee's TiketiPass QR code for instant entry verification.
                  </p>
                </div>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition"
                >
                  Start Camera Scanner
                </button>
                {cameraError && <p className="text-xs text-red-400">{cameraError}</p>}
              </div>
            )}
          </div>

          {/* Instant Test Simulator Bench (Allows user to test all 4 scan results without printing) */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Instant Verification Test Bench
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">1-Click Test Scenarios</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => simulateScanScenario('valid')}
                className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 text-left transition"
              >
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Scan Valid VIP</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">TKP-SOL-88219</p>
              </button>

              <button
                onClick={() => simulateScanScenario('used')}
                className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 text-left transition"
              >
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Scan Used Ticket</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">TKP-SOL-44102</p>
              </button>

              <button
                onClick={() => simulateScanScenario('transferred')}
                className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-left transition"
              >
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-violet-400" />
                  <span>Scan Transferred</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Revoked Old Pass</p>
              </button>

              <button
                onClick={() => simulateScanScenario('counterfeit')}
                className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-left transition"
              >
                <div className="flex items-center space-x-1.5 text-red-400 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>Scan Counterfeit</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Forged Signature</p>
              </button>
            </div>
          </div>

          {/* Result Banner Overlay (High Impact Visual Response FR26) */}
          {latestResult && (
            <div
              className={`p-6 rounded-3xl border-2 transition-all transform animate-in fade-in duration-200 ${
                latestResult.status === 'VALID'
                  ? 'bg-emerald-950 border-emerald-500 text-white'
                  : latestResult.status === 'ALREADY_USED'
                  ? 'bg-amber-950 border-amber-500 text-white'
                  : 'bg-red-950 border-red-500 text-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {latestResult.status === 'VALID' ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : latestResult.status === 'ALREADY_USED' ? (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{latestResult.title}</h2>
                    <p className="text-xs opacity-90 mt-0.5">{latestResult.message}</p>
                  </div>
                </div>

                <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/40 font-bold">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              {latestResult.holderName && (
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="opacity-70">Attendee</span>
                    <p className="font-extrabold text-sm mt-0.5">{latestResult.holderName}</p>
                  </div>
                  <div>
                    <span className="opacity-70">Ticket Number</span>
                    <p className="font-mono font-extrabold text-sm mt-0.5">
                      {latestResult.ticketNumber}
                    </p>
                  </div>
                  <div>
                    <span className="opacity-70">Tier</span>
                    <p className="font-bold text-sm mt-0.5">{latestResult.ticketType || 'VIP'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL SEARCH FALLBACK (FR29) */}
      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-white">Manual Attendee Search & Fallback Check-in</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Search by Ticket Number (e.g. TKP-SOL-88219), Attendee Name, Email, or Phone.
            </p>
          </div>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search ticket number, phone (+2547...), or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            {searchResults.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-extrabold text-violet-400">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ticket.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ticket.status === 'USED'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{ticket.holderName}</h4>
                  <p className="text-xs text-slate-400">
                    {ticket.ticketTypeName} • {ticket.holderEmail} • {ticket.holderPhone}
                  </p>
                </div>

                <button
                  onClick={() => processScan(ticket.ticketNumber)}
                  disabled={ticket.status !== 'ACTIVE'}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {ticket.status === 'ACTIVE' ? 'Check In Now' : 'Cannot Check In'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SCAN AUDIT LOGS (FR27) */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">Live Scan History</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Gate</th>
                  <th className="py-2.5 px-3">Verifier</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {scanHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'VALID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.result === 'ALREADY_USED'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      {log.ticketNumber}
                    </td>
                    <td className="py-2.5 px-3">{log.gate}</td>
                    <td className="py-2.5 px-3">{log.staffName}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.isOfflineSynced ? (
                        <span className="text-[10px] text-amber-400 font-bold">Offline Synced</span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">Cloud Live</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
