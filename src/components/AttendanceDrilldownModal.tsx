/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Live Attendance Drilldown Modal ("হাজিরা বিস্তারিত বিশ্লেষণ")
 * Interactive modal for Present, Late, Leave, and Absent employee breakdowns.
 * Supports shift toggling (Morning, Evening, Night, General) and rich analytics.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  XCircle,
  Clock,
  Phone,
  Filter,
  Check,
  FileText,
  AlertCircle,
  Building2,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Download,
} from 'lucide-react';
import { Locale, Role } from '../types';
import { toBanglaDigits } from '../data/translations';
import {
  LiveAttendanceEntry,
  AttendanceMetricCategory,
  filterEntriesByCategory,
  calculateLateAnalytics,
  calculateLeaveAnalytics,
  calculateAbsentAnalytics,
} from '../data/liveAttendanceData';

interface AttendanceDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: AttendanceMetricCategory;
  initialShift?: string;
  entries: LiveAttendanceEntry[];
  locale: Locale;
  currentRole: Role;
  onRequestAdjustment?: () => void;
}

export const AttendanceDrilldownModal: React.FC<AttendanceDrilldownModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  initialShift = 'all',
  entries,
  locale,
  currentRole,
  onRequestAdjustment,
}) => {
  const [activeCategory, setActiveCategory] = useState<AttendanceMetricCategory>(initialCategory);
  const [activeShift, setActiveShift] = useState<string>(initialShift);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [approvedAdjustments, setApprovedAdjustments] = useState<Record<string, boolean>>({});
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Sync initialCategory when opened
  React.useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  React.useEffect(() => {
    setActiveShift(initialShift);
  }, [initialShift]);

  // Filter entries by current shift
  const shiftFilteredEntries = useMemo(() => {
    if (activeShift === 'all') return entries;
    return entries.filter(e => e.shiftId === activeShift);
  }, [entries, activeShift]);

  // Filter entries by category and search
  const displayedEntries = useMemo(() => {
    const categoryEntries = filterEntriesByCategory(shiftFilteredEntries, activeCategory);
    if (!searchQuery.trim()) return categoryEntries;

    const q = searchQuery.toLowerCase();
    return categoryEntries.filter(
      e =>
        e.nameEn.toLowerCase().includes(q) ||
        e.nameBn.includes(q) ||
        e.empId.includes(q) ||
        e.deptNameEn.toLowerCase().includes(q) ||
        e.deptNameBn.includes(q) ||
        e.sectionNameEn.toLowerCase().includes(q) ||
        e.sectionNameBn.includes(q) ||
        (e.leaveTypeBn && e.leaveTypeBn.includes(q)) ||
        (e.leaveReasonBn && e.leaveReasonBn.includes(q))
    );
  }, [shiftFilteredEntries, activeCategory, searchQuery]);

  // Overall counts for category tabs based on activeShift
  const categoryCounts = useMemo(() => {
    const all = shiftFilteredEntries.length;
    const present = shiftFilteredEntries.filter(e => e.inAt !== null && e.inAt !== '').length;
    const late = shiftFilteredEntries.filter(e => e.isLate).length;
    const leave = shiftFilteredEntries.filter(e => e.status === 'leave').length;
    const absent = shiftFilteredEntries.filter(
      e => e.status === 'absent' || (!e.inAt && e.status !== 'leave' && e.status !== 'weeklyOff')
    ).length;

    return { all, present, late, leave, absent };
  }, [shiftFilteredEntries]);

  // Category-specific analytical summaries
  const lateStats = useMemo(() => calculateLateAnalytics(shiftFilteredEntries), [shiftFilteredEntries]);
  const leaveStats = useMemo(() => calculateLeaveAnalytics(shiftFilteredEntries), [shiftFilteredEntries]);
  const absentStats = useMemo(() => calculateAbsentAnalytics(shiftFilteredEntries), [shiftFilteredEntries]);

  if (!isOpen) return null;

  const handleApproveAdjustment = (empId: string, name: string) => {
    setApprovedAdjustments(prev => ({ ...prev, [empId]: true }));
    setActionSuccessNotice(
      locale === 'bn'
        ? `${name}-এর লেট অ্যাডজাস্টমেন্ট সফলভাবে অনুমোদন করা হয়েছে!`
        : `Late adjustment for ${name} successfully approved!`
    );
    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  const getShiftBadgeName = (shiftId: string) => {
    switch (shiftId) {
      case 'shiftA':
        return locale === 'bn' ? 'মর্নিং শিফট এ (০৬:০০ - ১৪:০০)' : 'Shift A Morning (06:00 - 14:00)';
      case 'shiftB':
        return locale === 'bn' ? 'ইভনিং শিফট বি (১৪:০০ - ২২:০০)' : 'Shift B Evening (14:00 - 22:00)';
      case 'night':
        return locale === 'bn' ? 'নাইট শিফট সি (২২:০০ - ০৬:০০)' : 'Night Roster (22:00 - 06:00)';
      case 'general':
        return locale === 'bn' ? 'জেনারেল শিফট (০৮:০০ - ১৭:০০)' : 'General Shift (08:00 - 17:00)';
      default:
        return locale === 'bn' ? 'সকল শিফট' : 'All Shifts';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col border border-[#EDE4DC] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#2A1A1B] to-[#3D2527] text-white flex items-center justify-between border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#EC1C24] font-black border border-white/10">
              {activeCategory === 'present' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {activeCategory === 'late' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {activeCategory === 'leave' && <Calendar className="w-5 h-5 text-purple-300" />}
              {activeCategory === 'absent' && <XCircle className="w-5 h-5 text-rose-400" />}
              {activeCategory === 'all' && <Users className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {activeCategory === 'present' && (locale === 'bn' ? 'উপস্থিত কর্মীদের লাইভ তালিকা' : 'Present Staff List')}
                  {activeCategory === 'late' && (locale === 'bn' ? 'দেরিতে আসা কর্মীদের বিশ্লেষণ' : 'Late Arrivals Breakdown')}
                  {activeCategory === 'leave' && (locale === 'bn' ? 'ছুটি ও অসুস্থতাজনিত তালিকা' : 'Staff On Leave & Sick List')}
                  {activeCategory === 'absent' && (locale === 'bn' ? 'অনুপস্থিত কর্মীদের তালিকা' : 'Absent Staff List')}
                  {activeCategory === 'all' && (locale === 'bn' ? 'সকল শিফট নির্ধারিত কর্মী' : 'All Scheduled Workforce')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-white/20 text-white">
                  {locale === 'bn' ? `${toBanglaDigits(displayedEntries.length)} জন` : `${displayedEntries.length} Total`}
                </span>
              </div>
              <p className="text-[11px] text-white/70">
                {locale === 'bn'
                  ? `বর্তমানে সক্রিয় ফিল্টার: ${getShiftBadgeName(activeShift)}`
                  : `Active Shift: ${getShiftBadgeName(activeShift)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Success Notification Toast */}
        {actionSuccessNotice && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-in slide-in-from-top">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {actionSuccessNotice}
            </span>
            <button onClick={() => setActionSuccessNotice(null)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Category Switcher Tabs */}
        <div className="bg-[#FAF7F2] px-3 sm:px-6 pt-3 border-b border-[#EDE4DC]">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2.5">
            {[
              {
                id: 'all' as AttendanceMetricCategory,
                labelBn: 'সকল কর্মী',
                labelEn: 'All Staff',
                count: categoryCounts.all,
                colorClass: 'text-slate-700 bg-slate-100',
              },
              {
                id: 'present' as AttendanceMetricCategory,
                labelBn: 'উপস্থিত',
                labelEn: 'Present',
                count: categoryCounts.present,
                colorClass: 'text-emerald-700 bg-emerald-100',
              },
              {
                id: 'late' as AttendanceMetricCategory,
                labelBn: 'দেরি (Late)',
                labelEn: 'Late',
                count: categoryCounts.late,
                colorClass: 'text-amber-700 bg-amber-100',
              },
              {
                id: 'leave' as AttendanceMetricCategory,
                labelBn: 'ছুটিতে (Leave)',
                labelEn: 'On Leave',
                count: categoryCounts.leave,
                colorClass: 'text-purple-700 bg-purple-100',
              },
              {
                id: 'absent' as AttendanceMetricCategory,
                labelBn: 'অনুপস্থিত',
                labelEn: 'Absent',
                count: categoryCounts.absent,
                colorClass: 'text-rose-700 bg-rose-100',
              },
            ].map(tab => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#EC1C24] text-white shadow-sm ring-2 ring-[#EC1C24]/20'
                      : 'bg-white text-[#2A1A1B] hover:bg-[#F3ECE6] border border-[#EDE4DC]'
                  }`}
                >
                  <span>{locale === 'bn' ? tab.labelBn : tab.labelEn}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : tab.colorClass
                    }`}
                  >
                    {locale === 'bn' ? toBanglaDigits(tab.count) : tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Shift Filter Navigation Row ("সকাল, বিকাল, নাইট—যে শিফটের উপর ক্লিক করা হবে সেই শিফটের ডাটা দেখাবে") */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-[#EDE4DC]/80 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-bold text-[#8C7B7C] whitespace-nowrap">
                {locale === 'bn' ? 'শিফট নির্বাচন:' : 'Shift:'}
              </span>
              {[
                { id: 'all', labelBn: 'সকল শিফট', labelEn: 'All Shifts' },
                { id: 'shiftA', labelBn: 'সকাল / মর্নিং এ', labelEn: 'Morning A' },
                { id: 'shiftB', labelBn: 'বিকাল / ইভনিং বি', labelEn: 'Evening B' },
                { id: 'night', labelBn: 'নাইট রোস্টার সি', labelEn: 'Night C' },
                { id: 'general', labelBn: 'জেনারেল শিফট', labelEn: 'General' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveShift(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition ${
                    activeShift === s.id
                      ? 'bg-[#2A1A1B] text-white'
                      : 'bg-white/80 hover:bg-white text-[#8C7B7C] border border-[#EDE4DC]'
                  }`}
                >
                  {locale === 'bn' ? s.labelBn : s.labelEn}
                </button>
              ))}
            </div>

            {/* Quick in-modal search input */}
            <div className="relative min-w-[180px] sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#8C7B7C] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={locale === 'bn' ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search staff...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white border border-[#EDE4DC] rounded-xl pl-8 pr-2.5 py-1 text-[#2A1A1B] placeholder-[#8C7B7C] focus:outline-none focus:border-[#EC1C24]"
              />
            </div>
          </div>
        </div>

        {/* Analytical Metric Sub-Banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-[#EDE4DC] text-xs">
          {activeCategory === 'late' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold block">
                  {locale === 'bn' ? 'মোট লেট কর্মী' : 'Total Late'}
                </span>
                <span className="text-sm font-black text-amber-900">
                  {locale === 'bn' ? `${toBanglaDigits(lateStats.totalLate)} জন` : `${lateStats.totalLate} Staff`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-[#8C7B7C] font-bold block">
                  {locale === 'bn' ? 'গড়ে বিলম্ব' : 'Avg. Delay'}
                </span>
                <span className="text-sm font-black text-slate-800">
                  {locale === 'bn' ? `${toBanglaDigits(lateStats.avgLateMinutes)} মিনিট` : `${lateStats.avgLateMinutes} min`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-[#8C7B7C] font-bold block">
                  {locale === 'bn' ? 'সর্বোচ্চ বিলম্ব' : 'Max Delay'}
                </span>
                <span className="text-sm font-black text-slate-800">
                  {locale === 'bn' ? `${toBanglaDigits(lateStats.maxLateMinutes)} মিনিট` : `${lateStats.maxLateMinutes} min`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold block">
                  {locale === 'bn' ? 'অ্যাডজাস্টমেন্ট পেন্ডিং' : 'Pending Request'}
                </span>
                <span className="text-sm font-black text-blue-900">
                  {locale === 'bn' ? `${toBanglaDigits(lateStats.pendingAdjustments)} জন` : `${lateStats.pendingAdjustments}`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-rose-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-rose-700 font-bold block">
                  {locale === 'bn' ? 'অননুমোদিত লেট' : 'Unapproved Late'}
                </span>
                <span className="text-sm font-black text-rose-800">
                  {locale === 'bn' ? `${toBanglaDigits(lateStats.unapprovedLate)} জন` : `${lateStats.unapprovedLate}`}
                </span>
              </div>
            </div>
          )}

          {activeCategory === 'leave' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold block">
                  {locale === 'bn' ? 'অসুস্থতাজনিত (SL)' : 'Sick Leave (SL)'}
                </span>
                <span className="text-sm font-black text-blue-900">
                  {locale === 'bn' ? `${toBanglaDigits(leaveStats.sickLeave)} জন` : `${leaveStats.sickLeave} Staff`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block">
                  {locale === 'bn' ? 'নৈমিত্তিক ছুটি (CL)' : 'Casual Leave (CL)'}
                </span>
                <span className="text-sm font-black text-emerald-900">
                  {locale === 'bn' ? `${toBanglaDigits(leaveStats.casualLeave)} জন` : `${leaveStats.casualLeave} Staff`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-purple-200">
                <span className="text-[10px] text-purple-700 font-bold block">
                  {locale === 'bn' ? 'অর্জিত ছুটি (EL)' : 'Earned Leave (EL)'}
                </span>
                <span className="text-sm font-black text-purple-900">
                  {locale === 'bn' ? `${toBanglaDigits(leaveStats.earnedLeave)} জন` : `${leaveStats.earnedLeave} Staff`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-pink-200">
                <span className="text-[10px] text-pink-700 font-bold block">
                  {locale === 'bn' ? 'প্রসূতি ছুটি (ML)' : 'Maternity Leave (ML)'}
                </span>
                <span className="text-sm font-black text-pink-900">
                  {locale === 'bn' ? `${toBanglaDigits(leaveStats.maternityLeave)} জন` : `${leaveStats.maternityLeave} Staff`}
                </span>
              </div>
            </div>
          )}

          {activeCategory === 'absent' && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-rose-300 bg-rose-50/50">
                <span className="text-[10px] text-rose-700 font-bold block flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  {locale === 'bn' ? 'বিনা নোটিশে অনুপস্থিত (জরুরি সতর্কতা)' : 'Unnotified Absent (Alert)'}
                </span>
                <span className="text-sm font-black text-rose-800">
                  {locale === 'bn' ? `${toBanglaDigits(absentStats.unnotified)} জন` : `${absentStats.unnotified} Staff`}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold block">
                  {locale === 'bn' ? 'পূর্ব নোটিশ অনুযায়ী অনুপস্থিত' : 'Pre-notified Absence'}
                </span>
                <span className="text-sm font-black text-amber-900">
                  {locale === 'bn' ? `${toBanglaDigits(absentStats.notified)} জন` : `${absentStats.notified} Staff`}
                </span>
              </div>
            </div>
          )}

          {activeCategory === 'present' && (
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span className="text-xs">
                {locale === 'bn'
                  ? 'কারখানায় প্রবেশের বায়োমেট্রিক সময়ানুক্রম অনুযায়ী তালিকা প্রদর্শন করা হচ্ছে।'
                  : 'Displaying biometric arrivals in real-time chronological entry order.'}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {locale === 'bn' ? 'সক্রিয় বায়োমেট্রিক টার্মিনাল' : 'Active Biometric Device'}
              </span>
            </div>
          )}

          {activeCategory === 'all' && (
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span className="text-xs">
                {locale === 'bn'
                  ? 'বর্তমান রোস্টার ও শিডিউল অনুযায়ী কারখানার মোট নির্ধারিত জনবল।'
                  : 'Total factory workforce scheduled for selected shift.'}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full">
                {locale === 'bn' ? `${toBanglaDigits(displayedEntries.length)} জন কর্মী` : `${displayedEntries.length} Staff`}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable List of Staff Cards */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[55vh] space-y-2.5">
          {displayedEntries.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE4DC] space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'কোনো কর্মীর রেকর্ড পাওয়া যায়নি' : 'No records found matching filters'}
              </p>
              <p className="text-xs text-[#8C7B7C]">
                {locale === 'bn'
                  ? 'অন্য কোনো শিফট বা ফিল্টার নির্বাচন করে পুনরায় চেষ্টা করুন।'
                  : 'Try selecting a different shift or search term.'}
              </p>
            </div>
          ) : (
            displayedEntries.map((entry, index) => {
              const isApproved = approvedAdjustments[entry.empId] || entry.lateAdjustmentStatus === 'approved';

              return (
                <div
                  key={entry.id || entry.empId}
                  className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EDE4DC] hover:border-[#EC1C24]/30 shadow-xs hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Employee Profile Identity */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={entry.photoUrl}
                          alt={entry.nameEn}
                          className="w-11 h-11 rounded-xl object-cover border border-[#EDE4DC]"
                        />
                        {/* Status Icon Indicator Dot */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white ${
                            entry.status === 'present' && !entry.isLate
                              ? 'bg-emerald-500'
                              : entry.isLate
                              ? 'bg-amber-500'
                              : entry.status === 'leave'
                              ? 'bg-purple-500'
                              : 'bg-rose-500'
                          }`}
                        >
                          {entry.status === 'present' && !entry.isLate && '✓'}
                          {entry.isLate && '!'}
                          {entry.status === 'leave' && 'L'}
                          {entry.status === 'absent' && '✕'}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-[#2A1A1B]">
                            {locale === 'bn' ? entry.nameBn : entry.nameEn}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                            ID: {entry.empId}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#8C7B7C] font-semibold border border-[#EDE4DC]">
                            {entry.cadre === 'officer'
                              ? locale === 'bn' ? 'কর্মকর্তা' : 'Officer'
                              : entry.cadre === 'worker'
                              ? locale === 'bn' ? 'স্থায়ী শ্রমিক' : 'Worker'
                              : locale === 'bn' ? 'চুক্তিভিত্তিক' : 'Casual'}
                          </span>
                        </div>
                        <div className="text-xs text-[#8C7B7C] font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{locale === 'bn' ? entry.designationNameBn : entry.designationNameEn}</span>
                          <span>•</span>
                          <span>{locale === 'bn' ? entry.deptNameBn : entry.deptNameEn}</span>
                          <span>({locale === 'bn' ? entry.sectionNameBn : entry.sectionNameEn})</span>
                        </div>
                      </div>
                    </div>

                    {/* Entry Time / Attendance Badge */}
                    <div className="text-right shrink-0">
                      {entry.inAt ? (
                        <div>
                          <div className="text-xs font-mono font-black text-slate-800">
                            {entry.inAt} {parseInt(entry.inAt.split(':')[0]) < 12 ? 'AM' : 'PM'}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                              entry.isLate
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {entry.isLate
                              ? locale === 'bn' ? `+${toBanglaDigits(entry.lateMinutes)} মিনিট দেরি` : `+${entry.lateMinutes}m Late`
                              : locale === 'bn' ? 'সময়মতো প্রবেশ' : 'On-Time'}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            entry.status === 'leave'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {entry.status === 'leave'
                            ? locale === 'bn' ? 'অনুমোদিত ছুটিতে' : 'On Leave'
                            : locale === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Context-Specific Rich Information Bar */}

                  {/* 1. LATE DETAILS (User: "কে কত মিনিট করে লেট করছে, কয়টা অ্যাডজাস্টমেন্ট আছে, লেট অ্যাপ্রুভ নাই, কনফার্মেশন রিপোর্ট কতদিন লেট হইছে") */}
                  {entry.isLate && (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span className="font-bold text-amber-900">
                            {locale === 'bn'
                              ? `দেরির পরিমাণ: ${toBanglaDigits(entry.lateMinutes)} মিনিট (${entry.shiftSchedule} শিডিউল)`
                              : `Late duration: ${entry.lateMinutes} minutes (${entry.shiftSchedule})`}
                          </span>
                        </div>

                        {/* Monthly Confirmation Report / Late Days Tally */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#8C7B7C] font-semibold">
                            {locale === 'bn' ? 'চলতি মাসে লেট:' : 'Month Tally:'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                              (entry.monthlyLateDays || 1) >= 3
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {locale === 'bn'
                              ? `${toBanglaDigits(entry.monthlyLateDays || 1)} দিন`
                              : `${entry.monthlyLateDays || 1} days`}
                          </span>
                          {(entry.monthlyLateDays || 1) >= 3 && (
                            <span className="text-[10px] font-bold text-rose-600">
                              {locale === 'bn' ? '(বেতন কর্তন নিয়ম প্রযোজ্য)' : '(Deduction rule)'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Late Delay Meter Bar */}
                      <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            entry.lateMinutes > 20
                              ? 'bg-rose-500'
                              : entry.lateMinutes > 10
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (entry.lateMinutes / 30) * 100)}%` }}
                        />
                      </div>

                      {/* Adjustment Status & Action Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#8C7B7C]">
                            {locale === 'bn' ? 'অ্যাডজাস্টমেন্ট স্ট্যাটাস:' : 'Adjustment Status:'}
                          </span>

                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {locale === 'bn' ? 'অনুমোদিত লেট অ্যাডজাস্টমেন্ট' : 'Approved Adjustment'}
                            </span>
                          ) : entry.lateAdjustmentStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-200/90 text-amber-900">
                              <Clock className="w-3 h-3 text-amber-700" />
                              {locale === 'bn'
                                ? 'অ্যাডজাস্টমেন্ট আবেদন প্রক্রিয়াধীন'
                                : 'Adjustment Pending Review'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-100 text-rose-800">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              {locale === 'bn' ? 'অননুমোদিত লেট (কোনো আবেদন নেই)' : 'Unapproved Late (No Request)'}
                            </span>
                          )}
                        </div>

                        {/* Interactive Approval / Request Trigger */}
                        <div className="flex items-center gap-2">
                          {['superAdmin', 'hrManager', 'hrExecutive', 'hod'].includes(currentRole) && !isApproved && (
                            <button
                              onClick={() =>
                                handleApproveAdjustment(entry.empId, locale === 'bn' ? entry.nameBn : entry.nameEn)
                              }
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              {locale === 'bn' ? 'অনুমোদন দিন' : 'Approve Late'}
                            </button>
                          )}
                          {onRequestAdjustment && !isApproved && entry.lateAdjustmentStatus !== 'pending' && (
                            <button
                              onClick={onRequestAdjustment}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EC1C24] hover:bg-[#C9141B] text-white transition active:scale-95 flex items-center gap-1 shadow-xs"
                            >
                              <FileText className="w-3 h-3" />
                              {locale === 'bn' ? 'আবেদন পাঠান' : 'Apply Adjustment'}
                            </button>
                          )}
                        </div>
                      </div>

                      {entry.lateAdjustmentNoteBn && (
                        <p className="text-[11px] text-amber-800/90 italic pt-0.5">
                          {locale === 'bn' ? `মন্তব্য: ${entry.lateAdjustmentNoteBn}` : `Note: ${entry.lateAdjustmentNoteEn || entry.lateAdjustmentNoteBn}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 2. LEAVE DETAILS (User: "ছুটিতে যদি কেউ থাকে সেটা চলে আসবে... কোন ছুটি নিছে সেটাও একটা লিস্ট থাকবে। অসুস্থতাজনিত ছুটি, সিএল, বা অন্য কিছু") */}
                  {entry.status === 'leave' && (
                    <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                              entry.leaveType === 'sick'
                                ? 'bg-blue-100 text-blue-800'
                                : entry.leaveType === 'casual'
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.leaveType === 'earned'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {locale === 'bn' ? entry.leaveTypeBn || 'ছুটি' : entry.leaveTypeEn || 'Leave'}
                          </span>
                          <span className="font-bold text-purple-900">
                            {locale === 'bn'
                              ? `মেয়াদ: ${toBanglaDigits(entry.leaveDays || 1)} দিন`
                              : `Duration: ${entry.leaveDays || 1} day(s)`}
                          </span>
                        </div>

                        {entry.emergencyPhone && (
                          <a
                            href={`tel:${entry.emergencyPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-200"
                          >
                            <Phone className="w-3 h-3" />
                            {entry.emergencyPhone}
                          </a>
                        )}
                      </div>

                      {entry.leaveReasonBn && (
                        <div className="text-[11px] text-purple-800/90 bg-white/70 p-2 rounded-lg border border-purple-100">
                          <span className="font-bold">{locale === 'bn' ? 'ছুটির কারণ: ' : 'Reason: '}</span>
                          {locale === 'bn' ? entry.leaveReasonBn : entry.leaveReasonEn || entry.leaveReasonBn}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. ABSENT DETAILS (User: "অনুপস্থিতের ক্ষেত্রেও সেম, কারা কারা অনুপস্থিত, কোনো নোটিশ ছাড়া অনুপস্থিত কিনা") */}
                  {entry.status === 'absent' && (
                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          {entry.absentNotice === 'unnotified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-600 text-white">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {locale === 'bn' ? 'বিনা নোটিশে অনুপস্থিত (জরুরি অনুসন্ধান)' : 'Unnotified Absence'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-200 text-amber-900">
                              <Clock className="w-3.5 h-3.5" />
                              {locale === 'bn' ? 'পূর্ব নোটিশকৃত অনুপস্থিতি' : 'Pre-notified Absence'}
                            </span>
                          )}

                          <span className="font-bold text-rose-900">
                            {locale === 'bn'
                              ? `টানা ${toBanglaDigits(entry.absentDaysCount || 1)} দিন অনুপস্থিত`
                              : `${entry.absentDaysCount || 1} day(s) absent`}
                          </span>
                        </div>

                        {entry.emergencyPhone && (
                          <a
                            href={`tel:${entry.emergencyPhone}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-lg shadow-xs transition"
                          >
                            <Phone className="w-3 h-3" />
                            {locale === 'bn' ? 'জরুরি যোগাযোগ' : 'Call Staff'}
                          </a>
                        )}
                      </div>

                      <p className="text-[11px] text-rose-700 font-medium">
                        {locale === 'bn'
                          ? `বায়োমেট্রিক গেট ডিভাইস (${entry.terminal})-এ কোনো পাঞ্চ রেকর্ড পাওয়া যায়নি। শিফট সময়: ${entry.shiftSchedule}`
                          : `No punch recorded at ${entry.terminal}. Shift schedule: ${entry.shiftSchedule}`}
                      </p>
                    </div>
                  )}

                  {/* 4. PRESENT DETAILS */}
                  {entry.status === 'present' && !entry.isLate && (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2 flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {locale === 'bn'
                            ? `সঠিক সময়ে পাঞ্চ সম্পন্ন: ${entry.terminal}`
                            : `Punched on-time at ${entry.terminal}`}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-900">
                        {entry.shiftSchedule}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#FAF7F2] border-t border-[#EDE4DC] flex items-center justify-between">
          <div className="text-xs text-[#8C7B7C]">
            {locale === 'bn'
              ? `মোট ${toBanglaDigits(displayedEntries.length)} টি রেকর্ড প্রদর্শিত হচ্ছে`
              : `Showing ${displayedEntries.length} records`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#2A1A1B] text-white hover:bg-black transition active:scale-95"
          >
            {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
