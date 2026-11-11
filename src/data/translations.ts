/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Complete Bilingual Localization (EN & BN)
 * Conforms to PRD §5.12, UI-Spec §10, and App-Flow F15
 */

import { Locale } from '../types';

export function toBanglaDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, w => bnDigits[+w]);
}

export function formatLocalizedNumber(num: number | string, locale: Locale): string {
  return locale === 'bn' ? toBanglaDigits(num) : String(num);
}

export function formatLocalizedDate(dateStr: string, locale: Locale): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();

  if (locale === 'bn') {
    return `${toBanglaDigits(day)} ${monthsBn[monthIdx]} ${toBanglaDigits(year)}`;
  }
  return `${day} ${monthsEn[monthIdx]} ${year}`;
}

export const TRANSLATIONS = {
  en: {
    // Brand
    brandName: 'CHARU HCM',
    tagline: 'Stylish Living — Smart HR',
    companyName: 'Charu Ceramic Industries Ltd',
    
    // Roles
    role_superAdmin: 'Super Admin',
    role_hrManager: 'HR Manager',
    role_hrExecutive: 'HR Executive',
    role_hod: 'Head of Department (HOD)',
    role_supervisor: 'Section Supervisor',
    role_employee: 'Employee',
    role_accounts: 'Accounts & Finance',

    // Nav
    nav_home: 'Home',
    nav_mySpace: 'My Space',
    nav_workspace: 'Workspace',
    nav_myCharu: 'My Charu',
    nav_attendance: 'Attendance',
    nav_myLog: 'My Log',
    nav_teamGrid: 'Employee Summary',
    nav_manualEntry: 'Manual Attendance',
    nav_leaves: 'Leaves',
    nav_applyLeave: 'Apply Leave',
    nav_leaveBalance: 'Leave Balances',
    nav_leaveRequests: 'Approvals Inbox',
    nav_overtime: 'Overtime',
    nav_schedules: 'Schedules & Roster',
    nav_employees: 'Employees',
    nav_workforceMap: 'Workforce Map',
    nav_analytics: 'Analytics & KPIs',
    nav_reports: 'Reports Hub',
    nav_monthClose: 'Month Close',
    nav_notices: 'Announcements',
    nav_settings: 'Settings & Masters',
    nav_auditLog: 'Audit Trail',
    nav_profile: 'My Profile',
    nav_inbox: 'Inbox',
    nav_checkIn: 'Check-in',
    nav_approvals: 'Approvals',
    nav_more: 'See More ⌄',
    nav_less: 'Show Less ⌃',

    // Statuses
    status_present: 'Present',
    status_late: 'Late',
    status_absent: 'Absent',
    status_leave: 'On Leave',
    status_holiday: 'Holiday',
    status_weeklyOff: 'Weekly Off',
    status_halfDay: 'Half Day',
    status_missingPunch: 'Missing Punch',
    status_pending: 'Pending',
    status_processing: 'Processing',
    status_approved: 'Approved',
    status_rejected: 'Rejected',
    status_cancelled: 'Cancelled',
    status_locked: 'Locked',
    status_open: 'Open',

    // Actions & Buttons
    btn_checkIn: 'Check In',
    btn_checkOut: 'Check Out',
    btn_requestAdjustment: 'Request Adjustment',
    btn_applyLeave: 'Apply for Leave',
    btn_approve: 'Approve',
    btn_reject: 'Reject',
    btn_cancel: 'Cancel',
    btn_submit: 'Submit Request',
    btn_save: 'Save',
    btn_saveNext: 'Save & Next',
    btn_export: 'Export Data',
    btn_exportSalary: 'Export Salary Sheet',
    btn_lockMonth: 'Lock Month',
    btn_reopenMonth: 'Reopen Month',
    btn_addEmployee: '+ New Employee',
    btn_filter: 'Filters',
    btn_viewEmployees: 'View Employees',
    btn_sharePoster: 'Share Poster',
    btn_viewDetails: 'View Details',
    btn_markReviewed: 'Mark Reviewed',
    btn_downloadXlsx: 'Download Excel (XLSX)',
    btn_downloadCsv: 'Download CSV',

    // Dashboard Cards & KPIs
    kpi_headcount: 'Active Headcount',
    kpi_presentToday: 'Present Today',
    kpi_lateToday: 'Late Today',
    kpi_absentToday: 'Absent Today',
    kpi_onLeaveToday: 'On Leave Today',
    kpi_attendanceRate: 'Attendance Rate',
    kpi_punctualityRate: 'Punctuality Rate',
    kpi_absenteeismRate: 'Absenteeism Rate',
    kpi_overtimeHours: 'Total OT Hours',
    kpi_pendingApprovals: 'Pending Approvals',
    today_shift: 'Today Shift',
    reveal_leave_balance: 'Tap to view leave balance',
    hide_leave_balance: 'Tap to hide balance',
    perfect_attendance_streak: 'Perfect Attendance Streak',
    days_streak: 'days consecutive',

    // Workforce Map
    map_overline: 'WORKFORCE MAP',
    map_headline: 'Where Our People Come From',
    map_coverage: 'Districts Covered',
    map_coverage_text: 'of 64 Bangladesh districts covered',
    map_permanent: 'Permanent Address',
    map_present: 'Present Address',
    map_metric_pct: 'Percentage (%)',
    map_metric_count: 'Headcount (Persons)',
    map_top_districts: 'Top Districts by Employee Share',
    map_not_set: 'District not recorded',
    map_tap_instruction: 'Pinch to zoom or tap any district to inspect workforce breakdown',
    map_sanitized_notice: 'Districts with under 5 staff are grouped into "Others" for privacy.',

    // Analytics Tabs
    tab_overview: 'Overview',
    tab_attendance: 'Attendance',
    tab_leave: 'Leave Health',
    tab_leaveIndicator: 'Leave Indicator',
    tab_performance: 'Performance & ADS',
    tab_myInsights: 'My Insights',

    // Attendance & Adjustments
    late_chip_text: 'Late by',
    minutes: 'min',
    punch_timeline: 'Daily Punch Log',
    first_in: 'Check-In (First Punch)',
    last_out: 'Check-Out (Last Punch)',
    worked_hours: 'Worked Hours',
    adjustment_reason_label: 'Reason for Adjustment (Required)',
    adjustment_type_label: 'Adjustment Category',
    adj_late_withdrawal: 'Late Arrival Withdrawal',
    adj_missing_in: 'Missing IN Punch Fix',
    adj_missing_out: 'Missing OUT Punch Fix',
    adj_explanation_note: 'Decision Note (Required on rejection)',

    // Common
    loading: 'Loading...',
    no_records: 'No records found',
    search_placeholder: 'Search employee by ID, name or phone...',
    all_departments: 'All Departments',
    all_shifts: 'All Shifts',
    all_statuses: 'All Statuses',
    switch_view: 'Switch View',
    mobile_preview: 'Mobile View',
    web_admin: 'Web Cockpit',
  },
  bn: {
    // Brand
    brandName: 'চারু এইচসিএম',
    tagline: 'স্টাইলিশ লিভিং — স্মার্ট এইচআর',
    companyName: 'চারু সিরামিক ইন্ডাস্ট্রিজ লিমিটেড',

    // Roles
    role_superAdmin: 'সুপার অ্যাডমিন',
    role_hrManager: 'এইচআর ম্যানেজার',
    role_hrExecutive: 'এইচআর এক্সিকিউটিভ',
    role_hod: 'বিভাগীয় প্রধান (HOD)',
    role_supervisor: 'সেকশন সুপারভাইজার',
    role_employee: 'কর্মী / কর্মকর্তা',
    role_accounts: 'হিসাব ও অর্থ বিভাগ',

    // Nav
    nav_home: 'হোম',
    nav_mySpace: 'মাই স্পেস',
    nav_workspace: 'ওয়ার্কস্পেস',
    nav_myCharu: 'আমার চারু',
    nav_attendance: 'হাজিরা',
    nav_myLog: 'আমার হাজিরা',
    nav_teamGrid: 'টিম হাজিরা গ্রিড',
    nav_manualEntry: 'ম্যানুয়াল হাজিরা এন্ট্রি',
    nav_leaves: 'ছুটি',
    nav_applyLeave: 'ছুটির আবেদন',
    nav_leaveBalance: 'ছুটির ব্যালেন্স',
    nav_leaveRequests: 'অনুমোদন ইনবক্স',
    nav_overtime: 'ওভারটাইম (OT)',
    nav_schedules: 'রোস্টার ও শিফট',
    nav_employees: 'কর্মী তালিকা',
    nav_workforceMap: 'কর্মী মানচিত্র',
    nav_analytics: 'বিশ্লেষণ ও ড্যাশবোর্ড',
    nav_reports: 'রিপোর্ট হাব',
    nav_monthClose: 'মাস ক্লোজ ও বেতন ইনপুট',
    nav_notices: 'নোটিশ বোর্ড',
    nav_settings: 'সেটিংস ও মাস্টার্স',
    nav_auditLog: 'অডিট লগ',
    nav_profile: 'আমার প্রোফাইল',
    nav_inbox: 'ইনবক্স',
    nav_checkIn: 'চেক-ইন',
    nav_approvals: 'অনুমোদন',
    nav_more: 'আরো দেখুন ⌄',
    nav_less: 'সংক্ষিপ্ত করুন ⌃',

    // Statuses
    status_present: 'উপস্থিত',
    status_late: 'দেরি (Late)',
    status_absent: 'অনুপস্থিত',
    status_leave: 'ছুটিতে',
    status_holiday: 'সরকারি ছুটি',
    status_weeklyOff: 'সাপ্তাহিক ছুটি',
    status_halfDay: 'অর্ধ দিবস',
    status_missingPunch: 'পাঞ্চ মিসিং',
    status_pending: 'অপেক্ষমাণ',
    status_processing: 'প্রক্রিয়াদীন',
    status_approved: 'অনুমোদিত',
    status_rejected: 'প্রত্যাখ্যাত',
    status_cancelled: 'বাতিলকৃত',
    status_locked: 'লক করা',
    status_open: 'চলমান',

    // Actions & Buttons
    btn_checkIn: 'চেক-ইন করুন',
    btn_checkOut: 'চেক-আউট করুন',
    btn_requestAdjustment: 'সংশোধনের আবেদন',
    btn_applyLeave: 'ছুটির আবেদন জমা দিন',
    btn_approve: 'অনুমোদন করুন',
    btn_reject: 'প্রত্যাখ্যান করুন',
    btn_cancel: 'বাতিল',
    btn_submit: 'আবেদন প্রেরণ করুন',
    btn_save: 'সংরক্ষণ',
    btn_saveNext: 'সংরক্ষণ ও পরবর্তী',
    btn_export: 'এক্সপোর্ট',
    btn_exportSalary: 'স্যালারি শীট ইনপুট এক্সপোর্ট',
    btn_lockMonth: 'মাস লক করুন',
    btn_reopenMonth: 'মাস পুনরায় খুলুন',
    btn_addEmployee: '+ নতুন কর্মী যোগ করুন',
    btn_filter: 'ফিল্টার',
    btn_viewEmployees: 'কর্মী তালিকা দেখুন',
    btn_sharePoster: 'পোস্টার শেয়ার করুন',
    btn_viewDetails: 'বিস্তারিত দেখুন',
    btn_markReviewed: 'পর্যালোচিত চিহ্নিত করুন',
    btn_downloadXlsx: 'ডাউনলোড এক্সেল (XLSX)',
    btn_downloadCsv: 'ডাউনলোড সিএসভি (CSV)',

    // Dashboard Cards & KPIs
    kpi_headcount: 'মোট সক্রিয় কর্মী',
    kpi_presentToday: 'আজকের উপস্থিতি',
    kpi_lateToday: 'আজ দেরিতে আগমন',
    kpi_absentToday: 'আজ অনুপস্থিত',
    kpi_onLeaveToday: 'আজ ছুটিতে',
    kpi_attendanceRate: 'গড় উপস্থিতি হার',
    kpi_punctualityRate: 'সময়ানুবর্তিতা হার',
    kpi_absenteeismRate: 'অনুপস্থিতির হার',
    kpi_overtimeHours: 'মোট ওভারটাইম ঘণ্টা',
    kpi_pendingApprovals: 'অপেক্ষমাণ অনুমোদন',
    today_shift: 'আজকের শিফট',
    reveal_leave_balance: 'আমার ছুটির ব্যালেন্স দেখুন',
    hide_leave_balance: 'ব্যালেন্স লুকান',
    perfect_attendance_streak: 'ধারাবাহিক নিখুঁত হাজিরা',
    days_streak: 'দিন একটানা',

    // Workforce Map
    map_overline: 'WORKFORCE MAP · কর্মী মানচিত্র',
    map_headline: 'আমাদের কর্মী, আমাদের বাংলাদেশ',
    map_coverage: 'জেলা কভারেজ',
    map_coverage_text: '৬৪টি জেলার মধ্যে কর্মী কভার হয়েছে',
    map_permanent: 'স্থায়ী ঠিকানা',
    map_present: 'বর্তমান ঠিকানা',
    map_metric_pct: 'শতাংশ (%)',
    map_metric_count: 'কর্মী সংখ্যা (জন)',
    map_top_districts: 'শীর্ষ জেলাভিত্তিক কর্মীর অনুপাত',
    map_not_set: 'ঠিকানা তথ্য যুক্ত নেই',
    map_tap_instruction: 'মানচিত্রে জুম করুন অথবা জেলায় ট্যাপ করে কর্মীদের পরিসংখ্যান দেখুন',
    map_sanitized_notice: 'গোপনীয়তা রক্ষার্থে ৫ জনের কম কর্মীর জেলাগুলো "অন্যান্য" বিভাগে দেখানো হয়েছে।',

    // Analytics Tabs
    tab_overview: 'ওভারভিউ',
    tab_attendance: 'হাজিরা ও পাঞ্চ',
    tab_leave: 'ছুটির স্বাস্থ্য',
    tab_leaveIndicator: 'লিভ ইন্ডিকেটর',
    tab_performance: 'পারফরম্যান্স ও এডিএস',
    tab_myInsights: 'আমার বিশ্লেষণ',

    // Attendance & Adjustments
    late_chip_text: 'দেরি হয়েছে',
    minutes: 'মিনিট',
    punch_timeline: 'দৈনিক পাঞ্চ রেকর্ড',
    first_in: 'ইন পাঞ্চ (প্রথম আগমন)',
    last_out: 'আউট পাঞ্চ (সর্বশেষ প্রস্থান)',
    worked_hours: 'মোট কাজের সময়',
    adjustment_reason_label: 'দেরি বা পাঞ্চ সংশোধনের কারণ (বাধ্যতামূলক)',
    adjustment_type_label: 'সংশোধনের ধরন',
    adj_late_withdrawal: 'দেরি প্রত্যাহার (Late Withdrawal)',
    adj_missing_in: 'ইন পাঞ্চ মিসিং সংশোধন',
    adj_missing_out: 'আউট পাঞ্চ মিসিং সংশোধন',
    adj_explanation_note: 'সিদ্ধান্তের মন্তব্য (প্রত্যাখ্যানের ক্ষেত্রে আবশ্যক)',

    // Common
    loading: 'লোড হচ্ছে...',
    no_records: 'কোনো তথ্য পাওয়া যায়নি',
    search_placeholder: 'আইডি, নাম বা মোবাইল নম্বর দিয়ে খুঁজুন...',
    all_departments: 'সকল বিভাগ',
    all_shifts: 'সকল শিফট',
    all_statuses: 'সকল স্ট্যাটাস',
    switch_view: 'ভিউ পরিবর্তন',
    mobile_preview: 'মোবাইল সুপার-অ্যাপ',
    web_admin: 'ওয়েব অ্যাডমিন ককপিট',
  },
};
