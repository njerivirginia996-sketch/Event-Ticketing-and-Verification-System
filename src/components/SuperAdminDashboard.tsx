import React, { useEffect, useState } from 'react';
import { AuditLog, Organization, PayoutRequest, User } from '../types';
import {
  DollarSign,
  Users,
  XCircle,
  AlertTriangle,
  History,
  Settings,
  Key,
  TrendingUp,
  Percent,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  authToken: string;
}

type PortalCodes = {
  super_admin: string;
  organizer: string;
  gate_staff: string;
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ authToken }) => {
  const [stats, setStats] = useState({
    totalVolume: 12450000,
    totalPlatformFees: 373500,
    totalOrganizers: 2,
    totalEvents: 3,
    totalTicketsSold: 2840,
    pendingPayoutsCount: 1,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'requests' | 'payouts' | 'audit' | 'settings'>('overview');
  const [accountRequests, setAccountRequests] = useState<Omit<User, 'password'>[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [portalCodes, setPortalCodes] = useState<PortalCodes | null>(null);
  const [portalCodesLoading, setPortalCodesLoading] = useState(false);
  const [portalCodesError, setPortalCodesError] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(3);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'aud_1',
      userId: 'usr_admin',
      userName: 'Super Admin',
      role: 'super_admin',
      action: 'PLATFORM_COMMISSION_UPDATE',
      entity: 'PlatformSettings',
      entityId: 'global_config',
      timestamp: new Date().toISOString(),
      details: { commission: '3%' },
    },
    {
      id: 'aud_2',
      userId: 'usr_org1',
      userName: 'Sol Entertainment Africa',
      role: 'organizer',
      action: 'CREATE_EVENT',
      entity: 'Event',
      entityId: 'evt_solfest',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'aud_3',
      userId: 'gate_main@tiketipass.com',
      userName: 'Kiprono Gate Warden',
      role: 'gate_staff',
      action: 'BATCH_OFFLINE_SYNC',
      entity: 'ScanManifest',
      entityId: 'manifest_01',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);

  const [payouts, setPayouts] = useState<PayoutRequest[]>([
    {
      id: 'pay_01',
      orgId: 'org_sol',
      orgName: 'Sol Entertainment Africa',
      amount: 450000,
      status: 'approved',
      requestedAt: '2026-10-15T10:00:00Z',
      payoutDetails: 'Equity Bank - Acc #0810293847291',
    },
    {
      id: 'pay_02',
      orgId: 'org_tech',
      orgName: 'Nairobi Tech Hub',
      amount: 280000,
      status: 'pending',
      requestedAt: '2026-11-02T14:30:00Z',
      payoutDetails: 'KCB Bank - Acc #1122334455',
    },
  ]);

  const handleApprovePayout = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved', approvedBy: 'usr_admin' } : p))
    );
  };

  const fetchAccountRequests = async () => {
    setRequestsLoading(true);
    setRequestError(null);
    try {
      const response = await fetch('/api/admin/account-requests', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load account requests.');
      }
      setAccountRequests(data.requests);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Failed to load account requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccountRequests();
  }, [authToken]);

  useEffect(() => {
    if (activeTab !== 'security') return;

    const fetchPortalCodes = async () => {
      setPortalCodesLoading(true);
      setPortalCodesError(null);
      try {
        const response = await fetch('/api/admin/portal-codes', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load portal security codes.');
        }
        setPortalCodes(data.portalCodes);
      } catch (error) {
        setPortalCodes(null);
        setPortalCodesError(error instanceof Error ? error.message : 'Failed to load portal security codes.');
      } finally {
        setPortalCodesLoading(false);
      }
    };

    void fetchPortalCodes();
  }, [activeTab, authToken]);

  const handleApproveAccountRequest = async (id: string) => {
    setApprovingRequestId(id);
    setRequestError(null);
    try {
      const response = await fetch(`/api/admin/account-requests/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve account request.');
      }
      await fetchAccountRequests();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Failed to approve account request.');
    } finally {
      setApprovingRequestId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Platform Master Console
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-400">
            Platform-wide governance, Kenya Data Protection Act compliance, and transaction clearing.
          </p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Financial Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Portal Security</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Account Requests ({accountRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'payouts'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payout Approvals ({payouts.filter((p) => p.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Platform Settings</span>
        </button>
      </div>

      {/* TAB 1: FINANCIAL OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Gross Platform Volume</span>
              <p className="text-2xl font-black text-amber-400">
                KES {stats.totalVolume.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">+24% volume month-over-month</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Platform Commission Earned ({commissionRate}%)
              </span>
              <p className="text-2xl font-black text-emerald-400">
                KES {stats.totalPlatformFees.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">Net platform revenue</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Active Organizers</span>
              <p className="text-2xl font-black text-white">2 Approved</p>
              <p className="text-[11px] text-slate-400">Sol Entertainment, Nairobi Tech Hub</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Fraud & Collision Rate</span>
              <p className="text-2xl font-black text-emerald-400">0.00%</p>
              <p className="text-[11px] text-slate-400">HMAC-SHA256 zero false admissions</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Lock className="w-5 h-5" />
            <h3 className="text-base text-white">Portal security codes</h3>
          </div>
          <p className="text-sm text-slate-300 max-w-3xl">
            Share each code only with authorized staff for its portal. These codes are visible only to an authenticated Super Admin.
          </p>
          {portalCodesLoading ? (
            <p className="text-sm text-slate-400">Loading portal codes...</p>
          ) : portalCodesError ? (
            <p role="alert" className="text-sm text-red-300">{portalCodesError}</p>
          ) : portalCodes && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Super Admin', code: portalCodes.super_admin },
                { label: 'Event Organizer', code: portalCodes.organizer },
                { label: 'Gate Verifier', code: portalCodes.gate_staff },
              ].map(({ label, code }) => (
                <div key={label} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-2 break-all font-mono text-lg font-bold text-amber-300">
                    {code || 'Not configured'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white">Staff account requests</h3>
              <p className="text-xs text-slate-400 mt-1">Approve requests before staff or admin accounts can sign in.</p>
            </div>
            <button
              onClick={() => void fetchAccountRequests()}
              disabled={requestsLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-50"
            >
              {requestsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {requestError && (
            <p role="alert" className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
              {requestError}
            </p>
          )}

          {requestsLoading ? (
            <p className="text-sm text-slate-400">Loading requests...</p>
          ) : accountRequests.length === 0 ? (
            <p className="text-sm text-slate-400">There are no pending account requests.</p>
          ) : (
            <div className="space-y-3">
              {accountRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{request.name}</p>
                    <p className="text-xs text-slate-300">{request.email} · {request.phone}</p>
                    <p className="text-xs text-amber-300 mt-1 capitalize">
                      {request.role.replace('_', ' ')} · Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleApproveAccountRequest(request.id)}
                    disabled={approvingRequestId !== null}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {approvingRequestId === request.id ? 'Approving...' : 'Approve Account'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYOUT APPROVALS */}
      {activeTab === 'payouts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-extrabold text-white">Pending Organizer Withdrawals</h3>
          <div className="space-y-3">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{p.orgName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Destination: {p.payoutDetails}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-base font-black text-amber-400">
                    KES {p.amount.toLocaleString()}
                  </span>
                  {p.status === 'pending' && (
                    <button
                      onClick={() => handleApprovePayout(p.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      Approve & Disburse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS (FR27, NFR7) */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">Immutable Platform Audit Trail</h3>
            <span className="text-xs text-slate-400">NFR7 Kenya Data Protection Compliant</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{log.userName}</td>
                    <td className="py-2.5 px-3">{log.role}</td>
                    <td className="py-2.5 px-3 font-mono text-violet-400">{log.action}</td>
                    <td className="py-2.5 px-3">{log.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-lg">
          <h3 className="text-base font-extrabold text-white">System Governance & Keys</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Platform Service Fee (%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
                <span className="text-slate-400">% per completed ticket order</span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>HMAC QR Signing Algorithm</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Using SHA-256 HMAC cryptographic signing key with timestamped nonce to eliminate forgery.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
