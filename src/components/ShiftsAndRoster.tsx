/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Shifts Master, Roster Grid & 2026 Holiday Calendar
 * Conforms to PRD §5.5, App-Flow F10, and Schema §2.5–§2.7
 */

import React, { useState } from 'react';
import { Clock, Calendar, Users, Moon, Sun, Lock, ShieldCheck, Plus } from 'lucide-react';
import { Employee, Holiday, Locale, Role, Shift } from '../types';
import { formatLocalizedDate, toBanglaDigits } from '../data/translations';

interface ShiftsAndRosterProps {
  shifts: Shift[];
  holidays: Holiday[];
  employees: Employee[];
  currentRole: Role;
  locale: Locale;
  onUpdateWeeklyOff: (empId: string, weekday: number) => void;
}

export const ShiftsAndRoster: React.FC<ShiftsAndRosterProps> = ({
  shifts,
  holidays,
  employees,
  currentRole,
  locale,
  onUpdateWeeklyOff,
}) => {
  const isHRManager = ['superAdmin', 'hrManager'].includes(currentRole);
  const [tab, setTab] = useState<'shifts' | 'weeklyOff' | 'holidays'>('shifts');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4DC] pb-4">
        <div className="inline-flex p-1 bg-white border border-[#EDE4DC] rounded-2xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setTab('shifts')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'shifts'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'শিফট মাস্টার (Shifts)' : 'Shifts Master'}
          </button>

          <button
            onClick={() => setTab('weeklyOff')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tab === 'weeklyOff'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>{locale === 'bn' ? 'সাপ্তাহিক ছুটি কন্ট্রোল (HR Mgr)' : 'Weekly-Off Control'}</span>
          </button>

          <button
            onClick={() => setTab('holidays')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'holidays'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'সরকারি ও প্রাতিষ্ঠানিক ছুটি (২০২৬)' : 'Holiday Calendar 2026'}
          </button>
        </div>
      </div>

      {/* TAB 1: SHIFTS MASTER */}
      {tab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shifts.map(s => (
            <div
              key={s.shiftId}
              className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-2 h-full"
                style={{ backgroundColor: s.color }}
              />

              <div className="pl-2">
                <span className="text-[10px] uppercase font-bold text-[#8C7B7C] block">
                  {s.shiftId}
                </span>
                <h4 className="text-base font-bold text-[#2A1A1B]">
                  {locale === 'bn' ? s.nameBn : s.name}
                </h4>
                <div className="text-xl font-black text-[#EC1C24] mt-1">
                  {s.start} – {s.end}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-[#EDE4DC] pl-2 text-[#8C7B7C]">
                <div>
                  Grace Period: <strong className="text-[#2A1A1B]">{s.graceMinutes} min</strong>
                </div>
                <div>
                  Break: <strong className="text-[#2A1A1B]">{s.breakMinutes} min</strong>
                </div>
                <div>
                  Work Hours: <strong className="text-[#2A1A1B]">{s.workMinutes / 60} hrs</strong>
                </div>
                <div>
                  Midnight: <strong className="text-[#2A1A1B]">{s.crossesMidnight ? 'Yes (Night)' : 'No'}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: WEEKLY OFF CONTROL (HR MANAGER ONLY per SHIFT-3) */}
      {tab === 'weeklyOff' && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#2A1A1B]">
                  {locale === 'bn'
                    ? 'কর্মীভিত্তিক সাপ্তাহিক ছুটি ব্যবস্থাপনা'
                    : 'Per-Employee Weekly Off Assignment'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDE8E9] text-[#EC1C24]">
                  HR Manager Role Gate
                </span>
              </div>
              <p className="text-xs text-[#8C7B7C] mt-0.5">
                {locale === 'bn'
                  ? 'কারখানায় সবার একই দিনে ছুটি নয়; শুধুমাত্র এইচআর ম্যানেজার পরিবর্তন করতে পারবেন।'
                  : 'Staggered weekly-offs across production lines; editable strictly by HR Manager.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#EDE4DC] rounded-xl text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FBF6F2] text-[#8C7B7C] uppercase font-bold border-b border-[#EDE4DC]">
                <tr>
                  <th className="p-3">{locale === 'bn' ? 'কর্মী' : 'Employee'}</th>
                  <th className="p-3">{locale === 'bn' ? 'বিভাগ' : 'Department'}</th>
                  <th className="p-3">{locale === 'bn' ? 'বর্তমান সাপ্তাহিক ছুটি' : 'Current Weekly Off'}</th>
                  <th className="p-3 text-right">{locale === 'bn' ? 'ছুটির দিন পরিবর্তন' : 'Assign Day'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE4DC]">
                {employees.map(emp => {
                  const currentDay = emp.schedule.weeklyOff.weekday;
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                  return (
                    <tr key={emp.empId} className="hover:bg-[#FBF6F2]/50">
                      <td className="p-3 font-semibold text-[#2A1A1B]">
                        <div>{locale === 'bn' ? emp.nameBn : emp.nameEn}</div>
                        <div className="text-[10px] text-[#8C7B7C]">#{emp.empId}</div>
                      </td>
                      <td className="p-3 text-[#8C7B7C]">{emp.employment.deptName}</td>
                      <td className="p-3 font-bold text-[#EC1C24]">
                        {dayNames[currentDay]} ({currentDay === 5 ? 'কারখানা ডিফল্ট' : 'কাস্টম'})
                      </td>
                      <td className="p-3 text-right">
                        <select
                          disabled={!isHRManager}
                          value={currentDay}
                          onChange={e => onUpdateWeeklyOff(emp.empId, Number(e.target.value))}
                          className="px-2.5 py-1 bg-white border border-[#EDE4DC] rounded-lg text-xs font-semibold focus:outline-none disabled:bg-gray-100"
                        >
                          <option value={5}>Friday (শুক্রবার)</option>
                          <option value={4}>Thursday (বৃহস্পতিবার)</option>
                          <option value={6}>Saturday (শনিবার)</option>
                          <option value={0}>Sunday (রবিবার)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HOLIDAY CALENDAR */}
      {tab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.map(h => (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-2"
            >
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F4F8] text-[#0E7490]">
                {formatLocalizedDate(h.date, locale)}
              </span>
              <h4 className="text-base font-bold text-[#2A1A1B]">
                {locale === 'bn' ? h.nameBn : h.nameEn}
              </h4>
              <p className="text-xs text-[#8C7B7C]">
                {locale === 'bn' ? 'সার্বজনীন সরকারি ছুটি · বেতনভুক্ত' : 'Mandatory Paid Public Holiday'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
