/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Live Attendance Monitor ("লাইভ অ্যাটেন্ডেন্স")
 * Supports 3 perspectives:
 * 1. Employee: Punch In/Out summary, Next Duty Schedule, Leave & Day-off balances.
 * 2. HOD: Shift-wise filters, Headcount metrics, Chronological arrival sequence ("কে কার আগে ঢুকছে"), Graphical progress bar, Line/Station grouping.
 * 3. Admin: 3-Way filtering (Section, Shift, Cadre), Real-time Chronological Leaderboard, Section-wise breakdowns.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  Medal,
  Award,
  ChevronRight,
  TrendingUp,
  User,
  Shield,
  Briefcase,
  Flame,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  Building2,
  SlidersHorizontal,
  Check,
  Activity,
  Zap,
  Radio,
  MapPin,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Locale, Role } from '../types';
import { toBanglaDigits } from '../data/translations';
import {
  TODAY_LIVE_ATTENDANCE,
  EMPLOYEE_UPCOMING_SCHEDULE,
  LiveAttendanceEntry,
  EmployeeCadre,
  AttendanceMetricCategory,
  sortChronologicalArrivals,
  calculateLiveHeadcount,
  calculateLateAnalytics,
  calculateLeaveAnalytics,
  calculateAbsentAnalytics,
  FACTORY_DEPARTMENTS,
  calculateAdminDailySummary,
  getAdminFilterLabel,
  filterAdminLiveAttendance,
} from '../data/liveAttendanceData';
import { AttendanceDrilldownModal } from './AttendanceDrilldownModal';

interface LiveAttendanceMonitorProps {
  currentRole: Role;
  locale: Locale;
  currentEmpId?: string;
  onRequestAdjustment?: () => void;
  onNavigateLeaves?: () => void;
  defaultPerspective?: 'employee' | 'hod' | 'admin';
  isEmbeddedInHome?: boolean;
}

export const LiveAttendanceMonitor: React.FC<LiveAttendanceMonitorProps> = ({
  currentRole,
  locale,
  currentEmpId = '20045',
  onRequestAdjustment,
  onNavigateLeaves,
  defaultPerspective,
  isEmbeddedInHome = false,
}) => {
  // Determine natural perspective based strictly on logged-in user role
  const perspective: 'employee' | 'hod' | 'admin' = useMemo(() => {
    if (defaultPerspective) return defaultPerspective;
    if (['superAdmin', 'hrManager', 'hrExecutive', 'accounts'].includes(currentRole)) {
      return 'admin';
    }
    if (currentRole === 'hod') {
      return 'hod';
    }
    return 'employee';
  }, [currentRole, defaultPerspective]);

  // Common filters
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCadre, setSelectedCadre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-30');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset all admin filters back to factory-wide total overview
  const handleResetAdminFilters = () => {
    setSelectedSection('all');
    setSelectedShift('all');
    setSelectedCadre('all');
    setSearchQuery('');
  };

  // Interactive drilldown modal state
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [drilldownCategory, setDrilldownCategory] = useState<AttendanceMetricCategory>('present');

  const handleOpenCategoryDrilldown = (cat: AttendanceMetricCategory) => {
    setDrilldownCategory(cat);
    setIsDrilldownOpen(true);
  };

  // Trigger brief refresh animation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Active category tab for inline related manpower view (all, present, late, absent, leave)
  const [activeCategoryTab, setActiveCategoryTab] = useState<AttendanceMetricCategory>('present');
  // Live location arrival tracker open/collapse and auto-scroll state
  const [isLiveLocationOpen, setIsLiveLocationOpen] = useState(true);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [selectedTerminalFilter, setSelectedTerminalFilter] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect for Live Location Ticker
  useEffect(() => {
    if (!isAutoScrollActive || !isLiveLocationOpen) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 12) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ top: 76, behavior: 'smooth' });
        }
      }
    }, 2600);
    return () => clearInterval(interval);
  }, [isAutoScrollActive, isLiveLocationOpen]);

  // Filtered entries for HOD & Admin views
  const filteredEntries = useMemo(() => {
    return filterAdminLiveAttendance(TODAY_LIVE_ATTENDANCE, {
      department: selectedSection,
      shift: selectedShift,
      cadre: selectedCadre,
      searchQuery,
      dateKey: selectedDate,
    });
  }, [selectedShift, selectedSection, selectedCadre, searchQuery, selectedDate]);

  // Ranked chronological entries ("কে কার আগে ঢুকছে, কে কার পরে ঢুকছে")
  const rankedEntries = useMemo(() => {
    return sortChronologicalArrivals(filteredEntries);
  }, [filteredEntries]);

  // Headcount statistics
  const stats = useMemo(() => {
    return calculateLiveHeadcount(filteredEntries);
  }, [filteredEntries]);

  // Comprehensive Admin Daily Per-Day Summary (Overall or Filtered)
  const adminDailySummary = useMemo(() => {
    return calculateAdminDailySummary(filteredEntries, TODAY_LIVE_ATTENDANCE);
  }, [filteredEntries]);

  // Filter state metadata & readable banner label
  const filterLabelInfo = useMemo(() => {
    return getAdminFilterLabel(
      {
        department: selectedSection,
        shift: selectedShift,
        cadre: selectedCadre,
        searchQuery,
        dateKey: selectedDate,
      },
      locale
    );
  }, [selectedSection, selectedShift, selectedCadre, searchQuery, selectedDate, locale]);

  // Late analytics for deep drilldown preview
  const lateAnalytics = useMemo(() => {
    return calculateLateAnalytics(filteredEntries);
  }, [filteredEntries]);

  // Chronological arrivals for Live Location stream ("কে কার আগে আসছে, কে পরে আসছে")
  const liveArrivalEntries = useMemo(() => {
    const arrived = TODAY_LIVE_ATTENDANCE.filter(e => e.inAt !== null);
    const sorted = sortChronologicalArrivals(arrived);
    if (selectedTerminalFilter === 'all') return sorted;
    return sorted.filter(e => e.terminal.toLowerCase().includes(selectedTerminalFilter.toLowerCase()));
  }, [selectedTerminalFilter]);

  // Related manpower entries displayed directly below the Manpower Summary Dashboard
  const relatedCategoryEntries = useMemo(() => {
    return filteredEntries.filter(entry => {
      if (activeCategoryTab === 'present') {
        return entry.inAt !== null;
      }
      if (activeCategoryTab === 'late') {
        return entry.isLate || (entry.lateMinutes && entry.lateMinutes > 0);
      }
      if (activeCategoryTab === 'absent') {
        return entry.status === 'absent';
      }
      if (activeCategoryTab === 'leave') {
        return entry.status === 'leave';
      }
      return true; // 'all'
    });
  }, [filteredEntries, activeCategoryTab]);

  // Current employee's personal today record
  const myRecord = useMemo(() => {
    return (
      TODAY_LIVE_ATTENDANCE.find(e => e.empId === currentEmpId) ||
      TODAY_LIVE_ATTENDANCE.find(e => e.empId === '20045') ||
      TODAY_LIVE_ATTENDANCE[0]
    );
  }, [currentEmpId]);

  // Section-wise breakdown for Admin View
  const sectionBreakdowns = useMemo(() => {
    const map = new Map<string, {
      deptId: string;
      nameBn: string;
      nameEn: string;
      total: number;
      present: number;
      late: number;
      absent: number;
    }>();

    TODAY_LIVE_ATTENDANCE.forEach(entry => {
      const existing = map.get(entry.deptId) || {
        deptId: entry.deptId,
        nameBn: entry.deptNameBn,
        nameEn: entry.deptNameEn,
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
      };

      existing.total += 1;
      if (entry.inAt) {
        existing.present += 1;
        if (entry.isLate) existing.late += 1;
      } else {
        existing.absent += 1;
      }

      map.set(entry.deptId, existing);
    });

    return Array.from(map.values());
  }, []);

  return (
    <div className={`w-full ${isEmbeddedInHome ? 'space-y-3.5' : 'space-y-5'}`}>
      {/* 1. Header & Interactive Multi-Perspective Mode Switcher */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EDE4DC] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#EC1C24] to-[#FF6B6B] flex items-center justify-center text-white shadow-sm shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#2A1A1B] tracking-tight">
                  {locale === 'bn' ? 'লাইভ উপস্থিতি মনিটর' : 'Live Attendance Monitor'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {locale === 'bn' ? 'রিয়েলটাইম বায়োমেট্রিক' : 'Live Biometric'}
                </span>
              </div>
              <p className="text-[11px] text-[#8C7B7C] font-medium">
                {locale === 'bn'
                  ? 'কে কার আগে প্রবেশ করেছে তার ক্রমানুসারে লাইভ তালিকা'
                  : 'Chronological first-in arrival sequence & shift analytics'}
              </p>
            </div>
          </div>

          {/* Role-Specific Badge & Refresh Control (strictly bound to logged-in user role) */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {perspective === 'admin' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF5F5] border border-[#FEE2E2] text-[#EC1C24] text-xs font-bold shadow-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>{locale === 'bn' ? 'অ্যাডমিন লাইভ প্যানেল' : 'Admin Live Panel'}</span>
              </div>
            )}
            {perspective === 'hod' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] text-amber-800 text-xs font-bold shadow-xs">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{locale === 'bn' ? 'এইচওডি শিফট কন্ট্রোল' : 'HOD Shift Control'}</span>
              </div>
            )}
            {perspective === 'employee' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-blue-800 text-xs font-bold shadow-xs">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{locale === 'bn' ? 'ব্যক্তিগত উপস্থিতি ও শিফট' : 'My Attendance & Schedule'}</span>
              </div>
            )}

            <button
              onClick={handleRefresh}
              title={locale === 'bn' ? 'ডাটা রিফ্রেশ করুন' : 'Refresh live data'}
              className="p-2 text-[#8C7B7C] hover:text-[#EC1C24] transition rounded-xl bg-[#F9F6F0] hover:bg-[#F3ECE6] border border-[#EDE4DC] flex items-center justify-center shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#EC1C24]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          PERSPECTIVE 1: EMPLOYEE VIEW
          - Punch In/Out Today summary
          - Next Duty / Shift Schedule
          - Leave & Day-Off summary
         ======================================================== */}
      {perspective === 'employee' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Card A: Today's Punch Summary */}
          <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/50 relative overflow-hidden">
            {/* Background ambient decorative orb */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#EC1C24]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={myRecord.photoUrl}
                  alt={myRecord.nameEn}
                  className="w-10 h-10 rounded-xl object-cover border border-white/20"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    {locale === 'bn' ? myRecord.nameBn : myRecord.nameEn}
                  </h4>
                  <div className="text-[11px] text-white/70">
                    {locale === 'bn'
                      ? `${myRecord.designationNameBn} · ${myRecord.deptNameBn}`
                      : `${myRecord.designationNameEn} · ${myRecord.deptNameEn}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold text-white border border-white/15">
                  {locale === 'bn' ? myRecord.shiftNameBn : myRecord.shiftNameEn} ({myRecord.shiftSchedule})
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                    myRecord.isLate
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  {myRecord.isLate
                    ? locale === 'bn'
                      ? `দেরি (${toBanglaDigits(myRecord.lateMinutes)} মিনিট)`
                      : `Late (${myRecord.lateMinutes}m)`
                    : locale === 'bn'
                    ? 'অন-টাইম উপস্থিতি'
                    : 'On-Time'}
                </span>
              </div>
            </div>

            {/* 3 Punch Metrics */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                  {locale === 'bn' ? 'প্রবেশ সময় (IN)' : 'In Time'}
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">
                  {myRecord.inAt
                    ? locale === 'bn'
                      ? `${toBanglaDigits(myRecord.inAt)} AM`
                      : `${myRecord.inAt} AM`
                    : '--:--'}
                </div>
                <div className="text-[9px] text-white/50 truncate mt-0.5">
                  {myRecord.terminal}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                  {locale === 'bn' ? 'প্রস্থান সময় (OUT)' : 'Out Time'}
                </div>
                <div className="text-base sm:text-lg font-black text-amber-300 mt-1">
                  {myRecord.outAt
                    ? locale === 'bn'
                      ? `${toBanglaDigits(myRecord.outAt)}`
                      : myRecord.outAt
                    : locale === 'bn'
                    ? 'চলমান...'
                    : 'Working...'}
                </div>
                <div className="text-[9px] text-white/50 truncate mt-0.5">
                  {locale === 'bn' ? 'ডিউটি চলমান অবস্থায়' : 'Shift Active'}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                  {locale === 'bn' ? 'কাজের মোট সময়' : 'Total Work'}
                </div>
                <div className="text-base sm:text-lg font-black text-white mt-1">
                  {locale === 'bn' ? '৮ ঘণ্টা ৪৪ মিনিট' : '8h 44m'}
                </div>
                <div className="text-[9px] text-emerald-400 truncate mt-0.5 font-bold">
                  {locale === 'bn' ? 'পূর্ণ কর্মদিবস অর্জিত' : 'Full Day Met'}
                </div>
              </div>
            </div>

            {myRecord.isLate && onRequestAdjustment && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-amber-200">
                  {locale === 'bn'
                    ? '১১ মিনিট দেরির জন্য আবেদন করতে চান?'
                    : 'Submit late withdrawal adjustment?'}
                </span>
                <button
                  onClick={onRequestAdjustment}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] rounded-lg transition shadow"
                >
                  {locale === 'bn' ? 'দেরি প্রত্যাহার আবেদন ➜' : 'Apply Adjustment ➜'}
                </button>
              </div>
            )}
          </div>

          {/* Card B: Next Duty / Shift Schedule & Leave Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Next Duty / Shift Schedule Overview */}
            <div className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EDE4DC]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#EC1C24]" />
                  <h4 className="text-xs font-bold text-[#2A1A1B]">
                    {locale === 'bn' ? 'পরবর্তী ডিউটি ও শিফট শিডিউল' : 'Next Duty & Shift Schedule'}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-[#EC1C24] bg-[#FDE8E9] px-2 py-0.5 rounded-full">
                  {locale === 'bn' ? 'আগামী ৫ দিন' : 'Next 5 Days'}
                </span>
              </div>

              <div className="space-y-2">
                {EMPLOYEE_UPCOMING_SCHEDULE.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      item.isOff
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : idx === 0
                        ? 'bg-[#FDF2F2] border-[#EC1C24]/30'
                        : 'bg-white border-[#EDE4DC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          item.isOff
                            ? 'bg-amber-500 text-white'
                            : idx === 0
                            ? 'bg-[#EC1C24] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2A1A1B]">
                          {locale === 'bn' ? item.dayBn : item.dayEn}
                        </div>
                        <div className="text-[10px] text-[#8C7B7C]">
                          {locale === 'bn' ? item.shiftNameBn : item.shiftNameEn}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                          item.isOff
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.timeRange}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Leave & Day-Off Summary Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EDE4DC]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#EC1C24]" />
                    <h4 className="text-xs font-bold text-[#2A1A1B]">
                      {locale === 'bn' ? 'ছুটি ব্যালেন্স ও সাপ্তাহিক ছুটি' : 'Leave & Day-Off Summary'}
                    </h4>
                  </div>
                  {onNavigateLeaves && (
                    <button
                      onClick={onNavigateLeaves}
                      className="text-[11px] font-bold text-[#EC1C24] hover:underline"
                    >
                      {locale === 'bn' ? 'ছুটি আবেদন' : 'Apply'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl p-3">
                    <div className="text-[10px] font-bold text-purple-700">
                      {locale === 'bn' ? 'নৈমিত্তিক ছুটি (CL)' : 'Casual Leave (CL)'}
                    </div>
                    <div className="text-lg font-black text-purple-900 mt-0.5">
                      {locale === 'bn' ? '০৭ দিন' : '07 Days'}
                    </div>
                    <div className="text-[9px] text-purple-600">
                      {locale === 'bn' ? '১০ দিনের কোটা থেকে' : 'Out of 10 days'}
                    </div>
                  </div>

                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3">
                    <div className="text-[10px] font-bold text-emerald-700">
                      {locale === 'bn' ? 'চিকিৎসা ছুটি (SL)' : 'Sick Leave (SL)'}
                    </div>
                    <div className="text-lg font-black text-emerald-900 mt-0.5">
                      {locale === 'bn' ? '১২ দিন' : '12 Days'}
                    </div>
                    <div className="text-[9px] text-emerald-600">
                      {locale === 'bn' ? '১৪ দিনের কোটা থেকে' : 'Out of 14 days'}
                    </div>
                  </div>

                  <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3">
                    <div className="text-[10px] font-bold text-amber-700">
                      {locale === 'bn' ? 'অর্জিত বার্ষিক ছুটি (EL)' : 'Earned Leave (EL)'}
                    </div>
                    <div className="text-lg font-black text-amber-900 mt-0.5">
                      {locale === 'bn' ? '১৩ দিন' : '13 Days'}
                    </div>
                    <div className="text-[9px] text-amber-600">
                      {locale === 'bn' ? 'পরবর্তী বছরে যোগযোগ্য' : 'Carry forward eligible'}
                    </div>
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3">
                    <div className="text-[10px] font-bold text-blue-700">
                      {locale === 'bn' ? 'সাপ্তাহিক ছুটি (Day-Off)' : 'Weekly Day-Off'}
                    </div>
                    <div className="text-lg font-black text-blue-900 mt-0.5">
                      {locale === 'bn' ? 'শুক্রবার' : 'Friday'}
                    </div>
                    <div className="text-[9px] text-blue-600">
                      {locale === 'bn' ? 'স্থায়ী কারখানা রোস্টার' : 'Fixed factory roster'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#EDE4DC] flex items-center justify-between text-[11px] text-[#8C7B7C]">
                <span>
                  {locale === 'bn' ? 'মোট অবশিষ্ট ছুটির পরিমাণ:' : 'Total Available Leaves:'}
                </span>
                <span className="font-extrabold text-[#2A1A1B]">
                  {locale === 'bn' ? '৩২ দিন' : '32 Days Total'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 2: HOD VIEW (বিভাগীয় প্রধান)
          Positioned below buttons on mobile or inside view:
          - Shift-wise tabs (Shift A, Shift B, Shift C / Night, General)
          - Headcount progress bar & metrics (Total, Present, Absent, Late)
          - Chronological arrival sequence ("কে কার আগে ঢুকছে")
          - Line / Station grouping selector
         ======================================================== */}
      {perspective === 'hod' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Shift Switcher Filter Pills */}
          <div className="bg-white rounded-2xl p-3 border border-[#EDE4DC] shadow-sm space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2A1A1B]">
                <Layers className="w-3.5 h-3.5 text-[#EC1C24]" />
                <span>{locale === 'bn' ? 'শিফট নির্বাচন করুন:' : 'Select Shift:'}</span>
              </div>

              {/* Station / Line Grouping Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8C7B7C] font-semibold">
                  {locale === 'bn' ? 'লাইন / স্টেশন:' : 'Line:'}
                </span>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="text-xs bg-[#F9F6F0] border border-[#EDE4DC] rounded-xl px-2.5 py-1 font-bold text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                >
                  <option value="all">{locale === 'bn' ? 'সকল লাইন ও স্টেশন' : 'All Lines'}</option>
                  <option value="line-1">{locale === 'bn' ? 'প্রোডাকশন লাইন ১' : 'Line 1'}</option>
                  <option value="line-2">{locale === 'bn' ? 'প্রোডাকশন লাইন ২' : 'Line 2'}</option>
                  <option value="line-3">{locale === 'bn' ? 'প্রোডাকশন লাইন ৩' : 'Line 3'}</option>
                  <option value="spray-line">{locale === 'bn' ? 'স্প্রে ও সারফেস লাইন' : 'Spray Line'}</option>
                  <option value="kiln-tunnel">{locale === 'bn' ? 'টানেল কিলন ১ ও ২' : 'Kiln Tunnel'}</option>
                  <option value="pack-auto">{locale === 'bn' ? 'প্যাকেজিং ইউনিট' : 'Packaging'}</option>
                </select>
              </div>
            </div>

            {/* Shift Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', labelBn: 'সকল শিফট', labelEn: 'All Shifts' },
                { id: 'shiftA', labelBn: 'শিফট এ (মর্নিং)', labelEn: 'Shift A (Morning)' },
                { id: 'shiftB', labelBn: 'শিফট বি (ইভনিং)', labelEn: 'Shift B (Evening)' },
                { id: 'night', labelBn: 'শিফট সি (নাইট)', labelEn: 'Shift C (Night)' },
                { id: 'general', labelBn: 'জেনারেল শিফট', labelEn: 'General Shift' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShift(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedShift === s.id
                      ? 'bg-[#EC1C24] text-white shadow-sm'
                      : 'bg-[#F9F6F0] text-[#2A1A1B] hover:bg-[#F3ECE6] border border-[#EDE4DC]'
                  }`}
                >
                  {locale === 'bn' ? s.labelBn : s.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Headcount Metrics & Visual Progress Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#2A1A1B]">
                  {locale === 'bn' ? 'বিভাগীয় উপস্থিতির হার (Headcount Progress)' : 'Department Attendance Progress'}
                </h4>
                <p className="text-[11px] text-[#8C7B7C]">
                  {locale === 'bn'
                    ? `মোট ${toBanglaDigits(stats.totalExpected)} জনের মধ্যে ${toBanglaDigits(stats.presentCount)} জন কারখানায় প্রবেশ করেছেন`
                    : `${stats.presentCount} of ${stats.totalExpected} staff clocked in`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600">
                  {locale === 'bn' ? `${toBanglaDigits(stats.attendanceRate)}%` : `${stats.attendanceRate}%`}
                </span>
                <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  {locale === 'bn' ? 'উপস্থিতির হার' : 'Turnout'}
                </div>
              </div>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(stats.onTimeCount / (stats.totalExpected || 1)) * 100}%` }}
                title="On-time"
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${(stats.lateCount / (stats.totalExpected || 1)) * 100}%` }}
                title="Late"
              />
              <div
                className="bg-purple-400 h-full transition-all duration-500"
                style={{ width: `${(stats.leaveCount / (stats.totalExpected || 1)) * 100}%` }}
                title="Leave"
              />
              <div
                className="bg-rose-400 h-full transition-all duration-500"
                style={{ width: `${(stats.absentCount / (stats.totalExpected || 1)) * 100}%` }}
                title="Absent"
              />
            </div>

            {/* Tap Hint */}
            <div className="flex items-center justify-between text-[11px] text-[#8C7B7C] font-semibold px-0.5">
              <span>{locale === 'bn' ? 'হাজিরা সামারি (বিস্তারিত দেখতে ট্যাপ করুন)' : 'Attendance Summary (Tap to drilldown)'}</span>
              <span className="text-[#EC1C24] font-bold flex items-center gap-0.5">
                {locale === 'bn' ? 'তালিকায় ক্লিক করুন ↗' : 'Click to view ↗'}
              </span>
            </div>

            {/* 5 Interactive Headcount Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5 text-center">
              {/* 1. Expected / All */}
              <button
                type="button"
                onClick={() => handleOpenCategoryDrilldown('all')}
                className="group bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 hover:border-slate-400 rounded-xl p-2.5 transition-all active:scale-95 text-center cursor-pointer hover:shadow-sm"
              >
                <div className="text-[10px] text-[#8C7B7C] group-hover:text-slate-800 font-bold uppercase tracking-wider">
                  {locale === 'bn' ? 'মোট লক্ষ্য' : 'Expected'}
                </div>
                <div className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
                  {locale === 'bn' ? toBanglaDigits(stats.totalExpected) : stats.totalExpected}
                </div>
                <div className="text-[9px] text-slate-500 font-bold group-hover:text-slate-800 transition mt-0.5">
                  {locale === 'bn' ? 'সব কর্মী ↗' : 'View all ↗'}
                </div>
              </button>

              {/* 2. Present */}
              <button
                type="button"
                onClick={() => handleOpenCategoryDrilldown('present')}
                className="group bg-[#ECFDF5] hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-400 rounded-xl p-2.5 transition-all active:scale-95 text-center cursor-pointer hover:shadow-sm"
              >
                <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  {locale === 'bn' ? 'উপস্থিত' : 'Present'}
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
                  {locale === 'bn' ? toBanglaDigits(stats.presentCount) : stats.presentCount}
                </div>
                <div className="text-[9px] text-emerald-600 font-bold group-hover:text-emerald-800 transition mt-0.5">
                  {locale === 'bn' ? 'উপস্থিত তালিকা ↗' : 'Present list ↗'}
                </div>
              </button>

              {/* 3. Late */}
              <button
                type="button"
                onClick={() => handleOpenCategoryDrilldown('late')}
                className="group bg-[#FFFBEB] hover:bg-amber-100 border border-amber-200 hover:border-amber-400 rounded-xl p-2.5 transition-all active:scale-95 text-center cursor-pointer hover:shadow-sm"
              >
                <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                  {locale === 'bn' ? 'দেরি (Late)' : 'Late'}
                </div>
                <div className="text-base sm:text-lg font-black text-amber-800 mt-0.5">
                  {locale === 'bn' ? toBanglaDigits(stats.lateCount) : stats.lateCount}
                </div>
                <div className="text-[9px] text-amber-700 font-bold group-hover:text-amber-900 transition mt-0.5">
                  {locale === 'bn' ? 'লেট মিনিট বিশ্লেষণ ↗' : 'Late breakdown ↗'}
                </div>
              </button>

              {/* 4. On Leave */}
              <button
                type="button"
                onClick={() => handleOpenCategoryDrilldown('leave')}
                className="group bg-[#FAF5FF] hover:bg-purple-100 border border-purple-200 hover:border-purple-400 rounded-xl p-2.5 transition-all active:scale-95 text-center cursor-pointer hover:shadow-sm"
              >
                <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                  {locale === 'bn' ? 'ছুটিতে' : 'On Leave'}
                </div>
                <div className="text-base sm:text-lg font-black text-purple-800 mt-0.5">
                  {locale === 'bn' ? toBanglaDigits(stats.leaveCount) : stats.leaveCount}
                </div>
                <div className="text-[9px] text-purple-700 font-bold group-hover:text-purple-900 transition mt-0.5">
                  {locale === 'bn' ? 'ছুটির ধরন (SL/CL) ↗' : 'Leave types ↗'}
                </div>
              </button>

              {/* 5. Absent */}
              <button
                type="button"
                onClick={() => handleOpenCategoryDrilldown('absent')}
                className="group bg-[#FEF2F2] hover:bg-rose-100 border border-rose-200 hover:border-rose-400 rounded-xl p-2.5 transition-all active:scale-95 text-center cursor-pointer hover:shadow-sm col-span-2 sm:col-span-1"
              >
                <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">
                  {locale === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                </div>
                <div className="text-base sm:text-lg font-black text-rose-800 mt-0.5">
                  {locale === 'bn' ? toBanglaDigits(stats.absentCount) : stats.absentCount}
                </div>
                <div className="text-[9px] text-rose-700 font-bold group-hover:text-rose-900 transition mt-0.5">
                  {locale === 'bn' ? 'নোটিশ ও অনুসন্ধান ↗' : 'Absent list ↗'}
                </div>
              </button>
            </div>
          </div>

          {/* Chronological Arrival Sequence Leaderboard ("কে কার আগে ঢুকছে, কে কার পরে ঢুকছে") */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE4DC]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#EC1C24]" />
                <h4 className="text-xs sm:text-sm font-bold text-[#2A1A1B]">
                  {locale === 'bn'
                    ? 'আগমনের সময়ানুক্রমিক ক্রম (কে কার আগে ঢুকছে)'
                    : 'Chronological Arrival Order (First-in to Last-in)'}
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {locale === 'bn'
                  ? `${toBanglaDigits(rankedEntries.filter(e => e.rank !== null).length)} জন প্রবেশ করেছেন`
                  : `${rankedEntries.filter(e => e.rank !== null).length} Checked In`}
              </span>
            </div>

            <div className="space-y-2">
              {rankedEntries.map((entry, idx) => {
                const isArrived = entry.rank !== null;
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition ${
                      isFirst
                        ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                        : isArrived
                        ? 'bg-white border-[#EDE4DC] hover:border-[#EC1C24]/30'
                        : 'bg-slate-50/60 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isFirst
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900 shadow-sm'
                            : isSecond
                            ? 'bg-slate-300 text-slate-800'
                            : isThird
                            ? 'bg-amber-700 text-white'
                            : isArrived
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isArrived ? (
                          isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${entry.rank}`
                        ) : (
                          '✕'
                        )}
                      </div>

                      {/* Photo & Identity */}
                      <img
                        src={entry.photoUrl}
                        alt={entry.nameEn}
                        className="w-8 h-8 rounded-lg object-cover border border-[#EDE4DC] shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#2A1A1B] truncate">
                            {locale === 'bn' ? entry.nameBn : entry.nameEn}
                          </span>
                          {isFirst && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                              {locale === 'bn' ? '১ম প্রবেশকারী' : 'Early Bird #1'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8C7B7C] truncate">
                          {locale === 'bn'
                            ? `${entry.designationNameBn} · ${entry.sectionNameBn}`
                            : `${entry.designationNameEn} · ${entry.sectionNameEn}`}
                        </div>
                      </div>
                    </div>

                    {/* Punch Time & Status */}
                    <div className="text-right shrink-0 pl-2">
                      {isArrived ? (
                        <>
                          <div className="text-xs sm:text-sm font-black text-[#2A1A1B]">
                            {locale === 'bn' ? toBanglaDigits(entry.inAt!) : entry.inAt}
                            <span className="text-[9px] font-normal text-slate-400 ml-0.5">AM</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {entry.isLate ? (
                              <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                {locale === 'bn'
                                  ? `${toBanglaDigits(entry.lateMinutes)} মি. দেরি`
                                  : `${entry.lateMinutes}m Late`}
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {locale === 'bn' ? 'অন-টাইম' : 'On-Time'}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {entry.status === 'leave'
                            ? locale === 'bn'
                              ? 'ছুটিতে'
                              : 'Leave'
                            : locale === 'bn'
                            ? 'অনুপস্থিত'
                            : 'Absent'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PERSPECTIVE 3: ADMIN PANEL (সুপার এডমিন ও এইচআর)
          - Executive Per-Day Overall Summary Dashboard
          - Initial State: Total 100% Factory Overview (All departments, shifts & cadres)
          - Progressive Cascading Filtering: By Section/Department, Shift, Cadre, Date
          - Interactive Drilldowns: Clicking metric cards opens employee lists
          - Interactive Department Quick-Pills: Instant 1-click drilldown into any section
         ======================================================== */}
      {perspective === 'admin' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* ========================================================
              SECTION 1: লাইভ লোকেশন — রিয়েলটাইম প্রবেশ ও বায়োমেট্রিক গেট ট্র্যাকার
              (Live Location: chronological arrival stream with photo, section, ID, gate, auto-scroll)
             ======================================================== */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
            {/* Ambient radar glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#EC1C24]/10 blur-3xl pointer-events-none" />

            {/* Live Location Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                      <span>{locale === 'bn' ? 'লাইভ লোকেশন — প্রবেশ ট্র্যাকার ও বায়োমেট্রিক গেট রাডার' : 'Live Location & Gate Arrival Radar'}</span>
                    </h4>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {locale === 'bn' ? 'রিয়েলটাইম স্ট্রিম' : 'Live Feed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {locale === 'bn'
                      ? 'কারখানার ৫টি বায়োমেট্রিক গেট দিয়ে কে কার আগে প্রবেশ করেছে তার লাইভ স্ক্রোলিং তালিকা'
                      : 'Real-time arrival sequence with photo, section, ID & entry gate'}
                  </p>
                </div>
              </div>

              {/* Live Location Controls: Auto-Scroll Toggle + Collapse */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAutoScrollActive(!isAutoScrollActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    isAutoScrollActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isAutoScrollActive ? 'অটো-স্ক্রোল বিরতি দিন' : 'অটো-স্ক্রোল চালু করুন'}
                >
                  {isAutoScrollActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{locale === 'bn' ? 'অটো-স্ক্রোল চলছে' : 'Auto-Scroll ON'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-slate-300" />
                      <span>{locale === 'bn' ? 'স্ক্রোল চালু করুন' : 'Start Scroll'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLiveLocationOpen(!isLiveLocationOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  {isLiveLocationOpen ? (
                    <>
                      <span>{locale === 'bn' ? 'সংকুচিত' : 'Collapse'}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>{locale === 'bn' ? 'প্রসারিত' : 'Expand'}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Location Body (when open) */}
            {isLiveLocationOpen && (
              <div className="relative z-10 space-y-3">
                {/* Gate Terminal Quick Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-[11px] text-slate-400 font-bold shrink-0 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#EC1C24]" />
                    {locale === 'bn' ? 'গেট ফিল্টার:' : 'Terminal:'}
                  </span>
                  {[
                    { id: 'all', labelBn: 'সকল গেট (৫টি)', labelEn: 'All Gates (5)' },
                    { id: 'এডমিন', labelBn: 'গেট ১ (এডমিন)', labelEn: 'Gate 1 (Admin)' },
                    { id: 'ওয়ার্কশপ', labelBn: 'গেট ২ (ওয়ার্কশপ)', labelEn: 'Gate 2 (Workshop)' },
                    { id: 'কাস্টিং', labelBn: 'গেট ৩ (কাস্টিং)', labelEn: 'Gate 3 (Casting)' },
                    { id: 'প্যাকেজিং', labelBn: 'গেট ৪ (প্যাকেজিং)', labelEn: 'Gate 4 (Packing)' },
                    { id: 'কিলন', labelBn: 'গেট ৫ (কিলন)', labelEn: 'Gate 5 (Kiln)' },
                  ].map(term => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedTerminalFilter(term.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                        selectedTerminalFilter === term.id
                          ? 'bg-[#EC1C24] text-white shadow-xs'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                      }`}
                    >
                      {locale === 'bn' ? term.labelBn : term.labelEn}
                    </button>
                  ))}
                </div>

                {/* Vertical Scrolling Arrivals Feed ("কে কারা আগে আসছে, একের পর এক উপর-নিচ ভিউ হতে থাকবে") */}
                <div
                  ref={scrollContainerRef}
                  className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40 rounded-2xl p-1"
                >
                  {liveArrivalEntries.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      {locale === 'bn' ? 'নির্বাচিত গেটে কোনো কর্মীর প্রবেশের তথ্য পাওয়া যায়নি।' : 'No entries found for this gate.'}
                    </div>
                  ) : (
                    liveArrivalEntries.map(entry => {
                      const isFirst = entry.rank === 1;
                      const isSecond = entry.rank === 2;
                      const isThird = entry.rank === 3;

                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all ${
                            isFirst
                              ? 'bg-gradient-to-r from-amber-500/15 via-slate-800/80 to-slate-800/60 border-amber-500/40 shadow-xs'
                              : isSecond
                              ? 'bg-gradient-to-r from-slate-700/20 via-slate-800/80 to-slate-800/60 border-slate-600/40'
                              : isThird
                              ? 'bg-gradient-to-r from-amber-700/15 via-slate-800/80 to-slate-800/60 border-amber-600/30'
                              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800/90'
                          }`}
                        >
                          {/* Left: Rank + Photo + Info */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Arrival Rank Badge */}
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                                isFirst
                                  ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black'
                                  : isSecond
                                  ? 'bg-slate-300 text-slate-950 font-black'
                                  : isThird
                                  ? 'bg-amber-600 text-white font-black'
                                  : 'bg-slate-800 border border-slate-700 text-slate-300'
                              }`}
                            >
                              {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${entry.rank}`}
                            </div>

                            {/* Employee Photo */}
                            <div className="relative shrink-0">
                              <img
                                src={entry.photoUrl}
                                alt={entry.nameEn}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-700"
                              />
                              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 absolute -bottom-0.5 -right-0.5" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-black text-white truncate">
                                  {locale === 'bn' ? entry.nameBn : entry.nameEn}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  #{entry.empId}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-extrabold">
                                  {entry.cadre === 'officer'
                                    ? locale === 'bn' ? 'কর্মকর্তা' : 'Officer'
                                    : entry.cadre === 'worker'
                                    ? locale === 'bn' ? 'শ্রমিক' : 'Worker'
                                    : locale === 'bn' ? 'চুক্তিভিত্তিক' : 'Casual'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                                <span className="font-semibold text-slate-300">
                                  {locale === 'bn' ? entry.deptNameBn : entry.deptNameEn}
                                </span>
                                <span>·</span>
                                <span className="text-slate-400 truncate">
                                  {locale === 'bn' ? entry.designationNameBn : entry.designationNameEn}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Arrival Time & Gate Location */}
                          <div className="text-right shrink-0 pl-2">
                            <div className="text-xs sm:text-sm font-black text-emerald-400">
                              {locale === 'bn' ? toBanglaDigits(entry.inAt!) : entry.inAt}
                              <span className="text-[9px] font-normal text-slate-400 ml-0.5">AM</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#EC1C24]" />
                              <span className="truncate max-w-[120px] sm:max-w-none">{entry.terminal}</span>
                            </div>
                            <div className="mt-0.5">
                              {entry.isLate ? (
                                <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                                  {locale === 'bn' ? `${toBanglaDigits(entry.lateMinutes)} মি. দেরি` : `${entry.lateMinutes}m Late`}
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  {locale === 'bn' ? 'অন-টাইম' : 'On-Time'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live stream ticker footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{locale === 'bn' ? 'বায়োমেট্রিক গেট সিঙ্ক: ৫/৫ গেট সক্রিয়' : 'Biometric Gate Sync: 5/5 Active'}</span>
                  </span>
                  <span className="font-bold text-slate-300">
                    {locale === 'bn' ? `মোট ${toBanglaDigits(liveArrivalEntries.length)} জন আগমন রেকর্ড` : `${liveArrivalEntries.length} Arrival Records`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================
              SECTION 2: বহুমাত্রিক ক্যাসকেডিং ফিল্টার
              (Multi-Dimensional Cascading Filter: Search, Section, Shift, Cadre, Quick-Pills)
             ======================================================== */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#EC1C24]" />
                <h4 className="text-xs sm:text-sm font-extrabold text-[#2A1A1B]">
                  {locale === 'bn' ? 'বহুমাত্রিক ক্যাসকেডিং ফিল্টার (সেকশন, শিফট ও ক্যাডার)' : 'Multi-Dimensional Cascading Filters'}
                </h4>
              </div>

              {/* Reset Filter Button if Filtered */}
              {filterLabelInfo.isFiltered && (
                <button
                  type="button"
                  onClick={handleResetAdminFilters}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF5F5] text-[#EC1C24] border border-[#FEE2E2] font-black text-xs hover:bg-[#FDE8E9] transition shadow-xs active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{locale === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}</span>
                </button>
              )}
            </div>

            {/* Live search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8C7B7C] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={locale === 'bn' ? 'নাম, আইডি বা গেট দিয়ে খুঁজুন...' : 'Search employee or gate...'}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#EDE4DC] focus:outline-none focus:border-[#EC1C24] bg-[#F9F6F0] font-medium"
              />
            </div>

            {/* 3 Dropdown Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Filter 1: Department / Section */}
              <div>
                <label className="text-[10px] font-bold text-[#8C7B7C] uppercase tracking-wider block mb-1">
                  {locale === 'bn' ? '১. সেকশন বা ডিপার্টমেন্ট' : '1. Department / Section'}
                </label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full text-xs bg-[#F9F6F0] border border-[#EDE4DC] rounded-xl px-2.5 py-1.5 font-bold text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                >
                  <option value="all">{locale === 'bn' ? '🏢 সকল বিভাগ (সম্পূর্ণ কারখানা)' : 'All Departments (Entire Factory)'}</option>
                  <option value="casting">{locale === 'bn' ? 'কাস্টিং ও মোল্ডিং' : 'Casting & Moulding'}</option>
                  <option value="glazing">{locale === 'bn' ? 'গ্লেজিং ও সারফেস টেক' : 'Glazing Tech'}</option>
                  <option value="kiln">{locale === 'bn' ? 'কিলন ও ফায়ারিং' : 'Kiln & Firing'}</option>
                  <option value="packing">{locale === 'bn' ? 'বাছাই ও প্যাকেজিং' : 'Sorting & Packing'}</option>
                  <option value="qa">{locale === 'bn' ? 'গুণমান নিয়ন্ত্রণ (QA)' : 'Quality Assurance'}</option>
                  <option value="maintenance">{locale === 'bn' ? 'প্রকৌশল ও রক্ষণাবেক্ষণ' : 'Maintenance'}</option>
                  <option value="hr">{locale === 'bn' ? 'এইচআর ও প্রশাসন' : 'HR & Admin'}</option>
                  <option value="accounts">{locale === 'bn' ? 'হিসাব ও অর্থ' : 'Accounts & Finance'}</option>
                </select>
              </div>

              {/* Filter 2: Shift */}
              <div>
                <label className="text-[10px] font-bold text-[#8C7B7C] uppercase tracking-wider block mb-1">
                  {locale === 'bn' ? '২. কাজের শিফট' : '2. Work Shift'}
                </label>
                <select
                  value={selectedShift}
                  onChange={e => setSelectedShift(e.target.value)}
                  className="w-full text-xs bg-[#F9F6F0] border border-[#EDE4DC] rounded-xl px-2.5 py-1.5 font-bold text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                >
                  <option value="all">{locale === 'bn' ? 'সকল শিফট (২৪ ঘণ্টা)' : 'All Shifts'}</option>
                  <option value="shiftA">{locale === 'bn' ? 'মর্নিং শিফট এ (০৬:০০ - ১৪:০০)' : 'Shift A (06:00 - 14:00)'}</option>
                  <option value="shiftB">{locale === 'bn' ? 'ইভনিং শিফট বি (১৪:০০ - ২২:০০)' : 'Shift B (14:00 - 22:00)'}</option>
                  <option value="night">{locale === 'bn' ? 'নাইট রোস্টার (২২:০০ - ০৬:০০)' : 'Night (22:00 - 06:00)'}</option>
                  <option value="general">{locale === 'bn' ? 'জেনারেল শিফট (০৮:০০ - ১৭:০০)' : 'General (08:00 - 17:00)'}</option>
                </select>
              </div>

              {/* Filter 3: Employee Cadre / Level */}
              <div>
                <label className="text-[10px] font-bold text-[#8C7B7C] uppercase tracking-wider block mb-1">
                  {locale === 'bn' ? '৩. এমপ্লয়ি ক্যাডার / শ্রেণি' : '3. Employee Cadre'}
                </label>
                <select
                  value={selectedCadre}
                  onChange={e => setSelectedCadre(e.target.value)}
                  className="w-full text-xs bg-[#F9F6F0] border border-[#EDE4DC] rounded-xl px-2.5 py-1.5 font-bold text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                >
                  <option value="all">{locale === 'bn' ? 'সকল ক্যাডার / স্তর' : 'All Cadres'}</option>
                  <option value="officer">{locale === 'bn' ? 'কর্মকর্তা (Officer Level - ১-৫)' : 'Officer Level'}</option>
                  <option value="worker">{locale === 'bn' ? 'স্থায়ী শ্রমিক / টেকনিশিয়ান (৬-৭)' : 'Permanent Worker'}</option>
                  <option value="casual">{locale === 'bn' ? 'অনিয়মিত / চুক্তিভিত্তিক (লেভেল ৮)' : 'Casual / Contract'}</option>
                </select>
              </div>
            </div>

            {/* Quick Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {[
                { id: 'all', nameBn: 'সব বিভাগ', nameEn: 'All' },
                { id: 'casting', nameBn: 'কাস্টিং', nameEn: 'Casting' },
                { id: 'glazing', nameBn: 'গ্লেজিং', nameEn: 'Glazing' },
                { id: 'kiln', nameBn: 'কিলন', nameEn: 'Kiln' },
                { id: 'packing', nameBn: 'বাছাই ও প্যাকিং', nameEn: 'Packing' },
                { id: 'qa', nameBn: 'কিউএ (QA)', nameEn: 'QA' },
                { id: 'maintenance', nameBn: 'রক্ষণাবেক্ষণ', nameEn: 'Maintenance' },
                { id: 'hr', nameBn: 'এইচআর', nameEn: 'HR' },
                { id: 'accounts', nameBn: 'হিসাব', nameEn: 'Accounts' },
              ].map(dept => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedSection(dept.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedSection === dept.id
                      ? 'bg-[#EC1C24] text-white shadow-xs'
                      : 'bg-[#F9F6F0] text-[#2A1A1B] hover:bg-[#F3ECE6] border border-[#EDE4DC]'
                  }`}
                >
                  {locale === 'bn' ? dept.nameBn : dept.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================
              SECTION 3: টোটাল ম্যানপাওয়ার ড্যাশবোর্ড (৫টি বোল্ড কার্ড)
              (Total Manpower Dashboard: Total, Present, Late, Absent, Leave)
              Note: Factory overall summary, Date filter & Daily shift rotation REMOVED per user request!
             ======================================================== */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-700/60 relative overflow-hidden space-y-4">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#EC1C24]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            {/* Header Row */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EC1C24] text-white flex items-center justify-center font-black shadow-lg shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                      {locale === 'bn' ? 'চারু সিরামিক — সার্বিক কারখানা দৈনিক ড্যাশবোর্ড' : 'Charu Ceramic — Factory Daily Executive Cockpit'}
                    </h3>
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-extrabold px-2.5 py-0.5 rounded-full">
                      {locale === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {locale === 'bn'
                      ? 'প্রতিদিনের সামগ্রিক হাজিরা, উপস্থিতি, বিলম্ব ও ছুটির সার্বিক সামারি'
                      : 'Daily overall workforce turnout, presence, late arrivals & leaves'}
                  </p>
                </div>
              </div>

              {/* Hardware Status & Refresh */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{locale === 'bn' ? 'বায়োমেট্রিক গেট সিঙ্ক: ৫/৫ গেট' : 'Gate Sync: 5/5'}</span>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  title={locale === 'bn' ? 'রিয়েলটাইম রিফ্রেশ' : 'Refresh Data'}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#EC1C24]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Manpower Summary Section Title & Interactive Tab Hint */}
            <div className="relative z-10 flex items-center justify-between text-xs font-black pt-1">
              <div className="flex items-center gap-2 text-white">
                <Users className="w-4 h-4 text-[#EC1C24]" />
                <span className="text-sm font-black tracking-tight">
                  {locale === 'bn' ? 'ম্যানপাওয়ার সামারি (Manpower Summary)' : 'Manpower Summary'}
                </span>
                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {selectedSection === 'all'
                    ? locale === 'bn' ? 'সম্পূর্ণ কারখানা' : 'Full Factory'
                    : locale === 'bn' ? 'সেকশন ভিত্তিক' : 'Section Specific'}
                </span>
              </div>
              <span className="text-[11px] text-[#FF6B57] font-extrabold flex items-center gap-1">
                <span>{locale === 'bn' ? 'কার্ডে ক্লিক করে নিচে তালিকা দেখুন ↓' : 'Click card to view list below ↓'}</span>
              </span>
            </div>

            {/* 5 Bold Manpower Cards (Total, Present, Late, Absent, Leave) */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* 1. টোটাল এমপ্লয়ি */}
              <button
                type="button"
                onClick={() => setActiveCategoryTab('all')}
                className={`group rounded-2xl p-3.5 border shadow-md transition-all active:scale-95 text-left cursor-pointer relative overflow-hidden ${
                  activeCategoryTab === 'all'
                    ? 'bg-slate-750 border-white ring-2 ring-white/80 shadow-lg scale-[1.02]'
                    : 'bg-slate-800/85 hover:bg-slate-750 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div className="text-[11px] text-slate-400 group-hover:text-slate-200 font-extrabold uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === 'bn' ? 'টোটাল এমপ্লয়ি' : 'Total Employees'}</span>
                  <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
                  {locale === 'bn' ? toBanglaDigits(adminDailySummary.totalExpected) : adminDailySummary.totalExpected}
                  <span className="text-xs font-bold text-slate-400 ml-1">
                    {locale === 'bn' ? 'জন' : 'Staff'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold group-hover:text-slate-200 transition mt-1.5 flex items-center justify-between">
                  <span>{locale === 'bn' ? 'সব কর্মী তালিকা' : 'View all'}</span>
                  <span className="text-[9px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded font-black">১০০%</span>
                </div>
              </button>

              {/* 2. উপস্থিত (ডিউটি করছেন) */}
              <button
                type="button"
                onClick={() => setActiveCategoryTab('present')}
                className={`group rounded-2xl p-3.5 border shadow-md transition-all active:scale-95 text-left cursor-pointer relative overflow-hidden ${
                  activeCategoryTab === 'present'
                    ? 'bg-emerald-900/60 border-emerald-400 ring-2 ring-emerald-400 shadow-lg scale-[1.02]'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 hover:border-emerald-400'
                }`}
              >
                <div className="text-[11px] text-emerald-300 font-extrabold uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === 'bn' ? 'উপস্থিত' : 'Present'}</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1.5 tracking-tight">
                  {locale === 'bn' ? toBanglaDigits(adminDailySummary.presentCount) : adminDailySummary.presentCount}
                  <span className="text-xs font-bold text-emerald-500/80 ml-1">
                    ({locale === 'bn' ? toBanglaDigits(adminDailySummary.attendanceRate) : adminDailySummary.attendanceRate}%)
                  </span>
                </div>
                <div className="text-[10px] text-emerald-300/90 font-bold group-hover:text-emerald-200 transition mt-1.5 flex items-center justify-between">
                  <span>{locale === 'bn' ? 'ডিউটিরত তালিকা' : 'On-Duty list'}</span>
                  <span className="text-[9px] text-emerald-300 font-extrabold">
                    {locale === 'bn' ? `অন-টাইম: ${toBanglaDigits(adminDailySummary.onTimeCount)}` : `On-time: ${adminDailySummary.onTimeCount}`}
                  </span>
                </div>
              </button>

              {/* 3. লেট (দেরি) */}
              <button
                type="button"
                onClick={() => setActiveCategoryTab('late')}
                className={`group rounded-2xl p-3.5 border shadow-md transition-all active:scale-95 text-left cursor-pointer relative overflow-hidden ${
                  activeCategoryTab === 'late'
                    ? 'bg-amber-900/60 border-amber-400 ring-2 ring-amber-400 shadow-lg scale-[1.02]'
                    : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <div className="text-[11px] text-amber-300 font-extrabold uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === 'bn' ? 'লেট (দেরি)' : 'Late Arrivals'}</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1.5 tracking-tight">
                  {locale === 'bn' ? toBanglaDigits(adminDailySummary.lateCount) : adminDailySummary.lateCount}
                  <span className="text-xs font-bold text-amber-500/80 ml-1">
                    ({locale === 'bn' ? toBanglaDigits(adminDailySummary.lateRate) : adminDailySummary.lateRate}%)
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/90 font-bold group-hover:text-amber-200 transition mt-1.5 flex items-center justify-between">
                  <span>{locale === 'bn' ? 'বিলম্ব তালিকা' : 'Late list'}</span>
                  {lateAnalytics.totalLate > 0 && (
                    <span className="text-[9px] text-amber-300 font-extrabold">
                      {locale === 'bn' ? `গড় ${toBanglaDigits(lateAnalytics.avgLateMinutes)} মি.` : `Avg ${lateAnalytics.avgLateMinutes}m`}
                    </span>
                  )}
                </div>
              </button>

              {/* 4. অনুপস্থিত */}
              <button
                type="button"
                onClick={() => setActiveCategoryTab('absent')}
                className={`group rounded-2xl p-3.5 border shadow-md transition-all active:scale-95 text-left cursor-pointer relative overflow-hidden ${
                  activeCategoryTab === 'absent'
                    ? 'bg-rose-900/60 border-rose-400 ring-2 ring-rose-400 shadow-lg scale-[1.02]'
                    : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/40 hover:border-rose-400'
                }`}
              >
                <div className="text-[11px] text-rose-300 font-extrabold uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === 'bn' ? 'অনুপস্থিত' : 'Absent'}</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1.5 tracking-tight">
                  {locale === 'bn' ? toBanglaDigits(adminDailySummary.absentCount) : adminDailySummary.absentCount}
                  <span className="text-xs font-bold text-rose-500/80 ml-1">
                    ({locale === 'bn' ? toBanglaDigits(adminDailySummary.absentRate) : adminDailySummary.absentRate}%)
                  </span>
                </div>
                <div className="text-[10px] text-rose-300/90 font-bold group-hover:text-rose-200 transition mt-1.5 flex items-center justify-between">
                  <span>{locale === 'bn' ? 'অনুপস্থিত তালিকা' : 'Absent list'}</span>
                  <span className="text-[9px] text-rose-300 font-extrabold">
                    {locale === 'bn' ? 'অননুমোদিত' : 'Unexcused'}
                  </span>
                </div>
              </button>

              {/* 5. ছুটিতে */}
              <button
                type="button"
                onClick={() => setActiveCategoryTab('leave')}
                className={`group rounded-2xl p-3.5 border shadow-md transition-all active:scale-95 text-left cursor-pointer col-span-2 sm:col-span-1 relative overflow-hidden ${
                  activeCategoryTab === 'leave'
                    ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-400 shadow-lg scale-[1.02]'
                    : 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/40 hover:border-purple-400'
                }`}
              >
                <div className="text-[11px] text-purple-300 font-extrabold uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === 'bn' ? 'ছুটিতে' : 'On Leave'}</span>
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1.5 tracking-tight">
                  {locale === 'bn' ? toBanglaDigits(adminDailySummary.leaveCount) : adminDailySummary.leaveCount}
                  <span className="text-xs font-bold text-purple-500/80 ml-1">
                    ({locale === 'bn' ? toBanglaDigits(adminDailySummary.leaveRate) : adminDailySummary.leaveRate}%)
                  </span>
                </div>
                <div className="text-[10px] text-purple-300/90 font-bold group-hover:text-purple-200 transition mt-1.5 flex items-center justify-between">
                  <span>{locale === 'bn' ? 'ছুটি তালিকা' : 'Leave list'}</span>
                  <span className="text-[9px] text-purple-300 font-extrabold truncate">
                    {locale === 'bn'
                      ? `SL:${toBanglaDigits(adminDailySummary.leaveBreakdown.sick)} · CL:${toBanglaDigits(adminDailySummary.leaveBreakdown.casual)}`
                      : `SL:${adminDailySummary.leaveBreakdown.sick} · CL:${adminDailySummary.leaveBreakdown.casual}`}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================
              SECTION 4: রিলেটেড ম্যানপাওয়ার তালিকা (ডিউটি করছে কয়জন, কারা / ছুটিতে কারা ইত্যাদি)
              (Related Manpower List: directly below the Manpower Summary Dashboard)
             ======================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE4DC] shadow-sm space-y-3.5">
            {/* Header with Active Category Indicator & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#EDE4DC]">
              <div className="flex items-center gap-2">
                {activeCategoryTab === 'present' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {activeCategoryTab === 'late' && <Clock className="w-5 h-5 text-amber-600" />}
                {activeCategoryTab === 'leave' && <Calendar className="w-5 h-5 text-purple-600" />}
                {activeCategoryTab === 'absent' && <XCircle className="w-5 h-5 text-rose-600" />}
                {activeCategoryTab === 'all' && <Users className="w-5 h-5 text-[#EC1C24]" />}

                <div>
                  <h4 className="text-sm sm:text-base font-black text-[#2A1A1B]">
                    {activeCategoryTab === 'present' && (locale === 'bn' ? `কারখানায় উপস্থিত ও ডিউটিরত কর্মী (${toBanglaDigits(relatedCategoryEntries.length)} জন)` : `On-Duty Employees (${relatedCategoryEntries.length} Staff)`)}
                    {activeCategoryTab === 'late' && (locale === 'bn' ? `দেরিতে প্রবেশকারী কর্মীদের তালিকা (${toBanglaDigits(relatedCategoryEntries.length)} জন)` : `Late Arrivals (${relatedCategoryEntries.length} Staff)`)}
                    {activeCategoryTab === 'leave' && (locale === 'bn' ? `ছুটিতে থাকা কর্মীদের তালিকা ও ছুটির বিবরণ (${toBanglaDigits(relatedCategoryEntries.length)} জন)` : `Employees On Leave (${relatedCategoryEntries.length} Staff)`)}
                    {activeCategoryTab === 'absent' && (locale === 'bn' ? `অনুপস্থিত কর্মীদের তালিকা (${toBanglaDigits(relatedCategoryEntries.length)} জন)` : `Absent Staff (${relatedCategoryEntries.length})`)}
                    {activeCategoryTab === 'all' && (locale === 'bn' ? `নির্বাচিত ফিল্টারের সকল কর্মী (${toBanglaDigits(relatedCategoryEntries.length)} জন)` : `All Personnel (${relatedCategoryEntries.length})`)}
                  </h4>
                  <p className="text-[11px] text-[#8C7B7C]">
                    {activeCategoryTab === 'present' && (locale === 'bn' ? 'বর্তমানে কারখানায় প্রবেশ করে নিজ নিজ সেকশনে ডিউটি করছেন' : 'Currently active & stationed in factory lines')}
                    {activeCategoryTab === 'late' && (locale === 'bn' ? 'নির্ধারিত শিফট গ্রেস টাইমের পরে বায়োমেট্রিক গেট পাঞ্চ করেছেন' : 'Clocked in past the scheduled shift grace period')}
                    {activeCategoryTab === 'leave' && (locale === 'bn' ? 'অনুমোদিত অসুস্থতাজনিত, নৈমিত্তিক, বার্ষিক বা প্রসূতি ছুটিতে আছেন' : 'Approved sick, casual, earned, or maternity leave')}
                    {activeCategoryTab === 'absent' && (locale === 'bn' ? 'কোনো পূর্ব অনুমতি ছাড়া অনুপস্থিত কর্মীবৃন্দ' : 'Unnotified / unexcused absence today')}
                    {activeCategoryTab === 'all' && (locale === 'bn' ? 'বিভাগ, শিফট ও ক্যাডার ফিল্টার অনুযায়ী সামগ্রিক তালিকা' : 'All employees matching active filter criteria')}
                  </p>
                </div>
              </div>

              {/* Quick Tab Selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none self-start sm:self-auto shrink-0">
                {[
                  { id: 'present', labelBn: `উপস্থিত (${toBanglaDigits(adminDailySummary.presentCount)})`, labelEn: `Present (${adminDailySummary.presentCount})` },
                  { id: 'late', labelBn: `লেট (${toBanglaDigits(adminDailySummary.lateCount)})`, labelEn: `Late (${adminDailySummary.lateCount})` },
                  { id: 'leave', labelBn: `ছুটিতে (${toBanglaDigits(adminDailySummary.leaveCount)})`, labelEn: `Leave (${adminDailySummary.leaveCount})` },
                  { id: 'absent', labelBn: `অনুপস্থিত (${toBanglaDigits(adminDailySummary.absentCount)})`, labelEn: `Absent (${adminDailySummary.absentCount})` },
                  { id: 'all', labelBn: `সব (${toBanglaDigits(adminDailySummary.totalExpected)})`, labelEn: `All (${adminDailySummary.totalExpected})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(tab.id as AttendanceMetricCategory)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeCategoryTab === tab.id
                        ? 'bg-[#2A1A1B] text-white shadow-xs'
                        : 'bg-[#F9F6F0] text-[#8C7B7C] hover:bg-[#F3ECE6] hover:text-[#2A1A1B] border border-[#EDE4DC]'
                    }`}
                  >
                    {locale === 'bn' ? tab.labelBn : tab.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* List of matching employees */}
            <div className="space-y-2.5">
              {relatedCategoryEntries.length === 0 ? (
                <div className="text-center py-8 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EDE4DC] text-xs font-semibold text-[#8C7B7C]">
                  {locale === 'bn' ? 'নির্বাচিত ফিল্টারে এই ক্যাটাগরিতে কোনো কর্মী পাওয়া যায়নি।' : 'No employees found in this category for the current filter.'}
                </div>
              ) : (
                relatedCategoryEntries.map((entry, idx) => {
                  const isArrived = entry.inAt !== null;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-[#EDE4DC] hover:border-[#EC1C24]/30 bg-white hover:bg-[#FDFCFB] transition-all shadow-2xs"
                    >
                      {/* Left: Index + Photo + Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center text-xs font-black text-[#8C7B7C] shrink-0">
                          {locale === 'bn' ? `${toBanglaDigits(idx + 1)}.` : `${idx + 1}.`}
                        </span>

                        <div className="relative shrink-0">
                          <img
                            src={entry.photoUrl}
                            alt={entry.nameEn}
                            className="w-10 h-10 rounded-xl object-cover border border-[#EDE4DC]"
                          />
                          {isArrived && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 -right-0.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-[#2A1A1B] truncate">
                              {locale === 'bn' ? entry.nameBn : entry.nameEn}
                            </span>
                            <span className="text-[10px] text-[#8C7B7C] font-semibold">
                              #{entry.empId}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                entry.cadre === 'officer'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : entry.cadre === 'worker'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {entry.cadre === 'officer'
                                ? locale === 'bn' ? 'কর্মকর্তা' : 'Officer'
                                : entry.cadre === 'worker'
                                ? locale === 'bn' ? 'শ্রমিক' : 'Worker'
                                : locale === 'bn' ? 'চুক্তিভিত্তিক' : 'Casual'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#8C7B7C] truncate mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {locale === 'bn' ? entry.deptNameBn : entry.deptNameEn}
                            </span>
                            <span> · </span>
                            <span>{locale === 'bn' ? entry.designationNameBn : entry.designationNameEn}</span>
                            <span className="hidden sm:inline"> ({locale === 'bn' ? entry.sectionNameBn : entry.sectionNameEn})</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                              {locale === 'bn' ? entry.shiftNameBn : entry.shiftNameEn}
                            </span>
                            {entry.terminal && (
                              <span className="truncate">📍 {entry.terminal}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Dynamic Category Specific Details */}
                      <div className="text-right shrink-0 pl-3">
                        {/* 1. Present / On-Duty Details */}
                        {entry.status === 'present' && (
                          <>
                            <div className="text-xs sm:text-sm font-black text-emerald-600">
                              {locale === 'bn' ? toBanglaDigits(entry.inAt!) : entry.inAt} AM
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {locale === 'bn' ? 'ডিউটি চলছে' : 'Duty Active'}
                              </span>
                            </div>
                            <div className="text-[9px] text-[#8C7B7C] mt-0.5">
                              {locale === 'bn' ? 'অন-টাইম উপস্থিতি' : 'On-Time'}
                            </div>
                          </>
                        )}

                        {/* 2. Late Arrival Details */}
                        {entry.status === 'late' && (
                          <>
                            <div className="text-xs sm:text-sm font-black text-amber-600">
                              {locale === 'bn' ? toBanglaDigits(entry.inAt!) : entry.inAt} AM
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                {locale === 'bn' ? `${toBanglaDigits(entry.lateMinutes)} মি. দেরি` : `${entry.lateMinutes}m Late`}
                              </span>
                            </div>
                            <div className="text-[9px] text-amber-600 mt-0.5 font-semibold">
                              {entry.lateAdjustmentStatus === 'pending'
                                ? locale === 'bn' ? 'প্রত্যাহার আবেদন পেন্ডিং' : 'Adj. Pending'
                                : locale === 'bn' ? 'অ্যাডজাস্টমেন্টহীন' : 'Unadjusted'}
                            </div>
                          </>
                        )}

                        {/* 3. Leave Details */}
                        {entry.status === 'leave' && (
                          <>
                            <span
                              className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                entry.leaveType === 'sick'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : entry.leaveType === 'casual'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : entry.leaveType === 'earned'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {entry.leaveType === 'sick'
                                ? locale === 'bn' ? 'অসুস্থতাজনিত (SL)' : 'Sick Leave (SL)'
                                : entry.leaveType === 'casual'
                                ? locale === 'bn' ? 'নৈমিত্তিক (CL)' : 'Casual Leave (CL)'
                                : entry.leaveType === 'earned'
                                ? locale === 'bn' ? 'অর্জিত ছুটি (EL)' : 'Earned Leave (EL)'
                                : locale === 'bn' ? 'প্রসূতি ছুটি (ML)' : 'Maternity (ML)'}
                            </span>
                            <div className="text-[9px] text-[#8C7B7C] mt-1 font-semibold">
                              {(locale === 'bn' ? entry.leaveReasonBn : entry.leaveReasonEn) ||
                                (locale === 'bn' ? 'এইচআর অনুমোদিত' : 'HR Approved')}
                            </div>
                          </>
                        )}

                        {/* 4. Absent Details */}
                        {entry.status === 'absent' && (
                          <>
                            <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {locale === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                            </span>
                            <div className="text-[9px] text-rose-600 mt-1 font-semibold">
                              {locale === 'bn' ? 'অননুমোদিত ছুটি' : 'Unexcused'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================
              SECTION 5: ডিটেইল সামারি
              (Detailed Summary: Section-by-section breakdown & Turnout health)
             ======================================================== */}
          <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-[#EDE4DC] shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#EDE4DC]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#EC1C24]" />
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#2A1A1B]">
                    {locale === 'bn' ? 'বিভাগ অনুযায়ী বিস্তারিত উপস্থিতি ও ম্যানপাওয়ার সামারি' : 'Department Manpower & Turnout Detailed Summary'}
                  </h4>
                  <p className="text-[11px] text-[#8C7B7C]">
                    {locale === 'bn' ? 'কারখানার ৮টি উৎপাদন ও প্রশাসনিক সেকশনের উপস্থিতির হার ও বিশদ' : 'Detailed metrics across all 8 factory departments'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-600">
                  {locale === 'bn' ? 'সার্বিক উপস্থিতি:' : 'Total Turnout:'}{' '}
                  <strong className="text-emerald-600 font-black">
                    {locale === 'bn' ? `${toBanglaDigits(adminDailySummary.attendanceRate)}%` : `${adminDailySummary.attendanceRate}%`}
                  </strong>
                </span>
              </div>
            </div>

            {/* 8 Department Breakdown Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {adminDailySummary.departmentStats.map(dept => {
                const isSelected = selectedSection === dept.deptId;

                return (
                  <button
                    key={dept.deptId}
                    type="button"
                    onClick={() => setSelectedSection(isSelected ? 'all' : dept.deptId)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#EC1C24] shadow-md ring-2 ring-[#EC1C24]/20'
                        : 'bg-white border-[#EDE4DC] hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-[#2A1A1B] truncate">
                        {locale === 'bn' ? dept.nameBn : dept.nameEn}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          dept.attendanceRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : dept.attendanceRate >= 60
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {locale === 'bn' ? `${toBanglaDigits(dept.attendanceRate)}%` : `${dept.attendanceRate}%`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${dept.attendanceRate}%` }}
                      />
                    </div>

                    {/* Counts Row */}
                    <div className="flex items-center justify-between text-[10px] text-[#8C7B7C] font-semibold mt-2 pt-1 border-t border-slate-100">
                      <span>
                        {locale === 'bn' ? 'উপস্থিত:' : 'Present:'}{' '}
                        <strong className="text-emerald-700 font-bold">
                          {locale === 'bn' ? `${toBanglaDigits(dept.present)}/${toBanglaDigits(dept.total)}` : `${dept.present}/${dept.total}`}
                        </strong>
                      </span>
                      {dept.late > 0 && (
                        <span className="text-amber-700 font-bold">
                          {locale === 'bn' ? `${toBanglaDigits(dept.late)} লেট` : `${dept.late} Late`}
                        </span>
                      )}
                      {dept.absent > 0 && (
                        <span className="text-rose-600 font-bold">
                          {locale === 'bn' ? `${toBanglaDigits(dept.absent)} অনু.` : `${dept.absent} Abs.`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Interactive Drilldown Modal */}
      <AttendanceDrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        initialCategory={drilldownCategory}
        initialShift={selectedShift}
        entries={filteredEntries}
        locale={locale}
        currentRole={currentRole}
        onRequestAdjustment={onRequestAdjustment}
      />
    </div>
  );
};
