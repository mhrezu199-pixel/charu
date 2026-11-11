/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Overtime Management (OT Candidates, Approvals & Month Summaries)
 * Conforms to PRD §5.8, App-Flow F8, and Schema §2.15
 */

import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Edit3, Filter } from 'lucide-react';
import { Employee, Locale, OvertimeRecord, Role } from '../types';
import { formatLocalizedDate, formatLocalizedNumber, toBanglaDigits } from '../data/translations';

interface OvertimeViewProps {
  currentEmpId: string;
  currentRole: Role;
  locale: Locale;
  overtimeRecords: OvertimeRecord[];
  onDecideOT: (otId: string, approvedMinutes: number, decision: 'approved' | 'rejected') => void;
  onRequestOT: (rec: Partial<OvertimeRecord>) => void;
  canApproveOT?: boolean;
}

export const OvertimeView: React.FC<OvertimeViewProps> = ({
  currentEmpId,
  currentRole,
  locale,
  overtimeRecords,
  onDecideOT,
  onRequestOT,
  canApproveOT,
}) => {
  const isApprover = ['superAdmin', 'hrManager', 'hod', 'supervisor'].includes(currentRole);
  const showApprovals = canApproveOT !== undefined ? canApproveOT : isApprover;
  const [activeTab, setActiveTab] = useState<'myOT' | 'approvals' | 'summary'>('myOT');
  const [editingOtId, setEditingOtId] = useState<string | null>(null);
  const [editedMinutes, setEditedMinutes] = useState<number>(60);

  const myOT = overtimeRecords.filter(r => r.empId === currentEmpId);
  const pendingApprovals = overtimeRecords.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4DC] pb-4">
        <div className="inline-flex p-1 bg-white border border-[#EDE4DC] rounded-2xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveTab('myOT')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'myOT'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'আমার ওভারটাইম লগ' : 'My Overtime'}
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
              <span>{locale === 'bn' ? 'ওটি অনুমোদন ইনবক্স' : 'OT Approvals'}</span>
              {pendingApprovals.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#EC1C24] text-white flex items-center justify-center text-[10px] font-black">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'summary'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'মাসিক সারসংক্ষেপ' : 'Monthly Summary'}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: MY OT */}
      {activeTab === 'myOT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myOT.map(ot => (
              <div
                key={ot.id}
                className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE8E9] text-[#EC1C24]">
                      {ot.dateKey}
                    </span>
                    <h4 className="font-bold text-lg text-[#2A1A1B] mt-1">
                      {toBanglaDigits(ot.approvedMinutes || ot.requestedMinutes)}{' '}
                      {locale === 'bn' ? 'মিনিট' : 'min'}{' '}
                      <span className="text-xs text-[#8C7B7C]">
                        ({((ot.approvedMinutes || ot.requestedMinutes) / 60).toFixed(1)}h)
                      </span>
                    </h4>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      ot.status === 'approved'
                        ? 'bg-[#E7F6EC] text-[#15803D]'
                        : ot.status === 'rejected'
                        ? 'bg-[#FEE2E2] text-[#B91C1C]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}
                  >
                    {ot.status}
                  </span>
                </div>

                <p className="text-xs text-[#8C7B7C] italic bg-[#FBF6F2] p-2.5 rounded-xl">
                  "{ot.reason}"
                </p>

                <div className="flex justify-between items-center text-[11px] text-[#8C7B7C] pt-2 border-t border-[#EDE4DC]">
                  <span>{locale === 'bn' ? 'অনুমোদনকারী:' : 'Approver:'} Engr. Tariqul Islam</span>
                  <span className="font-bold text-[#15803D]">1.0x Rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: APPROVALS INBOX (HOD APPROVAL WITH EDITABLE MINUTES per App-Flow F8) */}
      {activeTab === 'approvals' && isApprover && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'বিভাগীয় ওভারটাইম অনুমোদন' : 'Department Overtime Approval Queue'}
              </h3>
              <p className="text-xs text-[#8C7B7C]">
                {locale === 'bn'
                  ? 'সিস্টেম জেনারেটেড ওটি মিনিট যাচাই ও প্রয়োজনে সংশোধন করে অনুমোদন দিন'
                  : 'Review system-calculated extra minutes and adjust approved hours prior to payroll closing.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map(ot => (
              <div
                key={ot.id}
                className="p-4 bg-[#FBF6F2] rounded-2xl border border-[#EDE4DC] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-[#2A1A1B]">{ot.empName}</strong>
                    <span className="text-xs text-[#8C7B7C]">({ot.dateKey})</span>
                  </div>
                  <div className="text-xs text-[#8C7B7C] mt-1">
                    Reason: <span className="text-[#2A1A1B] font-medium">{ot.reason}</span>
                  </div>
                  <div className="text-xs text-[#EC1C24] font-bold mt-1">
                    System Candidate: {ot.systemMinutes} min ({(ot.systemMinutes / 60).toFixed(1)}h)
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {editingOtId === ot.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={15}
                        value={editedMinutes}
                        onChange={e => setEditedMinutes(Number(e.target.value))}
                        className="w-20 p-1.5 bg-white border border-[#EDE4DC] rounded-lg text-xs"
                      />
                      <button
                        onClick={() => {
                          onDecideOT(ot.id, editedMinutes, 'approved');
                          setEditingOtId(null);
                        }}
                        className="px-3 py-1.5 bg-[#15803D] text-white rounded-lg font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingOtId(ot.id);
                        setEditedMinutes(ot.requestedMinutes);
                      }}
                      className="px-3 py-1.5 bg-white border border-[#EDE4DC] rounded-xl font-bold text-[#2A1A1B] flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{ot.requestedMinutes} min</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDecideOT(ot.id, ot.requestedMinutes, 'approved')}
                    className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-bold transition shadow-sm"
                  >
                    {locale === 'bn' ? 'অনুমোদন' : 'Approve'}
                  </button>
                  <button
                    onClick={() => onDecideOT(ot.id, 0, 'rejected')}
                    className="px-4 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-xl font-bold transition shadow-sm"
                  >
                    {locale === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: MONTHLY SUMMARY */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#2A1A1B]">
            {locale === 'bn' ? 'অক্টোবর ২০২৬ ওভারটাইম সারসংক্ষেপ' : 'October 2026 Overtime Pool'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
              <span className="text-[#8C7B7C]">Total Approved OT</span>
              <div className="text-2xl font-black text-[#EC1C24] mt-1">২১০ ঘণ্টা</div>
            </div>
            <div className="p-4 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
              <span className="text-[#8C7B7C]">Highest Department</span>
              <div className="text-2xl font-black text-[#2A1A1B] mt-1">Casting (Line 3)</div>
            </div>
            <div className="p-4 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
              <span className="text-[#8C7B7C]">Estimated OT Payout</span>
              <div className="text-2xl font-black text-[#15803D] mt-1">৳৪৫,২০০</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
