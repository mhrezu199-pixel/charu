/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Mobile Hero Header
 * Conforms to UI-Spec §15.2-A & §16 (Luxury Motion System + bKash-inspired Landscape Hero)
 *
 * Implements user's exact specification:
 * 1. Sylhet Tea Garden ("সিলেট চা বাগান") & Paddy Field ("ধানের ক্ষেত") Animated Landscape Scenery
 * 2. Distinct Role-Based Themes:
 *    - HOD: Ruby Sunset Tea Estate ("ওয়ান কাইন্ডস অফ রেড")
 *    - Employee: Deep Obsidian Night Tea Estate ("ডিপ ব্ল্যাকের উপর ডার্ক - স্পষ্ট ও সুন্দর অ্যানিমেশন")
 *    - Admin: Imperial Emerald & Golden Sunrise ("এমারেল্ড সবুজ ও সোনালী ধানের ক্ষেত")
 * 3. Interactive Balance Pill ("ব্যালেন্স দেখুন") + Circular Action Buttons
 */

import React, { useState, useEffect } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { Locale, Role, UserSession } from '../types';
import { toBanglaDigits } from '../data/translations';
import { CharuLogo } from './CharuLogo';

export type HeroRoleTheme = 'employee' | 'hod' | 'admin';

interface HeroHeaderProps {
  user: UserSession;
  locale: Locale;
  currentRole: Role;
  isTodayLate: boolean;
  lateMinutes: number;
  availableLeaveDays: number;
  unreadCount: number;
  onToggleLocale: () => void;
  onSwitchRole: (role: Role) => void;
  onOpenNotifications: () => void;
  onOpenSplashPreview?: () => void;
}

export function getRoleThemeCategory(role: Role): HeroRoleTheme {
  if (role === 'hod') return 'hod';
  if (role === 'employee' || role === 'supervisor') return 'employee';
  return 'admin';
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  user,
  locale,
  currentRole,
  isTodayLate,
  lateMinutes,
  availableLeaveDays,
  unreadCount,
  onToggleLocale,
  onSwitchRole,
  onOpenNotifications,
  onOpenSplashPreview,
}) => {
  const [revealedBalance, setRevealedBalance] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  // Active theme based on role, with 1-click preview capability
  const [activeThemeOverride, setActiveThemeOverride] = useState<HeroRoleTheme | null>(null);

  // Sync with currentRole whenever it changes externally
  useEffect(() => {
    setActiveThemeOverride(null);
  }, [currentRole]);

  const activeTheme: HeroRoleTheme = activeThemeOverride || getRoleThemeCategory(currentRole);

  // Palette definitions for the 3 distinct role themes
  const themeStyles = {
    // 1. HOD Theme: Ruby Sunset Tea Garden ("ওয়ান কাইন্ডস অফ রেড")
    hod: {
      bgGradient: 'from-[#C81922] via-[#9E1118] to-[#5C070C]',
      sunColor: 'bg-[#FF9F43]/40',
      mistColor: 'bg-[#FF7A70]/20',
      hillFar: '#8E0D13',
      hillMid: '#6E080C',
      hillClose: '#4A0407',
      teaBushColor: '#A8141B',
      paddyColor: '#E65100',
      badgeBg: 'bg-white/15 text-white border-white/20',
      badgeTextBn: 'এইচওডি ভিউ · সিলেট চা বাগান',
      badgeTextEn: 'HOD · Sylhet Tea Estate',
      pillAccent: 'from-[#EC1C24] to-[#9E0D14]',
      balanceValColor: 'text-[#EC1C24]',
    },
    // 2. Employee Theme: Deep Obsidian Night Tea Garden ("ডিপ ব্ল্যাকের উপর ডার্ক - অত্যন্ত স্পষ্ট")
    employee: {
      bgGradient: 'from-[#0A0E17] via-[#101726] to-[#04060A]',
      sunColor: 'bg-[#FEF08A]/25', // Moon glow
      mistColor: 'bg-[#10B981]/15',
      hillFar: '#111827',
      hillMid: '#0B1320',
      hillClose: '#050A12',
      teaBushColor: '#059669',
      paddyColor: '#10B981',
      badgeBg: 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30',
      badgeTextBn: 'কর্মী ভিউ · নৈশ চা বাগান',
      badgeTextEn: 'Employee · Night Tea Garden',
      pillAccent: 'from-[#10B981] to-[#047857]',
      balanceValColor: 'text-[#10B981]',
    },
    // 3. Admin Theme: Imperial Emerald & Golden Sunrise ("এমারেল্ড সবুজ ও সোনালী ধানের ক্ষেত")
    admin: {
      bgGradient: 'from-[#064E3B] via-[#065F46] to-[#022C22]',
      sunColor: 'bg-[#FBBF24]/35',
      mistColor: 'bg-[#34D399]/20',
      hillFar: '#04382A',
      hillMid: '#032D22',
      hillClose: '#011E16',
      teaBushColor: '#10B981',
      paddyColor: '#F59E0B',
      badgeBg: 'bg-[#F59E0B]/20 text-[#FDE68A] border-[#F59E0B]/30',
      badgeTextBn: 'অ্যাডমিন ভিউ · সোনালী সকাল',
      badgeTextEn: 'Admin · Golden Sunrise',
      pillAccent: 'from-[#F59E0B] to-[#D97706]',
      balanceValColor: 'text-[#065F46]',
    },
  }[activeTheme];

  return (
    <div
      className={`relative bg-gradient-to-b ${themeStyles.bgGradient} text-white pt-2.5 pb-10 px-3.5 sm:px-4 overflow-hidden select-none transition-colors duration-700`}
    >
      {/* Sun / Moon Celestial Glow */}
      <div
        className={`absolute -top-10 right-10 w-48 h-48 ${themeStyles.sunColor} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
      />
      <div
        className={`absolute top-4 left-1/4 w-32 h-32 ${themeStyles.mistColor} rounded-full blur-2xl pointer-events-none transition-all duration-700`}
      />

      {/* Floating Animated Clouds & Birds across the Sylhet Sky */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cloud 1 */}
        <svg
          className="absolute top-2 left-6 w-28 h-10 opacity-30 animate-cloud-drift-slow"
          viewBox="0 0 100 40"
          fill="currentColor"
        >
          <path d="M20 30 Q30 10 45 20 Q55 5 70 18 Q85 12 90 30 Z" />
        </svg>

        {/* Cloud 2 */}
        <svg
          className="absolute top-6 right-16 w-36 h-12 opacity-25 animate-cloud-drift-fast"
          viewBox="0 0 120 40"
          fill="currentColor"
        >
          <path d="M15 28 Q28 12 45 22 Q60 8 80 20 Q95 10 105 28 Z" />
        </svg>

        {/* Flying Birds Flap Across */}
        <svg
          className="absolute top-4 right-1/3 w-16 h-6 opacity-40 animate-bird-glide text-white"
          viewBox="0 0 60 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M2 10 Q10 4 18 10 Q26 4 34 10" />
          <path d="M38 6 Q44 2 50 6 Q56 2 60 6" />
        </svg>

        {/* Twinkling Fireflies / Starlight on Employee Dark Night View */}
        {activeTheme === 'employee' && (
          <div className="absolute inset-0">
            <span className="absolute top-10 left-12 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-firefly" style={{ animationDelay: '0.2s' }} />
            <span className="absolute top-16 right-20 w-1.5 h-1.5 rounded-full bg-amber-200 animate-firefly" style={{ animationDelay: '0.8s' }} />
            <span className="absolute top-24 left-1/2 w-1 h-1 rounded-full bg-emerald-200 animate-firefly" style={{ animationDelay: '1.4s' }} />
          </div>
        )}
      </div>

      {/* TOP BRAND RIBBON & ROLE VIEW TOGGLE */}
      <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2.5 relative z-10 gap-2">
        {/* Brand Logo (triggers Loading Splash preview on tap) */}
        <div
          onClick={onOpenSplashPreview}
          className="flex items-center gap-1.5 cursor-pointer group"
          title={locale === 'bn' ? 'লোডিং অ্যানিমেশন দেখতে ক্লিক করুন' : 'Click to preview Loading Splash'}
        >
          <CharuLogo
            variant={activeTheme === 'employee' ? 'on-black' : 'on-red'}
            size="xs"
          />
          <span className="text-[10px] font-extrabold tracking-widest uppercase text-white/95 hidden xs:inline">
            CHARU CERAMIC
          </span>
        </div>

        {/* 3-Role View Switcher Pills: Employee (Dark) | HOD (Red) | Admin (Emerald) */}
        <div className="inline-flex items-center p-0.5 bg-black/30 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveThemeOverride('employee');
              onSwitchRole('employee');
            }}
            className={`px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 ${
              activeTheme === 'employee'
                ? 'bg-[#10B981] text-black shadow-sm font-black'
                : 'text-white/75 hover:text-white'
            }`}
            title="কর্মী ভিউ (Dark Midnight)"
          >
            <span>👤</span>
            <span className="hidden sm:inline">{locale === 'bn' ? 'কর্মী' : 'Staff'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveThemeOverride('hod');
              onSwitchRole('hod');
            }}
            className={`px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 ${
              activeTheme === 'hod'
                ? 'bg-[#EC1C24] text-white shadow-sm font-black'
                : 'text-white/75 hover:text-white'
            }`}
            title="এইচওডি ভিউ (Red Sunset)"
          >
            <span>👔</span>
            <span className="hidden sm:inline">{locale === 'bn' ? 'এইচওডি' : 'HOD'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveThemeOverride('admin');
              onSwitchRole('superAdmin');
            }}
            className={`px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 ${
              activeTheme === 'admin'
                ? 'bg-[#F59E0B] text-black shadow-sm font-black'
                : 'text-white/75 hover:text-white'
            }`}
            title="অ্যাডমিন ভিউ (Emerald Teal)"
          >
            <span>🛡️</span>
            <span className="hidden sm:inline">{locale === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
          </button>
        </div>
      </div>

      {/* DETAILED SYLHET TEA GARDEN & PADDY FIELD ANIMATED SVG BACKGROUND */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-22 sm:h-26 pointer-events-none select-none transition-all duration-700"
        viewBox="0 0 540 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="teaRowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* LAYER 1: Distant Undulating Sylhet Teela Hills */}
        <path
          d="M0 65 Q60 30 135 55 T290 38 T440 48 T540 42 L540 120 L0 120 Z"
          fill={themeStyles.hillFar}
          className="transition-colors duration-700"
        />

        {/* LAYER 2: Terraced Stepped Tea Garden Hill Slopes (সিলেট চা বাগান) */}
        <path
          d="M0 76 Q90 44 195 70 T390 52 T540 64 L540 120 L0 120 Z"
          fill={themeStyles.hillMid}
          className="transition-colors duration-700"
        />

        {/* Stepped Tea Row Ridges on Midground Hill */}
        <path
          d="M30 75 Q110 54 185 74 M210 72 Q310 55 385 64 M405 60 Q475 58 535 70"
          stroke="url(#teaRowGrad)"
          strokeWidth="1.8"
          strokeDasharray="4,3"
          fill="none"
        />

        {/* Stepped Tea Bushes Dots Pattern along slopes */}
        <g fill={themeStyles.teaBushColor} opacity="0.85">
          <circle cx="55" cy="74" r="3.2" />
          <circle cx="70" cy="71" r="3.4" />
          <circle cx="88" cy="67" r="3.2" />
          <circle cx="106" cy="64" r="3.5" />
          <circle cx="125" cy="65" r="3.2" />
          <circle cx="145" cy="68" r="3.5" />
          <circle cx="165" cy="72" r="3.3" />

          <circle cx="230" cy="68" r="3.4" />
          <circle cx="250" cy="64" r="3.2" />
          <circle cx="272" cy="60" r="3.5" />
          <circle cx="295" cy="58" r="3.3" />
          <circle cx="320" cy="59" r="3.5" />
          <circle cx="345" cy="61" r="3.3" />
          <circle cx="370" cy="63" r="3.5" />
        </g>

        {/* LAYER 3: Foreground Tea Estate Ridge + Cottage / Tea Factory Chimney */}
        <path
          d="M0 90 Q85 66 180 86 T360 74 L370 64 L386 64 L390 74 L420 74 L422 58 L430 58 L432 74 T540 82 L540 120 L0 120 Z"
          fill={themeStyles.hillClose}
          className="transition-colors duration-700"
        />

        {/* Tea Plucker with Wicker Basket Silhouette on the Hill */}
        <g fill="#FFFFFF" opacity="0.32" transform="translate(145, 68) scale(0.65)">
          <circle cx="10" cy="5" r="3.5" />
          <path d="M7 9 L13 9 L15 22 L5 22 Z" />
          {/* Conical Straw Hat / Basket */}
          <path d="M14 10 Q19 14 18 20 Q14 20 12 12 Z" />
        </g>

        {/* LAYER 4: Golden & Green Paddy Field Stalks Swaying (সবুজ ও সোনালী ধানের ক্ষেত) */}
        <g
          className="animate-sway-paddy origin-bottom"
          stroke={themeStyles.paddyColor}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        >
          {/* Cluster 1 Left */}
          <path d="M12 118 Q16 100 13 92 M15 118 Q20 98 22 90 M18 118 Q24 102 28 94" />
          {/* Cluster 2 Mid-Left */}
          <path d="M82 118 Q86 102 85 93 M86 118 Q91 97 94 88 M89 118 Q96 104 100 96" />
          {/* Cluster 3 Center */}
          <path d="M260 118 Q264 100 263 90 M265 118 Q271 96 276 86 M270 118 Q277 102 282 94" />
          {/* Cluster 4 Right */}
          <path d="M470 118 Q474 102 473 92 M475 118 Q481 97 486 88 M480 118 Q487 103 492 95" />
        </g>
      </svg>

      {/* MAIN HERO ROW: Employee Info + Interactive Balance Pill + Circle Buttons */}
      <div className="flex items-center justify-between relative z-10 gap-2 mt-1">
        {/* Left: Avatar + Name + Balance Pill */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with crisp ring */}
          <div className="relative shrink-0">
            <img
              src={user.avatarUrl}
              alt={user.nameEn}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-white shadow-xl"
            />
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${
                activeTheme === 'employee' ? 'bg-[#10B981]' : 'bg-[#10B981]'
              }`}
            />
          </div>

          {/* Name & Balance Pill directly beneath */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate drop-shadow-md">
                {locale === 'bn' ? user.nameBn : user.nameEn}
              </span>
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${themeStyles.badgeBg}`}
              >
                {locale === 'bn' ? themeStyles.badgeTextBn.split(' · ')[0] : themeStyles.badgeTextEn.split(' · ')[0]}
              </span>
            </div>

            {/* bKash-inspired Interactive Balance Pill ("ব্যালেন্স দেখুন") */}
            <button
              type="button"
              onClick={() => setRevealedBalance(!revealedBalance)}
              className="group relative bg-white text-[#2A1A1B] h-8 pl-1 pr-3.5 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 overflow-hidden"
            >
              {/* Organization icon badge */}
              <span
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${themeStyles.pillAccent} text-white flex items-center justify-center text-xs font-black shadow-sm transition-transform duration-300 ${
                  revealedBalance ? 'scale-105' : ''
                }`}
              >
                {locale === 'bn' ? '৳' : '★'}
              </span>

              {revealedBalance ? (
                <span className={`text-[11px] font-black ${themeStyles.balanceValColor} whitespace-nowrap animate-in fade-in duration-200`}>
                  {locale === 'bn'
                    ? `ছুটি: ${toBanglaDigits(availableLeaveDays)} দিন · ওটি: ৪.৫ ঘণ্টা`
                    : `Leave: ${availableLeaveDays}d · OT: 4.5h`}
                </span>
              ) : (
                <span className="text-xs font-bold text-[#2A1A1B] whitespace-nowrap">
                  {locale === 'bn' ? 'ব্যালেন্স দেখুন' : 'Check Balance'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right: Round Glass/White Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={onToggleLocale}
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#2A1A1B] flex items-center justify-center text-[11px] font-extrabold shadow-md transition active:scale-95"
            title="Toggle Language"
          >
            {locale === 'bn' ? 'EN' : 'বাং'}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#2A1A1B] flex items-center justify-center relative shadow-md transition active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#2A1A1B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EC1C24] text-white flex items-center justify-center text-[9px] font-black border border-white">
                {locale === 'bn' ? toBanglaDigits(unreadCount) : unreadCount}
              </span>
            )}
          </button>

          {/* Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="w-9 h-9 rounded-full bg-[#000000] border border-white/40 hover:scale-105 flex items-center justify-center shadow-md transition active:scale-95 overflow-hidden px-1"
              title="Role & Menu"
            >
              <CharuLogo variant="on-black" size="xs" />
            </button>

            {/* Role Switch Dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 top-11 w-56 bg-white text-[#2A1A1B] rounded-2xl p-2 border border-[#EDE4DC] shadow-2xl z-50 animate-in fade-in text-xs font-semibold">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#8C7B7C] border-b border-[#EDE4DC] flex items-center justify-between">
                  <span>{locale === 'bn' ? 'ভূমিকা ও থিম পরিবর্তন' : 'Switch Role & Theme'}</span>
                  <Sparkles className="w-3 h-3 text-[#EC1C24]" />
                </div>
                {[
                  { r: 'employee', label: locale === 'bn' ? 'কর্মী (ডিপ ব্ল্যাক নাইট থিম)' : 'Employee (Dark Night)' },
                  { r: 'supervisor', label: locale === 'bn' ? 'সুপারভাইজার (Kamal)' : 'Supervisor (Kamal)' },
                  { r: 'hod', label: locale === 'bn' ? 'বিভাগীয় প্রধান (রেড সানসেট থিম)' : 'HOD (Red Sunset)' },
                  { r: 'hrManager', label: locale === 'bn' ? 'এইচআর ম্যানেজার (এমারেল্ড থিম)' : 'HR Manager (Emerald)' },
                  { r: 'superAdmin', label: locale === 'bn' ? 'সুপার অ্যাডমিন (Tanvir)' : 'Super Admin (Tanvir)' },
                  { r: 'accounts', label: locale === 'bn' ? 'হিসাব বিভাগ (Nusrat)' : 'Accounts (Nusrat)' },
                ].map(item => (
                  <button
                    key={item.r}
                    onClick={() => {
                      onSwitchRole(item.r as Role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      currentRole === item.r
                        ? 'bg-[#FDE8E9] text-[#EC1C24] font-bold'
                        : 'hover:bg-gray-100 text-[#2A1A1B]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {currentRole === item.r && <span className="w-1.5 h-1.5 rounded-full bg-[#EC1C24]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Late Check-in Alert Banner */}
      {isTodayLate && (
        <div className="mt-2.5 relative z-10">
          <div className="w-full bg-white/95 text-[#EC1C24] px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between shadow-md">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EC1C24] animate-ping" />
              {locale === 'bn'
                ? `আজ দেরি — ${toBanglaDigits(lateMinutes)} মিনিট (সংশোধন করতে ট্যাপ করুন)`
                : `Late Check-in — ${lateMinutes} min (Tap to adjust)`}
            </span>
            <span className="underline font-extrabold">
              {locale === 'bn' ? 'আবেদন' : 'Adjust'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
