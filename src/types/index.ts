/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — TypeScript Data Models matching Schema.md
 */

export type Role =
  | 'superAdmin'
  | 'hrManager'
  | 'hrExecutive'
  | 'hod'
  | 'supervisor'
  | 'employee'
  | 'accounts';

export type Locale = 'en' | 'bn';

export type EmployeeStatus = 'active' | 'inactive' | 'onLeave' | 'separated';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'leave'
  | 'holiday'
  | 'weeklyOff'
  | 'halfDay'
  | 'missingPunch';

export interface UserSession {
  uid: string;
  empId: string;
  nameEn: string;
  nameBn: string;
  email: string;
  role: Role;
  deptIds: string[];
  deptNameEn: string;
  deptNameBn: string;
  avatarUrl: string;
  locale: Locale;
  active: boolean;
  mustChangePassword?: boolean;
}

export interface AddressBlock {
  divisionId: string;
  districtId: string;
  upazila: string;
  details: string;
}

export interface Employee {
  empId: string;
  deviceCode: string;
  nameEn: string;
  nameBn: string;
  photoUrl: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  phone: string;
  workEmail: string;
  address: {
    permanent: AddressBlock;
    present: AddressBlock;
  };
  homeDistrictId: string;
  employment: {
    joinDate: string;
    confirmationDate?: string | null;
    type: 'permanent' | 'probation' | 'contract' | 'worker' | 'intern';
    deptId: string;
    deptName: string;
    sectionId: string;
    sectionName: string;
    designationId: string;
    designationName: string;
    gradeId: string;
    locationId: string;
    managerEmpId: string;
    hodEmpId: string;
  };
  schedule: {
    defaultShiftId: string;
    weeklyOff: {
      mode: 'weekday' | 'custom';
      weekday: number; // 0=Sun..6=Sat (Friday=5)
      customDates?: string[];
    };
    weeklyOffUpdatedBy?: string;
  };
  status: EmployeeStatus;
  separation?: {
    date: string | null;
    reason: string | null;
  };
  privateInfo?: {
    nid: string;
    bloodGroup: string;
    bank: {
      bankName: string;
      branch: string;
      accountNo: string;
      routing: string;
    };
    family: Array<{ name: string; relation: string; phone: string }>;
    emergencyContact: { name: string; phone: string };
    salary: { gross: number; basic: number; structureId: string };
  };
  isActive: boolean;
  searchKeywords?: string[];
  fatherNameBn?: string;
  fatherNameEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  idDocType?: 'nid' | 'brn';
  nidOrBrn?: string;
  employeeTypeId?: string;
  employeeTypeNameBn?: string;
  accessTag?: 'employee' | 'officer' | 'hod' | 'admin';
  loginCredentials?: {
    username: string;
    password: string;
  };
  proRataLeaves?: {
    CL: number;
    SL: number;
    FL: number;
    EL: number;
    total: number;
  };
  educationBn?: string;
  presentAddressText?: string;
  reference?: {
    empId: string;
    nameBn: string;
    nameEn?: string;
    deptId?: string;
    sectionName: string;
    designationName?: string;
  };
  approvalChain?: {
    reportingBossEmpId: string;
    reportingBossName: string;
    leaveApplyToEmpId?: string;
    leaveApplyToName: string;
    leaveApproverEmpId?: string;
    leaveApproverName: string;
  };
}

export interface Department {
  deptId: string;
  nameEn: string;
  nameBn: string;
  headEmpId: string;
  isActive: boolean;
}

export interface Section {
  sectionId: string;
  deptId: string;
  nameEn: string;
  nameBn: string;
  supervisorEmpId: string;
  isActive: boolean;
}

export interface Designation {
  id: string;
  nameEn: string;
  nameBn: string;
  level: number;
}

export interface Shift {
  shiftId: string;
  name: string;
  nameBn: string;
  start: string; // "08:00"
  end: string; // "17:00"
  crossesMidnight: boolean;
  breakMinutes: number;
  workMinutes: number;
  graceMinutes: number; // default 10
  lateAfterMinutes: number;
  earlyOutBeforeMinutes: number;
  color: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  empId: string;
  empName: string;
  deptId: string;
  sectionId: string;
  dateKey: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  year: number;
  shiftId: string;
  shiftStart: string;
  shiftEnd: string;
  inAt: string | null; // HH:mm
  outAt: string | null; // HH:mm
  punchCount: number;
  workedMinutes: number;
  lateMinutes: number;
  isLate: boolean;
  earlyOutMinutes: number;
  otMinutes: number;
  status: AttendanceStatus;
  leaveRequestId?: string | null;
  leaveTypeId?: string | null;
  adjusted: boolean;
  adjustmentId?: string | null;
  manualEntry: boolean;
  locked: boolean;
}

export interface AttendanceAdjustment {
  id: string;
  empId: string;
  empName: string;
  deptId: string;
  dateKey: string;
  type: 'lateWithdrawal' | 'missingIn' | 'missingOut' | 'other';
  requestedIn?: string | null;
  requestedOut?: string | null;
  reason: string;
  attachmentUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverEmpId: string;
  approverRole: 'hod' | 'hrManager';
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  createdAt: string;
}

export interface LeaveType {
  code: string;
  nameEn: string;
  nameBn: string;
  annualQuota: number;
  carryForward: boolean;
  maxCarryDays: number;
  paid: boolean;
  encashable: boolean;
  allowHalfDay: boolean;
  color: string;
  descriptionEn?: string;
  descriptionBn?: string;
}

export interface LeaveBalance {
  empId: string;
  year: number;
  balances: Record<
    string,
    {
      entitled: number;
      used: number;
      pending: number;
      carried: number;
    }
  >;
}

export interface LeaveApprovalStep {
  level: number;
  role: 'supervisor' | 'hod' | 'hrManager';
  approverEmpId: string;
  status: 'pending' | 'approved' | 'rejected';
  at?: string;
  note?: string;
}

export interface LeaveRequest {
  id: string;
  empId: string;
  empName: string;
  deptId: string;
  photoUrl: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  halfDay: boolean;
  totalDays: number;
  reason: string;
  attachmentUrl?: string | null;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled';
  chain: LeaveApprovalStep[];
  currentLevel: number;
  pendingApproverEmpIds: string[];
  appliedBy: string;
  appliedAt: string;
  finalDecisionAt?: string | null;
  attendanceFilled: boolean;
}

export interface OvertimeRecord {
  id: string;
  empId: string;
  empName: string;
  deptId: string;
  dateKey: string;
  shiftId: string;
  systemMinutes: number;
  requestedMinutes: number;
  approvedMinutes: number;
  dayType: 'working' | 'weeklyOff' | 'holiday';
  multiplier: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverEmpId: string;
  decidedBy?: string | null;
  decidedAt?: string | null;
}

export interface Holiday {
  id: string;
  date: string;
  nameEn: string;
  nameBn: string;
  type: 'public' | 'company';
  appliesTo: string[];
  year: number;
}

export interface Notice {
  id: string;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  audience: {
    type: 'all' | 'dept' | 'role';
    deptIds?: string[];
    roles?: Role[];
  };
  pinned: boolean;
  publishAt: string;
  expireAt: string;
  author: string;
  attachmentUrl?: string;
}

export interface NotificationItem {
  id: string;
  toEmpId: string;
  type:
    | 'leave_approved'
    | 'leave_rejected'
    | 'adjustment_requested'
    | 'adjustment_decided'
    | 'absent_reminder'
    | 'ot_pending'
    | 'notice_new'
    | 'month_locked';
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  refCollection?: string;
  refId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorEmpId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
  timestamp: string;
}
