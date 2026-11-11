/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Role & Permission Matrix Control Panel (ক্ষমতা বণ্টন ও পারমিশন কন্ট্রোল)
 * Dynamic granular checklist for Admin, HOD, and Employee power distribution
 */

import React, { useState } from 'react';
import {
  Shield,
  CheckSquare,
  Square,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Calendar,
  Award,
  FileSpreadsheet,
  Edit3,
  Layers,
  Crown,
  Briefcase,
  User,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  HierarchyRole,
  RolePermissionMap,
  toggleRolePermission,
  setAllPermissionsForRole,
  DEFAULT_ROLE_PERMISSIONS,
} from '../data/permissionsData';
import { Locale, Role } from '../types';
import { toBanglaDigits, formatLocalizedNumber } from '../data/translations';
import { MasterOrgSettings } from './MasterOrgSettings';

interface RolePermissionControlProps {
  permissions: RolePermissionMap;
  onUpdatePermissions: (updated: RolePermissionMap) => void;
  currentRole: Role;
  onSwitchRole: (role: Role) => void;
  locale: Locale;
}

export const RolePermissionControl: React.FC<RolePermissionControlProps> = ({
  permissions,
  onUpdatePermissions,
  currentRole,
  onSwitchRole,
  locale,
}) => {
  const [selectedRole, setSelectedRole] = useState<HierarchyRole>('hod');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const rolePerms = permissions[selectedRole] || {};
  const activeCount = Object.values(rolePerms).filter(Boolean).length;
  const totalCount = ALL_PERMISSIONS.length;

  const handleToggle = (permId: string) => {
    const updated = toggleRolePermission(permissions, selectedRole, permId);
    onUpdatePermissions(updated);
    showSaveNotification();
  };

  const handleSelectAll = (val: boolean) => {
    const updated = setAllPermissionsForRole(permissions, selectedRole, val);
    onUpdatePermissions(updated);
    showSaveNotification();
  };

  const handleResetDefaults = () => {
    onUpdatePermissions(DEFAULT_ROLE_PERMISSIONS);
    setSaveSuccessMessage(
      locale === 'bn'
        ? 'সকল ভূমিকার ক্ষমতা চারু এইচসিএম স্ট্যান্ডার্ডে রিসেট করা হয়েছে।'
        : 'All role permissions have been reset to Charu standard defaults.'
    );
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const showSaveNotification = () => {
    setSaveSuccessMessage(
      locale === 'bn'
        ? 'পারমিশন সফলভাবে আপডেট করা হয়েছে এবং অ্যাপে তাৎক্ষণিক কার্যকর হয়েছে।'
        : 'Permissions successfully updated and applied in real-time across the app.'
    );
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // Get active system role to switch to for this hierarchy tier
  const getSystemRoleForHierarchy = (hRole: HierarchyRole): Role => {
    if (hRole === 'admin') return 'hrManager';
    if (hRole === 'hod') return 'hod';
    return 'employee';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#EDE4DC] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#EC1C24]/10 via-[#FF6B57]/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C7B7C] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#EC1C24]" />
                {locale === 'bn' ? 'ক্ষমতা বণ্টন ও রোল এক্সেস কন্ট্রোল' : 'ROLE ACCESS & POWER DISTRIBUTION'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F6EC] text-[#15803D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-ping mr-1" />
                {locale === 'bn' ? 'লাইভ ম্যাট্রিক্স' : 'Live Matrix'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2A1A1B]">
              {locale === 'bn' ? 'ভূমিকাভিত্তিক ক্ষমতা ও ফিচার কন্ট্রোল প্যানেল' : 'Role-Based Power Distribution Panel'}
            </h2>
            <p className="text-xs text-[#8C7B7C] mt-1 max-w-2xl">
              {locale === 'bn'
                ? 'এইচআর অ্যাডমিন, বিভাগীয় প্রধান (HOD) এবং সাধারণ কর্মীর ক্ষমতা চেকবক্সের মাধ্যমে সরাসরি বণ্টন করুন। আপনি যা টিক দেবেন, ব্যবহারকারী অ্যাপে ঠিক সেই ফিচারটি দেখতে ও ব্যবহার করতে পারবে।'
                : 'Distribute granular permissions between Admin, HOD, and Employee. Checkboxes directly govern which modules, action buttons, and approval workflows each role can access.'}
            </p>
          </div>

          {/* Quick Reset & Status */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-[#FBF6F2] hover:bg-[#FDE8E9] border border-[#EDE4DC] hover:border-[#EC1C24] text-[#2A1A1B] hover:text-[#EC1C24] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Reset to Charu HCM Default Rules"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset Defaults'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMessage && (
          <div className="mt-4 p-3.5 bg-[#E7F6EC] border border-[#86EFAC] text-[#15803D] rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              <span>{saveSuccessMessage}</span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full shadow-sm uppercase">
              {locale === 'bn' ? 'সরাসরি সক্রিয়' : 'Live Enforced'}
            </span>
          </div>
        )}
      </div>

      {/* MASTER DEPARTMENT, EMPLOYEE TYPE & DESIGNATION CREATOR (Moved from Onboarding per user instruction) */}
      <MasterOrgSettings locale={locale} />

      {/* 3 PRIMARY HIERARCHY ROLE TABS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* TAB 1: HR ADMIN */}
        <div
          onClick={() => setSelectedRole('admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedRole === 'admin'
              ? 'border-[#EC1C24] bg-white ring-2 ring-[#EC1C24]/30 shadow-lg'
              : 'border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white hover:border-[#8C7B7C]'
          }`}
        >
          {selectedRole === 'admin' && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#EC1C24]/10 rounded-full blur-xl pointer-events-none" />
          )}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                  selectedRole === 'admin'
                    ? 'bg-[#EC1C24] text-white'
                    : 'bg-white border border-[#EDE4DC] text-[#EC1C24]'
                }`}
              >
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7B7C] tracking-wider">
                  {locale === 'bn' ? 'সর্বোচ্চ স্তর (Tier 1)' : 'TOP TIER (TIER 1)'}
                </span>
                <h3 className="text-base font-black text-[#2A1A1B]">
                  {locale === 'bn' ? 'এইচআর অ্যাডমিন' : 'HR Admin / Super Admin'}
                </h3>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedRole === 'admin'
                  ? 'bg-[#EC1C24] text-white'
                  : 'bg-[#F2E4DA] text-[#2A1A1B]'
              }`}
            >
              {formatLocalizedNumber(
                Object.values(permissions.admin).filter(Boolean).length,
                locale
              )}
              /{formatLocalizedNumber(totalCount, locale)}
            </span>
          </div>
          <p className="text-[11px] text-[#8C7B7C] mt-2.5">
            {locale === 'bn'
              ? 'কোম্পানির সকল বিষয় অ্যাড, এডিট, রিমুভ, পলিসি ও বেতন লক করার পূর্ণ ক্ষমতা।'
              : 'Unrestricted authority to add, edit, approve, close months, and manage policies.'}
          </p>

          <div className="mt-3 pt-2.5 border-t border-[#EDE4DC] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[#15803D] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {locale === 'bn' ? 'সর্বোচ্চ ক্ষমতা' : 'Full Power'}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onSwitchRole('hrManager');
              }}
              className="text-[11px] font-bold text-[#EC1C24] hover:underline flex items-center gap-1"
            >
              <span>{locale === 'bn' ? 'এই রোলে সুইচ করুন' : 'Test as Admin'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* TAB 2: HOD (HEAD OF DEPARTMENT) */}
        <div
          onClick={() => setSelectedRole('hod')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedRole === 'hod'
              ? 'border-[#EC1C24] bg-white ring-2 ring-[#EC1C24]/30 shadow-lg'
              : 'border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white hover:border-[#8C7B7C]'
          }`}
        >
          {selectedRole === 'hod' && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6B57]/10 rounded-full blur-xl pointer-events-none" />
          )}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                  selectedRole === 'hod'
                    ? 'bg-[#FF6B57] text-white'
                    : 'bg-white border border-[#EDE4DC] text-[#FF6B57]'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7B7C] tracking-wider">
                  {locale === 'bn' ? 'মধ্যম স্তর (Tier 2)' : 'MANAGERIAL (TIER 2)'}
                </span>
                <h3 className="text-base font-black text-[#2A1A1B]">
                  {locale === 'bn' ? 'বিভাগীয় প্রধান (HOD)' : 'Head of Dept (HOD)'}
                </h3>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedRole === 'hod'
                  ? 'bg-[#EC1C24] text-white'
                  : 'bg-[#F2E4DA] text-[#2A1A1B]'
              }`}
            >
              {formatLocalizedNumber(
                Object.values(permissions.hod).filter(Boolean).length,
                locale
              )}
              /{formatLocalizedNumber(totalCount, locale)}
            </span>
          </div>
          <p className="text-[11px] text-[#8C7B7C] mt-2.5">
            {locale === 'bn'
              ? 'প্রাথমিক ক্ষমতা: ছুটি অনুমোদন, লেট প্রত্যাহার সুপারিশ ও ওভারটাইম কারেকশন।'
              : 'Initial managerial powers: approve leave, review late adjustment, verify OT minutes.'}
          </p>

          <div className="mt-3 pt-2.5 border-t border-[#EDE4DC] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[#2A1A1B] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#FF6B57]" />
              {locale === 'bn' ? 'বিভাগীয় ক্ষমতা' : 'Dept Manager'}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onSwitchRole('hod');
              }}
              className="text-[11px] font-bold text-[#EC1C24] hover:underline flex items-center gap-1"
            >
              <span>{locale === 'bn' ? 'এই রোলে সুইচ করুন' : 'Test as HOD'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* TAB 3: GENERAL EMPLOYEE */}
        <div
          onClick={() => setSelectedRole('employee')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedRole === 'employee'
              ? 'border-[#EC1C24] bg-white ring-2 ring-[#EC1C24]/30 shadow-lg'
              : 'border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white hover:border-[#8C7B7C]'
          }`}
        >
          {selectedRole === 'employee' && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#8E0F15]/10 rounded-full blur-xl pointer-events-none" />
          )}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                  selectedRole === 'employee'
                    ? 'bg-[#2A1A1B] text-white'
                    : 'bg-white border border-[#EDE4DC] text-[#2A1A1B]'
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7B7C] tracking-wider">
                  {locale === 'bn' ? 'বেসিক স্তর (Tier 3)' : 'SELF-SERVICE (TIER 3)'}
                </span>
                <h3 className="text-base font-black text-[#2A1A1B]">
                  {locale === 'bn' ? 'সাধারণ কর্মী (Employee)' : 'General Employee'}
                </h3>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedRole === 'employee'
                  ? 'bg-[#EC1C24] text-white'
                  : 'bg-[#F2E4DA] text-[#2A1A1B]'
              }`}
            >
              {formatLocalizedNumber(
                Object.values(permissions.employee).filter(Boolean).length,
                locale
              )}
              /{formatLocalizedNumber(totalCount, locale)}
            </span>
          </div>
          <p className="text-[11px] text-[#8C7B7C] mt-2.5">
            {locale === 'bn'
              ? 'সেলফ সার্ভিস ক্ষমতা: উপস্থিতি দেখা, ছুটির আবেদন ও নোটিশ পড়া (অ্যাডমিন অপশন গোপন)।'
              : 'Self-service: check-in, personal attendance log, apply leave, view notices (restricted admin tabs).'}
          </p>

          <div className="mt-3 pt-2.5 border-t border-[#EDE4DC] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[#8C7B7C] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#8C7B7C]" />
              {locale === 'bn' ? 'সীমিত সেলফ-সার্ভিস' : 'Restricted'}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onSwitchRole('employee');
              }}
              className="text-[11px] font-bold text-[#EC1C24] hover:underline flex items-center gap-1"
            >
              <span>{locale === 'bn' ? 'এই রোলে সুইচ করুন' : 'Test as Employee'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE ROLE CONTROL TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE4DC] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FDE8E9] text-[#EC1C24] flex items-center justify-center font-black text-sm">
            ✓
          </div>
          <div>
            <div className="text-xs font-bold text-[#2A1A1B] flex items-center gap-2">
              <span>
                {locale === 'bn' ? 'নির্বাচিত ভূমিকার ক্ষমতা:' : 'Active Role Power Matrix:'}{' '}
                <strong className="text-[#EC1C24] uppercase">{selectedRole}</strong>
              </span>
              <span className="text-[11px] font-bold text-[#8C7B7C] bg-[#FBF6F2] px-2 py-0.5 rounded-full border border-[#EDE4DC]">
                {formatLocalizedNumber(activeCount, locale)}/{formatLocalizedNumber(totalCount, locale)}{' '}
                {locale === 'bn' ? 'টি ক্ষমতা সক্রিয়' : 'enabled'}
              </span>
            </div>
            <p className="text-[11px] text-[#8C7B7C]">
              {locale === 'bn'
                ? 'চেকবক্সে ক্লিক করে যে কোনো ক্ষমতা যুক্ত বা প্রত্যাহার করুন।'
                : 'Click checkboxes below to grant or revoke specific feature capabilities.'}
            </p>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectAll(true)}
            className="px-3 py-1.5 bg-[#FBF6F2] hover:bg-[#E7F6EC] text-[#15803D] hover:border-[#15803D] border border-[#EDE4DC] rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'সকল চেক করুন' : 'Select All'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectAll(false)}
            className="px-3 py-1.5 bg-[#FBF6F2] hover:bg-[#FDE8E9] text-[#EC1C24] hover:border-[#EC1C24] border border-[#EDE4DC] rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <Square className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'সকল আনচেক' : 'Deselect All'}</span>
          </button>
        </div>
      </div>

      {/* CHECKLIST BY CATEGORIES */}
      <div className="space-y-5">
        {PERMISSION_CATEGORIES.map(category => {
          const catPermissions = ALL_PERMISSIONS.filter(p => p.category === category.id);
          const catActiveCount = catPermissions.filter(p => rolePerms[p.id]).length;

          return (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-[#EDE4DC] overflow-hidden shadow-sm"
            >
              {/* Category Header */}
              <div className="px-5 py-3.5 bg-[#FBF6F2] border-b border-[#EDE4DC] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#EDE4DC] flex items-center justify-center text-[#EC1C24]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#2A1A1B]">
                    {locale === 'bn' ? category.titleBn : category.titleEn}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#8C7B7C]">
                    {formatLocalizedNumber(catActiveCount, locale)}/
                    {formatLocalizedNumber(catPermissions.length, locale)}
                  </span>
                  <div className="w-16 h-2 bg-[#EDE4DC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EC1C24] transition-all"
                      style={{
                        width: `${(catActiveCount / catPermissions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#EDE4DC]/70">
                {catPermissions.map(item => {
                  const isChecked = rolePerms[item.id] === true;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggle(item.id)}
                      className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                        isChecked ? 'hover:bg-[#FDE8E9]/20' : 'hover:bg-gray-50 bg-[#FBF6F2]/30'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Custom styled checkbox */}
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition shadow-sm ${
                            isChecked
                              ? 'bg-[#EC1C24] text-white border border-[#C4141B]'
                              : 'bg-white border-2 border-[#8C7B7C]/60 hover:border-[#EC1C24]'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                isChecked ? 'text-[#2A1A1B]' : 'text-[#8C7B7C] line-through'
                              }`}
                            >
                              {locale === 'bn' ? item.nameBn : item.nameEn}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FDE8E9] text-[#EC1C24] border border-[#EC1C24]/20">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8C7B7C] mt-0.5 leading-relaxed">
                            {locale === 'bn' ? item.descriptionBn : item.descriptionEn}
                          </p>
                        </div>
                      </div>

                      {/* Power State Status Chip */}
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isChecked
                            ? 'bg-[#E7F6EC] text-[#15803D]'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isChecked ? 'bg-[#15803D] animate-pulse' : 'bg-gray-400'
                          }`}
                        />
                        <span>
                          {isChecked
                            ? locale === 'bn'
                              ? 'অনুমোদিত'
                              : 'Granted'
                            : locale === 'bn'
                            ? 'নিষিদ্ধ / লুকানো'
                            : 'Restricted'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="bg-[#0D0D0D] text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EC1C24] flex items-center justify-center font-bold text-lg">
            ✓
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {locale === 'bn'
                ? `${selectedRole.toUpperCase()} ভূমিকা এখন সক্রিয় রুলস দ্বারা নিয়ন্ত্রিত`
                : `${selectedRole.toUpperCase()} permissions live in application state`}
            </h4>
            <p className="text-xs text-white/60">
              {locale === 'bn'
                ? 'এই পেজে যে কোনো টিক পরিবর্তনের সাথে সাথে সংশ্লিষ্ট রোলের সাইডবার ও অ্যাকশন বাটন পরিবর্তিত হবে।'
                : 'Any change takes instant effect on module visibility, approval buttons, and action gates.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSwitchRole(getSystemRoleForHierarchy(selectedRole))}
          className="px-5 py-2.5 bg-[#EC1C24] hover:bg-[#C4141B] text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>
            {locale === 'bn'
              ? `${selectedRole.toUpperCase()} হিসেবে ইন্টারফেস দেখুন`
              : `Switch to ${selectedRole.toUpperCase()} View`}
          </span>
        </button>
      </div>
    </div>
  );
};
