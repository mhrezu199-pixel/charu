/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Attendance View (My Log & Team Grid / Employee Summary)
 * Conforms to PRD §5.6, App-Flow F2/F4/F5, and UI-Spec §6.6
 */

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileEdit,
  Filter,
  Download,
  Search,
  User,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Fingerprint,
} from 'lucide-react';
import { AttendanceRecord, Employee, Locale, Role, Shift } from '../types';
import { formatLocalizedNumber, formatLocalizedDate, toBanglaDigits } from '../data/translations';
import { BiometricLogs } from './BiometricLogs';
import { LiveAttendanceMonitor } from './LiveAttendanceMonitor';

interface AttendanceViewProps {
  currentEmpId: string;
  currentRole: Role;
  locale: Locale;
  attendanceLogs: AttendanceRecord[];
  employees: Employee[];
  shifts: Shift[];
  onRequestAdjustment: (record: AttendanceRecord) => void;
  onManualAttendanceSave: (record: Partial<AttendanceRecord>) => void;
  canManualEntry?: boolean;
  canViewTeam?: boolean;
  canViewBiometricLogs?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentEmpId,
  currentRole,
  locale,
  attendanceLogs,
  employees,
  shifts,
  onRequestAdjustment,
  onManualAttendanceSave,
  canManualEntry,
  canViewTeam,
  canViewBiometricLogs,
}) => {
  const isHR = ['superAdmin', 'hrManager', 'hrExecutive'].includes(currentRole);
  const isManager = isHR || ['hod', 'supervisor'].includes(currentRole);
  const showManualEntry = canManualEntry !== undefined ? canManualEntry : isHR;
  const showTeamGrid = canViewTeam !== undefined ? canViewTeam : isManager;
  const showBiometricLogs = canViewBiometricLogs !== undefined ? canViewBiometricLogs : isManager;

  const [subTab, setSubTab] = useState<'myLog' | 'teamGrid' | 'liveMonitor' | 'manualEntry' | 'biometricLogs'>('myLog');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayDetail, setSelectedDayDetail] = useState<AttendanceRecord | null>(null);

  // Manual entry form state
  const [manualEmpId, setManualEmpId] = useState<string>('20045');
  const [manualDate, setManualDate] = useState<string>('2026-10-30');
  const [manualIn, setManualIn] = useState<string>('08:00');
  const [manualOut, setManualOut] = useState<string>('17:00');
  const [manualReason, setManualReason] = useState<string>('');

  // Filter logs for personal log
  const myLogs = attendanceLogs
    .filter(l => l.empId === currentEmpId)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  // Today log
  const todayRecord = myLogs.find(l => l.dateKey === '2026-10-30') || myLogs[0];

  const filteredEmployees = employees.filter(emp => {
    if (selectedDept !== 'all' && emp.employment.deptId !== selectedDept) return false;
    if (
      searchQuery &&
      !emp.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !emp.nameBn.includes(searchQuery) &&
      !emp.empId.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  // Dates for the monthly grid (Oct 24 to Oct 30)
  const gridDates = [
    { date: '2026-10-24', label: '24', day: 'Sat' },
    { date: '2026-10-25', label: '25', day: 'Sun' },
    { date: '2026-10-26', label: '26', day: 'Mon' },
    { date: '2026-10-27', label: '27', day: 'Tue' },
    { date: '2026-10-28', label: '28', day: 'Wed' },
    { date: '2026-10-29', label: '29', day: 'Thu' },
    { date: '2026-10-30', label: '30', day: 'Fri', isToday: true },
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason) {
      alert(locale === 'bn' ? 'দয়া করে কারণ উল্লেখ করুন' : 'Please provide reason');
      return;
    }
    const emp = employees.find(e => e.empId === manualEmpId);
    onManualAttendanceSave({
      empId: manualEmpId,
      empName: emp ? emp.nameEn : 'Employee',
      deptId: emp ? emp.employment.deptId : 'casting',
      dateKey: manualDate,
      inAt: manualIn,
      outAt: manualOut,
      workedMinutes: 480,
      lateMinutes: 0,
      isLate: false,
      status: 'present',
      manualEntry: true,
      adjusted: true,
    });
    alert(locale === 'bn' ? 'ম্যানুয়াল উপস্থিতি সংরক্ষিত হয়েছে' : 'Manual attendance logged');
    setManualReason('');
    setSubTab('myLog');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4DC] pb-4">
        <div className="inline-flex p-1 bg-white border border-[#EDE4DC] rounded-2xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setSubTab('myLog')}
            className={`px-4 py-2 rounded-xl transition ${
              subTab === 'myLog'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'আমার হাজিরা লগ' : 'My Attendance Log'}
          </button>

          {showTeamGrid && (
            <button
              onClick={() => setSubTab('teamGrid')}
              className={`px-4 py-2 rounded-xl transition ${
                subTab === 'teamGrid'
                  ? 'bg-[#EC1C24] text-white shadow-sm'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? 'টিম সামারি গ্রিড' : 'Employee Summary Grid'}
            </button>
          )}

          <button
            onClick={() => setSubTab('liveMonitor')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              subTab === 'liveMonitor'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{locale === 'bn' ? 'লাইভ হাজিরা মনিটর' : 'Live Monitor'}</span>
          </button>

          {showManualEntry && (
            <button
              onClick={() => setSubTab('manualEntry')}
              className={`px-4 py-2 rounded-xl transition ${
                subTab === 'manualEntry'
                  ? 'bg-[#EC1C24] text-white shadow-sm'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              {locale === 'bn' ? '+ ম্যানুয়াল এন্ট্রি' : '+ Manual Entry'}
            </button>
          )}

          {showBiometricLogs && (
            <button
              onClick={() => setSubTab('biometricLogs')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                subTab === 'biometricLogs'
                  ? 'bg-[#EC1C24] text-white shadow-sm'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'ডিভাইস লগ (৩০ দিন)' : 'Biometric Logs (30D)'}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold ${subTab === 'biometricLogs' ? 'bg-white/20 text-white' : 'bg-red-100 text-[#EC1C24]'}`}>
                RAW
              </span>
            </button>
          )}
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#EDE4DC] text-xs font-semibold text-[#2A1A1B]">
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-4 h-4 text-[#8C7B7C]" />
          </button>
          <span>{locale === 'bn' ? 'অক্টোবর ২০২৬' : 'October 2026'}</span>
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-4 h-4 text-[#8C7B7C]" />
          </button>
        </div>
      </div>

      {/* SUBTAB 1: MY LOG */}
      {subTab === 'myLog' && (
        <div className="space-y-6">
          {/* Today Check-in Hero Status Card */}
          {todayRecord && (
            <div className="bg-gradient-to-r from-[#000000] via-[#141414] to-[#2A0A0C] text-white p-6 rounded-3xl border border-[#2B2B2B] shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[#EC1C24]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase font-bold text-white/50 tracking-wider">
                    {locale === 'bn' ? 'আজকের উপস্থিতি কার্ড' : 'TODAY CHECK-IN STATUS'}
                  </div>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatLocalizedDate(todayRecord.dateKey, locale)}
                  </h3>
                  <div className="text-xs text-white/70 mt-1">
                    {locale === 'bn'
                      ? 'শিফট: জেনারেল (০৮:০০ - ১৭:০০) · ১০ মিনিট গ্রেস'
                      : 'Shift: General (08:00 - 17:00) · 10 min grace period'}
                  </div>
                </div>

                {/* Status Indicator & Action */}
                <div className="flex flex-wrap items-center gap-3">
                  {todayRecord.isLate && !todayRecord.adjusted ? (
                    <div className="flex items-center gap-2 bg-[#FDE8E9] text-[#EC1C24] px-4 py-2 rounded-2xl font-bold text-xs border border-[#EC1C24]/30 animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        {locale === 'bn'
                          ? `আজকের আগমন দেরিতে (${toBanglaDigits(todayRecord.lateMinutes)} মিনিট)`
                          : `Late Check-In (${todayRecord.lateMinutes} min)`}
                      </span>
                    </div>
                  ) : todayRecord.status === 'present' ? (
                    <div className="flex items-center gap-2 bg-[#E7F6EC] text-[#15803D] px-4 py-2 rounded-2xl font-bold text-xs border border-[#15803D]/30">
                      <CheckCircle className="w-4 h-4" />
                      <span>{locale === 'bn' ? 'সময়মত উপস্থিত' : 'Present & On-Time'}</span>
                    </div>
                  ) : null}

                  {todayRecord.isLate && !todayRecord.adjusted && (
                    <button
                      onClick={() => onRequestAdjustment(todayRecord)}
                      className="px-4 py-2 bg-[#EC1C24] hover:bg-[#C4141B] text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-[#EC1C24]/30 flex items-center gap-1.5"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>{locale === 'bn' ? 'দেরি প্রত্যাহারের আবেদন' : 'Request Adjustment'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Punch Stats */}
              <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="text-white/50">{locale === 'bn' ? 'প্রথম ইন পাঞ্চ' : 'First IN Punch'}</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {todayRecord.inAt || '--:--'}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="text-white/50">{locale === 'bn' ? 'শেষ আউট পাঞ্চ' : 'Last OUT Punch'}</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {todayRecord.outAt || (locale === 'bn' ? 'চলমান' : 'Active Shift')}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="text-white/50">{locale === 'bn' ? 'মোট কাজের সময়' : 'Worked Hours'}</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {Math.floor(todayRecord.workedMinutes / 60)}h {todayRecord.workedMinutes % 60}m
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="text-white/50">{locale === 'bn' ? 'ওভারটাইম' : 'Overtime'}</div>
                  <div className="text-lg font-bold text-[#FF6B57] mt-1">
                    {todayRecord.otMinutes} {locale === 'bn' ? 'মিনিট' : 'min'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Log Table */}
          <div className="bg-white rounded-2xl border border-[#EDE4DC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#EDE4DC] flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'দৈনিক হাজিরা ইতিহাস' : 'Daily Punch History'}
              </h4>
              <span className="text-xs text-[#8C7B7C]">
                {locale === 'bn' ? 'সর্বশেষ ৭ কার্যদিবস' : 'Last 7 recorded days'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBF6F2] text-[#8C7B7C] uppercase font-bold border-b border-[#EDE4DC]">
                  <tr>
                    <th className="p-3.5">{locale === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="p-3.5">{locale === 'bn' ? 'শিফট' : 'Shift'}</th>
                    <th className="p-3.5">{locale === 'bn' ? 'ইন পাঞ্চ' : 'IN Punch'}</th>
                    <th className="p-3.5">{locale === 'bn' ? 'আউট পাঞ্চ' : 'OUT Punch'}</th>
                    <th className="p-3.5">{locale === 'bn' ? 'দেরি' : 'Late'}</th>
                    <th className="p-3.5">{locale === 'bn' ? 'ওভারটাইম' : 'OT'}</th>
                    <th className="p-3.5">{locale === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="p-3.5 text-right">{locale === 'bn' ? 'পদক্ষেপ' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE4DC]">
                  {myLogs.map(rec => {
                    const isLate = rec.isLate && !rec.adjusted;
                    return (
                      <tr key={rec.id} className="hover:bg-[#FBF6F2]/60 transition">
                        <td className="p-3.5 font-bold text-[#2A1A1B]">
                          {formatLocalizedDate(rec.dateKey, locale)}
                        </td>
                        <td className="p-3.5 text-[#8C7B7C] uppercase">{rec.shiftId}</td>
                        <td className="p-3.5 font-semibold text-[#2A1A1B]">{rec.inAt || '-'}</td>
                        <td className="p-3.5 font-semibold text-[#2A1A1B]">{rec.outAt || '-'}</td>
                        <td className="p-3.5">
                          {isLate ? (
                            <span className="text-[#EC1C24] font-bold">
                              {toBanglaDigits(rec.lateMinutes)} min
                            </span>
                          ) : rec.adjusted ? (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              {locale === 'bn' ? 'সংশোধিত' : 'Adjusted'}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-[#EC1C24]">
                          {rec.otMinutes > 0 ? `${rec.otMinutes}m` : '-'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              rec.status === 'present'
                                ? 'bg-[#E7F6EC] text-[#15803D]'
                                : isLate
                                ? 'bg-[#FDE8E9] text-[#EC1C24]'
                                : rec.status === 'leave'
                                ? 'bg-[#EDE9FE] text-[#6D28D9]'
                                : 'bg-[#FEE2E2] text-[#B91C1C]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                rec.status === 'present'
                                  ? 'bg-[#15803D]'
                                  : isLate
                                  ? 'bg-[#EC1C24]'
                                  : 'bg-[#B91C1C]'
                              }`}
                            />
                            {rec.status === 'present'
                              ? locale === 'bn'
                                ? 'উপস্থিত'
                                : 'Present'
                              : isLate
                              ? locale === 'bn'
                                ? 'দেরি'
                                : 'Late'
                              : rec.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {isLate ? (
                            <button
                              onClick={() => onRequestAdjustment(rec)}
                              className="text-xs font-bold text-[#EC1C24] hover:underline"
                            >
                              {locale === 'bn' ? 'সংশোধন' : 'Adjust'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedDayDetail(rec)}
                              className="text-xs font-semibold text-[#8C7B7C] hover:text-[#2A1A1B]"
                            >
                              {locale === 'bn' ? 'বিস্তারিত' : 'Detail'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TEAM SUMMARY GRID (EMPLOYEE × DATE MATRIX) */}
      {subTab === 'teamGrid' && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'কর্মীদের উপস্থিতি সামারি গ্রিড' : 'Employee Attendance Summary Grid'}
              </h3>
              <p className="text-xs text-[#8C7B7C]">
                {locale === 'bn'
                  ? 'সকল কর্মীর দিনভিত্তিক পাঞ্চ টাইম ও উপস্থিতি স্ট্যাটাস'
                  : 'Daily punch times, late flags, and attendance status matrix'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={locale === 'bn' ? 'কর্মী খুঁজুন...' : 'Search staff...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
              />
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
              >
                <option value="all">{locale === 'bn' ? 'সকল বিভাগ' : 'All Depts'}</option>
                <option value="casting">{locale === 'bn' ? 'কাস্টিং' : 'Casting'}</option>
                <option value="glazing">{locale === 'bn' ? 'গ্লেজিং' : 'Glazing'}</option>
                <option value="kiln">{locale === 'bn' ? 'কিলন' : 'Kiln'}</option>
              </select>
            </div>
          </div>

          {/* Frozen Column Table */}
          <div className="overflow-x-auto border border-[#EDE4DC] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FBF6F2] text-[#8C7B7C] uppercase font-bold">
                <tr>
                  <th className="p-3 sticky left-0 bg-[#FBF6F2] z-10 border-r border-[#EDE4DC] w-48">
                    {locale === 'bn' ? 'কর্মী' : 'Employee'}
                  </th>
                  {gridDates.map(d => (
                    <th
                      key={d.date}
                      className={`p-3 text-center min-w-[120px] ${
                        d.isToday ? 'bg-[#FDE8E9]/60 text-[#EC1C24]' : ''
                      }`}
                    >
                      <div className="text-[10px]">{d.day}</div>
                      <div
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black ${
                          d.isToday ? 'bg-[#EC1C24] text-white shadow-sm' : ''
                        }`}
                      >
                        {formatLocalizedNumber(d.label, locale)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE4DC]">
                {filteredEmployees.map(emp => (
                  <tr key={emp.empId} className="hover:bg-[#FBF6F2]/50">
                    {/* Frozen Employee info */}
                    <td className="p-3 sticky left-0 bg-white z-10 border-r border-[#EDE4DC] font-semibold">
                      <div className="flex items-center gap-2">
                        <img
                          src={emp.photoUrl}
                          alt={emp.nameEn}
                          className="w-7 h-7 rounded-full object-cover border border-[#EDE4DC]"
                        />
                        <div>
                          <div className="font-bold text-[#2A1A1B] text-xs">
                            {locale === 'bn' ? emp.nameBn : emp.nameEn}
                          </div>
                          <div className="text-[10px] text-[#8C7B7C]">#{emp.empId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Date Cells */}
                    {gridDates.map(d => {
                      // Match attendance log or mock deterministic cell
                      const record = attendanceLogs.find(
                        l => l.empId === emp.empId && l.dateKey === d.date
                      );

                      const isEmpTodayLate = emp.empId === '20045' && d.date === '2026-10-30';
                      const isAbsent = emp.empId === '20102' && d.date === '2026-10-30';

                      return (
                        <td
                          key={d.date}
                          className={`p-2.5 text-center text-[11px] border-r border-[#EDE4DC] last:border-r-0 ${
                            d.isToday ? 'bg-[#FDE8E9]/20' : ''
                          }`}
                        >
                          {isEmpTodayLate ? (
                            <div className="bg-[#FDE8E9] text-[#EC1C24] font-bold p-1 rounded border border-[#EC1C24]/30">
                              <div>08:11 - --</div>
                              <div className="text-[9px]">Late 11m</div>
                            </div>
                          ) : isAbsent ? (
                            <div className="bg-[#FEE2E2] text-[#B91C1C] font-bold p-1 rounded">
                              Absent
                            </div>
                          ) : (
                            <div className="text-[#15803D] font-semibold bg-[#E7F6EC] p-1 rounded">
                              <div>07:54 - 17:10</div>
                              <div className="text-[9px] text-[#15803D]">Present</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MANUAL ATTENDANCE ENTRY (HR ONLY) */}
      {subTab === 'manualEntry' && isHR && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#2A1A1B]">
              {locale === 'bn' ? 'ম্যানুয়াল হাজিরা অন্তর্ভুক্তি' : 'Manual Attendance Entry'}
            </h3>
            <p className="text-xs text-[#8C7B7C]">
              {locale === 'bn'
                ? 'কারখানা ডিভাইসে পাঞ্চ না হলে বা ত্রুটি থাকলে এইচআর কর্মকর্তা কর্তৃক অনুমোদিত এন্ট্রি'
                : 'Audited manual punch logging when biometrics malfunction or official on-duty outdoor shift occurs.'}
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#2A1A1B] mb-1">
                {locale === 'bn' ? 'কর্মী নির্বাচন করুন' : 'Select Employee'}
              </label>
              <select
                value={manualEmpId}
                onChange={e => setManualEmpId(e.target.value)}
                className="w-full p-2.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
              >
                {employees.map(e => (
                  <option key={e.empId} value={e.empId}>
                    {e.empId} - {e.nameEn} ({e.employment.deptName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'শিফট' : 'Shift'}
                </label>
                <input
                  type="text"
                  disabled
                  value="General (08:00 - 17:00)"
                  className="w-full p-2.5 bg-gray-100 border border-[#EDE4DC] rounded-xl text-xs text-[#8C7B7C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'সংশোধিত ইন পাঞ্চ' : 'Corrected IN Time'}
                </label>
                <input
                  type="time"
                  value={manualIn}
                  onChange={e => setManualIn(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'সংশোধিত আউট পাঞ্চ' : 'Corrected OUT Time'}
                </label>
                <input
                  type="time"
                  value={manualOut}
                  onChange={e => setManualOut(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2A1A1B] mb-1">
                {locale === 'bn' ? 'বাধ্যতামূলক কারণ (অডিটের জন্য)' : 'Audited Reason (Mandatory)'}
              </label>
              <textarea
                required
                rows={3}
                placeholder={locale === 'bn' ? 'কেন ম্যানুয়াল এন্ট্রি প্রয়োজন...' : 'Reason for manual logging...'}
                value={manualReason}
                onChange={e => setManualReason(e.target.value)}
                className="w-full p-2.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#EC1C24] hover:bg-[#C4141B] text-white rounded-xl font-bold text-xs transition shadow-md"
            >
              {locale === 'bn' ? 'ম্যানুয়াল উপস্থিতি অনুমোদন ও সংরক্ষণ' : 'Save & Log Manual Attendance'}
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 4: LIVE ATTENDANCE MONITOR */}
      {subTab === 'liveMonitor' && (
        <LiveAttendanceMonitor
          currentRole={currentRole}
          locale={locale}
          currentEmpId={currentEmpId}
          onRequestAdjustment={() => {
            if (todayRecord) onRequestAdjustment(todayRecord);
          }}
        />
      )}

      {/* SUBTAB 5: RAW BIOMETRIC DEVICE LOGS (30 DAYS) */}
      {subTab === 'biometricLogs' && showBiometricLogs && (
        <BiometricLogs
          employees={employees}
          locale={locale}
          currentRole={currentRole}
          currentEmpId={currentEmpId}
        />
      )}
    </div>
  );
};
