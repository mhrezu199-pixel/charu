/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Raw Biometric Device Logs & Terminal Hardware Bridge
 * Conforms to PRD §5.6, §5.13 and Technical Architecture
 */

import { Employee } from '../types';

export type BiometricVerifyMode = 'fingerprint' | 'face' | 'rfid' | 'palm';
export type BiometricPunchState = 'check_in' | 'check_out' | 'break_out' | 'break_in';
export type BiometricSyncStatus = 'synced' | 'flagged' | 'manual_override';

export interface BiometricTerminal {
  id: string;
  nameEn: string;
  nameBn: string;
  locationEn: string;
  locationBn: string;
  ip: string;
  port: number;
  model: string;
  status: 'online' | 'offline' | 'syncing';
  firmware: string;
  lastHeartbeat: string;
  registeredUsers: number;
  bufferPunches: number;
  supportedModes: BiometricVerifyMode[];
}

export interface RawBiometricLog {
  id: string;
  punchTime: string;      // "2026-10-30 07:54:12"
  dateKey: string;        // "2026-10-30"
  timeStr: string;        // "07:54:12"
  empId: string;
  empNameEn: string;
  empNameBn: string;
  deptId: string;
  deptNameEn: string;
  deptNameBn: string;
  avatarUrl: string;
  deviceId: string;
  deviceNameEn: string;
  deviceNameBn: string;
  terminalLocationEn: string;
  terminalLocationBn: string;
  ipAddress: string;
  verifyMode: BiometricVerifyMode;
  punchState: BiometricPunchState;
  syncStatus: BiometricSyncStatus;
  deviceUserId: string;   // Device internal slot #
  matchScore: number;     // Accuracy confidence e.g. 97%
  notes?: string;
}

export const BIOMETRIC_TERMINALS: BiometricTerminal[] = [
  {
    id: 'zk-fact-01',
    nameEn: 'Factory Main Gate — Turnstile 01',
    nameBn: 'কারখানা মেইন গেট — টার্নস্টাইল ০১',
    locationEn: 'Gate Complex, Factory 1, Tongi, Gazipur',
    locationBn: 'মেইন গেট কমপ্লেক্স, ফ্যাক্টরি ১, টঙ্গী, গাজীপুর',
    ip: '192.168.10.201',
    port: 4370,
    model: 'ZKTeco ProFace X (Hardware Rev 3.2)',
    status: 'online',
    firmware: 'Ver 6.60 (Apr 2026 Build)',
    lastHeartbeat: '2026-10-30 08:32:05',
    registeredUsers: 642,
    bufferPunches: 14,
    supportedModes: ['face', 'fingerprint', 'rfid', 'palm'],
  },
  {
    id: 'zk-fact-02',
    nameEn: 'Factory Main Gate — Turnstile 02',
    nameBn: 'কারখানা মেইন গেট — টার্নস্টাইল ০২',
    locationEn: 'Gate Complex, Factory 1, Tongi, Gazipur',
    locationBn: 'মেইন গেট কমপ্লেক্স, ফ্যাক্টরি ১, টঙ্গী, গাজীপুর',
    ip: '192.168.10.202',
    port: 4370,
    model: 'ZKTeco ProFace X (Hardware Rev 3.2)',
    status: 'online',
    firmware: 'Ver 6.60 (Apr 2026 Build)',
    lastHeartbeat: '2026-10-30 08:31:58',
    registeredUsers: 642,
    bufferPunches: 9,
    supportedModes: ['face', 'fingerprint', 'rfid', 'palm'],
  },
  {
    id: 'zk-kiln-01',
    nameEn: 'Tunnel Kiln Entrance Terminal',
    nameBn: 'টানেল কিলন ও ফায়ারিং ইউনিট স্ক্যানার',
    locationEn: 'Kiln Shed #1, High-Heat Secure Zone',
    locationBn: 'কিলন শেড #১, উচ্চ-তাপ সুরক্ষিত জোন',
    ip: '192.168.10.210',
    port: 4370,
    model: 'ZKTeco SilkBio-101TC Industrial',
    status: 'online',
    firmware: 'Ver 5.12 (Jan 2026)',
    lastHeartbeat: '2026-10-30 08:30:12',
    registeredUsers: 185,
    bufferPunches: 4,
    supportedModes: ['fingerprint', 'rfid', 'face'],
  },
  {
    id: 'zk-cast-01',
    nameEn: 'Casting & Moulding Floor Terminal',
    nameBn: 'কাস্টিং ও মোল্ডিং ফ্লোর টার্মিনাল',
    locationEn: 'Casting Production Floor, North Bay',
    locationBn: 'কাস্টিং প্রোডাকশন ফ্লোর, উত্তর শেড',
    ip: '192.168.10.215',
    port: 4370,
    model: 'ZKTeco IN01-A Heavy-Duty',
    status: 'online',
    firmware: 'Ver 4.88 (Nov 2025)',
    lastHeartbeat: '2026-10-30 08:29:40',
    registeredUsers: 240,
    bufferPunches: 6,
    supportedModes: ['fingerprint', 'rfid'],
  },
  {
    id: 'zk-head-01',
    nameEn: 'Corporate Head Office Reception',
    nameBn: 'কর্পোরেট হেড অফিস ৪থ তলা প্রবেশদ্বার',
    locationEn: 'Level 4, Gulshan-1, Dhaka-1212',
    locationBn: 'লেভেল ৪, গুলশান-১, ঢাকা-১২১২',
    ip: '192.168.1.105',
    port: 4370,
    model: 'ZKTeco SpeedFace-V5L [TD]',
    status: 'online',
    firmware: 'Ver 8.02 (Mar 2026)',
    lastHeartbeat: '2026-10-30 08:33:14',
    registeredUsers: 95,
    bufferPunches: 2,
    supportedModes: ['face', 'palm', 'rfid', 'fingerprint'],
  },
];

/**
 * Seed 30 days of realistic raw biometric device logs (Oct 1 to Oct 30, 2026)
 */
export function generate30DaysBiometricLogs(employees: Employee[]): RawBiometricLog[] {
  const logs: RawBiometricLog[] = [];
  let logCounter = 1;

  // Selected core employees to generate rich multi-punch timeline
  const activeEmployees = employees.length > 0
    ? employees
    : [
        {
          empId: '20045',
          deviceCode: '1045',
          nameEn: 'Md. Rahim Uddin',
          nameBn: 'মোঃ রহিম উদ্দিন',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          employment: { deptId: 'casting', deptName: 'Casting & Moulding' },
        } as unknown as Employee,
      ];

  // Helper to format 2 digits
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Loop backward across the last 30 days: Oct 30 down to Oct 1, 2026
  for (let day = 30; day >= 1; day--) {
    const dayStr = pad(day);
    const dateKey = `2026-10-${dayStr}`;

    // Friday is weekly holiday for factory in Charu Ceramic
    // Oct 2, 9, 16, 23, 30 are Fridays in 2026
    const isFriday = [2, 9, 16, 23, 30].includes(day);

    // On Fridays, only kiln / maintenance shift works (continuous operation)
    // On normal days, all active employees punch
    activeEmployees.forEach((emp, empIdx) => {
      // Determine device & verify mode based on department
      const isHQ = emp.employment.deptId === 'hr' || emp.employment.deptId === 'accounts';
      const isKiln = emp.employment.deptId === 'kiln';
      const isCasting = emp.employment.deptId === 'casting';

      let device: BiometricTerminal = BIOMETRIC_TERMINALS[0]; // zk-fact-01 default
      if (isHQ) {
        device = BIOMETRIC_TERMINALS[4]; // zk-head-01
      } else if (isKiln) {
        device = BIOMETRIC_TERMINALS[2]; // zk-kiln-01
      } else if (isCasting && day % 2 === 0) {
        device = BIOMETRIC_TERMINALS[3]; // zk-cast-01
      } else if (empIdx % 2 === 1) {
        device = BIOMETRIC_TERMINALS[1]; // zk-fact-02
      }

      // Skip non-kiln workers on Friday unless overtime
      if (isFriday && !isKiln && emp.empId !== '20045') {
        return;
      }

      // Preferred verify mode
      const modes: BiometricVerifyMode[] = isHQ
        ? ['face', 'palm']
        : ['fingerprint', 'face', 'rfid'];
      const verifyMode = modes[(empIdx + day) % modes.length];

      // Pseudo-random deterministic punch times
      const hash = (day * 37 + empIdx * 19) % 100;

      // 1. Check-In Punch
      let inHour = 7;
      let inMinute = 48 + (hash % 25); // 07:48 to 08:13
      if (inMinute >= 60) {
        inHour = 8;
        inMinute = inMinute - 60;
      }
      const inSecond = (hash * 7) % 60;
      const inTimeStr = `${pad(inHour)}:${pad(inMinute)}:${pad(inSecond)}`;
      const inTimestamp = `${dateKey} ${inTimeStr}`;

      const isLateCheckIn = inHour === 8 && inMinute > 10;
      const checkInStatus: BiometricSyncStatus = isLateCheckIn ? 'flagged' : 'synced';

      logs.push({
        id: `bio-pnc-${pad(logCounter++)}`,
        punchTime: inTimestamp,
        dateKey,
        timeStr: inTimeStr,
        empId: emp.empId,
        empNameEn: emp.nameEn,
        empNameBn: emp.nameBn,
        deptId: emp.employment.deptId,
        deptNameEn: emp.employment.deptName || emp.employment.deptId.toUpperCase(),
        deptNameBn: emp.employment.deptId === 'casting' ? 'কাস্টিং ও মোল্ডিং' : emp.employment.deptId === 'hr' ? 'এইচআর ও প্রশাসন' : 'কারখানা বিভাগ',
        avatarUrl: emp.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        deviceId: device.id,
        deviceNameEn: device.nameEn,
        deviceNameBn: device.nameBn,
        terminalLocationEn: device.locationEn,
        terminalLocationBn: device.locationBn,
        ipAddress: device.ip,
        verifyMode,
        punchState: 'check_in',
        syncStatus: checkInStatus,
        deviceUserId: emp.deviceCode || `${1000 + parseInt(emp.empId.slice(-3))}`,
        matchScore: 92 + (hash % 8),
        notes: isLateCheckIn
          ? `Late arrival punch recorded (${inMinute}m past shift start)`
          : `Fast verified via ${verifyMode.toUpperCase()} at ${device.id}`,
      });

      // Break punches for select factory workers (lunch break around 13:00 - 14:00)
      if (empIdx === 0 && day % 3 === 0) {
        const breakOutTimeStr = `13:02:${pad((hash * 3) % 60)}`;
        logs.push({
          id: `bio-pnc-${pad(logCounter++)}`,
          punchTime: `${dateKey} ${breakOutTimeStr}`,
          dateKey,
          timeStr: breakOutTimeStr,
          empId: emp.empId,
          empNameEn: emp.nameEn,
          empNameBn: emp.nameBn,
          deptId: emp.employment.deptId,
          deptNameEn: emp.employment.deptName || 'Factory',
          deptNameBn: 'কাস্টিং ও মোল্ডিং',
          avatarUrl: emp.photoUrl,
          deviceId: BIOMETRIC_TERMINALS[3].id,
          deviceNameEn: BIOMETRIC_TERMINALS[3].nameEn,
          deviceNameBn: BIOMETRIC_TERMINALS[3].nameBn,
          terminalLocationEn: BIOMETRIC_TERMINALS[3].locationEn,
          terminalLocationBn: BIOMETRIC_TERMINALS[3].locationBn,
          ipAddress: BIOMETRIC_TERMINALS[3].ip,
          verifyMode: 'fingerprint',
          punchState: 'break_out',
          syncStatus: 'synced',
          deviceUserId: emp.deviceCode || '1045',
          matchScore: 98,
          notes: 'Lunch break exit gate scanner',
        });

        const breakInTimeStr = `13:58:${pad((hash * 5) % 60)}`;
        logs.push({
          id: `bio-pnc-${pad(logCounter++)}`,
          punchTime: `${dateKey} ${breakInTimeStr}`,
          dateKey,
          timeStr: breakInTimeStr,
          empId: emp.empId,
          empNameEn: emp.nameEn,
          empNameBn: emp.nameBn,
          deptId: emp.employment.deptId,
          deptNameEn: emp.employment.deptName || 'Factory',
          deptNameBn: 'কাস্টিং ও মোল্ডিং',
          avatarUrl: emp.photoUrl,
          deviceId: BIOMETRIC_TERMINALS[3].id,
          deviceNameEn: BIOMETRIC_TERMINALS[3].nameEn,
          deviceNameBn: BIOMETRIC_TERMINALS[3].nameBn,
          terminalLocationEn: BIOMETRIC_TERMINALS[3].locationEn,
          terminalLocationBn: BIOMETRIC_TERMINALS[3].locationBn,
          ipAddress: BIOMETRIC_TERMINALS[3].ip,
          verifyMode: 'fingerprint',
          punchState: 'break_in',
          syncStatus: 'synced',
          deviceUserId: emp.deviceCode || '1045',
          matchScore: 97,
          notes: 'Break return verified',
        });
      }

      // 2. Check-Out Punch
      // For today (Oct 30), if it's morning, some haven't punched out yet
      const isToday = day === 30;
      if (isToday && empIdx > 1) {
        // Still on duty, only check-in logged
        return;
      }

      // An occasional missed punch anomaly (1 in 40)
      if (day === 14 && emp.empId === '20045') {
        // Rahim Uddin forgot punch out on Oct 14 -> flagged
        return;
      }

      let outHour = 17;
      let outMinute = 2 + (hash % 20); // 17:02 to 17:22
      // Overtime days
      if (day % 4 === 1 && !isHQ) {
        outHour = 18 + (hash % 2); // 18:xx or 19:xx
      }
      const outSecond = (hash * 11) % 60;
      const outTimeStr = `${pad(outHour)}:${pad(outMinute)}:${pad(outSecond)}`;
      const outTimestamp = `${dateKey} ${outTimeStr}`;

      logs.push({
        id: `bio-pnc-${pad(logCounter++)}`,
        punchTime: outTimestamp,
        dateKey,
        timeStr: outTimeStr,
        empId: emp.empId,
        empNameEn: emp.nameEn,
        empNameBn: emp.nameBn,
        deptId: emp.employment.deptId,
        deptNameEn: emp.employment.deptName || emp.employment.deptId.toUpperCase(),
        deptNameBn: emp.employment.deptId === 'casting' ? 'কাস্টিং ও মোল্ডিং' : emp.employment.deptId === 'hr' ? 'এইচআর ও প্রশাসন' : 'কারখানা বিভাগ',
        avatarUrl: emp.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        deviceId: device.id,
        deviceNameEn: device.nameEn,
        deviceNameBn: device.nameBn,
        terminalLocationEn: device.locationEn,
        terminalLocationBn: device.locationBn,
        ipAddress: device.ip,
        verifyMode,
        punchState: 'check_out',
        syncStatus: 'synced',
        deviceUserId: emp.deviceCode || `${1000 + parseInt(emp.empId.slice(-3))}`,
        matchScore: 95 + (hash % 5),
        notes: outHour >= 18 ? `Overtime exit logged (${outHour - 17}h+ extended shift)` : `Shift end turnstile checkout`,
      });
    });
  }

  // Sort logs in descending order (newest first)
  return logs.sort((a, b) => b.punchTime.localeCompare(a.punchTime));
}

/**
 * Summary Statistics for Biometric Device Logs
 */
export interface BiometricStats {
  totalPunches: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  totalBreaks: number;
  uniqueEmployees: number;
  flaggedPunches: number;
  syncRatePercentage: number;
  activeTerminals: number;
  totalTerminals: number;
}

export function getBiometricStats(logs: RawBiometricLog[]): BiometricStats {
  const total = logs.length;
  let checkIns = 0;
  let checkOuts = 0;
  let breaks = 0;
  let flagged = 0;
  const empSet = new Set<string>();

  logs.forEach(l => {
    empSet.add(l.empId);
    if (l.punchState === 'check_in') checkIns++;
    else if (l.punchState === 'check_out') checkOuts++;
    else breaks++;

    if (l.syncStatus === 'flagged') flagged++;
  });

  const syncRate = total > 0 ? Math.round(((total - flagged) / total) * 1000) / 10 : 100;

  return {
    totalPunches: total,
    totalCheckIns: checkIns,
    totalCheckOuts: checkOuts,
    totalBreaks: breaks,
    uniqueEmployees: empSet.size,
    flaggedPunches: flagged,
    syncRatePercentage: syncRate,
    activeTerminals: BIOMETRIC_TERMINALS.filter(t => t.status === 'online').length,
    totalTerminals: BIOMETRIC_TERMINALS.length,
  };
}

/**
 * Generate CSV and trigger browser download
 */
export function downloadBiometricLogsCSV(logs: RawBiometricLog[], filename = 'charu_biometric_device_logs_30days.csv') {
  const headers = [
    'Log ID',
    'Punch Timestamp',
    'Date',
    'Time',
    'Employee ID',
    'Employee Name',
    'Department',
    'Device ID',
    'Device Name',
    'Location',
    'IP Address',
    'Verification Mode',
    'Punch State',
    'Device Slot User ID',
    'Match Score (%)',
    'Sync Status',
    'Audit Notes',
  ];

  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.punchTime}"`,
    `"${l.dateKey}"`,
    `"${l.timeStr}"`,
    `"${l.empId}"`,
    `"${l.empNameEn} (${l.empNameBn})"`,
    `"${l.deptNameEn}"`,
    `"${l.deviceId}"`,
    `"${l.deviceNameEn}"`,
    `"${l.terminalLocationEn}"`,
    `"${l.ipAddress}"`,
    `"${l.verifyMode.toUpperCase()}"`,
    `"${l.punchState.replace('_', ' ').toUpperCase()}"`,
    `"${l.deviceUserId}"`,
    `"${l.matchScore}%"`,
    `"${l.syncStatus.toUpperCase()}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
