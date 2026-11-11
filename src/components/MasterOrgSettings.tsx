/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Charu HCM — Master Organization & Employee Category Creator
 * Placed inside Power Distribution (ক্ষমতা বণ্টন) & Settings (সেটিংস)
 * Allows Admin to create & manage:
 * 1. এমপ্লয়ি টাইপ (অফিসার, ডিপার্টমেন্ট হেড, ওয়ার্কার, ক্যাজুয়াল + কাস্টম)
 * 2. বিভাগ ও সাব-সেকশন (Department & Sub-sections)
 * 3. পদবী / ডেজিগনেশন অটো-সাজেশন ব্যাংক (ইঞ্জিনিয়ার, অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার, ইত্যাদি)
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  UserCheck,
  Briefcase,
  Plus,
  CheckCircle2,
  RotateCcw,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Locale } from '../types';
import {
  AccessTagType,
  CustomDepartmentItem,
  CustomEmployeeTypeItem,
  CustomDesignationItem,
  INITIAL_CUSTOM_DEPARTMENTS,
  INITIAL_EMPLOYEE_TYPES,
  INITIAL_DESIGNATION_SUGGESTIONS,
  createCustomDepartment,
  createCustomEmployeeType,
  createCustomDesignation,
  loadMasterOrgConfig,
  saveMasterOrgConfig,
  toBanglaNumber,
} from '../utils/onboardingRules';

interface MasterOrgSettingsProps {
  locale: Locale;
}

export const MasterOrgSettings: React.FC<MasterOrgSettingsProps> = ({ locale }) => {
  const [departments, setDepartments] = useState<CustomDepartmentItem[]>(INITIAL_CUSTOM_DEPARTMENTS);
  const [employeeTypes, setEmployeeTypes] = useState<CustomEmployeeTypeItem[]>(INITIAL_EMPLOYEE_TYPES);
  const [designations, setDesignations] = useState<CustomDesignationItem[]>(
    INITIAL_DESIGNATION_SUGGESTIONS
  );

  // Form states for creating Employee Type
  const [newTypeNameBn, setNewTypeNameBn] = useState('');
  const [newTypeNameEn, setNewTypeNameEn] = useState('');
  const [newTypeTag, setNewTypeTag] = useState<AccessTagType>('officer');
  const [newTypeDescBn, setNewTypeDescBn] = useState('');

  // Form states for creating Department
  const [newDeptNameBn, setNewDeptNameBn] = useState('');
  const [newDeptNameEn, setNewDeptNameEn] = useState('');
  const [newDeptSubSections, setNewDeptSubSections] = useState('');

  // Form states for creating Designation
  const [newDesigBn, setNewDesigBn] = useState('');
  const [newDesigEn, setNewDesigEn] = useState('');
  const [newDesigCat, setNewDesigCat] = useState<'officer' | 'hod' | 'worker' | 'casual'>('officer');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadMasterOrgConfig();
    setDepartments(loaded.departments);
    setEmployeeTypes(loaded.employeeTypes);
    setDesignations(loaded.designations);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAddEmployeeType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeNameBn.trim()) return;
    const created = createCustomEmployeeType(
      newTypeNameBn,
      newTypeNameEn || newTypeNameBn,
      newTypeTag,
      newTypeDescBn
    );
    const updated = [...employeeTypes, created];
    setEmployeeTypes(updated);
    saveMasterOrgConfig({ employeeTypes: updated });
    setNewTypeNameBn('');
    setNewTypeNameEn('');
    setNewTypeDescBn('');
    showToast(
      `নতুন এমপ্লয়ি টাইপ "${created.nameBn}" সফলভাবে তৈরি হয়েছে এবং অনবোর্ডিং প্যানেলে যুক্ত হয়েছে!`
    );
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptNameBn.trim()) return;
    const created = createCustomDepartment(
      newDeptNameBn,
      newDeptNameEn || newDeptNameBn,
      newDeptSubSections || 'ইউনিট ১, ইউনিট ২',
      departments.length
    );
    const updated = [...departments, created];
    setDepartments(updated);
    saveMasterOrgConfig({ departments: updated });
    setNewDeptNameBn('');
    setNewDeptNameEn('');
    setNewDeptSubSections('');
    showToast(
      `নতুন বিভাগ "${created.nameBn}" (${created.code}) সফলভাবে তৈরি হয়েছে এবং অনবোর্ডিং প্যানেলে যুক্ত হয়েছে!`
    );
  };

  const handleAddDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigBn.trim()) return;
    const created = createCustomDesignation(
      newDesigBn,
      newDesigEn || newDesigBn,
      newDesigCat
    );
    const updated = [created, ...designations];
    setDesignations(updated);
    saveMasterOrgConfig({ designations: updated });
    setNewDesigBn('');
    setNewDesigEn('');
    showToast(
      `নতুন পদবী "${created.titleBn}" সফলভাবে তৈরি হয়েছে! অনবোর্ডিংয়ে টাইপ বা হোভার করলেই এটি সাজেশনে আসবে।`
    );
  };

  const handleDeleteCustomType = (id: string) => {
    const updated = employeeTypes.filter(t => t.id !== id);
    setEmployeeTypes(updated);
    saveMasterOrgConfig({ employeeTypes: updated });
    showToast('কাস্টম এমপ্লয়ি টাইপ মুছে ফেলা হয়েছে।');
  };

  const handleDeleteCustomDept = (id: string) => {
    const updated = departments.filter(d => d.id !== id);
    setDepartments(updated);
    saveMasterOrgConfig({ departments: updated });
    showToast('কাস্টম বিভাগ মুছে ফেলা হয়েছে।');
  };

  const handleResetMasterDefaults = () => {
    setDepartments(INITIAL_CUSTOM_DEPARTMENTS);
    setEmployeeTypes(INITIAL_EMPLOYEE_TYPES);
    setDesignations(INITIAL_DESIGNATION_SUGGESTIONS);
    saveMasterOrgConfig({
      departments: INITIAL_CUSTOM_DEPARTMENTS,
      employeeTypes: INITIAL_EMPLOYEE_TYPES,
      designations: INITIAL_DESIGNATION_SUGGESTIONS,
    });
    showToast('সকল বিভাগ, এমপ্লয়ি টাইপ এবং পদবী ডিফল্ট সেটিংসে রিসেট করা হয়েছে।');
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#EDE4DC] shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F291E] via-[#133829] to-[#1A1A1A] text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>মাস্টার অর্গানাইজেশন ও ক্যাটাগরি সেটিংস (Master Configuration)</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {locale === 'bn'
              ? 'এমপ্লয়ি টাইপ, বিভাগ (Department) ও পদবী (Designation) তৈরি প্যানেল'
              : 'Create Employee Types, Departments & Designations'}
          </h3>
          <p className="text-sm font-medium text-emerald-100/90 mt-1">
            এখানে তৈরি করা প্রতিটি এমপ্লয়ি টাইপ (অফিসার, ডিপার্টমেন্ট হেড, ওয়ার্কার, ক্যাজুয়াল), নতুন বিভাগ এবং পদবী সরাসরি অনবোর্ডিং ফর্মে যুক্ত হয়ে যাবে।
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetMasterDefaults}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold flex items-center gap-2 transition self-start md:self-auto shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ডিফল্ট রিসেট করুন</span>
        </button>
      </div>

      {toastMsg && (
        <div className="m-6 mb-0 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. CREATE EMPLOYEE TYPE (অফিসার, ডিপার্টমেন্ট হেড, ওয়ার্কার, ক্যাজুয়াল) */}
        <div className="rounded-2xl border-2 border-[#EDE4DC] bg-[#FBF6F2]/60 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE4DC] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#1E1314]">
                    ১. এমপ্লয়ি টাইপ তৈরি করুন
                  </h4>
                  <p className="text-xs font-semibold text-[#6E5D5E]">
                    অফিসার, ডিপার্টমেন্ট হেড, ওয়ার্কার, ক্যাজুয়াল
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
                {toBanglaNumber(employeeTypes.length)} টি
              </span>
            </div>

            {/* Existing Employee Types List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {employeeTypes.map(t => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-white border border-[#EDE4DC] flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.badgeColor }}
                      />
                      <span className="text-sm font-extrabold text-[#1E1314] truncate">
                        {t.nameBn}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#6E5D5E] mt-0.5 truncate">
                      ট্যাগ: {t.defaultAccessTag.toUpperCase()} · {t.nameEn}
                    </div>
                  </div>
                  {t.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomType(t.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Employee Type Form */}
          <form
            onSubmit={handleAddEmployeeType}
            className="pt-4 border-t border-[#EDE4DC] space-y-3"
          >
            <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">
              + নতুন এমপ্লয়ি টাইপ যোগ করুন
            </div>
            <input
              type="text"
              value={newTypeNameBn}
              onChange={e => setNewTypeNameBn(e.target.value)}
              placeholder="টাইপের নাম (যেমন: চুক্তিভিত্তিক ইঞ্জিনিয়ার / টেকনিশিয়ান)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-blue-600 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newTypeNameEn}
                onChange={e => setNewTypeNameEn(e.target.value)}
                placeholder="English Name"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CEC5] text-xs font-bold text-[#1E1314] focus:outline-none"
              />
              <select
                value={newTypeTag}
                onChange={e => setNewTypeTag(e.target.value as AccessTagType)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CEC5] text-xs font-bold text-[#1E1314] focus:outline-none"
              >
                <option value="officer">অফিসার ভিউ (Officer)</option>
                <option value="hod">ডিপার্টমেন্ট হেড (HOD)</option>
                <option value="employee">ওয়ার্কার / ক্যাজুয়াল ভিউ</option>
                <option value="admin">অ্যাডমিন প্যানেল ভিউ</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>এমপ্লয়ি টাইপ সেভ করুন</span>
            </button>
          </form>
        </div>

        {/* 2. CREATE DEPARTMENT (বিভাগ তৈরি করুন) */}
        <div className="rounded-2xl border-2 border-[#EDE4DC] bg-[#FBF6F2]/60 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE4DC] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#1E1314]">
                    ২. বিভাগ ও সেকশন তৈরি করুন
                  </h4>
                  <p className="text-xs font-semibold text-[#6E5D5E]">
                    কারখানার ডিপার্টমেন্ট ও প্রোডাকশন লাইন
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                {toBanglaNumber(departments.length)} টি
              </span>
            </div>

            {/* Existing Departments List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {departments.map(d => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-white border border-[#EDE4DC] flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-black">
                        {d.code}
                      </span>
                      <span className="text-sm font-extrabold text-[#1E1314] truncate">
                        {d.nameBn}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#6E5D5E] mt-0.5 truncate">
                      সাব-সেকশন: {d.subSections.join(', ')}
                    </div>
                  </div>
                  {d.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomDept(d.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Department Form */}
          <form
            onSubmit={handleAddDepartment}
            className="pt-4 border-t border-[#EDE4DC] space-y-3"
          >
            <div className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
              + নতুন বিভাগ (Department) যোগ করুন
            </div>
            <input
              type="text"
              value={newDeptNameBn}
              onChange={e => setNewDeptNameBn(e.target.value)}
              placeholder="বিভাগের নাম (যেমন: ডিজিটাল প্রিন্টিং ও ডিক্যাল)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-emerald-600 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newDeptNameEn}
                onChange={e => setNewDeptNameEn(e.target.value)}
                placeholder="English Name"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CEC5] text-xs font-bold text-[#1E1314] focus:outline-none"
              />
              <input
                type="text"
                value={newDeptSubSections}
                onChange={e => setNewDeptSubSections(e.target.value)}
                placeholder="সাব-সেকশন (কমা দিয়ে: Line A, Line B)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CEC5] text-xs font-bold text-[#1E1314] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বিভাগ সেভ করুন</span>
            </button>
          </form>
        </div>

        {/* 3. CREATE DESIGNATION (পদবী / ডেজিগনেশন অটো-সাজেশন ব্যাংক) */}
        <div className="rounded-2xl border-2 border-[#EDE4DC] bg-[#FBF6F2]/60 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE4DC] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EC1C24] text-white flex items-center justify-center shadow-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#1E1314]">
                    ৩. পদবী ও ডেজিগনেশন ব্যাংক
                  </h4>
                  <p className="text-xs font-semibold text-[#6E5D5E]">
                    ইঞ্জিনিয়ার, অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার, অপারেটর
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
                {toBanglaNumber(designations.length)} টি
              </span>
            </div>

            {/* Existing Designations List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {designations.map(desig => (
                <div
                  key={desig.id}
                  className="p-3 rounded-xl bg-white border border-[#EDE4DC] flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#1E1314] truncate">
                      {desig.titleBn}
                    </div>
                    <div className="text-xs font-semibold text-[#6E5D5E] mt-0.5 truncate">
                      ক্যাটাগরি: {desig.category.toUpperCase()} · {desig.titleEn}
                    </div>
                  </div>
                  <Layers className="w-4 h-4 text-[#8C7B7C] shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Add New Designation Form */}
          <form
            onSubmit={handleAddDesignation}
            className="pt-4 border-t border-[#EDE4DC] space-y-3"
          >
            <div className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">
              + নতুন পদবী (Designation) যোগ করুন
            </div>
            <input
              type="text"
              value={newDesigBn}
              onChange={e => setNewDesigBn(e.target.value)}
              placeholder="পদবীর নাম (যেমন: অ্যাসিস্ট্যান্ট মেইনটেন্যান্স ইঞ্জিনিয়ার)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-[#EC1C24] focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newDesigEn}
                onChange={e => setNewDesigEn(e.target.value)}
                placeholder="English Title"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CEC5] text-xs font-bold text-[#1E1314] focus:outline-none"
              />
              <select
                value={newDesigCat}
                onChange={e =>
                  setNewDesigCat(e.target.value as 'officer' | 'hod' | 'worker' | 'casual')
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CEC5] text-xs font-bold text-[#1E1314] focus:outline-none"
              >
                <option value="officer">অফিসার (Officer)</option>
                <option value="hod">ডিপার্টমেন্ট হেড (HOD)</option>
                <option value="worker">ওয়ার্কার (Worker)</option>
                <option value="casual">ক্যাজুয়াল (Casual)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#EC1C24] hover:bg-[#C4141B] text-white text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>পদবী সেভ করুন</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
