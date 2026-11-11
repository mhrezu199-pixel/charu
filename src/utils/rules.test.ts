/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unit tests for Charu HCM core rules using Node test runner
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAttendanceStatus,
  calculateOvertime,
  calculateLeaveAvailability,
  computeDistrictDistribution,
  calculateADS,
  calculateAppraisalTotal,
  getDensityTier,
  getDensityTierColor,
  ShiftRule,
} from './rules';
import {
  getHierarchyRole,
  hasPermission,
  toggleRolePermission,
  DEFAULT_ROLE_PERMISSIONS,
} from '../data/permissionsData';
import {
  generate30DaysBiometricLogs,
  getBiometricStats,
} from '../data/biometricLogsData';
import { EXACT_DISTRICT_SVG_PATHS } from '../data/districtExactPaths';
import { getDesignationRoleGroup } from '../components/WorkforceMap';
import { INITIAL_EMPLOYEES } from '../data/mockData';
import { BANGLADESH_DISTRICTS, BANGLADESH_MAP_COORDINATES } from '../data/districts';

test('Attendance Late Rule: 08:10 punch within 10 min grace is Present', () => {
  const generalShift: ShiftRule = {
    start: '08:00',
    end: '17:00',
    graceMinutes: 10,
    workMinutes: 480,
    breakMinutes: 60,
  };

  const res = calculateAttendanceStatus(generalShift, '08:10', '17:00');
  assert.equal(res.status, 'present');
  assert.equal(res.isLate, false);
  assert.equal(res.lateMinutes, 0);
});

test('Attendance Late Rule: 08:11 punch exceeds 10 min grace is Late (11 min late)', () => {
  const generalShift: ShiftRule = {
    start: '08:00',
    end: '17:00',
    graceMinutes: 10,
    workMinutes: 480,
    breakMinutes: 60,
  };

  const res = calculateAttendanceStatus(generalShift, '08:11', '17:00');
  assert.equal(res.status, 'late');
  assert.equal(res.isLate, true);
  assert.equal(res.lateMinutes, 11);
});

test('Approved Attendance Adjustment clears late flag and marks Present', () => {
  const generalShift: ShiftRule = {
    start: '08:00',
    end: '17:00',
    graceMinutes: 10,
    workMinutes: 480,
    breakMinutes: 60,
  };

  const res = calculateAttendanceStatus(generalShift, '08:35', '17:00', true);
  assert.equal(res.status, 'present');
  assert.equal(res.isLate, false);
  assert.equal(res.lateMinutes, 0);
});

test('Overtime computation: worked 9h30m (570m - 480m = 90m extra) yields 90m OT', () => {
  const ot = calculateOvertime(570, 480, 30, 15);
  assert.equal(ot, 90);
});

test('Overtime computation: worked 15m extra (< 30m min threshold) yields 0 OT', () => {
  const ot = calculateOvertime(495, 480, 30, 15);
  assert.equal(ot, 0);
});

test('Leave balance calculation: entitled 10, carried 2, used 3, pending 1 -> available 8', () => {
  const available = calculateLeaveAvailability(10, 2, 3, 1);
  assert.equal(available, 8);
});

test('Workforce Map calculation: percentage and sanitization rule (<5 grouped as Others)', () => {
  const sampleDistricts = [
    { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', divisionId: 'sylhet' },
    { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', divisionId: 'chattogram' },
    { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', divisionId: 'chattogram' },
  ];

  // 20 in Habiganj, 30 in Lakshmipur, 2 in Feni (less than 5)
  const emps = [
    ...Array(20).fill({ districtId: 'habiganj' }),
    ...Array(30).fill({ districtId: 'lakshmipur' }),
    ...Array(2).fill({ districtId: 'feni' }),
  ];

  // For non-HR (sanitized = true): Feni should be merged into "Others"
  const sanitized = computeDistrictDistribution(sampleDistricts, emps, 55, true);
  assert.equal(sanitized.withDistrictCount, 52);
  assert.equal(sanitized.notSetCount, 3);
  
  const others = sanitized.stats.find(s => s.districtId === 'others');
  assert.ok(others, 'Others group should exist for count < 5 in sanitized mode');
  assert.equal(others.count, 2);

  // For HR (sanitized = false): Feni remains visible
  const raw = computeDistrictDistribution(sampleDistricts, emps, 55, false);
  const feni = raw.stats.find(s => s.districtId === 'feni');
  assert.ok(feni);
  assert.equal(feni.count, 2);
});

test('ADS and Performance score calculation matches PRD 60/15/15/10 weights', () => {
  const ads = calculateADS(0.95, 0.90);
  // (0.95 * 0.7 + 0.90 * 0.3) * 100 = (0.665 + 0.27) * 100 = 93.5
  assert.equal(ads, 93.5);

  const appraisal = calculateAppraisalTotal({ c1: 90, c2: 80, c3: 85, c4: 70 });
  // 90*0.6 + 80*0.15 + 85*0.15 + 70*0.1 = 54 + 12 + 12.75 + 7 = 85.75 -> 86
  assert.equal(appraisal, 86);
});

test('Workforce Map density tiers classification and color codes', () => {
  assert.equal(getDensityTier(0), 'zero');
  assert.equal(getDensityTierColor(0), '#F2E4DA');

  assert.equal(getDensityTier(1), 'low');
  assert.equal(getDensityTier(4), 'low');
  assert.equal(getDensityTierColor(3), '#FFB2A8');

  assert.equal(getDensityTier(5), 'medium');
  assert.equal(getDensityTier(14), 'medium');
  assert.equal(getDensityTierColor(9), '#FF6B57');

  assert.equal(getDensityTier(15), 'high');
  assert.equal(getDensityTier(24), 'high');
  assert.equal(getDensityTierColor(20), '#EC1C24');

  assert.equal(getDensityTier(25), 'very-high');
  assert.equal(getDensityTier(30), 'very-high');
  assert.equal(getDensityTierColor(30), '#8E0F15');
});

test('Role & Permission Hierarchy and Power Distribution Rules', () => {
  // Check hierarchy role mapping
  assert.equal(getHierarchyRole('superAdmin'), 'admin');
  assert.equal(getHierarchyRole('hrManager'), 'admin');
  assert.equal(getHierarchyRole('hod'), 'hod');
  assert.equal(getHierarchyRole('employee'), 'employee');

  // Verify Admin default powers (all enabled)
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hrManager', 'manual_attendance_entry'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'superAdmin', 'execute_month_lock'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hrManager', 'register_new_employee'), true);

  // Verify HOD initial managerial powers vs restrictions
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'hod_approve_leave'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'hod_approve_adjustment'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'hod_verify_overtime'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'manual_attendance_entry'), false);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'execute_month_lock'), false);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'register_new_employee'), false);

  // Verify Employee self-service powers vs restrictions
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'employee', 'view_own_attendance'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'employee', 'apply_personal_leave'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'employee', 'request_late_withdrawal'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'employee', 'hod_approve_leave'), false);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'employee', 'view_team_attendance'), false);

  // Test dynamic toggle of permission
  const modifiedPerms = toggleRolePermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'manual_attendance_entry');
  assert.equal(hasPermission(modifiedPerms, 'hod', 'manual_attendance_entry'), true);
});

test('Biometric Logs: 30-day raw device punches generation and role access', () => {
  // Authorized roles (Admin & HOD) have view_biometric_logs enabled by default
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hrManager', 'view_biometric_logs'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'hod', 'view_biometric_logs'), true);
  assert.equal(hasPermission(DEFAULT_ROLE_PERMISSIONS, 'employee', 'view_biometric_logs'), false);

  // Generate 30 days logs
  const logs = generate30DaysBiometricLogs([]);
  assert.ok(logs.length >= 50, 'Should generate at least 50 raw punches across 30 days');

  // Verify descending timestamp sort
  assert.ok(logs[0].punchTime >= logs[logs.length - 1].punchTime);

  // Verify stats calculation
  const stats = getBiometricStats(logs);
  assert.equal(stats.totalPunches, logs.length);
  assert.ok(stats.totalCheckIns > 0);
  assert.ok(stats.totalCheckOuts > 0);
  assert.equal(stats.totalTerminals, 5);
});

test('64-District Exact SVG Polygon Coverage, Centroids & Section+District+Designation Filtering', () => {
  // Verify all 64 districts have exact SVG paths and aligned 2391x2106 pin/label coordinates
  assert.equal(BANGLADESH_DISTRICTS.length, 64);
  for (const d of BANGLADESH_DISTRICTS) {
    const exact = EXACT_DISTRICT_SVG_PATHS[d.id];
    const mapCoord = BANGLADESH_MAP_COORDINATES[d.id];
    assert.ok(exact, `Missing SVG path for district: ${d.id}`);
    assert.ok(exact.path.startsWith('M'), `Invalid SVG path for ${d.id}`);
    assert.ok(exact.cx >= 550 && exact.cx <= 2000, `District ${d.id} cx (${exact.cx}) out of 2391x2106 map bounds`);
    assert.ok(exact.cy >= 20 && exact.cy <= 2080, `District ${d.id} cy (${exact.cy}) out of 2391x2106 map bounds`);
    assert.ok(mapCoord, `Missing BANGLADESH_MAP_COORDINATES for ${d.id}`);
    assert.equal(mapCoord.x, exact.cx, `Mismatch x coordinate for ${d.id}`);
    assert.equal(mapCoord.y, exact.cy, `Mismatch y coordinate for ${d.id}`);
  }

  // Filter Casting Section + Habiganj District
  const castingHabiganj = INITIAL_EMPLOYEES.filter(
    e => e.employment.deptId === 'casting' && e.homeDistrictId === 'habiganj'
  );
  const hodCount = castingHabiganj.filter(
    e => getDesignationRoleGroup(e.employment.designationId) === 'hod'
  ).length;
  const supCount = castingHabiganj.filter(
    e => getDesignationRoleGroup(e.employment.designationId) === 'supervisor'
  ).length;
  const empCount = castingHabiganj.filter(
    e => getDesignationRoleGroup(e.employment.designationId) === 'employee'
  ).length;

  assert.equal(hodCount, 1, 'Casting + Habiganj should have 1 HOD');
  assert.equal(supCount, 2, 'Casting + Habiganj should have 2 Supervisors');
  assert.equal(empCount, 3, 'Casting + Habiganj should have 3 Employees/Operators');
  assert.equal(castingHabiganj.length, 6);
});

import { getRoleThemeCategory } from '../components/HeroHeader';

test('Hero Header 3-Role Sylhet Scenery Theme Mapping (HOD Red, Employee Dark, Admin Emerald)', () => {
  // HOD maps to 'hod' (Ruby Sunset Tea Estate)
  assert.equal(getRoleThemeCategory('hod'), 'hod');

  // Employee maps to 'employee' (Obsidian Night Tea Garden)
  assert.equal(getRoleThemeCategory('employee'), 'employee');
  assert.equal(getRoleThemeCategory('supervisor'), 'employee');

  // Admin & Accounts map to 'admin' (Imperial Emerald & Golden Sunrise)
  assert.equal(getRoleThemeCategory('superAdmin'), 'admin');
  assert.equal(getRoleThemeCategory('hrManager'), 'admin');
  assert.equal(getRoleThemeCategory('hrExecutive'), 'admin');
  assert.equal(getRoleThemeCategory('accounts'), 'admin');
});

import {
  getEmployeeCadre,
  sortChronologicalArrivals,
  calculateLiveHeadcount,
  LiveAttendanceEntry,
} from '../data/liveAttendanceData';

test('Live Attendance: Employee Cadre classification (officer, worker, casual)', () => {
  // Level 1-5 -> officer
  assert.equal(getEmployeeCadre(1), 'officer');
  assert.equal(getEmployeeCadre(2), 'officer');
  assert.equal(getEmployeeCadre(4), 'officer');
  assert.equal(getEmployeeCadre(5), 'officer');

  // Level 6-7 -> worker
  assert.equal(getEmployeeCadre(6), 'worker');
  assert.equal(getEmployeeCadre(7), 'worker');

  // Level 8+ or contract -> casual
  assert.equal(getEmployeeCadre(8), 'casual');
  assert.equal(getEmployeeCadre(7, 'contract'), 'casual');
});

test('Live Attendance: Chronological arrival ordering ("কে কার আগে ঢুকছে, কে কার পরে ঢুকছে")', () => {
  const sampleEntries: LiveAttendanceEntry[] = [
    {
      id: 'e1',
      empId: '1001',
      deviceCode: '01',
      nameEn: 'Late Person',
      nameBn: 'দেরিতে আসা কর্মী',
      photoUrl: '',
      deptId: 'casting',
      deptNameEn: 'Casting',
      deptNameBn: 'কাস্টিং',
      sectionId: 'line-1',
      sectionNameEn: 'Line 1',
      sectionNameBn: 'লাইন ১',
      designationNameEn: 'Operator',
      designationNameBn: 'অপারেটর',
      designationLevel: 7,
      cadre: 'worker',
      shiftId: 'general',
      shiftNameEn: 'General',
      shiftNameBn: 'জেনারেল',
      shiftSchedule: '08:00 - 17:00',
      inAt: '08:15',
      outAt: null,
      status: 'late',
      isLate: true,
      lateMinutes: 15,
      terminal: 'Gate 1',
    },
    {
      id: 'e2',
      empId: '1002',
      deviceCode: '02',
      nameEn: 'Super Early Bird',
      nameBn: 'প্রথম প্রবেশকারী',
      photoUrl: '',
      deptId: 'casting',
      deptNameEn: 'Casting',
      deptNameBn: 'কাস্টিং',
      sectionId: 'line-1',
      sectionNameEn: 'Line 1',
      sectionNameBn: 'লাইন ১',
      designationNameEn: 'Supervisor',
      designationNameBn: 'সুপারভাইজার',
      designationLevel: 4,
      cadre: 'officer',
      shiftId: 'general',
      shiftNameEn: 'General',
      shiftNameBn: 'জেনারেল',
      shiftSchedule: '08:00 - 17:00',
      inAt: '07:40',
      outAt: null,
      status: 'present',
      isLate: false,
      lateMinutes: 0,
      terminal: 'Gate 1',
    },
    {
      id: 'e3',
      empId: '1003',
      deviceCode: '03',
      nameEn: 'On Time Person',
      nameBn: 'সময়মতো আসা কর্মী',
      photoUrl: '',
      deptId: 'casting',
      deptNameEn: 'Casting',
      deptNameBn: 'কাস্টিং',
      sectionId: 'line-1',
      sectionNameEn: 'Line 1',
      sectionNameBn: 'লাইন ১',
      designationNameEn: 'Operator',
      designationNameBn: 'অপারেটর',
      designationLevel: 7,
      cadre: 'worker',
      shiftId: 'general',
      shiftNameEn: 'General',
      shiftNameBn: 'জেনারেল',
      shiftSchedule: '08:00 - 17:00',
      inAt: '07:55',
      outAt: null,
      status: 'present',
      isLate: false,
      lateMinutes: 0,
      terminal: 'Gate 1',
    },
    {
      id: 'e4',
      empId: '1004',
      deviceCode: '04',
      nameEn: 'Absent Person',
      nameBn: 'অনুপস্থিত কর্মী',
      photoUrl: '',
      deptId: 'casting',
      deptNameEn: 'Casting',
      deptNameBn: 'কাস্টিং',
      sectionId: 'line-1',
      sectionNameEn: 'Line 1',
      sectionNameBn: 'লাইন ১',
      designationNameEn: 'Helper',
      designationNameBn: 'সহকারী',
      designationLevel: 8,
      cadre: 'casual',
      shiftId: 'general',
      shiftNameEn: 'General',
      shiftNameBn: 'জেনারেল',
      shiftSchedule: '08:00 - 17:00',
      inAt: null,
      outAt: null,
      status: 'absent',
      isLate: false,
      lateMinutes: 0,
      terminal: 'Gate 1',
    },
  ];

  const ranked = sortChronologicalArrivals(sampleEntries);

  // First arrival must be Super Early Bird (07:40) with rank 1
  assert.equal(ranked[0].empId, '1002');
  assert.equal(ranked[0].rank, 1, 'First arrival at 07:40 must have rank 1');

  // Second arrival must be On Time Person (07:55) with rank 2
  assert.equal(ranked[1].empId, '1003');
  assert.equal(ranked[1].rank, 2, 'Second arrival at 07:55 must have rank 2');

  // Third arrival must be Late Person (08:15) with rank 3
  assert.equal(ranked[2].empId, '1001');
  assert.equal(ranked[2].rank, 3, 'Third arrival at 08:15 must have rank 3');

  // Absent person must be unranked (rank null)
  assert.equal(ranked[3].empId, '1004');
  assert.equal(ranked[3].rank, null, 'Absent person must have null rank');
});

test('Live Attendance: Headcount statistics calculation', () => {
  const sampleEntries: LiveAttendanceEntry[] = [
    { inAt: '07:45', isLate: false, status: 'present' } as LiveAttendanceEntry,
    { inAt: '08:00', isLate: false, status: 'present' } as LiveAttendanceEntry,
    { inAt: '08:15', isLate: true, status: 'late' } as LiveAttendanceEntry,
    { inAt: null, isLate: false, status: 'absent' } as LiveAttendanceEntry,
  ];

  const stats = calculateLiveHeadcount(sampleEntries);
  assert.equal(stats.totalExpected, 4);
  assert.equal(stats.presentCount, 3);
  assert.equal(stats.lateCount, 1);
  assert.equal(stats.onTimeCount, 2);
  assert.equal(stats.absentCount, 1);
  assert.equal(stats.attendanceRate, 75);
});

import {
  filterEntriesByCategory,
  calculateLateAnalytics,
  calculateLeaveAnalytics,
  calculateAbsentAnalytics,
  filterAdminLiveAttendance,
  calculateAdminDailySummary,
  getAdminFilterLabel,
  TODAY_LIVE_ATTENDANCE,
  FACTORY_DEPARTMENTS,
} from '../data/liveAttendanceData';

test('Live Attendance: Interactive Metric Category Filtering (Present, Late, Leave, Absent, All)', () => {
  const sampleEntries: LiveAttendanceEntry[] = [
    { id: '1', inAt: '05:50', isLate: false, status: 'present' } as LiveAttendanceEntry,
    { id: '2', inAt: '06:15', isLate: true, lateMinutes: 15, status: 'late' } as LiveAttendanceEntry,
    { id: '3', inAt: null, isLate: false, status: 'leave', leaveType: 'sick' } as LiveAttendanceEntry,
    { id: '4', inAt: null, isLate: false, status: 'absent', absentNotice: 'unnotified' } as LiveAttendanceEntry,
  ];

  assert.equal(filterEntriesByCategory(sampleEntries, 'all').length, 4);
  assert.equal(filterEntriesByCategory(sampleEntries, 'present').length, 2); // present & late arrived
  assert.equal(filterEntriesByCategory(sampleEntries, 'late').length, 1);
  assert.equal(filterEntriesByCategory(sampleEntries, 'leave').length, 1);
  assert.equal(filterEntriesByCategory(sampleEntries, 'absent').length, 1);
});

test('Live Attendance: Late Analytics calculation (minutes, adjustment states, averages)', () => {
  const sampleEntries: LiveAttendanceEntry[] = [
    { id: '1', isLate: true, lateMinutes: 12, lateAdjustmentStatus: 'pending' } as LiveAttendanceEntry,
    { id: '2', isLate: true, lateMinutes: 18, lateAdjustmentStatus: 'unapproved' } as LiveAttendanceEntry,
    { id: '3', isLate: true, lateMinutes: 30, lateAdjustmentStatus: 'approved' } as LiveAttendanceEntry,
    { id: '4', isLate: false, lateMinutes: 0 } as LiveAttendanceEntry,
  ];

  const analytics = calculateLateAnalytics(sampleEntries);
  assert.equal(analytics.totalLate, 3);
  assert.equal(analytics.avgLateMinutes, 20); // (12+18+30)/3 = 20
  assert.equal(analytics.maxLateMinutes, 30);
  assert.equal(analytics.pendingAdjustments, 1);
  assert.equal(analytics.unapprovedLate, 1);
  assert.equal(analytics.approvedLate, 1);
});

test('Live Attendance: Leave & Absent Analytics breakdown (SL, CL, EL, ML, Unnotified)', () => {
  const sampleEntries: LiveAttendanceEntry[] = [
    { id: '1', status: 'leave', leaveType: 'sick' } as LiveAttendanceEntry,
    { id: '2', status: 'leave', leaveType: 'casual' } as LiveAttendanceEntry,
    { id: '3', status: 'leave', leaveType: 'earned' } as LiveAttendanceEntry,
    { id: '4', status: 'absent', inAt: null, absentNotice: 'unnotified' } as LiveAttendanceEntry,
    { id: '5', status: 'absent', inAt: null, absentNotice: 'notified' } as LiveAttendanceEntry,
  ];

  const leaveStats = calculateLeaveAnalytics(sampleEntries);
  assert.equal(leaveStats.totalLeave, 3);
  assert.equal(leaveStats.sickLeave, 1);
  assert.equal(leaveStats.casualLeave, 1);
  assert.equal(leaveStats.earnedLeave, 1);

  const absentStats = calculateAbsentAnalytics(sampleEntries);
  assert.equal(absentStats.totalAbsent, 2);
  assert.equal(absentStats.unnotified, 1);
  assert.equal(absentStats.notified, 1);
});

test('Admin Dashboard: Initial State starts with Total Overall Factory Summary', () => {
  const initialFilter = {
    department: 'all',
    shift: 'all',
    cadre: 'all',
  };

  const filtered = filterAdminLiveAttendance(TODAY_LIVE_ATTENDANCE, initialFilter);
  assert.equal(filtered.length, TODAY_LIVE_ATTENDANCE.length, 'Initial state must include all factory employees');

  const summary = calculateAdminDailySummary(filtered, TODAY_LIVE_ATTENDANCE);
  assert.equal(summary.isTotalOverview, true, 'isTotalOverview must be true when no filter is applied');
  assert.equal(summary.totalExpected, TODAY_LIVE_ATTENDANCE.length);
  assert.ok(summary.presentCount > 0, 'Must have present count');
  assert.ok(summary.attendanceRate > 0 && summary.attendanceRate <= 100, 'Attendance rate between 0 and 100');
  assert.equal(summary.departmentStats.length, 8, 'Must calculate metrics across all 8 factory departments');

  const label = getAdminFilterLabel(initialFilter, 'bn');
  assert.equal(label.isFiltered, false);
  assert.ok(label.badgeTitle.includes('সম্পূর্ণ কারখানার সামগ্রিক দৈনিক সারাংশ'));
});

test('Admin Dashboard: Progressive Cascading Filter narrows metrics and can be reset', () => {
  // 1. Filter by Glazing Department
  const glazingFilter = {
    department: 'glazing',
    shift: 'all',
    cadre: 'all',
  };

  const glazingFiltered = filterAdminLiveAttendance(TODAY_LIVE_ATTENDANCE, glazingFilter);
  assert.ok(glazingFiltered.length > 0 && glazingFiltered.length < TODAY_LIVE_ATTENDANCE.length);
  assert.ok(glazingFiltered.every(e => e.deptId === 'glazing' || e.sectionId === 'glazing'));

  const glazingSummary = calculateAdminDailySummary(glazingFiltered, TODAY_LIVE_ATTENDANCE);
  assert.equal(glazingSummary.isTotalOverview, false, 'isTotalOverview must be false when filtered');
  assert.equal(glazingSummary.totalExpected, glazingFiltered.length);

  const glazingLabel = getAdminFilterLabel(glazingFilter, 'bn');
  assert.equal(glazingLabel.isFiltered, true);
  assert.ok(glazingLabel.badgeTitle.includes('গ্লেজিং ও সারফেস টেক'));

  // 2. Further narrow to Morning Shift A inside Glazing
  const shiftFilter = {
    department: 'glazing',
    shift: 'shiftA',
    cadre: 'all',
  };
  const shiftFiltered = filterAdminLiveAttendance(TODAY_LIVE_ATTENDANCE, shiftFilter);
  assert.ok(shiftFiltered.every(e => e.shiftId === 'shiftA' && (e.deptId === 'glazing' || e.sectionId === 'glazing')));

  // 3. Reset back to all
  const resetFilter = {
    department: 'all',
    shift: 'all',
    cadre: 'all',
  };
  const resetFiltered = filterAdminLiveAttendance(TODAY_LIVE_ATTENDANCE, resetFilter);
  assert.equal(resetFiltered.length, TODAY_LIVE_ATTENDANCE.length, 'Resetting filter must restore 100% factory dataset');
  const resetSummary = calculateAdminDailySummary(resetFiltered, TODAY_LIVE_ATTENDANCE);
  assert.equal(resetSummary.isTotalOverview, true);
});

import {
  isAdminRoleForOnboarding,
  lookupCitizenByNidOrBrn,
  calculateProRataLeaves,
  generateEmployeeLoginCredentials,
  createCustomDepartment,
  createCustomEmployeeType,
  INITIAL_CUSTOM_DEPARTMENTS,
  INITIAL_EMPLOYEE_TYPES,
} from './onboardingRules';

test('Onboarding Guard: Strictly restricted to Admin roles only (hidden from HOD & Employee)', () => {
  assert.equal(isAdminRoleForOnboarding('superAdmin'), true);
  assert.equal(isAdminRoleForOnboarding('hrManager'), true);
  assert.equal(isAdminRoleForOnboarding('hrExecutive'), true);
  assert.equal(isAdminRoleForOnboarding('accounts'), true);

  // Must be false for HOD, Supervisor, and Employee
  assert.equal(isAdminRoleForOnboarding('hod'), false);
  assert.equal(isAdminRoleForOnboarding('supervisor'), false);
  assert.equal(isAdminRoleForOnboarding('employee'), false);
});

test('Onboarding Auto-Fill: NID & Birth Registration (জন্ম নিবন্ধন) lookup populates Name, Parents, and Address', () => {
  // 1. Preset 13-digit NID lookup
  const nidRecord = lookupCitizenByNidOrBrn('1996361784512', 'nid');
  assert.ok(nidRecord);
  assert.equal(nidRecord.nameBn, 'মোঃ সাইফুল ইসলাম চৌধুরী');
  assert.equal(nidRecord.fatherNameBn, 'মোঃ আব্দুল মতিন চৌধুরী');
  assert.equal(nidRecord.motherNameBn, 'মিসেস রোকেয়া বেগম');
  assert.equal(nidRecord.permanentAddress.districtId, 'habiganj');
  assert.equal(nidRecord.verifiedSource, 'EC_NID_SERVER');

  // 2. Preset 17-digit Birth Certificate (BRN) lookup
  const brnRecord = lookupCitizenByNidOrBrn('20013614785236987', 'brn');
  assert.ok(brnRecord);
  assert.equal(brnRecord.nameBn, 'মোঃ আরিফুল ইসলাম রনি');
  assert.equal(brnRecord.fatherNameBn, 'মোঃ সিরাজুল ইসলাম');
  assert.equal(brnRecord.motherNameBn, 'হালিমা বেগম');
  assert.equal(brnRecord.permanentAddress.districtId, 'brahmanbaria');
  assert.equal(brnRecord.verifiedSource, 'BDRIS_BIRTH_SERVER');

  // 3. Arbitrary valid 10-digit NID auto-lookup
  const arbitrary = lookupCitizenByNidOrBrn('5544332211', 'nid');
  assert.ok(arbitrary);
  assert.ok(arbitrary.nameBn.length > 0);
  assert.ok(arbitrary.fatherNameBn.length > 0);
  assert.ok(arbitrary.motherNameBn.length > 0);
  assert.ok(arbitrary.permanentAddress.districtId.length > 0);

  // 4. Too short / invalid input returns null
  assert.equal(lookupCitizenByNidOrBrn('1234', 'nid'), null);
});

test('Onboarding Pro-Rata Leave Calculator: CL=10, SL=14, FL=13, EL=16 divided by 12 * remaining months', () => {
  // Full year (Joining Jan 1 -> 12 months remaining)
  const fullYear = calculateProRataLeaves('2026-01-01');
  assert.equal(fullYear.remainingMonths, 12);
  assert.equal(fullYear.items.CL.exactEntitlement, 10);
  assert.equal(fullYear.items.SL.exactEntitlement, 14);
  assert.equal(fullYear.items.FL.exactEntitlement, 13);
  assert.equal(fullYear.items.EL.exactEntitlement, 16);
  assert.equal(fullYear.totalRoundedEntitlement, 53);

  // Mid-year (Joining July 1 -> 6 months remaining)
  const midYear = calculateProRataLeaves('2026-07-01');
  assert.equal(midYear.remainingMonths, 6);
  assert.equal(midYear.items.CL.exactEntitlement, 5); // (10/12)*6 = 5
  assert.equal(midYear.items.SL.exactEntitlement, 7); // (14/12)*6 = 7
  assert.equal(midYear.items.FL.exactEntitlement, 6.5); // (13/12)*6 = 6.5
  assert.equal(midYear.items.FL.roundedEntitlement, 7);
  assert.equal(midYear.items.EL.exactEntitlement, 8); // (16/12)*6 = 8

  // Q4 (Joining Oct 1 -> 3 months remaining)
  const q4 = calculateProRataLeaves('2026-10-01');
  assert.equal(q4.remainingMonths, 3);
  assert.equal(q4.items.CL.exactEntitlement, 2.5); // (10/12)*3 = 2.5
  assert.equal(q4.items.SL.exactEntitlement, 3.5); // (14/12)*3 = 3.5
  assert.equal(q4.items.FL.exactEntitlement, 3.25); // (13/12)*3 = 3.25
  assert.equal(q4.items.EL.exactEntitlement, 4); // (16/12)*3 = 4
});

test('Onboarding Login Credentials & Dynamic Department/Employee Type Creation', () => {
  // Username = Company Name (CHARU), Password = Employee ID
  const creds = generateEmployeeLoginCredentials('1045', 'CHARU', 'officer');
  assert.equal(creds.username, 'CHARU');
  assert.equal(creds.password, '1045');
  assert.equal(creds.accessTag, 'officer');
  assert.equal(creds.mappedSystemRole, 'supervisor');

  const hodCreds = generateEmployeeLoginCredentials('1046', 'CHARU', 'hod');
  assert.equal(hodCreds.username, 'CHARU');
  assert.equal(hodCreds.password, '1046');
  assert.equal(hodCreds.mappedSystemRole, 'hod');

  // Dynamic department creation
  const newDept = createCustomDepartment(
    'ডিজিটাল প্রিন্টিং ও ডিক্যাল',
    'Digital Printing & Decal',
    'Line A, Line B',
    INITIAL_CUSTOM_DEPARTMENTS.length
  );
  assert.equal(newDept.code, 'DEPT-09');
  assert.equal(newDept.nameBn, 'ডিজিটাল প্রিন্টিং ও ডিক্যাল');
  assert.equal(newDept.subSections.length, 2);

  // Dynamic employee type creation
  const newType = createCustomEmployeeType(
    'সিনিয়র কিলন ইঞ্জিনিয়ার',
    'Sr. Kiln Engineer',
    'officer'
  );
  assert.equal(newType.nameBn, 'সিনিয়র কিলন ইঞ্জিনিয়ার');
  assert.equal(newType.defaultAccessTag, 'officer');
  assert.ok(INITIAL_EMPLOYEE_TYPES.length >= 3);
});

import {
  normalizeIdentityNumber,
  decodeBangladeshNidStructure,
  lookupCompanyReferenceById,
  lookupReportingBossAndApprovers,
  createCustomDesignation,
  INITIAL_DESIGNATION_SUGGESTIONS,
} from './onboardingRules';

test('NID & BDRIS Gateway: Bangla numeral normalization, BBS District Geo-Code decoding & DOB sync', () => {
  // 1. Bangla digits normalize to English digits
  assert.equal(normalizeIdentityNumber('১৯৯৬৩৬১৭৮৪৫১২'), '1996361784512');
  const banglaLookup = lookupCitizenByNidOrBrn('১৯৯৬৩৬১৭৮৪৫১২', 'nid', '1996-04-15');
  assert.ok(banglaLookup);
  assert.equal(banglaLookup.nameBn, 'মোঃ সাইফুল ইসলাম চৌধুরী');

  // 2. 17-digit NID with BBS District Code 26 (Dhaka) and Birth Year 1993
  const dhaka17 = lookupCitizenByNidOrBrn('19932614587963214', 'nid', '1993-09-18');
  assert.ok(dhaka17);
  assert.equal(dhaka17.decodedBbsDistrictCode, '26');
  assert.equal(dhaka17.permanentAddress.districtId, 'dhaka');
  assert.equal(dhaka17.dob, '1993-09-18');

  // 3. 13-digit legacy NID starting with BBS District Code 15 (Chattogram) + DOB 1990-12-05
  const ctg13 = lookupCitizenByNidOrBrn('1514587963214', 'nid', '1990-12-05');
  assert.ok(ctg13);
  assert.equal(ctg13.decodedBbsDistrictCode, '15');
  assert.equal(ctg13.formatted17DigitId, '19901514587963214');
  assert.equal(ctg13.permanentAddress.districtId, 'chattogram');
  assert.equal(ctg13.dob, '1990-12-05');

  const decoded = decodeBangladeshNidStructure('1514587963214', '1990-12-05');
  assert.equal(decoded.bbsDistrictCode, '15');
  assert.equal(decoded.extractedBirthYear, 1990);
});

test('Manual Onboarding: Internal Company Reference Auto-Fill by Employee ID & Reporting Boss / Leave Approver Hierarchy', () => {
  // 1. Verify 4 core Employee Types (Officer, Department Head, Worker, Casual)
  const typeIds = INITIAL_EMPLOYEE_TYPES.map(t => t.id);
  assert.ok(typeIds.includes('type-officer'));
  assert.ok(typeIds.includes('type-hod'));
  assert.ok(typeIds.includes('type-worker'));
  assert.ok(typeIds.includes('type-casual'));

  // 2. Lookup company reference by English ID (e.g., '1003' or first employee in INITIAL_EMPLOYEES)
  const targetEmp = INITIAL_EMPLOYEES[0];
  const refMatchEn = lookupCompanyReferenceById(targetEmp.empId, INITIAL_EMPLOYEES);
  assert.ok(refMatchEn, 'Should find referrer employee by English ID');
  assert.equal(refMatchEn.nameBn, targetEmp.nameBn);
  assert.ok(refMatchEn.sectionName.length > 0);

  // 3. Lookup company reference by Bangla digits
  const banglaEmpId = targetEmp.empId.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  const refMatchBn = lookupCompanyReferenceById(banglaEmpId, INITIAL_EMPLOYEES);
  assert.ok(refMatchBn, 'Should find referrer employee by Bangla numeral ID');
  assert.equal(refMatchBn.empId, targetEmp.empId);
  assert.equal(refMatchBn.nameBn, targetEmp.nameBn);

  // 4. Reporting Boss & Leave Approver Hierarchy resolution
  const hierarchy = lookupReportingBossAndApprovers('casting', INITIAL_EMPLOYEES);
  assert.ok(hierarchy.reportingBossEmpId.length > 0);
  assert.ok(hierarchy.reportingBossNameBn.length > 0);
  assert.ok(hierarchy.leaveApplyToNameBn.length > 0);
  assert.ok(hierarchy.leaveApproverNameBn.length > 0);

  // 5. Designation suggestion bank & custom designation creator
  assert.ok(INITIAL_DESIGNATION_SUGGESTIONS.some(d => d.titleBn.includes('ইঞ্জিনিয়ার')));
  assert.ok(INITIAL_DESIGNATION_SUGGESTIONS.some(d => d.titleBn.includes('অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার')));
  const customDesig = createCustomDesignation('চীফ কিলন ইঞ্জিনিয়ার', 'Chief Kiln Engineer', 'hod');
  assert.equal(customDesig.titleBn, 'চীফ কিলন ইঞ্জিনিয়ার');
  assert.equal(customDesig.category, 'hod');
});



