/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Attendance Adjustment Request & HOD Decision Modal
 * Conforms to PRD ATT-5, App-Flow F5, and Schema §2.10
 */

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { AttendanceAdjustment, AttendanceRecord, Locale, Role } from '../types';
import { formatLocalizedDate } from '../data/translations';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRecord?: AttendanceRecord | null;
  pendingAdjustment?: AttendanceAdjustment | null;
  mode: 'request' | 'decide';
  currentRole: Role;
  locale: Locale;
  onSubmitRequest: (adj: Partial<AttendanceAdjustment>) => void;
  onDecideAdjustment: (adjId: string, decision: 'approved' | 'rejected', note: string) => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  onClose,
  targetRecord,
  pendingAdjustment,
  mode,
  currentRole,
  locale,
  onSubmitRequest,
  onDecideAdjustment,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<'lateWithdrawal' | 'missingIn' | 'missingOut' | 'other'>(
    'lateWithdrawal'
  );
  const [requestedTime, setRequestedTime] = useState<string>('08:00');
  const [reason, setReason] = useState<string>('');
  const [decisionNote, setDecisionNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert(locale === 'bn' ? 'সংশোধনের কারণ উল্লেখ আবশ্যক' : 'Reason is required');
      return;
    }

    setIsSubmitting(true);
    onSubmitRequest({
      empId: targetRecord?.empId || '20045',
      empName: targetRecord?.empName || 'Md. Rahim Uddin',
      deptId: targetRecord?.deptId || 'casting',
      dateKey: targetRecord?.dateKey || '2026-10-30',
      type,
      requestedIn: requestedTime,
      reason,
      status: 'pending',
      approverRole: 'hod',
      approverEmpId: '10003', // Engr Tariqul Islam
      createdAt: new Date().toISOString(),
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleDecision = (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !decisionNote.trim()) {
      alert(
        locale === 'bn'
          ? 'প্রত্যাখ্যানের ক্ষেত্রে কারণ বা মন্তব্য লেখা আবশ্যক'
          : 'Decision note is required for rejection'
      );
      return;
    }

    if (!pendingAdjustment) return;
    onDecideAdjustment(pendingAdjustment.id, decision, decisionNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FBF6F2] rounded-3xl max-w-lg w-full p-6 border border-[#EDE4DC] shadow-2xl relative animate-in fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#EDE4DC] text-[#2A1A1B] flex items-center justify-center hover:bg-[#FDE8E9] transition"
        >
          ✕
        </button>

        {mode === 'request' ? (
          /* EMPLOYEE REQUEST FORM (App-Flow F5) */
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-[#FDE8E9] text-[#EC1C24] rounded-xl">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#2A1A1B]">
                  {locale === 'bn'
                    ? 'হাজিরা বা দেরি প্রত্যাহারের আবেদন'
                    : 'Request Attendance Adjustment'}
                </h3>
                <span className="text-xs text-[#8C7B7C]">
                  {formatLocalizedDate(targetRecord?.dateKey || '2026-10-30', locale)} ·{' '}
                  {targetRecord?.empName}
                </span>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="mt-5 space-y-4 text-xs">
              {/* Type */}
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'সংশোধনের ধরন' : 'Adjustment Type'}
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                >
                  <option value="lateWithdrawal">
                    {locale === 'bn'
                      ? 'দেরি প্রত্যাহার (Late Arrival Withdrawal)'
                      : 'Late Arrival Withdrawal'}
                  </option>
                  <option value="missingIn">
                    {locale === 'bn' ? 'ইন পাঞ্চ মিসিং (Missing IN Punch)' : 'Missing IN Punch'}
                  </option>
                  <option value="missingOut">
                    {locale === 'bn' ? 'আউট পাঞ্চ মিসিং (Missing OUT Punch)' : 'Missing OUT Punch'}
                  </option>
                  <option value="other">{locale === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>

              {/* Correct Time */}
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'প্রকৃত বা দাবিকৃত সময়' : 'Requested / Correct Time'}
                </label>
                <input
                  type="time"
                  value={requestedTime}
                  onChange={e => setRequestedTime(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-[#2A1A1B] mb-1">
                  {locale === 'bn' ? 'দেরি বা সংশোধনের কারণ (বাধ্যতামূলক)' : 'Reason (Required)'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={
                    locale === 'bn'
                      ? 'মহাসড়কে যানজট, বাস নষ্ট, বা গেটে বিলম্বের সঠিক কারণ উল্লেখ করুন...'
                      : 'Provide specific reason (highway traffic, transport breakdown, etc.)...'
                  }
                  className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-white rounded-xl border border-[#EDE4DC] text-[#8C7B7C] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#EC1C24] shrink-0 mt-0.5" />
                <span>
                  {locale === 'bn'
                    ? 'আবেদনটি বিভাগীয় প্রধানের (HOD) অনুমোদনের জন্য প্রেরিত হবে। অনুমোদিত হলে লাল দাগ মুছে প্রেজেন্ট হিসেব হবে।'
                    : 'Submitting will notify your HOD. Upon approval, the red late mark is cleared and the day recalculates.'}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#EC1C24] hover:bg-[#C4141B] text-white rounded-xl font-bold transition shadow-md"
                >
                  {locale === 'bn' ? 'আবেদন প্রেরণ করুন' : 'Submit Adjustment Request'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 bg-white border border-[#EDE4DC] text-[#2A1A1B] rounded-xl font-semibold hover:bg-gray-100"
                >
                  {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* HOD / HR DECISION WORKFLOW (App-Flow F5) */
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-[#FDE8E9] text-[#EC1C24] rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#2A1A1B]">
                  {locale === 'bn'
                    ? 'দেরি প্রত্যাহারের আবেদন পর্যালোচনা'
                    : 'Review Attendance Adjustment'}
                </h3>
                <span className="text-xs text-[#8C7B7C]">
                  {locale === 'bn' ? 'এইচওডি ও এইচআর অনুমোদন' : 'HOD Approval Gate'}
                </span>
              </div>
            </div>

            {pendingAdjustment ? (
              <div className="mt-5 space-y-4 text-xs">
                {/* Employee Info Card */}
                <div className="p-3.5 bg-white rounded-xl border border-[#EDE4DC] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8C7B7C]">{locale === 'bn' ? 'কর্মী:' : 'Employee:'}</span>
                    <span className="font-bold text-[#2A1A1B]">{pendingAdjustment.empName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C7B7C]">{locale === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                    <span className="font-bold text-[#2A1A1B]">{pendingAdjustment.dateKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C7B7C]">{locale === 'bn' ? 'ধরন:' : 'Type:'}</span>
                    <span className="font-bold text-[#EC1C24] uppercase">
                      {pendingAdjustment.type}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#EDE4DC]">
                    <span className="text-[#8C7B7C] block mb-1">
                      {locale === 'bn' ? 'কর্মীর প্রদত্ত কারণ:' : 'Reason provided:'}
                    </span>
                    <p className="font-medium text-[#2A1A1B] italic bg-[#FBF6F2] p-2 rounded-lg">
                      "{pendingAdjustment.reason}"
                    </p>
                  </div>
                </div>

                {/* Decision Note */}
                <div>
                  <label className="block font-bold text-[#2A1A1B] mb-1">
                    {locale === 'bn'
                      ? 'অনুমোদনকারী মন্তব্য (প্রত্যাখ্যানে আবশ্যক)'
                      : 'Decision Note (Required on rejection)'}
                  </label>
                  <input
                    type="text"
                    value={decisionNote}
                    onChange={e => setDecisionNote(e.target.value)}
                    placeholder={
                      locale === 'bn'
                        ? 'অনুমোদন বা প্রত্যাখ্যানের প্রাসঙ্গিক নোট লিখুন...'
                        : 'Optional note on approval, mandatory on rejection...'
                    }
                    className="w-full p-2.5 bg-white border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24]"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleDecision('approved')}
                    className="flex-1 py-3 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{locale === 'bn' ? 'অনুমোদন করুন (লাল দাগ মুছুন)' : 'Approve & Clear Mark'}</span>
                  </button>
                  <button
                    onClick={() => handleDecision('rejected')}
                    className="flex-1 py-3 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{locale === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject Request'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
