/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Raw Biometric Device Logs Component
 * Detailed 30-Day Terminal Check-in/out Timestamps for Authorized Roles
 * Conforms to PRD §5.6, §5.13 and Technical Architecture
 */

import React, { useState, useMemo } from 'react';
import {
  Fingerprint,
  ScanFace,
  CreditCard,
  Hand,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  X,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { Employee, Locale, Role } from '../types';
import {
  RawBiometricLog,
  BiometricTerminal,
  BIOMETRIC_TERMINALS,
  generate30DaysBiometricLogs,
  getBiometricStats,
  downloadBiometricLogsCSV,
  BiometricVerifyMode,
  BiometricPunchState,
  BiometricSyncStatus,
} from '../data/biometricLogsData';
import { toBanglaDigits } from '../data/translations';

interface BiometricLogsProps {
  employees: Employee[];
  locale: Locale;
  currentRole: Role;
  currentEmpId: string;
}

export const BiometricLogs: React.FC<BiometricLogsProps> = ({
  employees,
  locale,
  currentRole,
  currentEmpId,
}) => {
  // Generate initial 30 days dataset
  const [logs, setLogs] = useState<RawBiometricLog[]>(() => generate30DaysBiometricLogs(employees));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<RawBiometricLog | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '14d' | '7d' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('2026-10-30');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Overall Stats
  const stats = useMemo(() => getBiometricStats(logs), [logs]);

  // Distinct departments from logs
  const departmentList = useMemo(() => {
    const map = new Map<string, { id: string; nameEn: string; nameBn: string }>();
    logs.forEach(l => {
      if (!map.has(l.deptId)) {
        map.set(l.deptId, { id: l.deptId, nameEn: l.deptNameEn, nameBn: l.deptNameBn });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      // Date filter
      if (dateFilter === 'today') {
        if (item.dateKey !== '2026-10-30') return false;
      } else if (dateFilter === '7d') {
        if (item.dateKey < '2026-10-24') return false;
      } else if (dateFilter === '14d') {
        if (item.dateKey < '2026-10-17') return false;
      } else if (dateFilter === 'custom') {
        if (item.dateKey !== customDate) return false;
      }

      // Device filter
      if (deviceFilter !== 'all' && item.deviceId !== deviceFilter) return false;

      // Department filter
      if (deptFilter !== 'all' && item.deptId !== deptFilter) return false;

      // Mode filter
      if (modeFilter !== 'all' && item.verifyMode !== modeFilter) return false;

      // Punch state filter
      if (stateFilter !== 'all' && item.punchState !== stateFilter) return false;

      // Sync status filter
      if (statusFilter !== 'all' && item.syncStatus !== statusFilter) return false;

      // Search query (matches Emp ID, name en/bn, terminal name, device ID, IP)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.empId.toLowerCase().includes(q) ||
          item.empNameEn.toLowerCase().includes(q) ||
          item.empNameBn.includes(q) ||
          item.deviceId.toLowerCase().includes(q) ||
          item.deviceNameEn.toLowerCase().includes(q) ||
          item.ipAddress.includes(q) ||
          item.deviceUserId.includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [logs, dateFilter, customDate, deviceFilter, deptFilter, modeFilter, stateFilter, statusFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset page when filter changes
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  // Simulate hardware buffer refresh / live punch capture
  const handleRefreshBuffer = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate injecting a fresh real-time punch on Oct 30
      const now = new Date();
      const timeStr = `08:${now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()}:${now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()}`;
      const newLog: RawBiometricLog = {
        id: `bio-live-${Date.now().toString().slice(-5)}`,
        punchTime: `2026-10-30 ${timeStr}`,
        dateKey: '2026-10-30',
        timeStr,
        empId: currentEmpId || '20045',
        empNameEn: 'Md. Rahim Uddin',
        empNameBn: 'মোঃ রহিম উদ্দিন',
        deptId: 'casting',
        deptNameEn: 'Casting & Moulding',
        deptNameBn: 'কাস্টিং ও মোল্ডিং',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        deviceId: 'zk-fact-01',
        deviceNameEn: 'Turnstile Gate 01',
        deviceNameBn: 'টার্নস্টাইল গেট ০১',
        terminalLocationEn: 'Factory Main Gate, Tongi',
        terminalLocationBn: 'কারখানা মেইন গেট, টঙ্গী',
        ipAddress: '192.168.10.201',
        verifyMode: 'face',
        punchState: 'check_in',
        syncStatus: 'synced',
        deviceUserId: '1045',
        matchScore: 99,
        notes: 'Real-time live push received via ZK Push Protocol port 4370',
      };

      setLogs(prev => [newLog, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  const handleExportCSV = () => {
    const filename = `charu_biometric_device_punches_30d_${dateFilter}.csv`;
    downloadBiometricLogsCSV(filteredLogs, filename);
  };

  // Format mode icon
  const renderModeIcon = (mode: BiometricVerifyMode) => {
    switch (mode) {
      case 'face':
        return <ScanFace className="w-3.5 h-3.5 text-blue-600" />;
      case 'fingerprint':
        return <Fingerprint className="w-3.5 h-3.5 text-purple-600" />;
      case 'rfid':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case 'palm':
        return <Hand className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Fingerprint className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const getModeLabel = (mode: BiometricVerifyMode) => {
    switch (mode) {
      case 'face':
        return locale === 'bn' ? 'ফেস স্ক্যান' : 'Face Recog';
      case 'fingerprint':
        return locale === 'bn' ? 'ফিঙ্গারপ্রিন্ট' : 'Fingerprint';
      case 'rfid':
        return locale === 'bn' ? 'আরএফআইডি কার্ড' : 'RFID Card';
      case 'palm':
        return locale === 'bn' ? 'পাম স্ক্যান' : 'Palm Vein';
    }
  };

  const getPunchStateBadge = (state: BiometricPunchState) => {
    switch (state) {
      case 'check_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E7F6EC] text-[#15803D] border border-[#15803D]/20">
            <ArrowDownLeft className="w-3 h-3 text-[#15803D]" />
            <span>{locale === 'bn' ? 'প্রবেশ (ইন)' : 'Check-In'}</span>
          </span>
        );
      case 'check_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#4338CA] border border-[#4338CA]/20">
            <ArrowUpRight className="w-3 h-3 text-[#4338CA]" />
            <span>{locale === 'bn' ? 'প্রস্থান (আউট)' : 'Check-Out'}</span>
          </span>
        );
      case 'break_out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20">
            <span>{locale === 'bn' ? 'বিরতি আউট' : 'Break-Out'}</span>
          </span>
        );
      case 'break_in':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20">
            <span>{locale === 'bn' ? 'বিরতি ইন' : 'Break-In'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. COMPONENT HEADER & ACTIONS */}
      <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0D0D0D] text-[#EC1C24] flex items-center justify-center shrink-0 shadow-sm border border-white/10">
              <Fingerprint className="w-6 h-6 text-[#EC1C24]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg text-[#2A1A1B] tracking-tight">
                  {locale === 'bn' ? 'বায়োমেট্রিক ডিভাইস পাঞ্চ লগ' : 'Biometric Device Raw Logs'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EC1C24]/10 text-[#EC1C24] border border-[#EC1C24]/20">
                  {locale === 'bn' ? 'গত ৩০ দিন (১–৩০ অক্টো ২০২৬)' : 'Last 30 Days (Oct 1–30, 2026)'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E7F6EC] text-[#15803D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-ping" />
                  <span>{locale === 'bn' ? 'লাইভ জেডকেটেকো ব্রিজ সক্রিয়' : 'Live ZKTeco Bridge Active'}</span>
                </span>
              </div>
              <p className="text-xs text-[#8C7B7C] mt-1">
                {locale === 'bn'
                  ? 'কারখানার সকল হার্ডওয়্যার টার্মিনাল (টার্নস্টাইল ১ ও ২, টানেল কিলন, কাস্টিং ও হেড অফিস) থেকে প্রাপ্ত অপরিবর্তিত রিয়েলটাইম পাঞ্চ ডেটা।'
                  : 'Immutable raw device timestamps, IP addresses, verification modes, and match confidence scores directly from ZKTeco terminals.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Terminals Status Button */}
            <button
              onClick={() => setShowTerminalModal(true)}
              className="px-3.5 py-2 rounded-xl border border-[#EDE4DC] hover:border-[#2A1A1B] text-xs font-bold text-[#2A1A1B] bg-[#FBF6F2] hover:bg-white transition flex items-center gap-2 shadow-xs"
            >
              <Server className="w-4 h-4 text-[#EC1C24]" />
              <span>{locale === 'bn' ? 'টার্মিনাল হার্ডওয়্যার (৫টি)' : 'Terminals (5 Devices)'}</span>
            </button>

            {/* Refresh Live Buffer */}
            <button
              onClick={handleRefreshBuffer}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl border border-[#EDE4DC] hover:border-[#2A1A1B] text-xs font-bold text-[#2A1A1B] bg-white transition flex items-center gap-2 shadow-xs disabled:opacity-50"
              title="Ping terminals and pull newest punches"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8C7B7C] ${isRefreshing ? 'animate-spin text-[#EC1C24]' : ''}`} />
              <span>{locale === 'bn' ? 'সিঙ্ক রিফ্রেশ' : 'Refresh Buffer'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-[#0D0D0D] hover:bg-[#2A1A1B] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#EC1C24]" />
              <span>{locale === 'bn' ? 'সিএসভি ডাউনলোড' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* 2. STATS SUMMARY ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-[#EDE4DC]/80">
          <div className="bg-[#FBF6F2] p-3 rounded-xl border border-[#EDE4DC]">
            <div className="text-[11px] font-semibold text-[#8C7B7C] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#EC1C24]" />
              <span>{locale === 'bn' ? 'মোট রিয়েল পাঞ্চ' : 'Total Raw Punches'}</span>
            </div>
            <div className="text-xl font-extrabold text-[#2A1A1B] mt-1 font-mono">
              {locale === 'bn' ? toBanglaDigits(stats.totalPunches) : stats.totalPunches}
              <span className="text-[11px] font-normal text-[#8C7B7C] ml-1">
                ({locale === 'bn' ? '৩০ দিন' : '30 days'})
              </span>
            </div>
          </div>

          <div className="bg-[#FBF6F2] p-3 rounded-xl border border-[#EDE4DC]">
            <div className="text-[11px] font-semibold text-[#8C7B7C] flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#15803D]" />
              <span>{locale === 'bn' ? 'প্রবেশ (Check-In)' : 'Total Check-Ins'}</span>
            </div>
            <div className="text-xl font-extrabold text-[#15803D] mt-1 font-mono">
              {locale === 'bn' ? toBanglaDigits(stats.totalCheckIns) : stats.totalCheckIns}
            </div>
          </div>

          <div className="bg-[#FBF6F2] p-3 rounded-xl border border-[#EDE4DC]">
            <div className="text-[11px] font-semibold text-[#8C7B7C] flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>{locale === 'bn' ? 'প্রস্থান (Check-Out)' : 'Total Check-Outs'}</span>
            </div>
            <div className="text-xl font-extrabold text-[#4338CA] mt-1 font-mono">
              {locale === 'bn' ? toBanglaDigits(stats.totalCheckOuts) : stats.totalCheckOuts}
            </div>
          </div>

          <div className="bg-[#FBF6F2] p-3 rounded-xl border border-[#EDE4DC]">
            <div className="text-[11px] font-semibold text-[#8C7B7C] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>{locale === 'bn' ? 'সক্রিয় টার্মিনাল' : 'Active Terminals'}</span>
            </div>
            <div className="text-xl font-extrabold text-[#2A1A1B] mt-1 font-mono flex items-center gap-2">
              <span>{locale === 'bn' ? `${toBanglaDigits(stats.activeTerminals)}/${toBanglaDigits(stats.totalTerminals)}` : `${stats.activeTerminals}/${stats.totalTerminals}`}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div className="bg-[#FBF6F2] p-3 rounded-xl border border-[#EDE4DC]">
            <div className="text-[11px] font-semibold text-[#8C7B7C] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{locale === 'bn' ? 'সিঙ্ক নির্ভুলতা' : 'Sync Accuracy'}</span>
            </div>
            <div className="text-xl font-extrabold text-[#2A1A1B] mt-1 font-mono">
              {locale === 'bn' ? `${toBanglaDigits(stats.syncRatePercentage)}%` : `${stats.syncRatePercentage}%`}
              {stats.flaggedPunches > 0 && (
                <span className="text-[11px] text-amber-600 font-semibold ml-1.5">
                  ({locale === 'bn' ? `${toBanglaDigits(stats.flaggedPunches)} ফ্ল্যাগড` : `${stats.flaggedPunches} flagged`})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MULTI-FILTER CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-[#EDE4DC] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="inline-flex p-1 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs font-bold">
            <button
              onClick={() => handleFilterChange(setDateFilter, 'all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'all'
                  ? 'bg-[#0D0D0D] text-white shadow-xs'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? 'সকল ৩০ দিন' : 'All 30 Days'}
            </button>
            <button
              onClick={() => handleFilterChange(setDateFilter, '14d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === '14d'
                  ? 'bg-[#0D0D0D] text-white shadow-xs'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? 'গত ১৪ দিন' : 'Last 14 Days'}
            </button>
            <button
              onClick={() => handleFilterChange(setDateFilter, '7d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === '7d'
                  ? 'bg-[#0D0D0D] text-white shadow-xs'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days'}
            </button>
            <button
              onClick={() => handleFilterChange(setDateFilter, 'today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'today'
                  ? 'bg-[#EC1C24] text-white shadow-xs'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? 'আজকের পাঞ্চ (৩০ অক্টো)' : 'Today (Oct 30)'}
            </button>
            <button
              onClick={() => handleFilterChange(setDateFilter, 'custom')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'custom'
                  ? 'bg-[#0D0D0D] text-white shadow-xs'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? 'কাস্টম তারিখ' : 'Custom Date'}
            </button>
          </div>

          {/* Custom Date Input if selected */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8C7B7C]">
                {locale === 'bn' ? 'তারিখ নির্বাচন:' : 'Select Date:'}
              </span>
              <input
                type="date"
                min="2026-10-01"
                max="2026-10-30"
                value={customDate}
                onChange={e => handleFilterChange(setCustomDate, e.target.value)}
                className="px-3 py-1.5 text-xs font-mono rounded-xl border border-[#EDE4DC] bg-white focus:outline-none focus:border-[#EC1C24]"
              />
            </div>
          )}

          {/* Quick Result Counter */}
          <div className="text-xs font-semibold text-[#8C7B7C] ml-auto">
            {locale === 'bn'
              ? `মোট ${toBanglaDigits(totalItems)} টি পাঞ্চ রেকর্ড পাওয়া গেছে`
              : `Found ${totalItems} punch records`}
          </div>
        </div>

        {/* Search & Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#EDE4DC]/60">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7B7C]" />
            <input
              type="text"
              placeholder={locale === 'bn' ? 'কর্মী নাম, আইডি, টার্মিনাল বা আইপি খুঁজুন...' : 'Search Name, ID, Device, IP...'}
              value={searchQuery}
              onChange={e => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EDE4DC] bg-[#FBF6F2] focus:bg-white focus:outline-none focus:border-[#EC1C24] transition"
            />
            {searchQuery && (
              <button
                onClick={() => handleFilterChange(setSearchQuery, '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Device Terminal Filter */}
          <div>
            <select
              value={deviceFilter}
              onChange={e => handleFilterChange(setDeviceFilter, e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4DC] bg-white text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
            >
              <option value="all">{locale === 'bn' ? 'সকল টার্মিনাল' : 'All Terminals'}</option>
              {BIOMETRIC_TERMINALS.map(term => (
                <option key={term.id} value={term.id}>
                  {term.id} — {locale === 'bn' ? term.nameBn : term.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={e => handleFilterChange(setDeptFilter, e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4DC] bg-white text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
            >
              <option value="all">{locale === 'bn' ? 'সকল বিভাগ' : 'All Departments'}</option>
              {departmentList.map(d => (
                <option key={d.id} value={d.id}>
                  {locale === 'bn' ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Mode */}
          <div>
            <select
              value={modeFilter}
              onChange={e => handleFilterChange(setModeFilter, e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4DC] bg-white text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
            >
              <option value="all">{locale === 'bn' ? 'সকল ভেরিফাই মোড' : 'All Verify Modes'}</option>
              <option value="face">{locale === 'bn' ? 'ফেস স্ক্যান (Face)' : 'Face Recognition'}</option>
              <option value="fingerprint">{locale === 'bn' ? 'ফিঙ্গারপ্রিন্ট' : 'Fingerprint'}</option>
              <option value="rfid">{locale === 'bn' ? 'আরএফআইডি কার্ড' : 'RFID Smart Card'}</option>
              <option value="palm">{locale === 'bn' ? 'পাম ভেইন' : 'Palm Vein'}</option>
            </select>
          </div>

          {/* Punch State */}
          <div>
            <select
              value={stateFilter}
              onChange={e => handleFilterChange(setStateFilter, e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4DC] bg-white text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
            >
              <option value="all">{locale === 'bn' ? 'সকল পাঞ্চ স্টেট' : 'All Directions'}</option>
              <option value="check_in">{locale === 'bn' ? 'প্রবেশ (Check-In)' : 'Check-In'}</option>
              <option value="check_out">{locale === 'bn' ? 'প্রস্থান (Check-Out)' : 'Check-Out'}</option>
              <option value="break_out">{locale === 'bn' ? 'বিরতি আউট' : 'Break-Out'}</option>
              <option value="break_in">{locale === 'bn' ? 'বিরতি ইন' : 'Break-In'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. DETAILED RAW BIOMETRIC LOGS TABLE */}
      <div className="bg-white rounded-2xl border border-[#EDE4DC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D0D0D] text-white/90 border-b border-[#2B2B2B]">
                <th className="py-3.5 px-4 font-bold text-[11px] w-12 text-center text-white/50">#</th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'পাঞ্চ সময় ও তারিখ' : 'Timestamp'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'কর্মী ও বিভাগ' : 'Employee & Dept'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'টার্মিনাল ও অবস্থান' : 'Device Terminal & IP'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'ভেরিফিকেশন মোড' : 'Verify Mode'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'পাঞ্চ স্টেট' : 'Punch State'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'স্লট কোড ও স্কোর' : 'Slot ID & Match'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px]">
                  {locale === 'bn' ? 'সিঙ্ক স্ট্যাটাস' : 'Sync Status'}
                </th>
                <th className="py-3.5 px-4 font-bold text-[11px] text-right">
                  {locale === 'bn' ? 'বিস্তারিত' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4DC]">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8C7B7C]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                        <Filter className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-sm text-[#2A1A1B]">
                        {locale === 'bn' ? 'কোন পাঞ্চ লগ পাওয়া যায়নি' : 'No biometric punch records found'}
                      </p>
                      <p className="text-xs text-[#8C7B7C]">
                        {locale === 'bn'
                          ? 'ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                          : 'Try adjusting your search terms or date filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLogs.map((log, index) => {
                  const globalIdx = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogForDetail(log)}
                      className="hover:bg-[#FBF6F2]/80 transition cursor-pointer group"
                    >
                      {/* 1. Index */}
                      <td className="py-3 px-4 text-center text-[#8C7B7C] font-mono font-medium text-[11px]">
                        {locale === 'bn' ? toBanglaDigits(globalIdx) : globalIdx}
                      </td>

                      {/* 2. Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#EC1C24]" />
                          <span className="font-mono font-bold text-[#2A1A1B] text-xs">
                            {locale === 'bn' ? toBanglaDigits(log.timeStr) : log.timeStr}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8C7B7C] font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{locale === 'bn' ? toBanglaDigits(log.dateKey) : log.dateKey}</span>
                        </div>
                      </td>

                      {/* 3. Employee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={log.avatarUrl}
                            alt={log.empNameEn}
                            className="w-8 h-8 rounded-full object-cover border border-[#EDE4DC] shrink-0"
                          />
                          <div className="truncate max-w-[160px]">
                            <div className="font-bold text-xs text-[#2A1A1B] truncate group-hover:text-[#EC1C24] transition">
                              {locale === 'bn' ? log.empNameBn : log.empNameEn}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-[#8C7B7C]">
                                #{log.empId}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-medium">
                                {locale === 'bn' ? log.deptNameBn : log.deptNameEn}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Terminal & Location */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-[#2A1A1B] flex items-center gap-1">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-[#0D0D0D] font-bold">
                            {log.deviceId}
                          </span>
                          <span className="truncate max-w-[140px] text-[11px]">
                            {locale === 'bn' ? log.deviceNameBn : log.deviceNameEn}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8C7B7C] font-mono mt-0.5 truncate max-w-[180px]">
                          IP: {log.ipAddress} • {locale === 'bn' ? log.terminalLocationBn : log.terminalLocationEn}
                        </div>
                      </td>

                      {/* 5. Verification Mode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EDE4DC] shadow-xs">
                          {renderModeIcon(log.verifyMode)}
                          <span className="text-[11px] font-semibold text-[#2A1A1B]">
                            {getModeLabel(log.verifyMode)}
                          </span>
                        </div>
                      </td>

                      {/* 6. Punch State */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPunchStateBadge(log.punchState)}
                      </td>

                      {/* 7. Slot ID & Match Score */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-[#2A1A1B]">
                          Slot #{log.deviceUserId}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>
                            {locale === 'bn' ? `${toBanglaDigits(log.matchScore)}% মিল` : `${log.matchScore}% Match`}
                          </span>
                        </div>
                      </td>

                      {/* 8. Sync Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.syncStatus === 'synced' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6EC] text-[#15803D]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{locale === 'bn' ? 'সিঙ্কড' : 'Synced'}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]"
                            title={log.notes}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>{locale === 'bn' ? 'ফ্ল্যাগড' : 'Flagged'}</span>
                          </span>
                        )}
                      </td>

                      {/* 9. Action / Detail */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedLogForDetail(log);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#EDE4DC] bg-white hover:bg-[#0D0D0D] hover:text-white transition"
                        >
                          {locale === 'bn' ? 'প্যাকেট' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. TABLE PAGINATION & FOOTER */}
        <div className="p-4 bg-[#FBF6F2] border-t border-[#EDE4DC] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8C7B7C]">
              {locale === 'bn' ? 'প্রতি পেজে সারি:' : 'Rows per page:'}
            </span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-[#EDE4DC] bg-white text-xs font-semibold focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span className="text-[#8C7B7C] ml-2 font-mono">
              {locale === 'bn'
                ? `প্রদর্শিত: ${toBanglaDigits(Math.min((currentPage - 1) * pageSize + 1, totalItems))} - ${toBanglaDigits(Math.min(currentPage * pageSize, totalItems))} (সর্বমোট ${toBanglaDigits(totalItems)})`
                : `Showing ${Math.min((currentPage - 1) * pageSize + 1, totalItems)} - ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#EDE4DC] bg-white text-[#2A1A1B] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 font-mono font-bold text-xs bg-white rounded-lg border border-[#EDE4DC]">
              {locale === 'bn'
                ? `${toBanglaDigits(currentPage)} / ${toBanglaDigits(totalPages)}`
                : `${currentPage} / ${totalPages}`}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#EDE4DC] bg-white text-[#2A1A1B] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL: TERMINALS HARDWARE OVERVIEW */}
      {showTerminalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EDE4DC] shadow-2xl overflow-hidden">
            <div className="bg-[#0D0D0D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EC1C24] flex items-center justify-center font-bold">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">
                    {locale === 'bn' ? 'জেডকেটেকো বায়োমেট্রিক হার্ডওয়্যার টার্মিনাল' : 'ZKTeco Hardware Terminals'}
                  </h3>
                  <p className="text-[11px] text-white/60">
                    {locale === 'bn'
                      ? 'কারখানা ও হেড অফিসের সকল ফিঙ্গারপ্রিন্ট ও ফেস স্ক্যানার স্ট্যাটাস'
                      : 'Live bridge status, IP, port, and firmware version across all sites'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTerminalModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {BIOMETRIC_TERMINALS.map(term => (
                <div
                  key={term.id}
                  className="p-4 rounded-2xl border border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#0D0D0D] text-[#EC1C24]">
                          {term.id}
                        </span>
                        <h4 className="font-bold text-sm text-[#2A1A1B]">
                          {locale === 'bn' ? term.nameBn : term.nameEn}
                        </h4>
                      </div>
                      <p className="text-xs text-[#8C7B7C] mt-1">
                        {locale === 'bn' ? term.locationBn : term.locationEn}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E7F6EC] text-[#15803D]">
                      <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                      <span>ONLINE</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-[#EDE4DC]/60 font-mono">
                    <div>
                      <div className="text-[10px] text-[#8C7B7C] font-sans">IP / Port:</div>
                      <div className="font-semibold text-[#2A1A1B]">{term.ip}:{term.port}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8C7B7C] font-sans">Model:</div>
                      <div className="font-semibold text-[#2A1A1B] truncate">{term.model}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8C7B7C] font-sans">Enrolled:</div>
                      <div className="font-semibold text-[#2A1A1B]">{term.registeredUsers} Users</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8C7B7C] font-sans">Last Ping:</div>
                      <div className="font-semibold text-[#15803D] truncate">{term.lastHeartbeat.split(' ')[1]}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#FBF6F2] border-t border-[#EDE4DC] flex justify-end">
              <button
                onClick={() => setShowTerminalModal(false)}
                className="px-5 py-2 bg-[#0D0D0D] text-white rounded-xl text-xs font-bold"
              >
                {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: RAW PACKET INSPECTOR */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#EDE4DC] shadow-2xl overflow-hidden">
            <div className="bg-[#0D0D0D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EC1C24] flex items-center justify-center font-bold">
                  <Fingerprint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {locale === 'bn' ? 'রিয়েলটাইম পাঞ্চ প্যাকেট পরিদর্শন' : 'Raw Biometric Punch Packet'}
                  </h3>
                  <div className="text-[11px] font-mono text-white/60">
                    ID: {selectedLogForDetail.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FBF6F2] border border-[#EDE4DC]">
                <img
                  src={selectedLogForDetail.avatarUrl}
                  alt={selectedLogForDetail.empNameEn}
                  className="w-12 h-12 rounded-full object-cover border border-[#EDE4DC]"
                />
                <div>
                  <div className="font-bold text-sm text-[#2A1A1B]">
                    {locale === 'bn' ? selectedLogForDetail.empNameBn : selectedLogForDetail.empNameEn}
                  </div>
                  <div className="text-xs text-[#8C7B7C]">
                    ID #{selectedLogForDetail.empId} • {locale === 'bn' ? selectedLogForDetail.deptNameBn : selectedLogForDetail.deptNameEn}
                  </div>
                </div>
              </div>

              <div className="bg-[#0D0D0D] text-emerald-400 p-4 rounded-2xl font-mono text-[11px] space-y-1 overflow-x-auto">
                <div className="text-white/40 mb-2">// ZKTeco Standalone Device Push Packet Protocol</div>
                <div>TIMESTAMP      : {selectedLogForDetail.punchTime}</div>
                <div>DEVICE_ID      : {selectedLogForDetail.deviceId}</div>
                <div>TERMINAL_IP    : {selectedLogForDetail.ipAddress}</div>
                <div>PORT           : 4370 (TCP Socket)</div>
                <div>USER_SLOT      : #{selectedLogForDetail.deviceUserId}</div>
                <div>VERIFY_MODE    : {selectedLogForDetail.verifyMode.toUpperCase()}</div>
                <div>PUNCH_STATE    : {selectedLogForDetail.punchState.toUpperCase()}</div>
                <div>MATCH_SCORE    : {selectedLogForDetail.matchScore}% Confidence</div>
                <div>SYNC_STATUS    : {selectedLogForDetail.syncStatus.toUpperCase()}</div>
                <div>AUDIT_NOTE     : "{selectedLogForDetail.notes || 'Normal sync'}"</div>
              </div>

              <p className="text-[11px] text-[#8C7B7C]">
                {locale === 'bn'
                  ? 'উক্ত ডেটা সরাসরি জেডকেটেকো মেশিন মেমরি থেকে পুল করা হয়েছে। ম্যানুয়ালি পরিমার্জনের প্রয়োজন হলে এডজাস্টমেন্ট মডিউল ব্যবহার করুন।'
                  : 'This record represents raw unedited memory buffer data straight from the terminal hardware. Use Late Adjustments to handle disputes.'}
              </p>
            </div>

            <div className="p-4 bg-[#FBF6F2] border-t border-[#EDE4DC] flex justify-end">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-5 py-2 bg-[#0D0D0D] text-white rounded-xl text-xs font-bold"
              >
                {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
