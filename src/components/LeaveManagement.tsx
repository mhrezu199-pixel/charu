/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Leave Management (Balances, Apply Form, Chain Tracker & Approvals)
 * Conforms to PRD §5.7, App-Flow F6/F7, and Schema §2.12–§2.14
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  PlusCircle,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Filter,
  Plus,
} from 'lucide-react';
import { Employee, LeaveBalance, LeaveRequest, LeaveType, Locale, Role } from '../types';
import { formatLocalizedDate, formatLocalizedNumber, toBanglaDigits } from '../data/translations';
import { calculateLeaveAvailability } from '../utils/rules';

interface LeaveManagementProps {
  currentEmpId: string;
  currentRole: Role;
  locale: Locale;
  employees: Employee[];
  leaveTypes: LeaveType[];
  leaveBalances: Record<string, LeaveBalance>;
  leaveRequests: LeaveRequest[];
  onApplyLeave: (req: Partial<LeaveRequest>) => void;
  onDecideLeave: (reqId: string, level: number, decision: 'approved' | 'rejected', note: string) => void;
  onCancelLeave: (reqId: string) => void;
  canApproveLeave?: boolean;
  canApplyLeave?: boolean;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  currentEmpId,
  currentRole,
  locale,
  employees,
  leaveTypes,
  leaveBalances,
  leaveRequests,
  onApplyLeave,
  onDecideLeave,
  onCancelLeave,
  canApproveLeave,
  canApplyLeave,
}) => {
  const isHR = ['superAdmin', 'hrManager', 'hrExecutive'].includes(currentRole);
  const isManager = isHR || ['hod', 'supervisor'].includes(currentRole);
  const showApprovals = canApproveLeave !== undefined ? canApproveLeave : isManager;
  const showApply = canApplyLeave !== undefined ? canApplyLeave : true;

  const [activeTab, setActiveTab] = useState<'myLeaves' | 'balance' | 'approvals'>('myLeaves');
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);

  // Apply form state
  const [applyEmpId, setApplyEmpId] = useState<string>(currentEmpId);
  const [leaveTypeCode, setLeaveTypeCode] = useState<string>('CL');
  const [fromDate, setFromDate] = useState<string>('2026-11-02');
  const [toDate, setToDate] = useState<string>('2026-11-03');
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');

  // Target employee balance
  const activeBalance = leaveBalances[applyEmpId]?.balances || {
    CL: { entitled: 10, used: 3, pending: 1, carried: 0 },
    SL: { entitled: 14, used: 2, pending: 0, carried: 0 },
    EL: { entitled: 18, used: 5, pending: 0, carried: 4 },
  };

  const selectedTypeBalance = activeBalance[leaveTypeCode] || {
    entitled: 10,
    used: 0,
    pending: 0,
    carried: 0,
  };

  const availableDays = calculateLeaveAvailability(
    selectedTypeBalance.entitled,
    selectedTypeBalance.carried,
    selectedTypeBalance.used,
    selectedTypeBalance.pending
  );

  // Calculate requested days
  const requestedDays = useMemo(() => {
    if (isHalfDay) return 0.5;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate, isHalfDay]);

  const hasBalanceError = requestedDays > availableDays && leaveTypeCode !== 'LWP';

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBalanceError) {
      alert(
        locale === 'bn'
          ? `অনুরোধকৃত দিন (${requestedDays}) অবশিষ্ট ব্যালেন্সের (${availableDays}) চেয়ে বেশি`
          : `Requested days (${requestedDays}) exceeds available quota (${availableDays})`
      );
      return;
    }
    if (!reason.trim()) {
      alert(locale === 'bn' ? 'দয়া করে ছুটির কারণ লিখুন' : 'Please provide reason');
      return;
    }

    const emp = employees.find(e => e.empId === applyEmpId);
    onApplyLeave({
      empId: applyEmpId,
      empName: emp ? emp.nameEn : 'Employee',
      deptId: emp ? emp.employment.deptId : 'casting',
      photoUrl: emp ? emp.photoUrl : '',
      leaveTypeId: leaveTypeCode,
      leaveTypeCode,
      fromDate,
      toDate: isHalfDay ? fromDate : toDate,
      halfDay: isHalfDay,
      totalDays: requestedDays,
      reason,
      status: 'pending',
      chain: [
        { level: 1, role: 'supervisor', approverEmpId: '10012', status: 'pending' },
        { level: 2, role: 'hod', approverEmpId: '10003', status: 'pending' },
        { level: 3, role: 'hrManager', approverEmpId: '10001', status: 'pending' },
      ],
      currentLevel: 1,
      pendingApproverEmpIds: ['10012'],
      appliedBy: currentEmpId,
      appliedAt: new Date().toISOString(),
      attendanceFilled: false,
    });

    setShowApplyModal(false);
    setReason('');
    alert(locale === 'bn' ? 'ছুটির আবেদন সফলভাবে জমা হয়েছে' : 'Leave application submitted');
  };

  // Filter requests
  const myRequests = leaveRequests.filter(r => r.empId === currentEmpId);
  const pendingApprovals = leaveRequests.filter(r => r.status === 'pending' || r.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4DC] pb-4">
        <div className="inline-flex p-1 bg-white border border-[#EDE4DC] rounded-2xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveTab('myLeaves')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'myLeaves'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'আমার আবেদনসমূহ' : 'My Requests'}
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'balance'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'ছুটির ব্যালেন্স ও কোটা' : 'Leave Balances'}
          </button>

          {showApprovals && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-[#EC1C24] text-white shadow-sm'
                  : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
              }`}
            >
              <span>{locale === 'bn' ? 'অনুমোদন ইনবক্স' : 'Approvals Inbox'}</span>
              {pendingApprovals.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#EC1C24] text-white flex items-center justify-center text-[10px] font-black">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}
        </div>

        {showApply && (
          <button
            onClick={() => {
              setApplyEmpId(currentEmpId);
              setShowApplyModal(true);
            }}
            className="px-4 py-2.5 bg-[#EC1C24] hover:bg-[#C4141B] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'bn' ? '+ ছুটির আবেদন' : '+ Apply Leave'}</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: MY LEAVE REQUESTS */}
      {activeTab === 'myLeaves' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRequests.map(req => {
              const statusColor =
                req.status === 'approved'
                  ? 'bg-[#E7F6EC] text-[#15803D]'
                  : req.status === 'rejected'
                  ? 'bg-[#FEE2E2] text-[#B91C1C]'
                  : 'bg-[#FEF3C7] text-[#B45309]';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-3 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EEF0FF] text-[#3730A3]">
                        {req.leaveTypeCode} -{' '}
                        {req.halfDay ? (locale === 'bn' ? 'অর্ধ দিবস' : 'Half Day') : `${req.totalDays} days`}
                      </span>
                      <h4 className="font-bold text-sm text-[#2A1A1B] mt-2">
                        {req.fromDate} {req.toDate !== req.fromDate ? `to ${req.toDate}` : ''}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#8C7B7C] italic bg-[#FBF6F2] p-2.5 rounded-xl">
                    "{req.reason}"
                  </p>

                  {/* Multi-Level Approval Chain Visualizer */}
                  <div className="pt-3 border-t border-[#EDE4DC] space-y-2">
                    <div className="text-[11px] font-bold text-[#8C7B7C]">
                      {locale === 'bn' ? 'অনুমোদন পর্যায় (Approval Chain):' : 'Chain Status:'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      {req.chain.map(step => (
                        <div key={step.level} className="flex flex-col items-center">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step.status === 'approved'
                                ? 'bg-[#15803D] text-white'
                                : step.status === 'rejected'
                                ? 'bg-[#B91C1C] text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            L{step.level}
                          </span>
                          <span className="text-[10px] font-medium text-[#8C7B7C] capitalize mt-0.5">
                            {step.role === 'hrManager' ? 'HR' : step.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {(req.status === 'pending' || req.status === 'processing') && (
                    <div className="pt-2">
                      <button
                        onClick={() => onCancelLeave(req.id)}
                        className="w-full py-1.5 text-center text-xs font-bold text-[#B91C1C] hover:bg-red-50 rounded-lg transition"
                      >
                        {locale === 'bn' ? 'আবেদন বাতিল করুন' : 'Cancel Request'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: LEAVE BALANCES */}
      {activeTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaveTypes.map(lt => {
            const b = activeBalance[lt.code] || {
              entitled: lt.annualQuota,
              used: 0,
              pending: 0,
              carried: 0,
            };
            const avail = calculateLeaveAvailability(b.entitled, b.carried, b.used, b.pending);

            return (
              <div
                key={lt.code}
                className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C7B7C]">
                    {lt.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E7F6EC] text-[#15803D]">
                    {avail} {locale === 'bn' ? 'দিন অবশিষ্ট' : 'days left'}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-[#2A1A1B]">
                    {locale === 'bn' ? lt.nameBn : lt.nameEn}
                  </h4>
                  <p className="text-xs text-[#8C7B7C] mt-0.5">
                    {locale === 'bn' ? lt.descriptionBn : lt.descriptionEn}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#F2E4DA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B57] to-[#EC1C24] rounded-full"
                      style={{ width: `${Math.min(100, (b.used / (b.entitled || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-[#EDE4DC]">
                  <div>
                    <span className="text-[#8C7B7C] block text-[10px]">Entitled</span>
                    <strong className="text-[#2A1A1B]">{b.entitled}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C7B7C] block text-[10px]">Carried</span>
                    <strong className="text-[#2A1A1B]">{b.carried}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C7B7C] block text-[10px]">Used</span>
                    <strong className="text-[#EC1C24]">{b.used}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C7B7C] block text-[10px]">Pending</span>
                    <strong className="text-amber-600">{b.pending}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 3: APPROVALS INBOX */}
      {activeTab === 'approvals' && isManager && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm">
            <h3 className="text-base font-bold text-[#2A1A1B] mb-1">
              {locale === 'bn' ? 'ছুটি অনুমোদন ইনবক্স' : 'Pending Leave Approvals Inbox'}
            </h3>
            <p className="text-xs text-[#8C7B7C] mb-4">
              {locale === 'bn'
                ? 'আপনার পর্যালোচনা ও অনুমোদনের অপেক্ষায় থাকা ছুটির আবেদনসমূহ'
                : 'Employee leave requests awaiting your decision level.'}
            </p>

            <div className="space-y-3">
              {pendingApprovals.map(req => (
                <div
                  key={req.id}
                  className="p-4 bg-[#FBF6F2] rounded-2xl border border-[#EDE4DC] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={req.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}
                      alt={req.empName}
                      className="w-10 h-10 rounded-full object-cover border border-[#EDE4DC]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#2A1A1B]">{req.empName}</strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF0FF] text-[#3730A3]">
                          {req.leaveTypeCode} ({req.totalDays} {locale === 'bn' ? 'দিন' : 'days'})
                        </span>
                      </div>
                      <div className="text-xs text-[#8C7B7C] mt-0.5">
                        {req.fromDate} to {req.toDate} · {req.reason}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDecideLeave(req.id, req.currentLevel, 'approved', 'Approved')}
                      className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      {locale === 'bn' ? 'অনুমোদন' : 'Approve'}
                    </button>
                    <button
                      onClick={() => onDecideLeave(req.id, req.currentLevel, 'rejected', 'Staff target pressure')}
                      className="px-4 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      {locale === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* APPLY FOR LEAVE MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF6F2] rounded-3xl max-w-lg w-full p-6 border border-[#EDE4DC] shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#EDE4DC] text-[#2A1A1B] flex items-center justify-center hover:bg-[#FDE8E9]"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-[#FDE8E9] text-[#EC1C24] rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#2A1A1B]">
                  {locale === 'bn' ? 'ছুটির আবেদন ফর্ম' : 'Apply for Leave'}
                </h3>
                <span className="text-xs text-[#8C7B7C]">
                  {locale === 'bn' ? 'অনলাইন ছুটির ব্যবস্থাপনা' : 'Digital Paperless Workflow'}
                </span>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4 text-xs">
              {/* HR on behalf */}
              {isHR && (
                <div>
                  <label className="block font-bold text-[#2A1A1B] mb-1">
                    {locale === 'bn' ? 'কর্মী নির্বাচন (অন বিহাফ)' : 'Apply on behalf of:'}
                  </label>
                  <select
                    value={applyEmpId}
                    onChange={e => setApplyEmpId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B]"
                  >
                    {employees.map(e => (
                      <option key={e.empId} value={e.empId}>
                        {e.empId} - {e.nameEn} ({e.employment.deptName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave Type Select */}
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'ছুটির ধরন' : 'Leave Type'}
                </label>
                <select
                  value={leaveTypeCode}
                  onChange={e => setLeaveTypeCode(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.code} value={lt.code}>
                      {lt.code} - {locale === 'bn' ? lt.nameBn : lt.nameEn}
                    </option>
                  ))}
                </select>

                <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] text-[#8C7B7C]">
                  <span>{locale === 'bn' ? 'অবশিষ্ট কোটা:' : 'Available Quota:'}</span>
                  <strong className="text-[#EC1C24]">{availableDays} days</strong>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2A1A1B] mb-1">
                    {locale === 'bn' ? 'শুরুর তারিখ' : 'From Date'}
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2A1A1B] mb-1">
                    {locale === 'bn' ? 'শেষের তারিখ' : 'To Date'}
                  </label>
                  <input
                    type="date"
                    disabled={isHalfDay}
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className={`w-full p-2.5 border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] ${
                      isHalfDay ? 'bg-gray-100' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Half Day Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={e => setIsHalfDay(e.target.checked)}
                  className="w-4 h-4 text-[#EC1C24] rounded"
                />
                <label htmlFor="halfDay" className="font-semibold text-[#2A1A1B]">
                  {locale === 'bn' ? 'অর্ধ দিবস (Half Day - ০.৫ দিন)' : 'Half Day (0.5 day)'}
                </label>
              </div>

              {/* Balance Alert if requested > available */}
              {hasBalanceError && (
                <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-[#B91C1C] flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {locale === 'bn'
                      ? `ক্যাজুয়াল ছুটির ব্যালেন্স অবশিষ্ট নেই! অনুরোধকৃত: ${requestedDays} দিন, বিদ্যমান: ${availableDays} দিন।`
                      : `Insufficient balance! Requested: ${requestedDays} days, available: ${availableDays} days.`}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'ছুটির কারণ (বাধ্যতামূলক)' : 'Reason (Required)'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={locale === 'bn' ? 'ছুটির সুনির্দিষ্ট কারণ লিখুন...' : 'Specify reason...'}
                  className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={hasBalanceError}
                  className="flex-1 py-3 bg-[#EC1C24] hover:bg-[#C4141B] disabled:opacity-50 text-white rounded-xl font-bold transition shadow-md"
                >
                  {locale === 'bn' ? 'আবেদন সম্পন্ন করুন' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="py-3 px-4 bg-white border border-[#EDE4DC] text-[#2A1A1B] rounded-xl font-semibold hover:bg-gray-100"
                >
                  {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
