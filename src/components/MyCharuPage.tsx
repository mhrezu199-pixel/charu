/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — "আমার চারু" (My Charu) Personal Hub
 * Conforms to UI-Spec §15.3 and Reference Set A2
 */

import React from 'react';
import {
  Award,
  Sparkles,
  Phone,
  MessageCircle,
  FileText,
  Download,
  AlertTriangle,
  User,
  Plus,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Employee, Locale, UserSession } from '../types';
import { toBanglaDigits } from '../data/translations';

interface MyCharuPageProps {
  user: UserSession;
  locale: Locale;
  availableLeaveDays: number;
  onNavigateLeaves: () => void;
  onNavigateAttendance: () => void;
}

export const MyCharuPage: React.FC<MyCharuPageProps> = ({
  user,
  locale,
  availableLeaveDays,
  onNavigateLeaves,
  onNavigateAttendance,
}) => {
  const teamMembers = [
    { name: 'Kamal H.', role: 'Supervisor', bg: 'bg-[#B39DDB]' },
    { name: 'Anowar P.', role: 'Line 1', bg: 'bg-[#90B4D4]' },
    { name: 'Shahin A.', role: 'Glazing', bg: 'bg-[#D49BC2]' },
    { name: 'Mehedi H.', role: 'Packing', bg: 'bg-[#E0DC8F]' },
    { name: 'Rokon U.', role: 'Maint', bg: 'bg-[#A7D7C5]' },
  ];

  const approvers = [
    {
      role: locale === 'bn' ? 'লাইন সুপারভাইজার' : 'Line Supervisor',
      name: 'Kamal Hossain',
      phone: '+8801912345678',
      dept: 'Line 3',
    },
    {
      role: locale === 'bn' ? 'বিভাগীয় প্রধান (HOD)' : 'Head of Dept (HOD)',
      name: 'Engr. Tariqul Islam',
      phone: '+8801819998877',
      dept: 'Casting & Production',
    },
    {
      role: locale === 'bn' ? 'এইচআর ম্যানেজার' : 'HR Manager',
      name: 'Farhana Akter',
      phone: '+8801722334455',
      dept: 'HR & Administration',
    },
  ];

  const savedDocs = [
    { name: 'Employee Identity Card', size: '1.2 MB PDF', date: '2026-01-10' },
    { name: 'Appointment Letter & Contract', size: '2.4 MB PDF', date: '2021-03-01' },
    { name: 'Latest Casual Leave Approval', size: '420 KB PDF', date: '2026-10-20' },
    { name: 'Fire Safety Certificate', size: '850 KB PDF', date: '2025-11-15' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in pb-10">
      {/* 1. Alert Card (Conditional) per §15.3 #1 */}
      <div className="bg-[#FDE8E9] border border-[#EC1C24]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EC1C24] text-white flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#EC1C24]">
              {locale === 'bn' ? 'জরুরি বিজ্ঞপ্তি' : 'Profile Status: Active'}
            </h4>
            <p className="text-xs text-[#2A1A1B]">
              {locale === 'bn'
                ? 'আপনার বায়োমেট্রিক ও জাতীয় পরিচয়পত্র ভেরিফিকেশন শতভাগ সম্পন্ন।'
                : 'Biometric device code #1045 synced with Head Office gate scanner.'}
            </p>
          </div>
        </div>
        <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
      </div>

      {/* 2. Two Cards Side by Side (§15.3 #2) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Card: Leave Balance */}
        <div
          onClick={onNavigateLeaves}
          className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#EC1C24] transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8C7B7C] uppercase">
              {locale === 'bn' ? 'ছুটির ব্যালেন্স' : 'Leave Balance'}
            </span>
            <div className="w-6 h-6 rounded-full bg-[#EEF0FF] text-[#3730A3] flex items-center justify-center text-xs">
              ★
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-[#2A1A1B] group-hover:text-[#EC1C24] transition">
              {toBanglaDigits(availableLeaveDays)} {locale === 'bn' ? 'দিন' : 'days'}
            </div>
          </div>
          <span className="text-xs font-bold text-[#EC1C24] flex items-center gap-0.5">
            <span>{locale === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Right Card: Perfect Attendance Streak */}
        <div
          onClick={onNavigateAttendance}
          className="bg-[#E7F6EC] rounded-2xl p-4 border border-[#BBF7D0] shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#15803D] uppercase">
              {locale === 'bn' ? 'নিখুঁত হাজিরা' : 'Attendance Streak'}
            </span>
            <Award className="w-5 h-5 text-[#15803D]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-[#15803D]">
              {toBanglaDigits(18)} {locale === 'bn' ? 'দিন' : 'days'}
            </div>
          </div>
          <span className="text-xs font-semibold text-[#15803D]">
            {locale === 'bn' ? 'একটানা নিয়মিত 🔥' : 'Consecutive on-time 🔥'}
          </span>
        </div>
      </div>

      {/* 3. My Team ("আমার টিম / প্রিয় সহকর্মী") (§15.3 #3) */}
      <div className="bg-white rounded-2xl p-5 border border-[#EDE4DC] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#2A1A1B]">
            {locale === 'bn' ? 'আমার টিম ও সহকর্মী' : 'My Team & Peer Circle'}
          </h4>
          <span className="text-xs font-bold text-[#EC1C24] cursor-pointer hover:underline">
            {locale === 'bn' ? 'ম্যানেজ' : 'Manage'}
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {teamMembers.map((m, idx) => (
            <div key={idx} className="flex flex-col items-center shrink-0 w-14">
              <div
                className={`w-12 h-12 rounded-full ${m.bg} text-white font-bold flex items-center justify-center text-xs shadow-sm`}
              >
                {m.name.slice(0, 2)}
              </div>
              <span className="text-[11px] font-semibold text-[#2A1A1B] text-center truncate w-full mt-1">
                {m.name}
              </span>
              <span className="text-[9px] text-[#8C7B7C] truncate w-full text-center">
                {m.role}
              </span>
            </div>
          ))}

          {/* Add member dashed circle */}
          <div className="flex flex-col items-center shrink-0 w-14">
            <button
              onClick={() => alert('Add team buddy feature')}
              className="w-12 h-12 rounded-full border-2 border-dashed border-[#8C7B7C] text-[#8C7B7C] hover:text-[#EC1C24] hover:border-[#EC1C24] flex items-center justify-center transition"
            >
              <Plus className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-[#8C7B7C] mt-1">
              {locale === 'bn' ? 'যোগ করুন' : 'Add'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. My Approvers / Contacts (§15.3 #4) */}
      <div className="bg-white rounded-2xl p-5 border border-[#EDE4DC] shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-[#2A1A1B]">
          {locale === 'bn' ? 'অনুমোদনকারী ও জরুরি যোগাযোগ' : 'My Approvers & Direct Contacts'}
        </h4>

        <div className="space-y-2.5">
          {approvers.map((app, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC] flex items-center justify-between text-xs"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7B7C] block">
                  {app.role}
                </span>
                <span className="font-bold text-[#2A1A1B]">{app.name}</span>
                <span className="text-[#8C7B7C] block text-[11px]">{app.dept}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${app.phone}`}
                  className="w-8 h-8 rounded-full bg-white border border-[#EDE4DC] text-[#15803D] flex items-center justify-center hover:bg-emerald-50 transition"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white border border-[#EDE4DC] text-emerald-600 flex items-center justify-center hover:bg-emerald-50 transition"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. My Saved Documents (§15.3 #5) */}
      <div className="bg-white rounded-2xl p-5 border border-[#EDE4DC] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#2A1A1B]">
            {locale === 'bn' ? 'সেভ করা অফিসিয়াল ডকুমেন্ট' : 'Saved Official Documents'}
          </h4>
          <span className="text-xs font-bold text-[#EC1C24] cursor-pointer hover:underline">
            {locale === 'bn' ? 'ম্যানেজ' : 'Manage'}
          </span>
        </div>

        <div className="space-y-2">
          {savedDocs.map((doc, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC] flex items-center justify-between text-xs hover:border-[#8C7B7C] transition"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#EC1C24]" />
                <div>
                  <div className="font-bold text-[#2A1A1B]">{doc.name}</div>
                  <div className="text-[10px] text-[#8C7B7C]">
                    {doc.size} · {doc.date}
                  </div>
                </div>
              </div>

              <button
                onClick={() => alert(`Downloading ${doc.name}`)}
                className="p-1.5 hover:bg-white text-[#8C7B7C] hover:text-[#2A1A1B] rounded-lg transition"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
