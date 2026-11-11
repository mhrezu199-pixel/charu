/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Live Attendance Data & Pure Chronological Logic
 * Conforms to User Request: "কে কার আগে ঢুকছে, কে কার পরে ঢুকছে"
 * Supports Employee, HOD, and Admin multi-perspective monitors.
 */

export type EmployeeCadre = 'officer' | 'worker' | 'casual';

export interface LiveAttendanceEntry {
  id: string;
  empId: string;
  deviceCode: string;
  nameEn: string;
  nameBn: string;
  photoUrl: string;
  deptId: string;
  deptNameEn: string;
  deptNameBn: string;
  sectionId: string;
  sectionNameEn: string;
  sectionNameBn: string;
  designationNameEn: string;
  designationNameBn: string;
  designationLevel: number;
  cadre: EmployeeCadre;
  shiftId: 'shiftA' | 'shiftB' | 'night' | 'general';
  shiftNameEn: string;
  shiftNameBn: string;
  shiftSchedule: string; // e.g. "06:00 - 14:00"
  inAt: string | null; // e.g. "05:48", chronological timestamp
  outAt: string | null;
  status: 'present' | 'late' | 'absent' | 'leave' | 'weeklyOff';
  isLate: boolean;
  lateMinutes: number;
  terminal: string; // Gate biometric device
  todayWorkedMinutes?: number;
  // Enhanced drilldown metadata for interactive stat cards
  monthlyLateDays?: number; // Total late arrivals this month (e.g., 3 days late)
  lateAdjustmentStatus?: 'none' | 'pending' | 'approved' | 'unapproved'; // Adjustment state
  lateAdjustmentNoteBn?: string;
  lateAdjustmentNoteEn?: string;
  leaveType?: 'sick' | 'casual' | 'earned' | 'maternity' | 'special';
  leaveTypeBn?: string;
  leaveTypeEn?: string;
  leaveReasonBn?: string;
  leaveReasonEn?: string;
  leaveDays?: number;
  absentNotice?: 'unnotified' | 'notified';
  absentDaysCount?: number;
  emergencyPhone?: string;
}

/**
 * Pure function: Classifies an employee's cadre based on designation level and employment type
 * Officer: level 1-5 (HOD, Manager, Asst Mgr, Supervisor, Officer)
 * Worker: level 6-7 (Senior Technician, Machine Operator)
 * Casual: level 8+ (Production Assistant, Helper, Casual/Contract)
 */
export function getEmployeeCadre(level: number, type?: string): EmployeeCadre {
  if (type === 'contract' || level >= 8) {
    return 'casual';
  }
  if (level <= 5) {
    return 'officer';
  }
  return 'worker';
}

/**
 * Pure function: Sorts records in chronological arrival order ("কে কার আগে ঢুকছে, কে কার পরে ঢুকছে")
 * Records with valid inAt come first, sorted ascending by time string (e.g. 05:48 < 05:52 < 07:45).
 * Absent/unpunched records are placed at the end.
 */
export function sortChronologicalArrivals(entries: LiveAttendanceEntry[]): Array<LiveAttendanceEntry & { rank: number | null }> {
  const arrived = entries
    .filter(e => e.inAt !== null && e.inAt !== undefined && e.inAt.trim() !== '')
    .sort((a, b) => (a.inAt || '').localeCompare(b.inAt || ''));

  const pendingOrAbsent = entries.filter(
    e => e.inAt === null || e.inAt === undefined || e.inAt.trim() === ''
  );

  const rankedArrived = arrived.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  const unrankedPending = pendingOrAbsent.map(entry => ({
    ...entry,
    rank: null,
  }));

  return [...rankedArrived, ...unrankedPending];
}

/**
 * Pure function: Calculates live headcount statistics
 */
export function calculateLiveHeadcount(entries: LiveAttendanceEntry[]) {
  const totalExpected = entries.length;
  const presentCount = entries.filter(e => e.inAt !== null && e.inAt !== '').length;
  const lateCount = entries.filter(e => e.isLate).length;
  const onTimeCount = entries.filter(e => e.inAt !== null && !e.isLate).length;
  const absentCount = entries.filter(e => e.status === 'absent' || (!e.inAt && e.status !== 'leave' && e.status !== 'weeklyOff')).length;
  const leaveCount = entries.filter(e => e.status === 'leave').length;
  const attendanceRate = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0;

  return {
    totalExpected,
    presentCount,
    lateCount,
    onTimeCount,
    absentCount,
    leaveCount,
    attendanceRate,
  };
}

export type AttendanceMetricCategory = 'all' | 'present' | 'late' | 'leave' | 'absent';

/**
 * Pure function: Filters live attendance entries by selected drilldown metric category
 */
export function filterEntriesByCategory(
  entries: LiveAttendanceEntry[],
  category: AttendanceMetricCategory
): LiveAttendanceEntry[] {
  switch (category) {
    case 'present':
      return entries.filter(e => e.inAt !== null && e.inAt !== '');
    case 'late':
      return entries.filter(e => e.isLate);
    case 'leave':
      return entries.filter(e => e.status === 'leave');
    case 'absent':
      return entries.filter(e => e.status === 'absent' || (!e.inAt && e.status !== 'leave' && e.status !== 'weeklyOff'));
    case 'all':
    default:
      return entries;
  }
}

/**
 * Pure function: Calculates Late Drilldown Analytics
 */
export function calculateLateAnalytics(entries: LiveAttendanceEntry[]) {
  const lateEntries = entries.filter(e => e.isLate);
  const totalLate = lateEntries.length;
  const totalMinutes = lateEntries.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);
  const avgLateMinutes = totalLate > 0 ? Math.round(totalMinutes / totalLate) : 0;
  const maxLateMinutes = lateEntries.reduce((max, curr) => Math.max(max, curr.lateMinutes || 0), 0);
  const pendingAdjustments = lateEntries.filter(e => e.lateAdjustmentStatus === 'pending').length;
  const unapprovedLate = lateEntries.filter(e => e.lateAdjustmentStatus === 'unapproved').length;
  const approvedLate = lateEntries.filter(e => e.lateAdjustmentStatus === 'approved').length;

  return {
    totalLate,
    avgLateMinutes,
    maxLateMinutes,
    pendingAdjustments,
    unapprovedLate,
    approvedLate,
  };
}

/**
 * Pure function: Calculates Leave Drilldown Analytics
 */
export function calculateLeaveAnalytics(entries: LiveAttendanceEntry[]) {
  const leaveEntries = entries.filter(e => e.status === 'leave');
  const totalLeave = leaveEntries.length;
  const sickLeave = leaveEntries.filter(e => e.leaveType === 'sick').length;
  const casualLeave = leaveEntries.filter(e => e.leaveType === 'casual').length;
  const earnedLeave = leaveEntries.filter(e => e.leaveType === 'earned').length;
  const maternityLeave = leaveEntries.filter(e => e.leaveType === 'maternity').length;
  const otherLeave = totalLeave - (sickLeave + casualLeave + earnedLeave + maternityLeave);

  return {
    totalLeave,
    sickLeave,
    casualLeave,
    earnedLeave,
    maternityLeave,
    otherLeave,
  };
}

/**
 * Pure function: Calculates Absent Drilldown Analytics
 */
export function calculateAbsentAnalytics(entries: LiveAttendanceEntry[]) {
  const absentEntries = entries.filter(
    e => e.status === 'absent' || (!e.inAt && e.status !== 'leave' && e.status !== 'weeklyOff')
  );
  const totalAbsent = absentEntries.length;
  const unnotified = absentEntries.filter(e => e.absentNotice === 'unnotified').length;
  const notified = absentEntries.filter(e => e.absentNotice === 'notified').length;

  return {
    totalAbsent,
    unnotified,
    notified,
  };
}

/**
 * 8 Official Charu Ceramic Factory Departments
 */
export interface FactoryDepartmentMeta {
  id: string;
  nameBn: string;
  nameEn: string;
  colorClass: string;
  badgeBg: string;
}

export const FACTORY_DEPARTMENTS: FactoryDepartmentMeta[] = [
  { id: 'casting', nameBn: 'কাস্টিং ও মোল্ডিং', nameEn: 'Casting & Moulding', colorClass: 'text-amber-700', badgeBg: 'bg-amber-100' },
  { id: 'glazing', nameBn: 'গ্লেজিং ও সারফেস টেক', nameEn: 'Glazing & Surface Tech', colorClass: 'text-cyan-700', badgeBg: 'bg-cyan-100' },
  { id: 'kiln', nameBn: 'কিলন ও ফায়ারিং', nameEn: 'Kiln & Firing', colorClass: 'text-rose-700', badgeBg: 'bg-rose-100' },
  { id: 'packing', nameBn: 'বাছাই ও প্যাকেজিং', nameEn: 'Sorting & Packing', colorClass: 'text-emerald-700', badgeBg: 'bg-emerald-100' },
  { id: 'qa', nameBn: 'গুণমান নিয়ন্ত্রণ (QA)', nameEn: 'Quality Assurance', colorClass: 'text-blue-700', badgeBg: 'bg-blue-100' },
  { id: 'maintenance', nameBn: 'প্রকৌশল ও রক্ষণাবেক্ষণ', nameEn: 'Maintenance & Eng', colorClass: 'text-purple-700', badgeBg: 'bg-purple-100' },
  { id: 'hr', nameBn: 'এইচআর ও প্রশাসন', nameEn: 'HR & Administration', colorClass: 'text-slate-800', badgeBg: 'bg-slate-200' },
  { id: 'accounts', nameBn: 'হিসাব ও অর্থ', nameEn: 'Accounts & Finance', colorClass: 'text-teal-700', badgeBg: 'bg-teal-100' },
];

export interface AdminDashboardFilterCriteria {
  department: string; // 'all' or specific department
  shift: string; // 'all' or 'shiftA' | 'shiftB' | 'night' | 'general'
  cadre: string; // 'all' or 'officer' | 'worker' | 'casual'
  searchQuery?: string;
  dateKey?: string; // e.g. '2026-10-30'
}

/**
 * Pure function: Filters entries dynamically based on Admin criteria
 */
export function filterAdminLiveAttendance(
  entries: LiveAttendanceEntry[],
  filters: AdminDashboardFilterCriteria
): LiveAttendanceEntry[] {
  return entries.filter(entry => {
    // Shift filter
    if (filters.shift !== 'all' && entry.shiftId !== filters.shift) return false;

    // Dept / Section filter
    if (filters.department !== 'all') {
      if (entry.deptId !== filters.department && entry.sectionId !== filters.department) {
        return false;
      }
    }

    // Cadre filter
    if (filters.cadre !== 'all' && entry.cadre !== filters.cadre) return false;

    // Search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const match =
        entry.nameEn.toLowerCase().includes(q) ||
        entry.nameBn.includes(q) ||
        entry.empId.includes(q) ||
        entry.deviceCode.includes(q) ||
        (entry.terminal && entry.terminal.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

export interface AdminDailySummary {
  isTotalOverview: boolean;
  totalExpected: number;
  presentCount: number;
  attendanceRate: number;
  onTimeCount: number;
  onTimeRate: number;
  lateCount: number;
  lateRate: number;
  leaveCount: number;
  leaveRate: number;
  leaveBreakdown: {
    sick: number;
    casual: number;
    earned: number;
    maternity: number;
    other: number;
  };
  absentCount: number;
  absentRate: number;
  totalWorkedMinutes: number;
  totalWorkedHours: number;
  overtimeMinutesEst: number;
  overtimeHoursEst: number;
  shiftCounts: {
    shiftA: { total: number; present: number };
    shiftB: { total: number; present: number };
    night: { total: number; present: number };
    general: { total: number; present: number };
  };
  cadreCounts: {
    officer: { total: number; present: number };
    worker: { total: number; present: number };
    casual: { total: number; present: number };
  };
  departmentStats: Array<{
    deptId: string;
    nameBn: string;
    nameEn: string;
    total: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    attendanceRate: number;
  }>;
}

/**
 * Pure function: Calculates the Admin Per-Day Daily Summary
 * When no filter is active, presents the total 100% factory overview.
 * When filtered, accurately recalculates all metrics and breakdowns for that specific slice.
 */
export function calculateAdminDailySummary(
  filteredEntries: LiveAttendanceEntry[],
  allFactoryEntries: LiveAttendanceEntry[]
): AdminDailySummary {
  const isTotalOverview = filteredEntries.length === allFactoryEntries.length;
  const totalExpected = filteredEntries.length;
  const presentCount = filteredEntries.filter(e => e.inAt !== null && e.inAt !== '').length;
  const attendanceRate = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0;

  const onTimeCount = filteredEntries.filter(e => e.inAt !== null && !e.isLate).length;
  const onTimeRate = totalExpected > 0 ? Math.round((onTimeCount / totalExpected) * 100) : 0;

  const lateCount = filteredEntries.filter(e => e.isLate).length;
  const lateRate = totalExpected > 0 ? Math.round((lateCount / totalExpected) * 100) : 0;

  const leaveCount = filteredEntries.filter(e => e.status === 'leave').length;
  const leaveRate = totalExpected > 0 ? Math.round((leaveCount / totalExpected) * 100) : 0;

  const leaveBreakdown = {
    sick: filteredEntries.filter(e => e.status === 'leave' && e.leaveType === 'sick').length,
    casual: filteredEntries.filter(e => e.status === 'leave' && e.leaveType === 'casual').length,
    earned: filteredEntries.filter(e => e.status === 'leave' && e.leaveType === 'earned').length,
    maternity: filteredEntries.filter(e => e.status === 'leave' && e.leaveType === 'maternity').length,
    other: 0,
  };
  leaveBreakdown.other =
    leaveCount -
    (leaveBreakdown.sick + leaveBreakdown.casual + leaveBreakdown.earned + leaveBreakdown.maternity);

  const absentCount = filteredEntries.filter(
    e => e.status === 'absent' || (!e.inAt && e.status !== 'leave' && e.status !== 'weeklyOff')
  ).length;
  const absentRate = totalExpected > 0 ? Math.round((absentCount / totalExpected) * 100) : 0;

  const totalWorkedMinutes = filteredEntries.reduce(
    (sum, e) => sum + (e.todayWorkedMinutes || (e.inAt ? 480 : 0)),
    0
  );
  const totalWorkedHours = Number((totalWorkedMinutes / 60).toFixed(1));

  // Estimate OT: worked over 480m (8 hours)
  const overtimeMinutesEst = filteredEntries.reduce((sum, e) => {
    const worked = e.todayWorkedMinutes || (e.inAt ? 480 : 0);
    return sum + (worked > 480 ? worked - 480 : 0);
  }, 0);
  const overtimeHoursEst = Number((overtimeMinutesEst / 60).toFixed(1));

  // Shifts
  const shiftCounts = {
    shiftA: {
      total: filteredEntries.filter(e => e.shiftId === 'shiftA').length,
      present: filteredEntries.filter(e => e.shiftId === 'shiftA' && e.inAt !== null && e.inAt !== '').length,
    },
    shiftB: {
      total: filteredEntries.filter(e => e.shiftId === 'shiftB').length,
      present: filteredEntries.filter(e => e.shiftId === 'shiftB' && e.inAt !== null && e.inAt !== '').length,
    },
    night: {
      total: filteredEntries.filter(e => e.shiftId === 'night').length,
      present: filteredEntries.filter(e => e.shiftId === 'night' && e.inAt !== null && e.inAt !== '').length,
    },
    general: {
      total: filteredEntries.filter(e => e.shiftId === 'general').length,
      present: filteredEntries.filter(e => e.shiftId === 'general' && e.inAt !== null && e.inAt !== '').length,
    },
  };

  // Cadre
  const cadreCounts = {
    officer: {
      total: filteredEntries.filter(e => e.cadre === 'officer').length,
      present: filteredEntries.filter(e => e.cadre === 'officer' && e.inAt !== null && e.inAt !== '').length,
    },
    worker: {
      total: filteredEntries.filter(e => e.cadre === 'worker').length,
      present: filteredEntries.filter(e => e.cadre === 'worker' && e.inAt !== null && e.inAt !== '').length,
    },
    casual: {
      total: filteredEntries.filter(e => e.cadre === 'casual').length,
      present: filteredEntries.filter(e => e.cadre === 'casual' && e.inAt !== null && e.inAt !== '').length,
    },
  };

  // Department Breakdown (computed across entries)
  const departmentStats = FACTORY_DEPARTMENTS.map(dept => {
    const inDept = filteredEntries.filter(e => e.deptId === dept.id || e.sectionId === dept.id);
    const inDeptPresent = inDept.filter(e => e.inAt !== null && e.inAt !== '').length;
    const inDeptLate = inDept.filter(e => e.isLate).length;
    const inDeptAbsent = inDept.filter(
      e => e.status === 'absent' || (!e.inAt && e.status !== 'leave' && e.status !== 'weeklyOff')
    ).length;
    const inDeptLeave = inDept.filter(e => e.status === 'leave').length;
    const rate = inDept.length > 0 ? Math.round((inDeptPresent / inDept.length) * 100) : 0;

    return {
      deptId: dept.id,
      nameBn: dept.nameBn,
      nameEn: dept.nameEn,
      total: inDept.length,
      present: inDeptPresent,
      late: inDeptLate,
      absent: inDeptAbsent,
      leave: inDeptLeave,
      attendanceRate: rate,
    };
  });

  return {
    isTotalOverview,
    totalExpected,
    presentCount,
    attendanceRate,
    onTimeCount,
    onTimeRate,
    lateCount,
    lateRate,
    leaveCount,
    leaveRate,
    leaveBreakdown,
    absentCount,
    absentRate,
    totalWorkedMinutes,
    totalWorkedHours,
    overtimeMinutesEst,
    overtimeHoursEst,
    shiftCounts,
    cadreCounts,
    departmentStats,
  };
}

/**
 * Pure function: Generates clear description label for current filter state
 */
export function getAdminFilterLabel(
  filters: AdminDashboardFilterCriteria,
  locale: 'bn' | 'en'
): { isFiltered: boolean; badgeTitle: string; subtitle: string } {
  const isFiltered =
    filters.department !== 'all' ||
    filters.shift !== 'all' ||
    filters.cadre !== 'all' ||
    !!(filters.searchQuery && filters.searchQuery.trim());

  if (!isFiltered) {
    return {
      isFiltered: false,
      badgeTitle:
        locale === 'bn'
          ? '🏢 সম্পূর্ণ কারখানার সামগ্রিক দৈনিক সারাংশ'
          : '🏢 Factory Overall Daily Summary',
      subtitle:
        locale === 'bn'
          ? '৮টি প্রধান বিভাগ ও ৪টি শিফটের মোট সামগ্রিক পরিসংখ্যান'
          : 'Total aggregated metrics across all 8 factory departments and 4 shifts',
    };
  }

  const deptMeta = FACTORY_DEPARTMENTS.find(d => d.id === filters.department);
  const deptName = deptMeta
    ? locale === 'bn'
      ? deptMeta.nameBn
      : deptMeta.nameEn
    : filters.department === 'all'
    ? locale === 'bn'
      ? 'সকল বিভাগ'
      : 'All Departments'
    : filters.department;

  const shiftLabels: Record<string, { bn: string; en: string }> = {
    shiftA: { bn: 'মর্নিং শিফট এ', en: 'Shift A (Morning)' },
    shiftB: { bn: 'ইভনিং শিফট বি', en: 'Shift B (Evening)' },
    night: { bn: 'নাইট রোস্টার', en: 'Night Roster' },
    general: { bn: 'জেনারেল শিফট', en: 'General Shift' },
  };
  const shiftName =
    filters.shift !== 'all'
      ? locale === 'bn'
        ? shiftLabels[filters.shift]?.bn
        : shiftLabels[filters.shift]?.en
      : null;

  const cadreLabels: Record<string, { bn: string; en: string }> = {
    officer: { bn: 'কর্মকর্তা', en: 'Officers' },
    worker: { bn: 'স্থায়ী শ্রমিক', en: 'Workers' },
    casual: { bn: 'চুক্তিভিত্তিক', en: 'Contract' },
  };
  const cadreName =
    filters.cadre !== 'all'
      ? locale === 'bn'
        ? cadreLabels[filters.cadre]?.bn
        : cadreLabels[filters.cadre]?.en
      : null;

  const parts = [deptName, shiftName, cadreName].filter(Boolean);

  return {
    isFiltered: true,
    badgeTitle:
      locale === 'bn'
        ? `🔍 ফিল্টারকৃত সেকশন ভিউ: ${parts.join(' · ')}`
        : `🔍 Filtered View: ${parts.join(' · ')}`,
    subtitle:
      locale === 'bn'
        ? 'নির্বাচিত ফিল্টার অনুযায়ী সমস্ত মেট্রিক্স ও তালিকা রিয়েলটাইমে আপডেট হয়েছে'
        : 'All metrics and arrival logs updated according to selected filters',
  };
}

/**
 * Rich seed of today's live factory attendance logs (Date: 2026-10-30)
 * Realistic ceramic industry factory scenario with 24-hour operation (Shifts A, B, Night, General)
 */
export const TODAY_LIVE_ATTENDANCE: LiveAttendanceEntry[] = [
  // 1. First early bird arrival at 05:45 AM (Shift A)
  {
    id: 'live-01',
    empId: '20088',
    deviceCode: '1088',
    nameEn: 'Shahin Alam',
    nameBn: 'শাহিন আলম',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    deptId: 'glazing',
    deptNameEn: 'Glazing & Surface Tech',
    deptNameBn: 'গ্লেজিং ও সারফেস টেক',
    sectionId: 'spray-line',
    sectionNameEn: 'Automated Spray Line',
    sectionNameBn: 'অটোমেটেড স্প্রে লাইন',
    designationNameEn: 'Machine Operator',
    designationNameBn: 'মেশিন অপারেটর',
    designationLevel: 7,
    cadre: 'worker',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: '05:45',
    outAt: '14:02',
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ১ (মেইন গেট)',
    todayWorkedMinutes: 497,
  },
  // 2. Second arrival at 05:49 AM
  {
    id: 'live-02',
    empId: '20187',
    deviceCode: '1187',
    nameEn: 'Subrata Chakma',
    nameBn: 'সুব্রত চাকমা',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-2',
    sectionNameEn: 'Production Line 2',
    sectionNameBn: 'প্রোডাকশন লাইন ২',
    designationNameEn: 'Casting Tech',
    designationNameBn: 'কাস্টিং টেকনিশিয়ান',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: '05:49',
    outAt: '14:05',
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 496,
  },
  // 3. Third arrival at 05:52 AM
  {
    id: 'live-03',
    empId: '20195',
    deviceCode: '1195',
    nameEn: 'Md. Dulal Mia',
    nameBn: 'মোঃ দুলাল মিয়া',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-1',
    sectionNameEn: 'Production Line 1',
    sectionNameBn: 'প্রোডাকশন লাইন ১',
    designationNameEn: 'Senior Mould Specialist',
    designationNameBn: 'সিনিয়র মোল্ডিং কর্মী',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: '05:52',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 520,
  },
  // 4. Fourth arrival at 05:58 AM (Supervisor Shift A)
  {
    id: 'live-04',
    empId: '10011',
    deviceCode: '1011',
    nameEn: 'Kabir Ahmed',
    nameBn: 'কবীর আহমেদ',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-1',
    sectionNameEn: 'Production Line 1',
    sectionNameBn: 'প্রোডাকশন লাইন ১',
    designationNameEn: 'Section Supervisor',
    designationNameBn: 'সেকশন সুপারভাইজার',
    designationLevel: 4,
    cadre: 'officer',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: '05:58',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ১ (মেইন গেট)',
    todayWorkedMinutes: 510,
  },
  // 5. Fifth arrival at 06:12 AM (Shift A Late - 12m late)
  {
    id: 'live-05',
    empId: '20140',
    deviceCode: '1140',
    nameEn: 'Rashidul Islam',
    nameBn: 'রাশিদুল ইসলাম',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-3',
    sectionNameEn: 'Production Line 3',
    sectionNameBn: 'প্রোডাকশন লাইন ৩',
    designationNameEn: 'Production Assistant',
    designationNameBn: 'উৎপাদন সহকারী',
    designationLevel: 8,
    cadre: 'casual',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: '06:12',
    outAt: null,
    status: 'late',
    isLate: true,
    lateMinutes: 12,
    monthlyLateDays: 3,
    lateAdjustmentStatus: 'pending',
    lateAdjustmentNoteBn: 'ট্রেন বিলম্বের জন্য আবেদন জমা দেওয়া হয়েছে (অনুমোদন প্রক্রিয়াধীন)',
    lateAdjustmentNoteEn: 'Adjustment request submitted due to train delay (Pending)',
    emergencyPhone: '01711-223344',
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 495,
  },
  // 6. General Shift arrival at 07:42 AM (Early Bird for General)
  {
    id: 'live-06',
    empId: '10001',
    deviceCode: '1001',
    nameEn: 'Farhana Akter',
    nameBn: 'ফারহানা আক্তার',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    deptId: 'hr',
    deptNameEn: 'HR & Administration',
    deptNameBn: 'এইচআর ও প্রশাসন',
    sectionId: 'hr',
    sectionNameEn: 'HR Operations',
    sectionNameBn: 'এইচআর অপারেশনস',
    designationNameEn: 'HR Manager',
    designationNameBn: 'এইচআর ম্যানেজার',
    designationLevel: 2,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '07:42',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ১ (এডমিন গেট)',
    todayWorkedMinutes: 420,
  },
  // 7. Arrival at 07:48 AM
  {
    id: 'live-07',
    empId: '10009',
    deviceCode: '1009',
    nameEn: 'Engr. Mofizur Rahman',
    nameBn: 'প্রকৌঃ মফিজুর রহমান',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    deptId: 'maintenance',
    deptNameEn: 'Engineering & Maintenance',
    deptNameBn: 'প্রকৌশল ও রক্ষণাবেক্ষণ',
    sectionId: 'mechanical',
    sectionNameEn: 'Mechanical & Power',
    sectionNameBn: 'মেকানিক্যাল ও পাওয়ার',
    designationNameEn: 'Head of Maintenance',
    designationNameBn: 'রক্ষণাবেক্ষণ প্রধান',
    designationLevel: 1,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '07:48',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ২ (ওয়ার্কশপ গেট)',
    todayWorkedMinutes: 415,
  },
  // 8. Arrival at 07:50 AM
  {
    id: 'live-08',
    empId: '10012',
    deviceCode: '1012',
    nameEn: 'Kamal Hossain',
    nameBn: 'কামাল হোসেন',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-2',
    sectionNameEn: 'Production Line 2',
    sectionNameBn: 'প্রোডাকশন লাইন ২',
    designationNameEn: 'Section Supervisor',
    designationNameBn: 'সেকশন সুপারভাইজার',
    designationLevel: 4,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '07:50',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 412,
  },
  // 9. Arrival at 07:52 AM
  {
    id: 'live-09',
    empId: '10008',
    deviceCode: '1008',
    nameEn: 'Dr. Shahana Parveen',
    nameBn: 'ড. শাহানা পারভীন',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    deptId: 'qa',
    deptNameEn: 'Quality Assurance',
    deptNameBn: 'গুণমান নিয়ন্ত্রণ (QA)',
    sectionId: 'qa-lab',
    sectionNameEn: 'Quality Testing Lab',
    sectionNameBn: 'কোয়ালিটি টেস্টিং ল্যাব',
    designationNameEn: 'QA Manager',
    designationNameBn: 'কিউএ ম্যানেজার',
    designationLevel: 2,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '07:52',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ১ (এডমিন গেট)',
    todayWorkedMinutes: 410,
  },
  // 10. Arrival at 07:55 AM (Casting HOD)
  {
    id: 'live-10',
    empId: '10003',
    deviceCode: '1003',
    nameEn: 'Engr. Tariqul Islam',
    nameBn: 'প্রকৌঃ তারিকুল ইসলাম',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-1',
    sectionNameEn: 'Production Line 1',
    sectionNameBn: 'প্রোডাকশন লাইন ১',
    designationNameEn: 'Head of Casting',
    designationNameBn: 'বিভাগীয় প্রধান (কাস্টিং)',
    designationLevel: 1,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '07:55',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 405,
  },
  // 11. Arrival at 07:58 AM (Electrical Maintenance)
  {
    id: 'live-11',
    empId: '20186',
    deviceCode: '1186',
    nameEn: 'Jasim Uddin',
    nameBn: 'জসিম উদ্দিন',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
    deptId: 'maintenance',
    deptNameEn: 'Engineering & Maintenance',
    deptNameBn: 'প্রকৌশল ও রক্ষণাবেক্ষণ',
    sectionId: 'electrical',
    sectionNameEn: 'Electrical Maintenance',
    sectionNameBn: 'ইলেকট্রিক্যাল মেইনটেন্যান্স',
    designationNameEn: 'Electrical Specialist',
    designationNameBn: 'ইলেকট্রিক্যাল স্পেশালিস্ট',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '07:58',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ২ (ওয়ার্কশপ গেট)',
    todayWorkedMinutes: 402,
  },
  // 12. Arrival at 08:04 AM (QA Inspector - On time within 10m grace)
  {
    id: 'live-12',
    empId: '20174',
    deviceCode: '1174',
    nameEn: 'Al-Amin Sheikh',
    nameBn: 'আল-আমিন শেখ',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    deptId: 'qa',
    deptNameEn: 'Quality Assurance',
    deptNameBn: 'গুণমান নিয়ন্ত্রণ (QA)',
    sectionId: 'qa-line',
    sectionNameEn: 'Line Inspection',
    sectionNameBn: 'লাইন ইন্সপেকশন',
    designationNameEn: 'QA Inspector',
    designationNameBn: 'কিউএ ইন্সপেক্টর',
    designationLevel: 5,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '08:04',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ১ (এডমিন গেট)',
    todayWorkedMinutes: 395,
  },
  // 13. Arrival at 08:11 AM (Md. Rahim Uddin - 11 minutes late)
  {
    id: 'live-13',
    empId: '20045',
    deviceCode: '1045',
    nameEn: 'Md. Rahim Uddin',
    nameBn: 'মোঃ রহিম উদ্দিন',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-3',
    sectionNameEn: 'Production Line 3',
    sectionNameBn: 'প্রোডাকশন লাইন ৩',
    designationNameEn: 'Casting Tech',
    designationNameBn: 'কাস্টিং টেকনিশিয়ান',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '08:11',
    outAt: null,
    status: 'late',
    isLate: true,
    lateMinutes: 11,
    monthlyLateDays: 2,
    lateAdjustmentStatus: 'pending',
    lateAdjustmentNoteBn: 'কোম্পানি বাস জ্যামে পড়ার কারণে আবেদন প্রক্রিয়াধীন',
    lateAdjustmentNoteEn: 'Late due to company bus traffic jam (Adjustment Pending)',
    emergencyPhone: '01811-334455',
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 388,
  },
  // 14. Arrival at 08:16 AM (Accounts Executive - Late 16m)
  {
    id: 'live-14',
    empId: '30015',
    deviceCode: '3015',
    nameEn: 'Ashraful Alam',
    nameBn: 'আশরাফুল আলম',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    deptId: 'accounts',
    deptNameEn: 'Accounts & Finance',
    deptNameBn: 'হিসাব ও অর্থ',
    sectionId: 'finance',
    sectionNameEn: 'Payroll & Accounts',
    sectionNameBn: 'পে-রোল ও অ্যাকাউন্টস',
    designationNameEn: 'Accounts Officer',
    designationNameBn: 'অ্যাকাউন্টস অফিসার',
    designationLevel: 5,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '08:16',
    outAt: null,
    status: 'late',
    isLate: true,
    lateMinutes: 16,
    monthlyLateDays: 4,
    lateAdjustmentStatus: 'unapproved',
    lateAdjustmentNoteBn: 'অননুমোদিত লেট — কোনো অ্যাডজাস্টমেন্ট আবেদন করা হয়নি (বেতন সমন্বয় সতর্কবার্তা)',
    lateAdjustmentNoteEn: 'Unapproved late — No adjustment submitted (Salary deduction warning)',
    emergencyPhone: '01911-445566',
    terminal: 'টার্মিনাল ১ (এডমিন গেট)',
    todayWorkedMinutes: 380,
  },
  // 15. Evening Shift B arrival at 13:42 PM (Early Bird Shift B)
  {
    id: 'live-15',
    empId: '20130',
    deviceCode: '1130',
    nameEn: 'Mehedi Hasan',
    nameBn: 'মেহেদী হাসান',
    photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=250&q=80',
    deptId: 'packing',
    deptNameEn: 'Sorting & Packing',
    deptNameBn: 'বাছাই ও প্যাকেজিং',
    sectionId: 'pack-auto',
    sectionNameEn: 'Auto Packaging Unit',
    sectionNameBn: 'অটো প্যাকেজিং ইউনিট',
    designationNameEn: 'Packing Operator',
    designationNameBn: 'প্যাকিং অপারেটর',
    designationLevel: 7,
    cadre: 'worker',
    shiftId: 'shiftB',
    shiftNameEn: 'Evening Shift B',
    shiftNameBn: 'ইভনিং শিফট বি',
    shiftSchedule: '14:00 - 22:00',
    inAt: '13:42',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৪ (প্যাকেজিং গেট)',
    todayWorkedMinutes: 120,
  },
  // 16. Evening Shift B arrival at 13:48 PM
  {
    id: 'live-16',
    empId: '20173',
    deviceCode: '1173',
    nameEn: 'Nazmul Hossain',
    nameBn: 'নাজমুল হোসেন',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-2',
    sectionNameEn: 'Production Line 2',
    sectionNameBn: 'প্রোডাকশন লাইন ২',
    designationNameEn: 'Mould Specialist',
    designationNameBn: 'মোল্ড স্পেশালিস্ট',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'shiftB',
    shiftNameEn: 'Evening Shift B',
    shiftNameBn: 'ইভনিং শিফট বি',
    shiftSchedule: '14:00 - 22:00',
    inAt: '13:48',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
    todayWorkedMinutes: 114,
  },
  // 17. Evening Shift B arrival at 13:54 PM (Assistant Casual)
  {
    id: 'live-17',
    empId: '20188',
    deviceCode: '1188',
    nameEn: 'Mong Marma',
    nameBn: 'মং মারমা',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    deptId: 'packing',
    deptNameEn: 'Sorting & Packing',
    deptNameBn: 'বাছাই ও প্যাকেজিং',
    sectionId: 'pack-auto',
    sectionNameEn: 'Auto Packaging Unit',
    sectionNameBn: 'অটো প্যাকেজিং ইউনিট',
    designationNameEn: 'Packaging Assistant',
    designationNameBn: 'প্যাকেজিং সহকারী',
    designationLevel: 8,
    cadre: 'casual',
    shiftId: 'shiftB',
    shiftNameEn: 'Evening Shift B',
    shiftNameBn: 'ইভনিং শিফট বি',
    shiftSchedule: '14:00 - 22:00',
    inAt: '13:54',
    outAt: null,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    terminal: 'টার্মিনাল ৪ (প্যাকেজিং গেট)',
    todayWorkedMinutes: 108,
  },
  // 18. Evening Shift B arrival at 14:15 PM (Late 15m)
  {
    id: 'live-18',
    empId: '20196',
    deviceCode: '1196',
    nameEn: 'Habibur Rahman',
    nameBn: 'হাবিবুর রহমান',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
    deptId: 'glazing',
    deptNameEn: 'Glazing & Surface Tech',
    deptNameBn: 'গ্লেজিং ও সারফেস টেক',
    sectionId: 'spray-line',
    sectionNameEn: 'Automated Spray Line',
    sectionNameBn: 'অটোমেটেড স্প্রে লাইন',
    designationNameEn: 'Glaze Spray Operator',
    designationNameBn: 'গ্লেজ স্প্রে অপারেটর',
    designationLevel: 7,
    cadre: 'worker',
    shiftId: 'shiftB',
    shiftNameEn: 'Evening Shift B',
    shiftNameBn: 'ইভনিং শিফট বি',
    shiftSchedule: '14:00 - 22:00',
    inAt: '14:15',
    outAt: null,
    status: 'late',
    isLate: true,
    lateMinutes: 15,
    monthlyLateDays: 1,
    lateAdjustmentStatus: 'approved',
    lateAdjustmentNoteBn: 'জরুরি কাজের চাপে দেরি — এইচওডি কর্তৃক অনুমোদিত',
    lateAdjustmentNoteEn: 'Late due to handover delay — Approved by HOD',
    emergencyPhone: '01511-556677',
    terminal: 'টার্মিনাল ১ (মেইন গেট)',
    todayWorkedMinutes: 92,
  },
  // 19. Night Shift (22:00 - 06:00) - Unnotified Absent
  {
    id: 'live-19',
    empId: '20115',
    deviceCode: '1115',
    nameEn: 'Jahangir Hossain',
    nameBn: 'জাহাঙ্গীর হোসেন',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    deptId: 'kiln',
    deptNameEn: 'Kiln & Firing',
    deptNameBn: 'কিলন ও ফায়ারিং',
    sectionId: 'kiln-tunnel',
    sectionNameEn: 'Tunnel Kiln #1',
    sectionNameBn: 'টানেল কিলন ১',
    designationNameEn: 'Kiln Controller',
    designationNameBn: 'কিলন কন্ট্রোলার',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'night',
    shiftNameEn: 'Night Roster',
    shiftNameBn: 'নাইট রোস্টার',
    shiftSchedule: '22:00 - 06:00',
    inAt: null,
    outAt: null,
    status: 'absent',
    isLate: false,
    lateMinutes: 0,
    absentNotice: 'unnotified',
    absentDaysCount: 1,
    emergencyPhone: '01744-334455',
    terminal: 'টার্মিনাল ৫ (কিলন গেট)',
  },
  // 20. Night Shift Supervisor - Pre-notified Absent
  {
    id: 'live-20',
    empId: '20197',
    deviceCode: '1197',
    nameEn: 'Tajul Islam',
    nameBn: 'তাজুল ইসলাম',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    deptId: 'kiln',
    deptNameEn: 'Kiln & Firing',
    deptNameBn: 'কিলন ও ফায়ারিং',
    sectionId: 'kiln-tunnel',
    sectionNameEn: 'Tunnel Kiln #1',
    sectionNameBn: 'টানেল কিলন ১',
    designationNameEn: 'Kiln Shift Supervisor',
    designationNameBn: 'কিলন শিফট সুপারভাইজার',
    designationLevel: 4,
    cadre: 'officer',
    shiftId: 'night',
    shiftNameEn: 'Night Roster',
    shiftNameBn: 'নাইট রোস্টার',
    shiftSchedule: '22:00 - 06:00',
    inAt: null,
    outAt: null,
    status: 'absent',
    isLate: false,
    lateMinutes: 0,
    absentNotice: 'notified',
    absentDaysCount: 1,
    emergencyPhone: '01844-445566',
    terminal: 'টার্মিনাল ৫ (কিলন গেট)',
  },
  // 21. Casual worker absent in Shift A (Unnotified 2 consecutive days)
  {
    id: 'live-21',
    empId: '20102',
    deviceCode: '1102',
    nameEn: 'Anowar Parvez',
    nameBn: 'আনোয়ার পারভেজ',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-1',
    sectionNameEn: 'Production Line 1',
    sectionNameBn: 'প্রোডাকশন লাইন ১',
    designationNameEn: 'Casting Operator',
    designationNameBn: 'কাস্টিং অপারেটর',
    designationLevel: 7,
    cadre: 'worker',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: null,
    outAt: null,
    status: 'absent',
    isLate: false,
    lateMinutes: 0,
    absentNotice: 'unnotified',
    absentDaysCount: 2,
    emergencyPhone: '01944-556677',
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
  },
  // 22. Employee on approved medical leave today (Sick Leave SL)
  {
    id: 'live-22',
    empId: '20172',
    deviceCode: '1172',
    nameEn: 'Sumon Mia',
    nameBn: 'সুমন মিয়া',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
    deptId: 'glazing',
    deptNameEn: 'Glazing & Surface Tech',
    deptNameBn: 'গ্লেজিং ও সারফেস টেক',
    sectionId: 'spray-line',
    sectionNameEn: 'Automated Spray Line',
    sectionNameBn: 'অটোমেটেড স্প্রে লাইন',
    designationNameEn: 'Spray Technician',
    designationNameBn: 'স্প্রে টেকনিশিয়ান',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: null,
    outAt: null,
    status: 'leave',
    isLate: false,
    lateMinutes: 0,
    leaveType: 'sick',
    leaveTypeBn: 'অসুস্থতাজনিত ছুটি (SL)',
    leaveTypeEn: 'Sick Leave (SL)',
    leaveReasonBn: 'মৌসুমি তীব্র জ্বর ও চিকিৎসকের ৩ দিন বিশ্রাম পরামর্শ (প্রেসক্রিপশন আপলোডকৃত)',
    leaveReasonEn: 'Severe seasonal fever with medical rest prescription',
    leaveDays: 3,
    emergencyPhone: '01733-889900',
    terminal: 'অনুমোদিত অসুস্থতাজনিত ছুটি (SL)',
  },
  // 23. General Shift Late - Unapproved with high monthly tally
  {
    id: 'live-23',
    empId: '20120',
    deviceCode: '1120',
    nameEn: 'Tania Sultana',
    nameBn: 'তানিয়া সুলতানা',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    deptId: 'glazing',
    deptNameEn: 'Glazing & Surface Tech',
    deptNameBn: 'গ্লেজিং ও সারফেস টেক',
    sectionId: 'spray-line',
    sectionNameEn: 'Automated Spray Line',
    sectionNameBn: 'অটোমেটেড স্প্রে লাইন',
    designationNameEn: 'Glaze Quality Inspector',
    designationNameBn: 'গ্লেজ কোয়ালিটি ইন্সপেক্টর',
    designationLevel: 5,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: '08:25',
    outAt: null,
    status: 'late',
    isLate: true,
    lateMinutes: 25,
    monthlyLateDays: 5,
    lateAdjustmentStatus: 'unapproved',
    lateAdjustmentNoteBn: 'অননুমোদিত লেট — চলতি মাসে ৫ দিন লেট হওয়ায় অর্ধদিবস বেতন কর্তন প্রযোজ্য',
    lateAdjustmentNoteEn: 'Unapproved late — 5th late this month, subject to half-day deduction',
    emergencyPhone: '01722-667788',
    terminal: 'টার্মিনাল ১ (এডমিন গেট)',
    todayWorkedMinutes: 370,
  },
  // 24. Night Shift Late Arrival
  {
    id: 'live-24',
    empId: '20133',
    deviceCode: '1133',
    nameEn: 'Monirul Islam',
    nameBn: 'মনিরুল ইসলাম',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    deptId: 'kiln',
    deptNameEn: 'Kiln & Firing',
    deptNameBn: 'কিলন ও ফায়ারিং',
    sectionId: 'kiln-tunnel',
    sectionNameEn: 'Tunnel Kiln #1',
    sectionNameBn: 'টানেল কিলন ১',
    designationNameEn: 'Kiln Operator',
    designationNameBn: 'কিলন অপারেটর',
    designationLevel: 7,
    cadre: 'worker',
    shiftId: 'night',
    shiftNameEn: 'Night Roster',
    shiftNameBn: 'নাইট রোস্টার',
    shiftSchedule: '22:00 - 06:00',
    inAt: '22:18',
    outAt: null,
    status: 'late',
    isLate: true,
    lateMinutes: 18,
    monthlyLateDays: 2,
    lateAdjustmentStatus: 'pending',
    lateAdjustmentNoteBn: 'স্থানীয় যানবাহন না পাওয়ার কারণে লেট (আবেদন পেন্ডিং)',
    lateAdjustmentNoteEn: 'Local transport unavailability (Pending Approval)',
    emergencyPhone: '01822-778899',
    terminal: 'টার্মিনাল ৫ (কিলন গেট)',
    todayWorkedMinutes: 462,
  },
  // 25. Shift A On Leave - Casual Leave (CL)
  {
    id: 'live-25',
    empId: '20155',
    deviceCode: '1155',
    nameEn: 'Nasir Uddin',
    nameBn: 'নাছির উদ্দিন',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-2',
    sectionNameEn: 'Production Line 2',
    sectionNameBn: 'প্রোডাকশন লাইন ২',
    designationNameEn: 'Casting Tech',
    designationNameBn: 'কাস্টিং টেকনিশিয়ান',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'shiftA',
    shiftNameEn: 'Morning Shift A',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftSchedule: '06:00 - 14:00',
    inAt: null,
    outAt: null,
    status: 'leave',
    isLate: false,
    lateMinutes: 0,
    leaveType: 'casual',
    leaveTypeBn: 'নৈমিত্তিক ছুটি (CL)',
    leaveTypeEn: 'Casual Leave (CL)',
    leaveReasonBn: 'পারিবারিক জরুরি কাজ ও ব্যাংক সংক্রান্ত প্রয়োজনে অনুমোদিত ছুটি',
    leaveReasonEn: 'Family emergency and banking errand (Approved)',
    leaveDays: 1,
    emergencyPhone: '01833-990011',
    terminal: 'অনুমোদিত নৈমিত্তিক ছুটি (CL)',
  },
  // 26. Shift B On Leave - Earned Leave (EL)
  {
    id: 'live-26',
    empId: '20166',
    deviceCode: '1166',
    nameEn: 'Roksana Begum',
    nameBn: 'রোকসানা বেগম',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    deptId: 'packing',
    deptNameEn: 'Sorting & Packing',
    deptNameBn: 'বাছাই ও প্যাকেজিং',
    sectionId: 'pack-auto',
    sectionNameEn: 'Auto Packaging Unit',
    sectionNameBn: 'অটো প্যাকেজিং ইউনিট',
    designationNameEn: 'Sorting Specialist',
    designationNameBn: 'বাছাই বিশেষজ্ঞ',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'shiftB',
    shiftNameEn: 'Evening Shift B',
    shiftNameBn: 'ইভনিং শিফট বি',
    shiftSchedule: '14:00 - 22:00',
    inAt: null,
    outAt: null,
    status: 'leave',
    isLate: false,
    lateMinutes: 0,
    leaveType: 'earned',
    leaveTypeBn: 'অর্জিত ছুটি (EL)',
    leaveTypeEn: 'Earned Leave (EL)',
    leaveReasonBn: 'বার্ষিক নির্ধারিত পারিবারিক অবকাশ ও গ্রামের বাড়ি গমন',
    leaveReasonEn: 'Annual scheduled family vacation',
    leaveDays: 4,
    emergencyPhone: '01933-112244',
    terminal: 'অনুমোদিত অর্জিত ছুটি (EL)',
  },
  // 27. General Shift On Leave - Maternity Leave (ML)
  {
    id: 'live-27',
    empId: '20177',
    deviceCode: '1177',
    nameEn: 'Shamima Nasrin',
    nameBn: 'শামীমা নাসরিন',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    deptId: 'hr',
    deptNameEn: 'HR & Administration',
    deptNameBn: 'এইচআর ও প্রশাসন',
    sectionId: 'hr',
    sectionNameEn: 'HR Operations',
    sectionNameBn: 'এইচআর অপারেশনস',
    designationNameEn: 'HR Executive',
    designationNameBn: 'এইচআর এক্সিকিউটিভ',
    designationLevel: 3,
    cadre: 'officer',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: null,
    outAt: null,
    status: 'leave',
    isLate: false,
    lateMinutes: 0,
    leaveType: 'maternity',
    leaveTypeBn: 'প্রসূতি ছুটি (ML)',
    leaveTypeEn: 'Maternity Leave (ML)',
    leaveReasonBn: 'মাতৃত্বকালীন সংবিধিবদ্ধ সরকারি ছুটির অনুমোদন',
    leaveReasonEn: 'Approved statutory maternity leave',
    leaveDays: 120,
    emergencyPhone: '01633-223355',
    terminal: 'অনুমোদিত প্রসূতি ছুটি (ML)',
  },
  // 28. General Shift Absent - Unnotified
  {
    id: 'live-28',
    empId: '20199',
    deviceCode: '1199',
    nameEn: 'Babul Chandra Roy',
    nameBn: 'বাবুল চন্দ্র রায়',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    deptId: 'casting',
    deptNameEn: 'Casting & Moulding',
    deptNameBn: 'কাস্টিং ও মোল্ডিং',
    sectionId: 'line-3',
    sectionNameEn: 'Production Line 3',
    sectionNameBn: 'প্রোডাকশন লাইন ৩',
    designationNameEn: 'Casting Tech',
    designationNameBn: 'কাস্টিং টেকনিশিয়ান',
    designationLevel: 6,
    cadre: 'worker',
    shiftId: 'general',
    shiftNameEn: 'General Shift',
    shiftNameBn: 'জেনারেল শিফট',
    shiftSchedule: '08:00 - 17:00',
    inAt: null,
    outAt: null,
    status: 'absent',
    isLate: false,
    lateMinutes: 0,
    absentNotice: 'unnotified',
    absentDaysCount: 1,
    emergencyPhone: '01544-667788',
    terminal: 'টার্মিনাল ৩ (কাস্টিং গেট)',
  },
  // 29. Shift B Absent - Unnotified 3 days
  {
    id: 'live-29',
    empId: '20205',
    deviceCode: '1205',
    nameEn: 'Khorshed Alam',
    nameBn: 'খোরশেদ আলম',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
    deptId: 'glazing',
    deptNameEn: 'Glazing & Surface Tech',
    deptNameBn: 'গ্লেজিং ও সারফেস টেক',
    sectionId: 'spray-line',
    sectionNameEn: 'Automated Spray Line',
    sectionNameBn: 'অটোমেটেড স্প্রে লাইন',
    designationNameEn: 'Spray Operator',
    designationNameBn: 'স্প্রে অপারেটর',
    designationLevel: 7,
    cadre: 'worker',
    shiftId: 'shiftB',
    shiftNameEn: 'Evening Shift B',
    shiftNameBn: 'ইভনিং শিফট বি',
    shiftSchedule: '14:00 - 22:00',
    inAt: null,
    outAt: null,
    status: 'absent',
    isLate: false,
    lateMinutes: 0,
    absentNotice: 'unnotified',
    absentDaysCount: 3,
    emergencyPhone: '01755-778899',
    terminal: 'টার্মিনাল ১ (মেইন গেট)',
  },
];

/**
 * Duty Schedule for Employee View (Upcoming 5-day roadmap)
 */
export interface DutyRosterItem {
  date: string;
  dayBn: string;
  dayEn: string;
  shiftNameBn: string;
  shiftNameEn: string;
  timeRange: string;
  isOff: boolean;
}

export const EMPLOYEE_UPCOMING_SCHEDULE: DutyRosterItem[] = [
  {
    date: '2026-10-30',
    dayBn: 'আজ (বৃহস্পতিবার)',
    dayEn: 'Today (Thursday)',
    shiftNameBn: 'জেনারেল শিফট',
    shiftNameEn: 'General Shift',
    timeRange: '০৮:০০ - ১৭:০০',
    isOff: false,
  },
  {
    date: '2026-10-31',
    dayBn: 'শুক্রবার',
    dayEn: 'Friday',
    shiftNameBn: 'সাপ্তাহিক ছুটি',
    shiftNameEn: 'Weekly Off Day',
    timeRange: 'ছুটি (Day Off)',
    isOff: true,
  },
  {
    date: '2026-11-01',
    dayBn: 'শনিবার',
    dayEn: 'Saturday',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftNameEn: 'Morning Shift A',
    timeRange: '০৬:০০ - ১৪:০০',
    isOff: false,
  },
  {
    date: '2026-11-02',
    dayBn: 'রবিবার',
    dayEn: 'Sunday',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftNameEn: 'Morning Shift A',
    timeRange: '০৬:০০ - ১৪:০০',
    isOff: false,
  },
  {
    date: '2026-11-03',
    dayBn: 'সোমবার',
    dayEn: 'Monday',
    shiftNameBn: 'মর্নিং শিফট এ',
    shiftNameEn: 'Morning Shift A',
    timeRange: '০৬:০০ - ১৪:০০',
    isOff: false,
  },
];
