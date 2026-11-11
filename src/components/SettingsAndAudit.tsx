/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Settings, ZKTeco Device Integration & Immutable Audit Log
 * Conforms to PRD §5.4, §5.11, TRD §6, and Schema §2.20–§2.22
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  RotateCcw,
  CheckCircle2,
  Clock,
  Key,
  Building,
  FileText,
  Search,
} from 'lucide-react';
import { AuditLogItem, Locale, Role } from '../types';
import { RolePermissionMap, DEFAULT_ROLE_PERMISSIONS } from '../data/permissionsData';
import { RolePermissionControl } from './RolePermissionControl';
import { MasterOrgSettings } from './MasterOrgSettings';

interface SettingsAndAuditProps {
  auditLogs: AuditLogItem[];
  currentRole: Role;
  locale: Locale;
  permissions?: RolePermissionMap;
  onUpdatePermissions?: (updated: RolePermissionMap) => void;
  onSwitchRole?: (role: Role) => void;
  initialTab?: 'permissions' | 'settings' | 'devices' | 'audit';
}

export const SettingsAndAudit: React.FC<SettingsAndAuditProps> = ({
  auditLogs,
  currentRole,
  locale,
  permissions = DEFAULT_ROLE_PERMISSIONS,
  onUpdatePermissions,
  onSwitchRole,
  initialTab = 'permissions',
}) => {
  const [tab, setTab] = useState<'permissions' | 'settings' | 'devices' | 'audit'>(initialTab);
  const [searchAudit, setSearchAudit] = useState<string>('');
  const [deviceSyncTime, setDeviceSyncTime] = useState<string>('2 minutes ago');

  const filteredLogs = auditLogs.filter(
    l =>
      l.actorName.toLowerCase().includes(searchAudit.toLowerCase()) ||
      l.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
      l.details.toLowerCase().includes(searchAudit.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4DC] pb-4">
        <div className="inline-flex p-1 bg-white border border-[#EDE4DC] rounded-2xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setTab('permissions')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tab === 'permissions'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'ক্ষমতা বণ্টন ও পারমিশন কন্ট্রোল' : 'Role Permissions'}</span>
            <span className="w-2 h-2 rounded-full bg-[#EC1C24] animate-ping" />
          </button>

          <button
            onClick={() => setTab('settings')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'settings'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            {locale === 'bn' ? 'কোম্পানি ও পলিসি সেটিংস' : 'Company & Rules'}
          </button>

          <button
            onClick={() => setTab('devices')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tab === 'devices'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'জেডকেটেকো ডিভাইস ব্রিজ' : 'ZKTeco Devices'}</span>
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
          </button>

          <button
            onClick={() => setTab('audit')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tab === 'audit'
                ? 'bg-[#EC1C24] text-white shadow-sm'
                : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'অডিট ট্রেইল (Audit Log)' : 'Audit Trail'}</span>
          </button>
        </div>
      </div>

      {/* TAB 0: ROLE ACCESS & POWER DISTRIBUTION (DYNAMIC RBAC CHECKLIST) */}
      {tab === 'permissions' && (
        <RolePermissionControl
          permissions={permissions}
          onUpdatePermissions={onUpdatePermissions || (() => {})}
          currentRole={currentRole}
          onSwitchRole={onSwitchRole || (() => {})}
          locale={locale}
        />
      )}

      {/* TAB 1: RULES, MASTER DEPARTMENTS, EMPLOYEE TYPES & POLICIES */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <MasterOrgSettings locale={locale} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'উপস্থিতি নিয়মাবলী (Attendance Rules)' : 'Attendance Policy Engine'}
              </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">Shift Grace Time:</span>
                <strong className="text-[#EC1C24]">10 Minutes (PRD Rule 3)</strong>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">Late Withdrawal Authority:</span>
                <strong className="text-[#2A1A1B]">HOD Approval Required</strong>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">Daily Break Duration:</span>
                <strong className="text-[#2A1A1B]">60 Minutes (Lunch & Prayer)</strong>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">Timezone Authority:</span>
                <strong className="text-[#2A1A1B]">Asia/Dhaka (UTC+6)</strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#2A1A1B]">
              {locale === 'bn' ? 'ওভারটাইম ও লিভ পলিসি' : 'Overtime & Leave Policy'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">OT Minimum Qualifying Threshold:</span>
                <strong className="text-[#2A1A1B]">30 Minutes</strong>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">OT Minute Rounding:</span>
                <strong className="text-[#2A1A1B]">15 Minutes Block</strong>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">Weekly-Off Overtime Multiplier:</span>
                <strong className="text-[#EC1C24]">2.0x Basic Rate</strong>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC]">
                <span className="text-[#8C7B7C]">Earned Leave Encashment:</span>
                <strong className="text-[#15803D]">Enabled (Year-End)</strong>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZKTECO DEVICE INTEGRATION (TRD §6) */}
      {tab === 'devices' && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E7F6EC] text-[#15803D] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2A1A1B]">
                  zk-head-01 (Head Office Gate Scanner)
                </h3>
                <span className="text-xs text-[#8C7B7C]">
                  ZKTeco Face & Palm Recognition Bridge Service
                </span>
              </div>
            </div>

            <span className="px-3 py-1 bg-[#E7F6EC] text-[#15803D] rounded-full text-xs font-bold flex items-center gap-1.5 border border-[#15803D]/30">
              <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
              <span>ONLINE</span>
            </span>
          </div>

          <div className="p-4 bg-[#FBF6F2] rounded-2xl border border-[#EDE4DC] grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#8C7B7C]">Sync Frequency:</span>
              <div className="font-bold text-[#2A1A1B] mt-0.5">Every 5 Minutes (Heartbeat)</div>
            </div>
            <div>
              <span className="text-[#8C7B7C]">Last Device Sync:</span>
              <div className="font-bold text-[#15803D] mt-0.5">{deviceSyncTime}</div>
            </div>
            <div>
              <span className="text-[#8C7B7C]">Bridge Endpoint:</span>
              <div className="font-bold text-[#2A1A1B] mt-0.5">HTTPS POST /ingestPunches</div>
            </div>
            <div>
              <span className="text-[#8C7B7C]">Enrolled Biometric Staff:</span>
              <div className="font-bold text-[#EC1C24] mt-0.5">1,240 Enrolled Users</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeviceSyncTime('Just now');
                alert(locale === 'bn' ? 'ডিভাইস হার্টবিট সফলভাবে সিঙ্ক হয়েছে।' : 'Device heartbeat synchronized.');
              }}
              className="flex-1 py-2.5 bg-[#EC1C24] hover:bg-[#C4141B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ম্যানুয়াল সিঙ্ক চালান' : 'Trigger Sync'}</span>
            </button>
            <button
              onClick={() => alert('API key rotated and hashed in devices/{id}.apiKeyHash')}
              className="py-2.5 px-4 bg-white border border-[#EDE4DC] text-[#2A1A1B] rounded-xl text-xs font-bold hover:bg-gray-100 flex items-center gap-1.5"
            >
              <Key className="w-4 h-4 text-[#8C7B7C]" />
              <span>Rotate Key</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'অপরিবর্তনীয় অডিট ট্রেইল (Immutable Audit Log)' : 'Immutable Audit Trail'}
              </h3>
              <p className="text-xs text-[#8C7B7C]">
                {locale === 'bn'
                  ? 'সকল অনুমোদন, সমন্বয় ও পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়'
                  : 'Immutable record of every override, approval, shift modification, and month close.'}
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8C7B7C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={locale === 'bn' ? 'অডিট ফিল্টার...' : 'Search logs...'}
                value={searchAudit}
                onChange={e => setSearchAudit(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#FBF6F2] border border-[#EDE4DC] rounded-xl text-xs text-[#2A1A1B] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[#EDE4DC] rounded-xl text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FBF6F2] text-[#8C7B7C] uppercase font-bold border-b border-[#EDE4DC]">
                <tr>
                  <th className="p-3">{locale === 'bn' ? 'সময়' : 'Timestamp'}</th>
                  <th className="p-3">{locale === 'bn' ? 'ব্যবহারকারী' : 'Actor'}</th>
                  <th className="p-3">{locale === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  <th className="p-3">{locale === 'bn' ? 'টার্গেট' : 'Target'}</th>
                  <th className="p-3">{locale === 'bn' ? 'বিস্তারিত' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE4DC]">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FBF6F2]/50">
                    <td className="p-3 text-[#8C7B7C] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-bold text-[#2A1A1B]">
                      {log.actorName}{' '}
                      <span className="text-[10px] text-[#EC1C24] font-normal uppercase">
                        ({log.actorRole})
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#2A1A1B]">{log.action}</td>
                    <td className="p-3 text-[#8C7B7C]">
                      {log.targetCollection}/{log.targetId}
                    </td>
                    <td className="p-3 text-[#2A1A1B]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
