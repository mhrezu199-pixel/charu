/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Analytics Dashboards ("Noir Cockpit")
 * Conforms to PRD §5.14, UI-Spec §18, and Schema.md §11
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Flame,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Locale, Role, Employee } from '../types';
import { formatLocalizedNumber, toBanglaDigits } from '../data/translations';

interface AnalyticsDashboardProps {
  locale: Locale;
  currentRole: Role;
  employees: Employee[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  locale,
  currentRole,
  employees,
}) => {
  const isEmployeeOnly = currentRole === 'employee';
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'leave' | 'indicator' | 'performance' | 'myInsights'
  >(isEmployeeOnly ? 'myInsights' : 'overview');

  const [periodFilter, setPeriodFilter] = useState<'30D' | '90D' | '12M'>('30D');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDonutSegment, setSelectedDonutSegment] = useState<number | null>(null);
  const [reviewedAlerts, setReviewedAlerts] = useState<string[]>([]);

  // 12-Month attendance data for wave chart
  const monthlyAttendanceWave = [
    { month: 'Nov 25', rate: 91.2 },
    { month: 'Dec 25', rate: 92.5 },
    { month: 'Jan 26', rate: 93.8 },
    { month: 'Feb 26', rate: 90.4 },
    { month: 'Mar 26', rate: 94.1 },
    { month: 'Apr 26', rate: 92.8 },
    { month: 'May 26', rate: 95.0 },
    { month: 'Jun 26', rate: 93.4 },
    { month: 'Jul 26', rate: 91.8 },
    { month: 'Aug 26', rate: 94.6 },
    { month: 'Sep 26', rate: 95.8 },
    { month: 'Oct 26', rate: 96.2 },
  ];

  // Arrival histogram data
  const arrivalHistogram = [
    { bin: '07:30', count: 42, label: 'Early' },
    { bin: '07:45', count: 380, label: 'On Time' },
    { bin: '08:00', count: 620, label: 'Shift Start' },
    { bin: '08:10', count: 140, label: 'Grace End' },
    { bin: '08:20', count: 48, label: 'Late' },
    { bin: '08:30+', count: 10, label: 'Severe' },
  ];

  // Department Attendance Progress Data
  const deptProgress = [
    { name: 'Casting & Moulding', rate: 96.4, headcount: 310 },
    { name: 'Glazing & Surface Tech', rate: 95.8, headcount: 240 },
    { name: 'Kiln & Firing', rate: 97.2, headcount: 180 },
    { name: 'Sorting & Packing', rate: 94.1, headcount: 260 },
    { name: 'Quality Assurance', rate: 98.0, headcount: 75 },
    { name: 'Maintenance & Eng', rate: 95.5, headcount: 95 },
    { name: 'HR & Administration', rate: 99.1, headcount: 35 },
  ];

  // Leave Indicator Alerts
  const initialAlerts = [
    {
      id: 'alt-1',
      empName: 'Md. Al-Amin',
      dept: 'Casting',
      type: 'sickSpike',
      severity: 'warn',
      titleEn: 'Sick leave surge: 6 days in last 60 days',
      titleBn: 'সিক লিভ বৃদ্ধি: গত ৬০ দিনে ৬ দিন',
      date: '2026-10-24',
    },
    {
      id: 'alt-2',
      empName: 'Mehedi Hasan',
      dept: 'Packing',
      type: 'adjacentOff',
      severity: 'info',
      titleEn: 'Repeated leave adjacent to weekly off (Friday) 3 times',
      titleBn: 'সাপ্তাহিক ছুটির (শুক্রবার) সাথে মিলিয়ে ৩ বার ছুটি গ্রহণ',
      date: '2026-10-18',
    },
    {
      id: 'alt-3',
      empName: 'Rashedul Islam',
      dept: 'Glazing',
      type: 'lowBalance',
      severity: 'error',
      titleEn: 'Casual Leave balance near exhaustion (1 day remaining)',
      titleBn: 'নৈমিত্তিক ছুটির ব্যালেন্স সমাপ্তির পথে (১ দিন অবশিষ্ট)',
      date: '2026-10-28',
    },
  ];

  return (
    <div className="bg-[#0B0B0D] text-white rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
      {/* Cockpit Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC1C24] animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-widest text-white/50">
              {locale === 'bn' ? 'ককপিট বিশ্লেষণ হাব' : 'NOIR COCKPIT ANALYTICS'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {locale === 'bn' ? 'কার্যনির্বাহী বিশ্লেষণ ও স্বাস্থ্য' : 'Workforce Health & Intelligence'}
          </h2>
        </div>

        {/* Period and Dept Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl text-xs">
            {(['30D', '90D', '12M'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  periodFilter === p
                    ? 'bg-[#EC1C24] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all" className="bg-[#141417] text-white">
              {locale === 'bn' ? 'সকল বিভাগ' : 'All Departments'}
            </option>
            <option value="casting" className="bg-[#141417] text-white">
              {locale === 'bn' ? 'কাস্টিং' : 'Casting'}
            </option>
            <option value="glazing" className="bg-[#141417] text-white">
              {locale === 'bn' ? 'গ্লেজিং' : 'Glazing'}
            </option>
            <option value="kiln" className="bg-[#141417] text-white">
              {locale === 'bn' ? 'কিলন' : 'Kiln'}
            </option>
            <option value="packing" className="bg-[#141417] text-white">
              {locale === 'bn' ? 'প্যাকিং' : 'Packing'}
            </option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-white/10 pb-2 text-xs font-bold scrollbar-none">
        {!isEmployeeOnly && (
          <>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] text-white shadow-lg shadow-[#EC1C24]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'ওভারভিউ' : 'Overview'}</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] text-white shadow-lg shadow-[#EC1C24]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'হাজিরা বিশ্লেষণ' : 'Attendance'}</span>
            </button>

            <button
              onClick={() => setActiveTab('leave')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'leave'
                  ? 'bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] text-white shadow-lg shadow-[#EC1C24]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'ছুটির স্বাস্থ্য' : 'Leave Health'}</span>
            </button>

            <button
              onClick={() => setActiveTab('indicator')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'indicator'
                  ? 'bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] text-white shadow-lg shadow-[#EC1C24]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'লিভ ইন্ডিকেটর' : 'Leave Indicator'}</span>
              <span className="w-2 h-2 rounded-full bg-[#EC1C24]" />
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] text-white shadow-lg shadow-[#EC1C24]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'পারফরম্যান্স ও এডিএস' : 'Performance & ADS'}</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('myInsights')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'myInsights'
              ? 'bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] text-white shadow-lg shadow-[#EC1C24]/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{locale === 'bn' ? 'আমার ইনসাইটস' : 'My Insights'}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: locale === 'bn' ? 'মোট সক্রিয় কর্মী' : 'Headcount', val: '১,২৪০', delta: '+১২ জন', up: true },
              { label: locale === 'bn' ? 'গড় উপস্থিতি হার' : 'Attendance Rate', val: '৯৬.২%', delta: '+১.৪%', up: true },
              { label: locale === 'bn' ? 'সময়ানুবর্তিতা' : 'Punctuality', val: '৯৪.৮%', delta: '+০.৮%', up: true },
              { label: locale === 'bn' ? 'দেরি হার' : 'Late Rate', val: '৩.৮%', delta: '-০.৯%', up: false },
              { label: locale === 'bn' ? 'অনুপস্থিতি' : 'Absence', val: '১.২%', delta: '-০.৩%', up: false },
              { label: locale === 'bn' ? 'ওভারটাইম ঘণ্টা' : 'OT Hours', val: '৯৮০ ঘঃ', delta: '+৪৫ ঘঃ', up: true },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div className="text-[11px] font-bold uppercase text-white/50">{kpi.label}</div>
                <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] bg-clip-text text-transparent my-1">
                  {kpi.val}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{kpi.delta}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 12-Month Wave Chart (C2) & Today Status Donut (C5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Wave Chart */}
            <div className="lg:col-span-8 bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {locale === 'bn' ? '১২ মাসের উপস্থিতি প্রবণতা তরঙ্গ' : '12-Month Attendance Wave Curve'}
                  </h3>
                  <p className="text-xs text-white/50">
                    {locale === 'bn' ? 'মাসভিত্তিক ধারাবাহিক উপস্থিতি হারের গ্রাফিক্যাল চিত্র' : 'Historical monthly compliance & punctuality curve'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#EC1C24] bg-[#EC1C24]/10 px-2.5 py-1 rounded-full border border-[#EC1C24]/30">
                  {locale === 'bn' ? 'সর্বোচ্চ: ৯৬.২%' : 'Peak: 96.2%'}
                </span>
              </div>

              {/* Smooth Wave SVG */}
              <div className="relative w-full h-56 pt-2">
                <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC1C24" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#EC1C24" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF6B57" />
                      <stop offset="50%" stopColor="#EC1C24" />
                      <stop offset="100%" stopColor="#FF8A7A" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[40, 80, 120, 160].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  ))}

                  {/* Area */}
                  <path
                    d="M 20,130 C 70,110 120,90 170,140 C 220,80 270,100 320,60 C 370,80 420,110 470,70 C 520,50 550,40 580,30 L 580,180 L 20,180 Z"
                    fill="url(#waveFill)"
                  />

                  {/* Smooth Line */}
                  <path
                    d="M 20,130 C 70,110 120,90 170,140 C 220,80 270,100 320,60 C 370,80 420,110 470,70 C 520,50 550,40 580,30"
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Pulsing Dot at current peak */}
                  <circle cx="580" cy="30" r="5" fill="#FF6B57" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="580" cy="30" r="10" fill="#EC1C24" opacity="0.4" className="animate-ping" />
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] text-white/40 mt-1 px-1">
                  {monthlyAttendanceWave.map((m, idx) => (
                    <span key={idx}>{m.month}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Today Status Donut (C5) */}
            <div className="lg:col-span-4 bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {locale === 'bn' ? 'আজকের উপস্থিতি অনুপাত' : 'Today Status Breakdown'}
                </h3>
                <p className="text-xs text-white/50">
                  {locale === 'bn' ? 'উপস্থিত, দেরি, অনুপস্থিত ও ছুটির ভাগ' : 'Real-time daily punch mix'}
                </p>
              </div>

              {/* Custom SVG Donut */}
              <div className="relative w-44 h-44 mx-auto my-3 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Present (82%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#15803D"
                    strokeWidth="14"
                    strokeDasharray="206 251"
                    strokeLinecap="round"
                    className="hover:stroke-emerald-400 transition-all cursor-pointer"
                    onClick={() => setSelectedDonutSegment(0)}
                  />
                  {/* Late (8%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#EC1C24"
                    strokeWidth="14"
                    strokeDasharray="20 251"
                    strokeDashoffset="-206"
                    strokeLinecap="round"
                    className="hover:stroke-red-400 transition-all cursor-pointer"
                    onClick={() => setSelectedDonutSegment(1)}
                  />
                  {/* Leave (6%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#6D28D9"
                    strokeWidth="14"
                    strokeDasharray="15 251"
                    strokeDashoffset="-226"
                    strokeLinecap="round"
                    className="hover:stroke-purple-400 transition-all cursor-pointer"
                    onClick={() => setSelectedDonutSegment(2)}
                  />
                  {/* Absent (4%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#B91C1C"
                    strokeWidth="14"
                    strokeDasharray="10 251"
                    strokeDashoffset="-241"
                    strokeLinecap="round"
                    className="hover:stroke-rose-600 transition-all cursor-pointer"
                    onClick={() => setSelectedDonutSegment(3)}
                  />
                </svg>

                {/* Donut Center */}
                <div className="absolute text-center pointer-events-none">
                  <div className="text-2xl font-black text-white">৯৬.২%</div>
                  <div className="text-[10px] uppercase font-bold text-white/50">
                    {locale === 'bn' ? 'কার্যক্ষম' : 'Effective'}
                  </div>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                  <span className="text-white/80">{locale === 'bn' ? 'উপস্থিত ৮২%' : 'Present 82%'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC1C24]" />
                  <span className="text-white/80">{locale === 'bn' ? 'দেরি ৮%' : 'Late 8%'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6D28D9]" />
                  <span className="text-white/80">{locale === 'bn' ? 'ছুটি ৬%' : 'Leave 6%'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
                  <span className="text-white/80">{locale === 'bn' ? 'অনুপস্থিত ৪%' : 'Absent 4%'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Ranking (C4) */}
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-3">
              {locale === 'bn' ? 'বিভাগভিত্তিক উপস্থিতি রেটিং' : 'Department Attendance Leaderboard'}
            </h3>
            <div className="space-y-3">
              {deptProgress.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white/90">{d.name}</span>
                    <span className="font-bold text-[#EC1C24]">{d.rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B57] via-[#EC1C24] to-[#8E0F15] rounded-full"
                      style={{ width: `${d.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE ANALYTICS */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Arrival Time Histogram */}
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {locale === 'bn' ? 'আগমন সময় হিস্টোগ্রাম (Arrival Bell Curve)' : 'Arrival Time Distribution Histogram'}
                </h3>
                <p className="text-xs text-white/50">
                  {locale === 'bn' ? '০৮:০০ শিফটের কর্মীদের আগমন সময়ের ফ্রিকোয়েন্সি' : 'Employee morning punch distribution around 08:00 AM shift'}
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                {locale === 'bn' ? '৮৬% সময়মত পাঞ্চ' : '86% On-time'}
              </span>
            </div>

            <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4 border-b border-white/10">
              {arrivalHistogram.map(b => {
                const heightPct = Math.round((b.count / 620) * 100);
                const isLateBin = b.bin.startsWith('08:1') || b.bin.startsWith('08:2') || b.bin.includes('+');
                return (
                  <div key={b.bin} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-bold text-white/60 group-hover:text-white transition">
                      {b.count}
                    </span>
                    <div className="w-full bg-white/10 rounded-t-xl overflow-hidden h-36 flex items-end">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isLateBin
                            ? 'bg-gradient-to-t from-[#8E0F15] to-[#EC1C24]'
                            : 'bg-gradient-to-t from-emerald-800 to-emerald-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white">{b.bin}</span>
                    <span className="text-[10px] text-white/40">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 30-Day Heatmap Calendar (C8) */}
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-2">
              {locale === 'bn' ? 'অক্টোবর ২০২৬ দৈনিক উপস্থিতি হিটম্যাপ (Heatmap)' : 'October 2026 Daily Attendance Heatmap'}
            </h3>
            <p className="text-xs text-white/50 mb-4">
              {locale === 'bn' ? 'গাঢ় লাল = উচ্চ উপস্থিতি; ধূসর = সাপ্তাহিক ছুটি' : 'Darker red represents 95%+ turnout; grey represents weekly off'}
            </p>

            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="font-bold text-white/40 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const isFriday = day % 7 === 5;
                const attendanceShade = isFriday
                  ? 'bg-white/10 border-white/10 text-white/40'
                  : day % 3 === 0
                  ? 'bg-[#8E0F15] border-[#EC1C24]/30 text-white font-bold'
                  : 'bg-[#EC1C24] border-[#FF6B57] text-white font-black shadow-sm';

                return (
                  <div
                    key={day}
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform ${attendanceShade}`}
                  >
                    <span>{formatLocalizedNumber(day, locale)}</span>
                    <span className="text-[9px] opacity-75">
                      {isFriday ? (locale === 'bn' ? 'ছুটি' : 'Off') : '96%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE HEALTH */}
      {activeTab === 'leave' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#141417] border border-white/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase text-white/50 mb-1">
                {locale === 'bn' ? 'অনুমোদন গড় গতি' : 'Approval Turnaround'}
              </h4>
              <div className="text-3xl font-black text-[#EC1C24]">৮.৫ ঘঃ</div>
              <p className="text-xs text-white/60 mt-1">
                {locale === 'bn' ? 'আবেদন থেকে চূড়ান্তে গড় ৮.৫ ঘণ্টা' : 'Median decision turnaround (Target <24h)'}
              </p>
            </div>
            <div className="bg-[#141417] border border-white/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase text-white/50 mb-1">
                {locale === 'bn' ? 'চলতি মাসে ব্যবহৃত ছুটি' : 'Leaves Used This Month'}
              </h4>
              <div className="text-3xl font-black text-amber-400">৭৪ দিন</div>
              <p className="text-xs text-white/60 mt-1">
                {locale === 'bn' ? 'ক্যাজুয়াল ৪২, সিক ২০, আর্ন ১২' : 'CL: 42, SL: 20, EL: 12 days'}
              </p>
            </div>
            <div className="bg-[#141417] border border-white/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase text-white/50 mb-1">
                {locale === 'bn' ? 'ইএল লায়াবিলিটি এনক্যাশমেন্ট' : 'Earned Leave Encashment Pool'}
              </h4>
              <div className="text-3xl font-black text-emerald-400">৳১৪.৮ লাখ</div>
              <p className="text-xs text-white/60 mt-1">
                {locale === 'bn' ? 'বাৎসরিক সঞ্চিত ছুটির সম্ভাব্য নগদায়ন' : 'Estimated year-end encashment liability'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE INDICATOR (TRAFFIC LIGHTS & PATTERNS) */}
      {activeTab === 'indicator' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Status Trio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">
                  {locale === 'bn' ? 'সবুজ জোন (সুরক্ষিত)' : 'Green Zone (Safe >= 50%)'}
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {formatLocalizedNumber(88, locale)}%
                </div>
                <div className="text-xs text-emerald-300">১,০৯০ জন কর্মী</div>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase">
                  {locale === 'bn' ? 'হলুদ জোন (সতর্কতা ২০-৫০%)' : 'Amber Zone (Notice 20-50%)'}
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {formatLocalizedNumber(9, locale)}%
                </div>
                <div className="text-xs text-amber-300">১১২ জন কর্মী</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>

            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#FF6B57] uppercase">
                  {locale === 'bn' ? 'লাল জোন (ঝুঁকি < ২০%)' : 'Red Zone (Critical < 20%)'}
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {formatLocalizedNumber(3, locale)}%
                </div>
                <div className="text-xs text-red-300">৩৮ জন কর্মী</div>
              </div>
              <ShieldAlert className="w-8 h-8 text-[#EC1C24]" />
            </div>
          </div>

          {/* Pattern Alerts List */}
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {locale === 'bn' ? 'লিভ ইন্ডিকেটর ও প্যাটার্ন অ্যালার্ট' : 'Leave Indicator & Risk Flags'}
                </h3>
                <p className="text-xs text-white/50">
                  {locale === 'bn'
                    ? 'এইচআর পর্যালোচনার জন্য চিহ্নিত প্যাটার্ন (কোনো শাস্তিমূলক ব্যবস্থা নয়)'
                    : 'System prompts for HR advisory review (neutral, non-punitive)'}
                </p>
              </div>
              <span className="text-xs text-white/50 font-semibold">
                {locale === 'bn' ? 'এইচআর রিভিউর জন্য' : 'HR Review Only'}
              </span>
            </div>

            <div className="space-y-3">
              {initialAlerts.map(alt => {
                const isReviewed = reviewedAlerts.includes(alt.id);
                return (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                      isReviewed
                        ? 'bg-white/5 border-white/5 opacity-50'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${
                          alt.severity === 'error'
                            ? 'bg-[#EC1C24]'
                            : alt.severity === 'warn'
                            ? 'bg-amber-400'
                            : 'bg-blue-400'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-bold text-white">
                          {locale === 'bn' ? alt.titleBn : alt.titleEn}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">
                          {alt.empName} · {alt.dept} · {alt.date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isReviewed ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {locale === 'bn' ? 'পর্যালোচিত' : 'Reviewed'}
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewedAlerts(prev => [...prev, alt.id])}
                          className="px-3 py-1.5 bg-[#EC1C24] hover:bg-[#C4141B] text-white rounded-lg text-xs font-bold transition"
                        >
                          {locale === 'bn' ? 'পর্যালোচনা সম্পন্ন' : 'Mark Reviewed'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PERFORMANCE & ADS */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* ADS Explained Card */}
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-white/50">
                  {locale === 'bn' ? 'এটেন্ডেন্স ডিসিপ্লিন স্কোর' : 'ATTENDANCE DISCIPLINE SCORE (ADS)'}
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  {locale === 'bn' ? 'গড় স্কোর: ৯৪.২ / ১০০' : 'Company Avg: 94.2 / 100'}
                </h3>
                <p className="text-xs text-white/60 mt-1 max-w-xl">
                  {locale === 'bn'
                    ? '৭০% উপস্থিতি হার + ৩০% সময়ানুবর্তিতা হারের ভিত্তিতে স্বয়ংক্রিয়ভাবে গণনা করা কার্যক্ষমতা স্কোর।'
                    : 'Weighted compliance composite: 70% attendance rate + 30% punctuality rate.'}
                </p>
              </div>

              {/* 4-Component Appraisal Weights Pill */}
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs space-y-1">
                <div className="font-bold text-[#FF6B57]">PMS Appraisal Matrix:</div>
                <div className="text-white/70">
                  • Component 1 (Target): <strong>60%</strong>
                </div>
                <div className="text-white/70">
                  • Component 2 (Quality): <strong>15%</strong>
                </div>
                <div className="text-white/70">
                  • Component 3 (Discipline): <strong>15%</strong>
                </div>
                <div className="text-white/70">
                  • Component 4 (Safety): <strong>10%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MY INSIGHTS (FOR EMPLOYEES) */}
      {activeTab === 'myInsights' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#141417] border border-white/10 rounded-2xl p-5">
              <span className="text-xs font-bold text-white/50 uppercase">
                {locale === 'bn' ? 'আমার উপস্থিতি স্কোর' : 'My Punctuality Rate'}
              </span>
              <div className="text-3xl font-black text-emerald-400 mt-1">৯৮.৫%</div>
              <p className="text-xs text-white/60 mt-1">
                {locale === 'bn' ? 'গত ৩০ দিনে ২৯ দিন অন-টাইম' : '29 days on-time out of 30'}
              </p>
            </div>

            <div className="bg-[#141417] border border-white/10 rounded-2xl p-5">
              <span className="text-xs font-bold text-white/50 uppercase">
                {locale === 'bn' ? 'ছুটি অবশিষ্ট' : 'Available Leaves'}
              </span>
              <div className="text-3xl font-black text-[#EC1C24] mt-1">২১ দিন</div>
              <p className="text-xs text-white/60 mt-1">CL: 7, SL: 12, EL: 2 days</p>
            </div>

            <div className="bg-[#141417] border border-white/10 rounded-2xl p-5">
              <span className="text-xs font-bold text-white/50 uppercase">
                {locale === 'bn' ? 'ধারাবাহিকতার ধারা' : 'Active Streak'}
              </span>
              <div className="text-3xl font-black text-amber-400 mt-1">১৮ দিন 🔥</div>
              <p className="text-xs text-white/60 mt-1">
                {locale === 'bn' ? '১৮ দিন একটানা উপস্থিতি' : '18 consecutive present days'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
