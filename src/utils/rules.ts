/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Pure Business Logic and Validation Rules
 * Conforms to PRD §4, §5.6, §5.7, §5.8, §5.13, §5.14 and Schema.md
 */

export interface Punch {
  time: string; // HH:mm
}

export interface ShiftRule {
  start: string; // HH:mm
  end: string; // HH:mm
  graceMinutes: number; // default 10
  workMinutes: number; // default 480
  breakMinutes: number; // default 60
  crossesMidnight?: boolean;
}

export function parseMinutesFromMidnight(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * ATT-2 & ATT-5: Late calculation rule.
 * Shift 08:00 with 10 min grace:
 * - 08:10 punch is Present
 * - 08:11 punch is Late (11 late minutes from shift start, shown in red)
 */
export function calculateAttendanceStatus(
  shift: ShiftRule,
  inTime?: string,
  outTime?: string,
  hasApprovedAdjustment = false
): {
  status: 'present' | 'late' | 'absent' | 'missingPunch';
  lateMinutes: number;
  workedMinutes: number;
  isLate: boolean;
} {
  if (hasApprovedAdjustment) {
    return {
      status: 'present',
      lateMinutes: 0,
      workedMinutes: shift.workMinutes,
      isLate: false,
    };
  }

  if (!inTime && !outTime) {
    return {
      status: 'absent',
      lateMinutes: 0,
      workedMinutes: 0,
      isLate: false,
    };
  }

  if (!inTime || !outTime) {
    return {
      status: 'missingPunch',
      lateMinutes: 0,
      workedMinutes: 0,
      isLate: false,
    };
  }

  const shiftStartMin = parseMinutesFromMidnight(shift.start);
  const inMin = parseMinutesFromMidnight(inTime);
  let outMin = parseMinutesFromMidnight(outTime);

  if (shift.crossesMidnight && outMin < inMin) {
    outMin += 24 * 60;
  }

  const diffFromStart = inMin - shiftStartMin;
  const isLate = diffFromStart > shift.graceMinutes;
  const lateMinutes = isLate ? diffFromStart : 0;
  const totalWorked = Math.max(0, outMin - inMin - shift.breakMinutes);

  return {
    status: isLate ? 'late' : 'present',
    lateMinutes,
    workedMinutes: totalWorked,
    isLate,
  };
}

/**
 * OT-1 & OT-3: Overtime computation
 */
export function calculateOvertime(
  workedMinutes: number,
  shiftWorkMinutes = 480,
  minMinutesThreshold = 30,
  roundTo = 15
): number {
  const extraMinutes = workedMinutes - shiftWorkMinutes;
  if (extraMinutes < minMinutesThreshold) {
    return 0;
  }
  return Math.floor(extraMinutes / roundTo) * roundTo;
}

/**
 * LV-2: Leave balance availability calculation
 * available = entitled + carried − used − pending
 */
export function calculateLeaveAvailability(
  entitled: number,
  carried: number,
  used: number,
  pending: number
): number {
  return Math.max(0, entitled + carried - used - pending);
}

/**
 * GEO-4, GEO-9: Workforce Map percentages and sanitization
 * district % = count in district / active with district * 100
 * sanitized view: any district with count < 5 is grouped into "Others"
 */
export interface DistrictStat {
  districtId: string;
  nameEn: string;
  nameBn: string;
  divisionId: string;
  count: number;
  percentage: number;
}

export function computeDistrictDistribution(
  districtsList: { id: string; nameEn: string; nameBn: string; divisionId: string }[],
  employeesWithDistrict: { districtId: string }[],
  totalActive: number,
  isSanitized: boolean
): {
  stats: DistrictStat[];
  withDistrictCount: number;
  notSetCount: number;
  districtsCovered: number;
  coveragePercentage: number;
} {
  const counts: Record<string, number> = {};
  let withDistrictCount = 0;

  for (const emp of employeesWithDistrict) {
    if (emp.districtId && emp.districtId.trim() !== '') {
      counts[emp.districtId] = (counts[emp.districtId] || 0) + 1;
      withDistrictCount++;
    }
  }

  const notSetCount = Math.max(0, totalActive - withDistrictCount);
  const coveredCount = Object.keys(counts).filter(k => counts[k] > 0).length;
  const coveragePercentage = totalActive > 0 ? Math.round((coveredCount / 64) * 100) : 0;

  const results: DistrictStat[] = [];
  let othersCount = 0;

  for (const dist of districtsList) {
    const rawCount = counts[dist.id] || 0;
    if (isSanitized && rawCount > 0 && rawCount < 5) {
      othersCount += rawCount;
      continue;
    }
    const percentage = withDistrictCount > 0 ? Number(((rawCount / withDistrictCount) * 100).toFixed(1)) : 0;
    results.push({
      districtId: dist.id,
      nameEn: dist.nameEn,
      nameBn: dist.nameBn,
      divisionId: dist.divisionId,
      count: rawCount,
      percentage,
    });
  }

  if (isSanitized && othersCount > 0) {
    const percentage = withDistrictCount > 0 ? Number(((othersCount / withDistrictCount) * 100).toFixed(1)) : 0;
    results.push({
      districtId: 'others',
      nameEn: 'Others',
      nameBn: 'অন্যান্য',
      divisionId: 'various',
      count: othersCount,
      percentage,
    });
  }

  // Sort descending by count
  results.sort((a, b) => b.count - a.count);

  return {
    stats: results,
    withDistrictCount,
    notSetCount,
    districtsCovered: coveredCount,
    coveragePercentage,
  };
}

/**
 * Performance & Attendance Discipline Score (ADS)
 * 70% attendance rate + 30% punctuality rate
 */
export function calculateADS(
  attendanceRate: number, // 0 to 1
  punctualityRate: number, // 0 to 1
  weights = { attendance: 0.7, punctuality: 0.3 }
): number {
  const score = (attendanceRate * weights.attendance + punctualityRate * weights.punctuality) * 100;
  return Number(score.toFixed(1));
}

/**
 * Performance appraisal 4-component weighted model: 60 / 15 / 15 / 10
 */
export function calculateAppraisalTotal(
  components: { c1: number; c2: number; c3: number; c4: number },
  weights = { c1: 0.6, c2: 0.15, c3: 0.15, c4: 0.1 }
): number {
  const total =
    components.c1 * weights.c1 +
    components.c2 * weights.c2 +
    components.c3 * weights.c3 +
    components.c4 * weights.c4;
  return Math.round(total);
}

/**
 * GEO Workforce Map Density Tiers
 * Color-coded density ranges for visual interpretation
 */
export type DensityTier = 'zero' | 'low' | 'medium' | 'high' | 'very-high';

export interface DensityTierConfig {
  id: DensityTier;
  labelEn: string;
  labelBn: string;
  rangeEn: string;
  rangeBn: string;
  min: number;
  max: number;
  color: string;
  borderColor: string;
  bgHex: string;
  descriptionEn: string;
  descriptionBn: string;
}

export const DENSITY_TIERS: DensityTierConfig[] = [
  {
    id: 'zero',
    labelEn: 'Zero Staff',
    labelBn: 'শূন্য কর্মী',
    rangeEn: '0 staff',
    rangeBn: '০ জন',
    min: 0,
    max: 0,
    color: '#F2E4DA',
    borderColor: '#EDE4DC',
    bgHex: '#F2E4DA',
    descriptionEn: 'No recorded workforce',
    descriptionBn: 'কোনো কর্মী নেই',
  },
  {
    id: 'low',
    labelEn: 'Low Density',
    labelBn: 'স্বল্প ঘনত্ব',
    rangeEn: '1–4 staff',
    rangeBn: '১–৪ জন',
    min: 1,
    max: 4,
    color: '#FFB2A8',
    borderColor: '#FF8A7A',
    bgHex: '#FFB2A8',
    descriptionEn: '1 to 4 employees',
    descriptionBn: '১ থেকে ৪ জন কর্মী',
  },
  {
    id: 'medium',
    labelEn: 'Moderate',
    labelBn: 'মাঝারি ঘনত্ব',
    rangeEn: '5–14 staff',
    rangeBn: '৫–১৪ জন',
    min: 5,
    max: 14,
    color: '#FF6B57',
    borderColor: '#E64C35',
    bgHex: '#FF6B57',
    descriptionEn: '5 to 14 employees',
    descriptionBn: '৫ থেকে ১৪ জন কর্মী',
  },
  {
    id: 'high',
    labelEn: 'High Density',
    labelBn: 'উচ্চ ঘনত্ব',
    rangeEn: '15–24 staff',
    rangeBn: '১৫–২৪ জন',
    min: 15,
    max: 24,
    color: '#EC1C24',
    borderColor: '#C4141B',
    bgHex: '#EC1C24',
    descriptionEn: '15 to 24 employees',
    descriptionBn: '১৫ থেকে ২৪ জন কর্মী',
  },
  {
    id: 'very-high',
    labelEn: 'Core Hub',
    labelBn: 'প্রধান কর্মী হাব',
    rangeEn: '25+ staff',
    rangeBn: '২৫+ জন',
    min: 25,
    max: Infinity,
    color: '#8E0F15',
    borderColor: '#5C080C',
    bgHex: '#8E0F15',
    descriptionEn: '25 or more employees',
    descriptionBn: '২৫ বা ততোধিক কর্মী',
  },
];

export function getDensityTier(count: number): DensityTier {
  if (count <= 0) return 'zero';
  if (count <= 4) return 'low';
  if (count <= 14) return 'medium';
  if (count <= 24) return 'high';
  return 'very-high';
}

export function getDensityTierColor(count: number): string {
  const tier = getDensityTier(count);
  const cfg = DENSITY_TIERS.find(t => t.id === tier);
  return cfg ? cfg.color : '#F2E4DA';
}

