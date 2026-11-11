/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Dynamic Role & Permission Matrix Data & Helpers
 * Allows granular power distribution between Admin, HOD, and Employee
 */

import { Role } from '../types';

export type HierarchyRole = 'admin' | 'hod' | 'employee';

export interface PermissionDefinition {
  id: string;
  category:
    | 'attendance'
    | 'adjustments'
    | 'leaves'
    | 'overtime'
    | 'employees'
    | 'payroll'
    | 'system';
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  badge?: string;
}

export interface PermissionCategoryInfo {
  id: PermissionDefinition['category'];
  titleEn: string;
  titleBn: string;
  icon: string;
}

export const PERMISSION_CATEGORIES: PermissionCategoryInfo[] = [
  {
    id: 'attendance',
    titleEn: 'Attendance & Time Tracking',
    titleBn: 'উপস্থিতি ও সময় পর্যবেক্ষণ',
    icon: 'Clock',
  },
  {
    id: 'adjustments',
    titleEn: 'Late & Punch Adjustments',
    titleBn: 'লেট ও পাঞ্চ সমন্বয় (কারেকশন)',
    icon: 'Edit3',
  },
  {
    id: 'leaves',
    titleEn: 'Leave Management',
    titleBn: 'ছুটি ব্যবস্থাপনা ও অনুমোদন',
    icon: 'Calendar',
  },
  {
    id: 'overtime',
    titleEn: 'Overtime & Duty Rostering',
    titleBn: 'ওভারটাইম ও ডিউটি রোস্টার',
    icon: 'Award',
  },
  {
    id: 'employees',
    titleEn: 'Employee Management & Profiles',
    titleBn: 'কর্মী ব্যবস্থাপনা ও প্রোফাইল',
    icon: 'Users',
  },
  {
    id: 'payroll',
    titleEn: 'Month Close & Salary Input Report',
    titleBn: 'মাস ক্লোজ ও বেতন শিট রিপোর্ট',
    icon: 'FileSpreadsheet',
  },
  {
    id: 'system',
    titleEn: 'System, Biometrics & Permissions',
    titleBn: 'সিস্টেম, ডিভাইস ও ক্ষমতা নিয়ন্ত্রণ',
    icon: 'Shield',
  },
];

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // 1. Attendance & Time Tracking
  {
    id: 'view_own_attendance',
    category: 'attendance',
    nameEn: 'View Own Attendance Log',
    nameBn: 'নিজের উপস্থিতি লগ ও পাঞ্চ হিস্ট্রি দেখা',
    descriptionEn: 'Access daily check-in hero, punch timeline, and personal late chips',
    descriptionBn: 'নিজের দৈনিক উপস্থিতি কার্ড, পাঞ্চ টাইমলাইন ও লেটের মিনিট দেখা',
  },
  {
    id: 'view_team_attendance',
    category: 'attendance',
    nameEn: 'View Team / Department Summary Grid',
    nameBn: 'বিভাগ ও দলের উপস্থিতি গ্রিড দেখা',
    descriptionEn: 'View attendance matrix with status filters across department employees',
    descriptionBn: 'বিভাগের কর্মীদের তারিখভিত্তিক উপস্থিতি ছক ও স্ট্যাটাস দেখা',
  },
  {
    id: 'manual_attendance_entry',
    category: 'attendance',
    nameEn: 'HR Manual Attendance Entry',
    nameBn: 'ম্যানুয়াল উপস্থিতি এন্ট্রি ও পাঞ্চ ইনসার্ট',
    descriptionEn: 'Manually insert or override biometric attendance punches with mandatory audit reason',
    descriptionBn: 'অডিট কারণ উল্লেখ করে ম্যানুয়ালি উপস্থিতি রেকর্ড ও পাঞ্চ তৈরি করা',
    badge: 'Admin Power',
  },
  {
    id: 'export_attendance_sheet',
    category: 'attendance',
    nameEn: 'Export Attendance Reports',
    nameBn: 'উপস্থিতি শিট ও রিপোর্ট ডাউনলোড করা',
    descriptionEn: 'Download CSV / Excel export of team or department attendance',
    descriptionBn: 'উপস্থিতির এক্সেল বা সিএসভি শিট ডাউনলোড করা',
  },
  {
    id: 'view_biometric_logs',
    category: 'attendance',
    nameEn: 'View Raw Biometric Device Logs (Last 30 Days)',
    nameBn: 'বায়োমেট্রিক ডিভাইসের রিয়েলটাইম পাঞ্চ লগ দেখা (গত ৩০ দিন)',
    descriptionEn: 'Inspect raw device check-in/out timestamps, terminal IPs, and verification modes across factory scanners',
    descriptionBn: 'কারখানার সকল ফিঙ্গারপ্রিন্ট ও ফেস স্ক্যানারের কাঁচা (raw) পাঞ্চ ডাটা ও আইপি দেখা',
    badge: 'Admin & HOD',
  },

  // 2. Late & Punch Adjustments
  {
    id: 'request_late_withdrawal',
    category: 'adjustments',
    nameEn: 'Request Late Withdrawal Adjustment',
    nameBn: 'লেট প্রত্যাহারের আবেদন জমা দেওয়া',
    descriptionEn: 'Submit reason and evidence to withdraw late arrival mark for eligible shift',
    descriptionBn: 'দেরিতে উপস্থিতির জন্য কারণ ও প্রমাণসহ লেট প্রত্যাহারের আবেদন করা',
  },
  {
    id: 'hod_approve_adjustment',
    category: 'adjustments',
    nameEn: 'HOD Late Adjustment Review & Recommendation',
    nameBn: 'এইচওডি লেট সমন্বয় প্রাথমিক অনুমোদন/সুপারিশ',
    descriptionEn: 'Initial departmental power: review reason, add comment, and recommend approval/rejection',
    descriptionBn: 'বিভাগীয় প্রধান হিসেবে কর্মীর লেট প্রত্যাহার পর্যালোচনা ও সুপারিশ অনুমোদন করা',
    badge: 'HOD Power',
  },
  {
    id: 'hr_approve_adjustment',
    category: 'adjustments',
    nameEn: 'HR Final Adjustment Execution',
    nameBn: 'এইচআর চূড়ান্ত সমন্বয় অনুমোদন ও লেট ক্লিয়ারেন্স',
    descriptionEn: 'Final approval authority: recalculate status to Present, clear red late mark, and log audit',
    descriptionBn: 'এইচআর হিসেবে চূড়ান্ত অনুমোদন দিয়ে স্ট্যাটাস প্রেজেন্টে রূপান্তর ও লাল দাগ মুক্ত করা',
    badge: 'Admin Power',
  },

  // 3. Leave Management
  {
    id: 'apply_personal_leave',
    category: 'leaves',
    nameEn: 'Apply for Personal Leave',
    nameBn: 'নিজের ছুটির আবেদন করা (CL/SL/EL)',
    descriptionEn: 'Submit leave request with date range, reason, and attachment with quota validation',
    descriptionBn: 'কোটা যাচাই সাপেক্ষে তারিখ ও কারণ উল্লেখ করে ছুটির আবেদন করা',
  },
  {
    id: 'view_leave_quota',
    category: 'leaves',
    nameEn: 'View Leave Quota Balances',
    nameBn: 'ছুটির ব্যালেন্স ও প্রাপ্ত কোটা দেখা',
    descriptionEn: 'Inspect entitled, used, carried forward, and pending leave balances',
    descriptionBn: 'বার্ষিক মোট ছুটি, ব্যবহৃত দিন ও বাকি ব্যালেন্স পর্যবেক্ষণ করা',
  },
  {
    id: 'hod_approve_leave',
    category: 'leaves',
    nameEn: 'HOD Leave Approval (Department Members)',
    nameBn: 'এইচওডি বিভাগীয় কর্মীর ছুটি অনুমোদন ও বাতিল',
    descriptionEn: 'Primary departmental managerial power: approve or reject leave requests from direct reports',
    descriptionBn: 'বিভাগীয় প্রধান হিসেবে নিজ দলের কর্মীদের ছুটির আবেদন অনুমোদন বা বাতিল করা',
    badge: 'HOD Power',
  },
  {
    id: 'hr_approve_leave',
    category: 'leaves',
    nameEn: 'HR Final Leave Approval & Roster Sync',
    nameBn: 'এইচআর চূড়ান্ত ছুটি অনুমোদন ও রোস্টার আপডেট',
    descriptionEn: 'Execute multi-level final approval, deduct quota, and mark roster as Leave',
    descriptionBn: 'এইচআর কর্তৃক চূড়ান্ত অনুমোদন, কোটা কর্তন ও উপস্থিতিতে ছুটি মার্ক করা',
    badge: 'Admin Power',
  },
  {
    id: 'adjust_leave_quota',
    category: 'leaves',
    nameEn: 'Manage & Adjust Leave Quotas',
    nameBn: 'ছুটির কোটা নির্ধারণ ও ব্যালেন্স সমন্বয়',
    descriptionEn: 'Add emergency compensatory quotas or adjust carried-over balances',
    descriptionBn: 'কর্মীদের ছুটির কোটা বাড়ানো, কমানো বা সমন্বয় করা',
    badge: 'Admin Power',
  },

  // 4. Overtime & Duty Rostering
  {
    id: 'view_own_overtime',
    category: 'overtime',
    nameEn: 'View Own Overtime Hours',
    nameBn: 'নিজের ওভারটাইম মিনিট ও হিসাব দেখা',
    descriptionEn: 'Track eligible overtime hours calculated from shift end time',
    descriptionBn: 'নিজের অনুমোদিত ও অপেক্ষমাণ ওভারটাইম ঘণ্টা পর্যবেক্ষণ করা',
  },
  {
    id: 'hod_verify_overtime',
    category: 'overtime',
    nameEn: 'HOD Overtime Verification & Minute Adjustment',
    nameBn: 'এইচওডি ওভারটাইম মিনিট যাচাই ও অনুমোদন',
    descriptionEn: 'Department power: inspect automated biometric OT minutes, modify if needed, and recommend',
    descriptionBn: 'কারখানার কর্মীদের কাজের প্রকৃত সময় দেখে ওভারটাইম অনুমোদন বা মিনিট পরিবর্তন করা',
    badge: 'HOD Power',
  },
  {
    id: 'hr_authorize_overtime',
    category: 'overtime',
    nameEn: 'HR Overtime Payroll Authorization',
    nameBn: 'এইচআর ওভারটাইম চূড়ান্ত অনুমোদন ও বেতন সিঙ্ক',
    descriptionEn: 'Finalize approved overtime hours for salary computation and close monthly sheet',
    descriptionBn: 'বেতনের জন্য চূড়ান্ত ওভারটাইম অনুমোদন ও পে-রোল সিঙ্ক করা',
    badge: 'Admin Power',
  },
  {
    id: 'manage_shifts_roster',
    category: 'overtime',
    nameEn: 'Manage Shifts & Weekly Off Rosters',
    nameBn: 'শিফট কনফিগারেশন ও সাপ্তাহিক ছুটি রোস্টার পরিবর্তন',
    descriptionEn: 'Configure factory shifts (General, Shift A, Shift B, Night) and assign weekly offs',
    descriptionBn: 'কারখানার শিফট শিডিউল পরিবর্তন এবং কর্মীদের সাপ্তাহিক ছুটি বরাদ্দ করা',
    badge: 'Admin Power',
  },

  // 5. Employee Management & Profiles
  {
    id: 'view_own_profile',
    category: 'employees',
    nameEn: 'View Own Profile & Documents',
    nameBn: 'নিজের প্রোফাইল ও নথি দেখা',
    descriptionEn: 'Inspect personal job details, emergency contacts, and assigned shift',
    descriptionBn: 'নিজের ব্যক্তিগত তথ্য, জরুরি যোগাযোগ ও কর্মসংস্থান বিবরণ দেখা',
  },
  {
    id: 'view_employee_directory',
    category: 'employees',
    nameEn: 'View Employee Directory & Team Lists',
    nameBn: 'সকল কর্মী তালিকা ও ডিপার্টমেন্ট ডিরেক্টরি দেখা',
    descriptionEn: 'Search and inspect team members, designations, and department roster',
    descriptionBn: 'কর্মীদের নাম, পদবী, মোবাইল ও ডিপার্টমেন্টের তালিকা দেখা',
  },
  {
    id: 'register_new_employee',
    category: 'employees',
    nameEn: 'Register New Employee (6-Step Wizard)',
    nameBn: 'নতুন কর্মী নিবন্ধন ও অনবোর্ডিং (৬ ধাপের ফরম)',
    descriptionEn: 'Complete onboarding with personal info, 64-district geo-address, shift, and documents',
    descriptionBn: 'নতুন কর্মীর ব্যক্তিগত, ৬৪ জেলা ঠিকানা, পদবী ও নথিপত্র যুক্ত করা',
    badge: 'Admin Power',
  },
  {
    id: 'edit_employee_details',
    category: 'employees',
    nameEn: 'Edit Employee Job & Designation Details',
    nameBn: 'কর্মীর পদবী, বিভাগ ও তথ্য এডিট বা পরিবর্তন',
    descriptionEn: 'Update employment status, department assignment, grade, and reporting managers',
    descriptionBn: 'কর্মীর বিভাগ বদলি, পদবী ও কর্মসংস্থান তথ্য হালনাগাদ করা',
    badge: 'Admin Power',
  },
  {
    id: 'view_restricted_bank_salary',
    category: 'employees',
    nameEn: 'Access Restricted Bank & Salary Info',
    nameBn: 'গোপনীয় ব্যাংক অ্যাকাউন্ট ও বেতন তথ্য দেখা',
    descriptionEn: 'Strict HR security gate for confidential bank numbers, routing codes, and basic salary',
    descriptionBn: 'কর্মীর ব্যাংক অ্যাকাউন্ট নম্বর ও বেতন সংক্রান্ত গোপনীয় তথ্য দেখা',
    badge: 'Admin Power',
  },

  // 6. Month Close & Salary Reports
  {
    id: 'view_salary_sheet_export',
    category: 'payroll',
    nameEn: 'View & Download Salary Sheet Export (P/A/L/H/W/LT)',
    nameBn: 'বেতন শিট ইনপুট রিপোর্ট দেখা ও ডাউনলোড',
    descriptionEn: 'Generate monthly attendance summary with working days, leaves, and late deductions',
    descriptionBn: 'মাসিক কাজের দিন, ছুটি ও লেটের কলামসহ বেতন শিট তৈরি করা',
    badge: 'HOD / Admin',
  },
  {
    id: 'execute_month_lock',
    category: 'payroll',
    nameEn: 'Execute Official Month Lock & Reopen',
    nameBn: 'মাসের উপস্থিতি লক ও পুনরায় উন্মুক্ত করা',
    descriptionEn: 'Lock attendance records to prevent retro changes before payroll, or reopen with reason',
    descriptionBn: 'বেতন তৈরির আগে মাস লক করে অতীত পরিবর্তন বন্ধ করা বা জরুরি কারণে খোলা',
    badge: 'Admin Power',
  },
  {
    id: 'view_analytics_cockpit',
    category: 'payroll',
    nameEn: 'View Executive Analytics Noir Cockpit',
    nameBn: 'এক্সিকিউটিভ এনালিটিক্স ও ড্যাশবোর্ড দেখা',
    descriptionEn: 'Explore 12-month attendance wave chart, status donut, and arrival histograms',
    descriptionBn: '১২ মাসের উপস্থিতি ওয়েভ চার্ট, লেট প্যাটার্ন ও ড্যাশবোর্ড দেখা',
  },

  // 7. System, Biometrics & Permissions
  {
    id: 'view_notices',
    category: 'system',
    nameEn: 'View Company Notice Board',
    nameBn: 'কোম্পানি নোটিশ বোর্ড ও ঘোষণা দেখা',
    descriptionEn: 'Read official circulars, pinned notices, and holiday announcements',
    descriptionBn: 'অফিসের জরুরি বিজ্ঞপ্তি, নোটিশ ও ছুটির তালিকা দেখা',
  },
  {
    id: 'publish_notices',
    category: 'system',
    nameEn: 'Publish & Pin Official Notices',
    nameBn: 'নতুন নোটিশ তৈরি ও পিন করে প্রকাশ করা',
    descriptionEn: 'Draft, publish, and target announcements to all or specific factory departments',
    descriptionBn: 'কারখানা বা হেড অফিসের কর্মীদের জন্য নতুন নোটিশ জারি করা',
    badge: 'Admin Power',
  },
  {
    id: 'manage_zkteco_devices',
    category: 'system',
    nameEn: 'Configure ZKTeco Biometric Devices',
    nameBn: 'জেডকেটেকো বায়োমেট্রিক ডিভাইস ব্রিজ ও হার্টবিট কনফিগারেশন',
    descriptionEn: 'Monitor biometric hardware, manual sync push, and heartbeat connectivity',
    descriptionBn: 'ফিঙ্গারপ্রিন্ট ডিভাইসের সংযোগ পর্যবেক্ষণ ও ম্যানুয়াল সিঙ্ক করা',
    badge: 'Admin Power',
  },
  {
    id: 'view_audit_trail',
    category: 'system',
    nameEn: 'View Immutable Audit Trail',
    nameBn: 'অপরিবর্তনীয় অডিট লগ ও কার্যকলাপ পর্যবেক্ষণ',
    descriptionEn: 'Inspect comprehensive audit logs of all manual entries, adjustments, and approvals',
    descriptionBn: 'সিস্টেমের সকল অনুমোদন, বাতিল ও এন্ট্রি পরিবর্তনের ইতিহাস দেখা',
    badge: 'Admin Power',
  },
  {
    id: 'manage_role_permissions',
    category: 'system',
    nameEn: 'Role Permission Distribution Control',
    nameBn: 'ভূমিকা ও ক্ষমতা বণ্টন নিয়ন্ত্রণ (পারমিশন প্যানেল)',
    descriptionEn: 'Check and uncheck powers for Admin, HOD, and Employee in real-time',
    descriptionBn: 'অ্যাডমিন, এইচওডি ও এমপ্লয়ীর ক্ষমতা চেকবক্সের মাধ্যমে ডিস্ট্রিবিউট করা',
    badge: 'Admin Only',
  },
];

export type RolePermissionMap = Record<HierarchyRole, Record<string, boolean>>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMap = {
  // 1. HR ADMIN: Has ALL powers enabled by default
  admin: {
    view_own_attendance: true,
    view_team_attendance: true,
    manual_attendance_entry: true,
    export_attendance_sheet: true,
    view_biometric_logs: true,
    request_late_withdrawal: true,
    hod_approve_adjustment: true,
    hr_approve_adjustment: true,
    apply_personal_leave: true,
    view_leave_quota: true,
    hod_approve_leave: true,
    hr_approve_leave: true,
    adjust_leave_quota: true,
    view_own_overtime: true,
    hod_verify_overtime: true,
    hr_authorize_overtime: true,
    manage_shifts_roster: true,
    view_own_profile: true,
    view_employee_directory: true,
    register_new_employee: true,
    edit_employee_details: true,
    view_restricted_bank_salary: true,
    view_salary_sheet_export: true,
    execute_month_lock: true,
    view_analytics_cockpit: true,
    view_notices: true,
    publish_notices: true,
    manage_zkteco_devices: true,
    view_audit_trail: true,
    manage_role_permissions: true,
  },

  // 2. HOD: Managerial powers (Approve leaves, verify adjustments, check OT, view directory, view team attendance)
  hod: {
    view_own_attendance: true,
    view_team_attendance: true,
    manual_attendance_entry: false, // Only HR
    export_attendance_sheet: true,
    view_biometric_logs: true, // Authorized HOD power to inspect machine logs
    request_late_withdrawal: true,
    hod_approve_adjustment: true, // HOD initial recommendation
    hr_approve_adjustment: false,
    apply_personal_leave: true,
    view_leave_quota: true,
    hod_approve_leave: true, // HOD approve leaves
    hr_approve_leave: false,
    adjust_leave_quota: false,
    view_own_overtime: true,
    hod_verify_overtime: true, // HOD verify overtime
    hr_authorize_overtime: false,
    manage_shifts_roster: false,
    view_own_profile: true,
    view_employee_directory: true,
    register_new_employee: false,
    edit_employee_details: false,
    view_restricted_bank_salary: false,
    view_salary_sheet_export: false,
    execute_month_lock: false,
    view_analytics_cockpit: true,
    view_notices: true,
    publish_notices: false,
    manage_zkteco_devices: false,
    view_audit_trail: false,
    manage_role_permissions: false,
  },

  // 3. EMPLOYEE: Self-service features only
  employee: {
    view_own_attendance: true,
    view_team_attendance: false,
    manual_attendance_entry: false,
    export_attendance_sheet: false,
    view_biometric_logs: false,
    request_late_withdrawal: true,
    hod_approve_adjustment: false,
    hr_approve_adjustment: false,
    apply_personal_leave: true,
    view_leave_quota: true,
    hod_approve_leave: false,
    hr_approve_leave: false,
    adjust_leave_quota: false,
    view_own_overtime: true,
    hod_verify_overtime: false,
    hr_authorize_overtime: false,
    manage_shifts_roster: false,
    view_own_profile: true,
    view_employee_directory: false,
    register_new_employee: false,
    edit_employee_details: false,
    view_restricted_bank_salary: false,
    view_salary_sheet_export: false,
    execute_month_lock: false,
    view_analytics_cockpit: false,
    view_notices: true,
    publish_notices: false,
    manage_zkteco_devices: false,
    view_audit_trail: false,
    manage_role_permissions: false,
  },
};

/**
 * Maps system Role into one of the 3 primary hierarchy levels: admin, hod, employee
 */
export function getHierarchyRole(role: Role): HierarchyRole {
  if (['superAdmin', 'hrManager', 'hrExecutive'].includes(role)) {
    return 'admin';
  }
  if (['hod', 'supervisor'].includes(role)) {
    return 'hod';
  }
  return 'employee';
}

/**
 * Checks if a specific role possesses a permission
 */
export function hasPermission(
  permissionsMap: RolePermissionMap,
  role: Role | HierarchyRole,
  permissionKey: string
): boolean {
  const hRole = ['admin', 'hod', 'employee'].includes(role as string)
    ? (role as HierarchyRole)
    : getHierarchyRole(role as Role);

  const rolePerms = permissionsMap[hRole];
  if (!rolePerms) return false;
  return rolePerms[permissionKey] === true;
}

/**
 * Toggles a single permission for a role
 */
export function toggleRolePermission(
  currentMap: RolePermissionMap,
  role: HierarchyRole,
  permissionKey: string
): RolePermissionMap {
  const rolePerms = currentMap[role] || {};
  const currentVal = rolePerms[permissionKey] ?? false;

  return {
    ...currentMap,
    [role]: {
      ...rolePerms,
      [permissionKey]: !currentVal,
    },
  };
}

/**
 * Bulk sets all permissions for a role (Select All / Deselect All)
 */
export function setAllPermissionsForRole(
  currentMap: RolePermissionMap,
  role: HierarchyRole,
  value: boolean
): RolePermissionMap {
  const updatedRolePerms: Record<string, boolean> = {};
  ALL_PERMISSIONS.forEach(p => {
    // Keep manage_role_permissions true for admin so they don't lock themselves out
    if (role === 'admin' && p.id === 'manage_role_permissions') {
      updatedRolePerms[p.id] = true;
    } else {
      updatedRolePerms[p.id] = value;
    }
  });

  return {
    ...currentMap,
    [role]: updatedRolePerms,
  };
}
