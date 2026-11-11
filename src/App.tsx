/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Main Application Entry Point
 * Conforms to PRD, App-Flow, Schema, TRD, and UI-Spec
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Clock,
  Calendar,
  Users,
  MapPin,
  BarChart3,
  FileSpreadsheet,
  Megaphone,
  Settings,
  Shield,
  Bell,
  Smartphone,
  Monitor,
  Globe,
  LogOut,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Percent,
  Trophy,
  Menu,
  X,
  Play,
  UserPlus,
} from 'lucide-react';

import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_OVERTIME_RECORDS,
  INITIAL_NOTICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SHIFTS,
  INITIAL_HOLIDAYS_2026,
  INITIAL_LEAVE_TYPES,
  MOCK_USERS,
} from './data/mockData';

import {
  AttendanceAdjustment,
  AttendanceRecord,
  Employee,
  LeaveRequest,
  Locale,
  Notice,
  NotificationItem,
  OvertimeRecord,
  Role,
  UserSession,
} from './types';

import { TRANSLATIONS, toBanglaDigits, formatLocalizedNumber, formatLocalizedDate } from './data/translations';
import { calculateAttendanceStatus, calculateLeaveAvailability } from './utils/rules';
import { WorkforceMap } from './components/WorkforceMap';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AttendanceView } from './components/AttendanceView';
import { AdjustmentModal } from './components/AdjustmentModal';
import { LeaveManagement } from './components/LeaveManagement';
import { EmployeeManagement } from './components/EmployeeManagement';
import { ReportsAndMonthClose } from './components/ReportsAndMonthClose';
import { OvertimeView } from './components/OvertimeView';
import { ShiftsAndRoster } from './components/ShiftsAndRoster';
import { NoticesAndInbox } from './components/NoticesAndInbox';
import { SettingsAndAudit } from './components/SettingsAndAudit';
import { HeroHeader } from './components/HeroHeader';
import { MyCharuPage } from './components/MyCharuPage';
import { RolePermissionControl } from './components/RolePermissionControl';
import { CharuLogo } from './components/CharuLogo';
import { LoadingSplash, SplashBgTheme } from './components/LoadingSplash';
import { LiveAttendanceMonitor } from './components/LiveAttendanceMonitor';
import {
  RolePermissionMap,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
} from './data/permissionsData';
import { isAdminRoleForOnboarding } from './utils/onboardingRules';

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<UserSession>(MOCK_USERS.hrManager);
  const [locale, setLocale] = useState<Locale>('bn');
  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');
  const [activeNav, setActiveNav] = useState<string>('workforceMap');
  const [mobileTab, setMobileTab] = useState<'home' | 'myCharu' | 'checkIn' | 'inbox'>('home');
  const [expandMobileGrid, setExpandMobileGrid] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Full-screen Loading / Connecting Splash Screen State
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);
  const [splashTheme, setSplashTheme] = useState<SplashBgTheme>('black');
  const [splashStatusText, setSplashStatusText] = useState<string>('');
  const [isManualSplash, setIsManualSplash] = useState<boolean>(false);

  // Initial App Boot / Refresh Splash (1.6s smooth logo animation on Black background)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  const triggerLoadingSplash = (
    theme: SplashBgTheme = 'black',
    durationMs: number = 1100,
    statusMsg: string = '',
    manual: boolean = false
  ) => {
    setSplashTheme(theme);
    setSplashStatusText(statusMsg);
    setIsManualSplash(manual);
    setIsSplashVisible(true);
    if (!manual) {
      setTimeout(() => {
        setIsSplashVisible(false);
      }, durationMs);
    }
  };

  // Dynamic Role Permissions Matrix State
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMap>(() => {
    try {
      const saved = localStorage.getItem('charu_role_permissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const handleUpdateRolePermissions = (updated: RolePermissionMap) => {
    setRolePermissions(updated);
    try {
      localStorage.setItem('charu_role_permissions', JSON.stringify(updated));
    } catch (e) {
      // fallback
    }
  };

  // Permission access checker
  const canAccess = (permKey: string) => hasPermission(rolePermissions, currentUser.role, permKey);

  // Data Collections
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_LOGS);
  const [adjustments, setAdjustments] = useState<AttendanceAdjustment[]>(INITIAL_ADJUSTMENTS);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [leaveBalances, setLeaveBalances] = useState(INITIAL_LEAVE_BALANCES);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(INITIAL_OVERTIME_RECORDS);
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [isMonthLocked, setIsMonthLocked] = useState<boolean>(false);

  // Adjustment Modal State
  const [adjModalOpen, setAdjModalOpen] = useState<boolean>(false);
  const [adjModalRecord, setAdjModalRecord] = useState<AttendanceRecord | null>(null);
  const [adjModalAdjustment, setAdjModalAdjustment] = useState<AttendanceAdjustment | null>(null);
  const [adjModalMode, setAdjModalMode] = useState<'request' | 'decide'>('request');

  const t = TRANSLATIONS[locale];

  // Helper check for current user today status
  const currentUserTodayLog = attendanceLogs.find(
    l => l.empId === currentUser.empId && l.dateKey === '2026-10-30'
  );
  const isTodayLate = currentUserTodayLog ? currentUserTodayLog.isLate && !currentUserTodayLog.adjusted : false;
  const lateMinutes = currentUserTodayLog ? currentUserTodayLog.lateMinutes : 0;

  // Available leave days for current user
  const userBalanceObj = leaveBalances[currentUser.empId]?.balances?.CL || { entitled: 10, used: 3, pending: 1, carried: 0 };
  const availableLeaveDays = calculateLeaveAvailability(
    userBalanceObj.entitled,
    userBalanceObj.carried,
    userBalanceObj.used,
    userBalanceObj.pending
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Role switch handler (triggers brief Connecting Splash with CAHR logo on Black background)
  const handleSwitchRole = (role: Role) => {
    const userKeys = Object.keys(MOCK_USERS);
    const matchedKey = userKeys.find(k => MOCK_USERS[k].role === role) || 'employee';
    const nextUser = MOCK_USERS[matchedKey];
    triggerLoadingSplash(
      'black',
      850,
      locale === 'bn' ? `${nextUser.nameBn} হিসেবে সংযুক্ত হচ্ছে...` : `Connecting as ${nextUser.nameEn}...`,
      false
    );
    setCurrentUser(nextUser);
    if (!isAdminRoleForOnboarding(nextUser.role) && activeNav === 'employees') {
      setActiveNav('workforceMap');
    }
  };

  // Adjustments Workflow
  const handleOpenAdjustmentRequest = (rec: AttendanceRecord) => {
    setAdjModalRecord(rec);
    setAdjModalAdjustment(null);
    setAdjModalMode('request');
    setAdjModalOpen(true);
  };

  const handleOpenAdjustmentDecision = (adj: AttendanceAdjustment) => {
    setAdjModalAdjustment(adj);
    setAdjModalMode('decide');
    setAdjModalOpen(true);
  };

  const handleSubmitAdjustment = (adjData: Partial<AttendanceAdjustment>) => {
    const newAdj: AttendanceAdjustment = {
      id: `adj-${Date.now()}`,
      empId: adjData.empId || currentUser.empId,
      empName: adjData.empName || currentUser.nameEn,
      deptId: adjData.deptId || 'casting',
      dateKey: adjData.dateKey || '2026-10-30',
      type: adjData.type || 'lateWithdrawal',
      requestedIn: adjData.requestedIn || '08:00',
      reason: adjData.reason || '',
      status: 'pending',
      approverEmpId: '10003',
      approverRole: 'hod',
      createdAt: new Date().toISOString(),
    };

    setAdjustments(prev => [newAdj, ...prev]);

    // Add notification to HOD
    setNotifications(prev => [
      {
        id: `ntf-${Date.now()}`,
        toEmpId: '10003',
        type: 'adjustment_requested',
        titleEn: `Pending Late Adjustment: ${newAdj.empName}`,
        titleBn: `দেরি প্রত্যাহারের আবেদন: ${newAdj.empName}`,
        bodyEn: `Reason: ${newAdj.reason}`,
        bodyBn: `কারণ: ${newAdj.reason}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleDecideAdjustment = (adjId: string, decision: 'approved' | 'rejected', note: string) => {
    setAdjustments(prev =>
      prev.map(a => {
        if (a.id === adjId) {
          return {
            ...a,
            status: decision,
            decidedBy: currentUser.empId,
            decidedAt: new Date().toISOString(),
            decisionNote: note,
          };
        }
        return a;
      })
    );

    const adj = adjustments.find(a => a.id === adjId);
    if (!adj) return;

    if (decision === 'approved') {
      // Recalculate day and clear red late mark per App-Flow F5 & ATT-5
      setAttendanceLogs(prev =>
        prev.map(l => {
          if (l.empId === adj.empId && l.dateKey === adj.dateKey) {
            return {
              ...l,
              status: 'present',
              isLate: false,
              lateMinutes: 0,
              adjusted: true,
              adjustmentId: adjId,
            };
          }
          return l;
        })
      );

      // Audit Log
      setAuditLogs(prev => [
        {
          id: `aud-${Date.now()}`,
          actorEmpId: currentUser.empId,
          actorName: currentUser.nameEn,
          actorRole: currentUser.role,
          action: 'adjustment.approve',
          targetCollection: 'attendanceAdjustments',
          targetId: adjId,
          details: `Approved late withdrawal for ${adj.empName} on ${adj.dateKey}. Red mark cleared.`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        },
        ...prev,
      ]);
    }

    // Notify employee
    setNotifications(prev => [
      {
        id: `ntf-${Date.now()}`,
        toEmpId: adj.empId,
        type: 'adjustment_decided',
        titleEn: `Adjustment Request ${decision.toUpperCase()}`,
        titleBn: `দেরি প্রত্যাহারের আবেদন ${decision === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`,
        bodyEn: note || 'Decision applied to attendance records.',
        bodyBn: note || 'সিদ্ধান্তটি উপস্থিতির রেকর্ডে সমন্বয় করা হয়েছে।',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Leave Handlers
  const handleApplyLeave = (reqData: Partial<LeaveRequest>) => {
    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      empId: reqData.empId || currentUser.empId,
      empName: reqData.empName || currentUser.nameEn,
      deptId: reqData.deptId || 'casting',
      photoUrl: reqData.photoUrl || currentUser.avatarUrl,
      leaveTypeId: reqData.leaveTypeId || 'CL',
      leaveTypeCode: reqData.leaveTypeCode || 'CL',
      fromDate: reqData.fromDate || '2026-11-02',
      toDate: reqData.toDate || '2026-11-03',
      halfDay: !!reqData.halfDay,
      totalDays: reqData.totalDays || 1,
      reason: reqData.reason || '',
      status: 'pending',
      chain: reqData.chain || [],
      currentLevel: 1,
      pendingApproverEmpIds: ['10012'],
      appliedBy: currentUser.empId,
      appliedAt: new Date().toISOString(),
      attendanceFilled: false,
    };

    setLeaveRequests(prev => [newReq, ...prev]);

    // Update pending balance
    setLeaveBalances(prev => {
      const currentBalances = prev[newReq.empId] || {
        empId: newReq.empId,
        year: 2026,
        balances: {},
      };
      const typeBal = currentBalances.balances[newReq.leaveTypeCode] || {
        entitled: 10,
        used: 0,
        pending: 0,
        carried: 0,
      };

      return {
        ...prev,
        [newReq.empId]: {
          ...currentBalances,
          balances: {
            ...currentBalances.balances,
            [newReq.leaveTypeCode]: {
              ...typeBal,
              pending: typeBal.pending + newReq.totalDays,
            },
          },
        },
      };
    });
  };

  const handleDecideLeave = (
    reqId: string,
    level: number,
    decision: 'approved' | 'rejected',
    note: string
  ) => {
    setLeaveRequests(prev =>
      prev.map(r => {
        if (r.id === reqId) {
          const updatedChain = r.chain.map(step => {
            if (step.level === level) {
              return { ...step, status: decision, note, at: new Date().toISOString() };
            }
            return step;
          });

          const isFinal = level >= 2 || decision === 'rejected';
          const newStatus = decision === 'rejected' ? 'rejected' : isFinal ? 'approved' : 'processing';

          return {
            ...r,
            chain: updatedChain,
            status: newStatus,
            currentLevel: isFinal ? level : level + 1,
            finalDecisionAt: isFinal ? new Date().toISOString() : null,
          };
        }
        return r;
      })
    );

    const req = leaveRequests.find(r => r.id === reqId);
    if (!req) return;

    if (decision === 'approved') {
      // Deduct balance and clear pending
      setLeaveBalances(prev => {
        const empBal = prev[req.empId];
        if (!empBal) return prev;
        const b = empBal.balances[req.leaveTypeCode];
        return {
          ...prev,
          [req.empId]: {
            ...empBal,
            balances: {
              ...empBal.balances,
              [req.leaveTypeCode]: {
                ...b,
                used: b.used + req.totalDays,
                pending: Math.max(0, b.pending - req.totalDays),
              },
            },
          },
        };
      });

      // Auto-fill Attendance as Leave per PRD LV-7 & ATT-7
      setAttendanceLogs(prev => [
        {
          id: `att-leave-${Date.now()}`,
          empId: req.empId,
          empName: req.empName,
          deptId: req.deptId,
          sectionId: 'line-3',
          dateKey: req.fromDate,
          month: req.fromDate.substring(0, 7),
          year: 2026,
          shiftId: 'general',
          shiftStart: '08:00',
          shiftEnd: '17:00',
          inAt: null,
          outAt: null,
          punchCount: 0,
          workedMinutes: 0,
          lateMinutes: 0,
          isLate: false,
          earlyOutMinutes: 0,
          otMinutes: 0,
          status: 'leave',
          leaveRequestId: req.id,
          leaveTypeId: req.leaveTypeCode,
          adjusted: false,
          manualEntry: false,
          locked: false,
        },
        ...prev,
      ]);
    }
  };

  const handleCancelLeave = (reqId: string) => {
    setLeaveRequests(prev =>
      prev.map(r => (r.id === reqId ? { ...r, status: 'cancelled' } : r))
    );
  };

  // Overtime Decision
  const handleDecideOT = (otId: string, approvedMinutes: number, decision: 'approved' | 'rejected') => {
    setOvertimeRecords(prev =>
      prev.map(r =>
        r.id === otId
          ? {
              ...r,
              status: decision,
              approvedMinutes: decision === 'approved' ? approvedMinutes : 0,
              decidedBy: currentUser.empId,
              decidedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FBF6F2] text-[#2A1A1B] flex flex-col font-sans ${locale === 'bn' ? 'locale-bn' : ''}`}>
      {/* FULL-SCREEN ANIMATED LOADING / CONNECTING SPLASH SCREEN */}
      <LoadingSplash
        isOpen={isSplashVisible}
        initialTheme={splashTheme}
        statusText={splashStatusText}
        locale={locale}
        allowThemeSwitch={true}
        onDismiss={() => {
          setIsSplashVisible(false);
          setIsManualSplash(false);
        }}
      />

      {/* GLOBAL TOP ANNOUNCEMENT BAR & MODE SELECTOR */}
      <div className="bg-[#000000] text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#2B2B2B] sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Menu Button (Visible on < lg screens in Web Mode) */}
          {viewMode === 'web' && (
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 shrink-0"
              aria-label="Open Navigation Menu"
            >
              {mobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          {/* Official CAHR (CHARU HR) Logo on Black Background (White Font + Red Icon) */}
          <div
            onClick={() => triggerLoadingSplash('black', 2200, '', true)}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
            title={locale === 'bn' ? 'লোডিং অ্যানিমেশন দেখতে ক্লিক করুন' : 'Click to preview Loading Animation'}
          >
            <CharuLogo variant="on-black" size="sm" />
            <div className="hidden sm:flex flex-col leading-tight border-l border-white/20 pl-2.5">
              <span className="font-extrabold tracking-wider text-[11px] sm:text-xs text-white truncate">
                CHARU CERAMIC INDUSTRIES LTD.
              </span>
              <span className="text-[10px] text-white/60">
                {locale === 'bn' ? 'চারু এইচআর — স্মার্ট এইচসিএম' : 'Stylish Living — Smart HCM'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5">
          {/* Quick Button to Preview Animated Splash Screen (Black & Red Themes) */}
          <button
            onClick={() => triggerLoadingSplash('black', 3000, '', true)}
            className="px-2.5 py-1 rounded-lg bg-[#EC1C24]/20 hover:bg-[#EC1C24] border border-[#EC1C24]/50 text-white text-[11px] font-bold transition flex items-center gap-1"
            title={locale === 'bn' ? 'লোডিং স্ক্রিন প্রিভিউ দেখুন' : 'Preview Loading Screen'}
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden xs:inline">{locale === 'bn' ? 'লোডার' : 'Splash'}</span>
          </button>

          {/* 3 Hierarchy Role Switcher (Admin, HOD, Employee) */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 p-0.5 sm:p-1 rounded-xl border border-white/15">
            <button
              onClick={() => handleSwitchRole('hrManager')}
              className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 ${
                ['superAdmin', 'hrManager', 'hrExecutive'].includes(currentUser.role)
                  ? 'bg-[#EC1C24] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              title={locale === 'bn' ? 'এইচআর অ্যাডমিন ভূমিকায় সুইচ করুন' : 'Switch to HR Admin'}
            >
              <span>👑</span>
              <span className="hidden sm:inline">{locale === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
            </button>

            <button
              onClick={() => handleSwitchRole('hod')}
              className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 ${
                ['hod', 'supervisor'].includes(currentUser.role)
                  ? 'bg-[#FF6B57] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              title={locale === 'bn' ? 'বিভাগীয় প্রধান (HOD) ভূমিকায় সুইচ করুন' : 'Switch to HOD'}
            >
              <span>👔</span>
              <span className="hidden sm:inline">{locale === 'bn' ? 'এইচওডি' : 'HOD'}</span>
            </button>

            <button
              onClick={() => handleSwitchRole('employee')}
              className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 ${
                ['employee', 'accounts'].includes(currentUser.role)
                  ? 'bg-white text-[#0D0D0D] shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              title={locale === 'bn' ? 'সাধারণ কর্মী ভূমিকায় সুইচ করুন' : 'Switch to Employee'}
            >
              <span>👤</span>
              <span className="hidden sm:inline">{locale === 'bn' ? 'এমপ্লয়ী' : 'Employee'}</span>
            </button>
          </div>

          {/* View Mode Switcher (Web Cockpit vs Mobile Super-App) */}
          <div className="inline-flex p-0.5 bg-white/10 rounded-lg">
            <button
              onClick={() => setViewMode('web')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition text-[11px] ${
                viewMode === 'web' ? 'bg-[#EC1C24] text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden md:inline">{t.web_admin}</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition text-[11px] ${
                viewMode === 'mobile' ? 'bg-[#EC1C24] text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden md:inline">{t.mobile_preview}</span>
            </button>
          </div>

          {/* Language Switch */}
          <button
            onClick={() => setLocale(l => (l === 'en' ? 'bn' : 'en'))}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition font-bold text-white text-[11px]"
          >
            <Globe className="w-3 h-3" />
            <span>{locale === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: WEB / TABLET / RESPONSIVE MOBILE COCKPIT */}
      {viewMode === 'web' ? (
        <div className="flex flex-1 overflow-hidden relative">
          {/* MOBILE DRAWER BACKDROP OVERLAY (< lg screens) */}
          {mobileDrawerOpen && (
            <div
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
            />
          )}

          {/* LEFT BLACK SIDEBAR (Permanent on lg+, Slide-over Drawer on < lg mobile screens) */}
          <aside
            className={`${
              mobileDrawerOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden lg:flex'
            } w-64 bg-[#000000] text-white flex-col justify-between shrink-0 border-r border-[#2B2B2B] select-none overflow-y-auto`}
          >
            <div className="p-5">
              {/* Official CAHR — CHARU HR Brand Logo inside Black Sidebar (White Font + Red Icon) */}
              <div className="flex flex-col items-start mb-6 pb-4 border-b border-[#222]">
                <div className="w-full flex items-center justify-between">
                  <div
                    onClick={() => triggerLoadingSplash('black', 2200, '', true)}
                    className="cursor-pointer"
                  >
                    <CharuLogo variant="on-black" size="md" />
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[9px] font-bold tracking-[0.16em] text-white/60 uppercase mt-2">
                  CHARU CERAMIC INDUSTRIES LTD.
                </p>
              </div>

              {/* Navigation Sections */}
              <nav
                onClick={() => setMobileDrawerOpen(false)}
                className="space-y-6 text-xs"
              >
                {/* Section 1: Dashboard & Maps */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A93] px-3 mb-2">
                    {locale === 'bn' ? 'কোর মডিউল ও মানচিত্র' : 'CORE MODULES & MAP'}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveNav('workforceMap')}
                      className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                        activeNav === 'workforceMap'
                          ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeNav === 'workforceMap' && (
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                      )}
                      <span className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-[#EC1C24]" />
                        <span>{t.nav_workforceMap}</span>
                      </span>
                      <span className="text-[10px] bg-[#EC1C24] text-white px-1.5 py-0.5 rounded-full font-black">
                        ৬৪
                      </span>
                    </button>

                    {canAccess('view_analytics_cockpit') && (
                      <button
                        onClick={() => setActiveNav('analytics')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'analytics'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'analytics' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <BarChart3 className="w-4 h-4 text-[#EC1C24]" />
                          <span>{t.nav_analytics}</span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#EC1C24] animate-ping" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 2: Daily People Work */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A93] px-3 mb-2">
                    {locale === 'bn' ? 'দৈনিক উপস্থিতি ও ছুটি' : 'ATTENDANCE & LEAVES'}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveNav('liveAttendance')}
                      className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                        activeNav === 'liveAttendance'
                          ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeNav === 'liveAttendance' && (
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                      )}
                      <span className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>{locale === 'bn' ? 'লাইভ হাজিরা (কে কার আগে)' : 'Live Attendance'}</span>
                      </span>
                      <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                        LIVE
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveNav('attendance')}
                      className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                        activeNav === 'attendance'
                          ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeNav === 'attendance' && (
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                      )}
                      <span className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#EC1C24]" />
                        <span>{t.nav_attendance}</span>
                      </span>
                      {isTodayLate && (
                        <span className="text-[10px] bg-[#EC1C24] text-white px-1.5 py-0.5 rounded-md font-bold">
                          Late
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveNav('leaves')}
                      className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                        activeNav === 'leaves'
                          ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeNav === 'leaves' && (
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                      )}
                      <span className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#EC1C24]" />
                        <span>{t.nav_leaves}</span>
                      </span>
                    </button>

                    {canAccess('view_own_overtime') && (
                      <button
                        onClick={() => setActiveNav('overtime')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'overtime'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'overtime' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <Award className="w-4 h-4 text-[#EC1C24]" />
                          <span>{t.nav_overtime}</span>
                        </span>
                      </button>
                    )}

                    {canAccess('manage_shifts_roster') && (
                      <button
                        onClick={() => setActiveNav('schedules')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'schedules'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'schedules' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-[#EC1C24]" />
                          <span>{t.nav_schedules}</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 3: HR Administration, Permissions & Reports */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A93] px-3 mb-2">
                    {locale === 'bn' ? 'এইচআর প্রশাসন ও ক্ষমতা' : 'HR & POWER CONTROL'}
                  </div>
                  <div className="space-y-1">
                    {/* Role Permission Control Button */}
                    <button
                      onClick={() => setActiveNav('permissions')}
                      className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                        activeNav === 'permissions'
                          ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeNav === 'permissions' && (
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                      )}
                      <span className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-[#EC1C24]" />
                        <span>{locale === 'bn' ? 'ক্ষমতা বণ্টন (RBAC)' : 'Power Control (RBAC)'}</span>
                      </span>
                      <span className="text-[10px] bg-[#EC1C24] text-white px-1.5 py-0.5 rounded-full font-bold">
                        ৩ স্তর
                      </span>
                    </button>

                    {isAdminRoleForOnboarding(currentUser.role) && (
                      <button
                        onClick={() => setActiveNav('employees')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'employees'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'employees' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <UserPlus className="w-4 h-4 text-[#EC1C24]" />
                          <span>{locale === 'bn' ? 'এমপ্লয়ি অনবোর্ডিং ও ইমপোর্ট' : 'Onboarding & Import'}</span>
                        </span>
                        <span className="text-[9px] bg-amber-400 text-[#042F2E] px-1.5 py-0.2 rounded-full font-black">
                          ADMIN
                        </span>
                      </button>
                    )}

                    {(canAccess('view_salary_sheet_export') || canAccess('execute_month_lock')) && (
                      <button
                        onClick={() => setActiveNav('reports')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'reports'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'reports' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-[#EC1C24]" />
                          <span>{t.nav_monthClose}</span>
                        </span>
                      </button>
                    )}

                    {canAccess('view_notices') && (
                      <button
                        onClick={() => setActiveNav('notices')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'notices'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'notices' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <Megaphone className="w-4 h-4 text-[#EC1C24]" />
                          <span>{t.nav_notices}</span>
                        </span>
                      </button>
                    )}

                    {(canAccess('manage_zkteco_devices') ||
                      canAccess('view_audit_trail') ||
                      canAccess('manage_role_permissions')) && (
                      <button
                        onClick={() => setActiveNav('settings')}
                        className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                          activeNav === 'settings'
                            ? 'bg-white text-[#000000] shadow-sm relative overflow-hidden pl-4'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {activeNav === 'settings' && (
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-[#EC1C24]" />
                        )}
                        <span className="flex items-center gap-2.5">
                          <Settings className="w-4 h-4 text-[#EC1C24]" />
                          <span>{t.nav_settings}</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </nav>
            </div>

            {/* Sidebar User Footer */}
            <div className="p-4 border-t border-[#2B2B2B] bg-[#0A0A0A] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.nameEn}
                  className="w-8 h-8 rounded-full object-cover border border-[#444]"
                />
                <div className="truncate max-w-[120px]">
                  <div className="font-bold text-xs text-white truncate">
                    {locale === 'bn' ? currentUser.nameBn : currentUser.nameEn}
                  </div>
                  <div className="text-[10px] text-white/50 truncate">#{currentUser.empId}</div>
                </div>
              </div>

              <button
                onClick={() => handleSwitchRole('employee')}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
                title="Switch User"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA (100% width on mobile with responsive padding & scroll) */}
          <main className="w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-8 pb-24 lg:pb-8 space-y-5">
            {/* Mobile Quick Module Bar (Visible on < lg screens so mobile users can switch tabs effortlessly) */}
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none border-b border-[#EDE4DC]">
              {[
                { id: 'workforceMap', label: locale === 'bn' ? 'মানচিত্র (৬৪)' : 'Map (64)', icon: MapPin },
                { id: 'liveAttendance', label: locale === 'bn' ? 'লাইভ হাজিরা' : 'Live Attend', icon: Clock },
                { id: 'attendance', label: locale === 'bn' ? 'হাজিরা' : 'Attendance', icon: Clock },
                { id: 'leaves', label: locale === 'bn' ? 'ছুটি' : 'Leaves', icon: Calendar },
                { id: 'overtime', label: locale === 'bn' ? 'ওভারটাইম' : 'Overtime', icon: Award },
                { id: 'analytics', label: locale === 'bn' ? 'ড্যাশবোর্ড' : 'Analytics', icon: BarChart3 },
                ...(isAdminRoleForOnboarding(currentUser.role)
                  ? [{ id: 'employees', label: locale === 'bn' ? 'অনবোর্ডিং ও ইমপোর্ট' : 'Onboarding', icon: UserPlus }]
                  : []),
                { id: 'permissions', label: locale === 'bn' ? 'ক্ষমতা বণ্টন' : 'RBAC', icon: Shield },
              ].map(tab => {
                const IconComp = tab.icon;
                const isActive = activeNav === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveNav(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 ${
                      isActive
                        ? 'bg-[#EC1C24] text-white shadow-sm'
                        : 'bg-white text-[#2A1A1B] border border-[#EDE4DC]'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Top Global Pending Adjustments Banner if HOD / HR */}
            {(canAccess('hod_approve_adjustment') || canAccess('hr_approve_adjustment')) &&
              adjustments.filter(a => a.status === 'pending').length > 0 && (
                <div className="bg-[#FDE8E9] border border-[#EC1C24]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EC1C24] text-white flex items-center justify-center font-bold shrink-0">
                      !
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#EC1C24]">
                        {locale === 'bn'
                          ? 'দেরি প্রত্যাহারের অপেক্ষমাণ আবেদন রয়েছে'
                          : 'Pending Late Withdrawal Adjustments Awaiting Decision'}
                      </h4>
                      <p className="text-xs text-[#2A1A1B]">
                        {locale === 'bn'
                          ? `মোঃ রহিম উদ্দিনসহ ${toBanglaDigits(adjustments.filter(a => a.status === 'pending').length)} জন কর্মীর আবেদন পর্যালোচনার জন্য অপেক্ষমাণ।`
                          : `${adjustments.filter(a => a.status === 'pending').length} adjustment requests awaiting HOD verification.`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAdjustmentDecision(adjustments.filter(a => a.status === 'pending')[0])}
                    className="px-4 py-2 bg-[#EC1C24] hover:bg-[#C4141B] text-white text-xs font-bold rounded-xl transition shadow self-start sm:self-auto shrink-0"
                  >
                    {locale === 'bn' ? 'অনুমোদন দিন' : 'Review & Decide'}
                  </button>
                </div>
              )}

            {/* ROUTED CONTENT VIEWS */}
            {activeNav === 'permissions' && (
              <RolePermissionControl
                permissions={rolePermissions}
                onUpdatePermissions={handleUpdateRolePermissions}
                currentRole={currentUser.role}
                onSwitchRole={handleSwitchRole}
                locale={locale}
              />
            )}

            {activeNav === 'workforceMap' && (
              <WorkforceMap
                employees={employees}
                locale={locale}
                currentRole={currentUser.role}
                onFilterEmployeeDistrict={districtId => {
                  if (isAdminRoleForOnboarding(currentUser.role)) {
                    setActiveNav('employees');
                  }
                }}
              />
            )}

            {activeNav === 'analytics' && (
              <AnalyticsDashboard
                locale={locale}
                currentRole={currentUser.role}
                employees={employees}
              />
            )}

            {activeNav === 'liveAttendance' && (
              <LiveAttendanceMonitor
                currentRole={currentUser.role}
                locale={locale}
                currentEmpId={currentUser.empId}
                onRequestAdjustment={() => handleOpenAdjustmentRequest(attendanceLogs[0])}
                onNavigateLeaves={() => setActiveNav('leaves')}
              />
            )}

            {activeNav === 'attendance' && (
              <AttendanceView
                currentEmpId={currentUser.empId}
                currentRole={currentUser.role}
                locale={locale}
                attendanceLogs={attendanceLogs}
                employees={employees}
                shifts={INITIAL_SHIFTS}
                canManualEntry={canAccess('manual_attendance_entry')}
                canViewTeam={canAccess('view_team_attendance')}
                canViewBiometricLogs={canAccess('view_biometric_logs')}
                onRequestAdjustment={handleOpenAdjustmentRequest}
                onManualAttendanceSave={rec => {
                  setAttendanceLogs(prev => [
                    {
                      id: `att-manual-${Date.now()}`,
                      empId: rec.empId || '20045',
                      empName: rec.empName || 'Employee',
                      deptId: rec.deptId || 'casting',
                      sectionId: 'line-1',
                      dateKey: rec.dateKey || '2026-10-30',
                      month: '2026-10',
                      year: 2026,
                      shiftId: 'general',
                      shiftStart: '08:00',
                      shiftEnd: '17:00',
                      inAt: rec.inAt || '08:00',
                      outAt: rec.outAt || '17:00',
                      punchCount: 2,
                      workedMinutes: 480,
                      lateMinutes: 0,
                      isLate: false,
                      earlyOutMinutes: 0,
                      otMinutes: 0,
                      status: 'present',
                      adjusted: true,
                      manualEntry: true,
                      locked: false,
                    },
                    ...prev,
                  ]);
                }}
              />
            )}

            {activeNav === 'leaves' && (
              <LeaveManagement
                currentEmpId={currentUser.empId}
                currentRole={currentUser.role}
                locale={locale}
                employees={employees}
                leaveTypes={INITIAL_LEAVE_TYPES}
                leaveBalances={leaveBalances}
                leaveRequests={leaveRequests}
                canApproveLeave={canAccess('hod_approve_leave') || canAccess('hr_approve_leave')}
                canApplyLeave={canAccess('apply_personal_leave')}
                onApplyLeave={handleApplyLeave}
                onDecideLeave={handleDecideLeave}
                onCancelLeave={handleCancelLeave}
              />
            )}

            {activeNav === 'overtime' && (
              <OvertimeView
                currentEmpId={currentUser.empId}
                currentRole={currentUser.role}
                locale={locale}
                overtimeRecords={overtimeRecords}
                canApproveOT={canAccess('hod_verify_overtime') || canAccess('hr_authorize_overtime')}
                onDecideOT={handleDecideOT}
                onRequestOT={rec => alert('OT request logged')}
              />
            )}

            {activeNav === 'schedules' && (
              <ShiftsAndRoster
                shifts={INITIAL_SHIFTS}
                holidays={INITIAL_HOLIDAYS_2026}
                employees={employees}
                currentRole={currentUser.role}
                locale={locale}
                onUpdateWeeklyOff={(empId, weekday) => {
                  setEmployees(prev =>
                    prev.map(e =>
                      e.empId === empId
                        ? {
                            ...e,
                            schedule: {
                              ...e.schedule,
                              weeklyOff: { mode: 'weekday', weekday },
                            },
                          }
                        : e
                    )
                  );
                  alert(locale === 'bn' ? 'সাপ্তাহিক ছুটি সফলভাবে পরিবর্তন করা হয়েছে।' : 'Weekly off updated.');
                }}
              />
            )}

            {activeNav === 'employees' && isAdminRoleForOnboarding(currentUser.role) && (
              <EmployeeManagement
                employees={employees}
                locale={locale}
                onAddEmployee={newEmp => setEmployees(prev => [newEmp, ...prev])}
                onAddLeaveBalance={newBal =>
                  setLeaveBalances(prev => ({
                    ...prev,
                    [newBal.empId]: newBal,
                  }))
                }
                onNavigateSettings={() => setActiveNav('permissions')}
              />
            )}

            {activeNav === 'reports' && (
              <ReportsAndMonthClose
                employees={employees}
                attendanceLogs={attendanceLogs}
                currentRole={currentUser.role}
                locale={locale}
                isMonthLocked={isMonthLocked}
                canLock={canAccess('execute_month_lock')}
                onToggleMonthLock={(locked, reason) => {
                  setIsMonthLocked(locked);
                  // Audit
                  setAuditLogs(prev => [
                    {
                      id: `aud-${Date.now()}`,
                      actorEmpId: currentUser.empId,
                      actorName: currentUser.nameEn,
                      actorRole: currentUser.role,
                      action: locked ? 'month.lock' : 'month.reopen',
                      targetCollection: 'attendanceMonths',
                      targetId: '2026-10',
                      details: locked
                        ? 'Locked and sealed October 2026 attendance records.'
                        : `Reopened October 2026. Reason: ${reason}`,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    },
                    ...prev,
                  ]);
                }}
              />
            )}

            {activeNav === 'notices' && (
              <NoticesAndInbox
                notices={notices}
                notifications={notifications}
                locale={locale}
                currentRole={currentUser.role}
                onMarkNotificationRead={id =>
                  setNotifications(prev =>
                    prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
                  )
                }
                onMarkAllRead={() =>
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                }
              />
            )}

            {activeNav === 'settings' && (
              <SettingsAndAudit
                auditLogs={auditLogs}
                currentRole={currentUser.role}
                locale={locale}
                permissions={rolePermissions}
                onUpdatePermissions={handleUpdateRolePermissions}
                onSwitchRole={handleSwitchRole}
              />
            )}
          </main>

          {/* MOBILE FIXED BOTTOM NAVIGATION BAR (Visible on < lg mobile screens in Web Mode) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 h-15 bg-[#000000] text-white border-t border-[#2B2B2B] flex items-center justify-around z-30 px-1 shadow-2xl">
            <button
              onClick={() => setViewMode('mobile')}
              className="flex flex-col items-center justify-center flex-1 py-1 text-white/75 hover:text-white"
            >
              <Home className="w-4 h-4 text-[#EC1C24]" />
              <span className="text-[10px] font-bold mt-0.5">{locale === 'bn' ? 'হোম অ্যাপ' : 'Super App'}</span>
            </button>

            <button
              onClick={() => setActiveNav('workforceMap')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'workforceMap' ? 'text-[#EC1C24] font-extrabold' : 'text-white/75'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'মানচিত্র' : 'Map'}</span>
            </button>

            <button
              onClick={() => setActiveNav('attendance')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'attendance' ? 'text-[#EC1C24] font-extrabold' : 'text-white/75'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'হাজিরা' : 'Attendance'}</span>
            </button>

            <button
              onClick={() => setActiveNav('leaves')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'leaves' ? 'text-[#EC1C24] font-extrabold' : 'text-white/75'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'ছুটি' : 'Leaves'}</span>
            </button>

            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 text-white/75 hover:text-white"
            >
              <Menu className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'সব মেনু' : 'Menu'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: MOBILE SUPER-APP EXPERIENCE (UI-Spec §15) */
        <div className="flex-1 flex justify-center p-0 md:p-6 bg-[#EDE4DC]/50 overflow-y-auto overflow-x-hidden">
          {/* Mobile Phone Mockup Shell */}
          <div className="w-full max-w-[420px] bg-white rounded-none md:rounded-[40px] shadow-2xl border-0 md:border-8 md:border-[#0D0D0D] overflow-hidden flex flex-col min-h-[calc(100vh-48px)] md:min-h-[820px] relative">
            {/* Top Phone Camera Notch */}
            <div className="hidden md:flex justify-center pt-2 bg-black pb-1 z-20">
              <div className="w-20 h-4 bg-[#1A1A1A] rounded-full" />
            </div>

            {/* A. Hero Header per §15.2-A */}
            <HeroHeader
              user={currentUser}
              locale={locale}
              currentRole={currentUser.role}
              isTodayLate={isTodayLate}
              lateMinutes={lateMinutes}
              availableLeaveDays={availableLeaveDays}
              unreadCount={unreadCount}
              onToggleLocale={() => setLocale(l => (l === 'en' ? 'bn' : 'en'))}
              onSwitchRole={handleSwitchRole}
              onOpenNotifications={() => setMobileTab('inbox')}
              onOpenSplashPreview={() => triggerLoadingSplash('black', 3500, '', true)}
            />

            {/* B. White Rounded Sheet Container (overlaps header by 24dp) */}
            <div className="-mt-6 bg-white rounded-t-[28px] p-4 flex-1 shadow-inner space-y-5 pb-24 z-10 overflow-y-auto">
              {/* TAB 1: HOME */}
              {mobileTab === 'home' && (
                <div className="space-y-5">
                  {/* C. Alert Card (Conditional) */}
                  {isTodayLate && (
                    <div
                      onClick={() => currentUserTodayLog && handleOpenAdjustmentRequest(currentUserTodayLog)}
                      className="p-3.5 bg-[#FDE8E9] border border-[#EC1C24]/30 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EC1C24] text-white flex items-center justify-center font-bold text-xs">
                          !
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#EC1C24]">
                            {locale === 'bn' ? 'দেরি প্রত্যাহারের আবেদন' : 'Late Arrival Adjustment'}
                          </div>
                          <div className="text-[11px] text-[#2A1A1B]">
                            {locale === 'bn'
                              ? 'আজ ৮:১১ মিনিটে পাঞ্চ। সংশোধনের অনুরোধ পাঠান।'
                              : '08:11 AM punch. Tap to submit justification.'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#EC1C24]" />
                    </div>
                  )}

                  {/* D. Primary Service Grid (4 columns × 2 rows with distinct Organization-Themed Colors) */}
                  <div>
                    <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
                      {[
                        {
                          id: 'workforceMap',
                          icon: MapPin,
                          labelBn: 'কর্মী মানচিত্র',
                          labelEn: 'Workforce',
                          badge: '৬৪',
                          bgClass: 'bg-[#FFF0F1] border-[#F9C6C9]',
                          iconClass: 'text-[#EC1C24]',
                          visible: true,
                          action: () => setActiveNav('workforceMap'),
                        },
                        {
                          id: 'attendance',
                          icon: Clock,
                          labelBn: 'হাজিরা',
                          labelEn: 'Attendance',
                          badge: isTodayLate ? 'Late' : null,
                          bgClass: 'bg-[#ECFDF5] border-[#A7F3D0]',
                          iconClass: 'text-[#0D8A6A]',
                          visible: canAccess('view_personal_attendance') || canAccess('view_team_attendance'),
                          action: () => setActiveNav('attendance'),
                        },
                        {
                          id: 'leaves',
                          icon: Calendar,
                          labelBn: 'ছুটির আবেদন',
                          labelEn: 'Apply Leave',
                          bgClass: 'bg-[#ECFEFF] border-[#A5F3FC]',
                          iconClass: 'text-[#0891B2]',
                          visible: canAccess('apply_personal_leave') || canAccess('hod_approve_leave') || canAccess('hr_approve_leave'),
                          action: () => setActiveNav('leaves'),
                        },
                        {
                          id: 'analytics',
                          icon: BarChart3,
                          labelBn: 'ড্যাশবোর্ড',
                          labelEn: 'Analytics',
                          bgClass: 'bg-[#FFF7ED] border-[#FED7AA]',
                          iconClass: 'text-[#EA580C]',
                          visible: canAccess('view_analytics_dashboard'),
                          action: () => setActiveNav('analytics'),
                        },
                        {
                          id: 'overtime',
                          icon: Award,
                          labelBn: 'ওভারটাইম',
                          labelEn: 'Overtime',
                          bgClass: 'bg-[#F5F3FF] border-[#DDD6FE]',
                          iconClass: 'text-[#7C3AED]',
                          visible: canAccess('view_personal_overtime') || canAccess('hod_verify_overtime') || canAccess('hr_authorize_overtime'),
                          action: () => setActiveNav('overtime'),
                        },
                        {
                          id: 'schedules',
                          icon: Layers,
                          labelBn: 'রোস্টার/শিফট',
                          labelEn: 'Schedule',
                          bgClass: 'bg-[#F0FDFA] border-[#99F6E4]',
                          iconClass: 'text-[#0F766E]',
                          visible: canAccess('view_shift_schedules'),
                          action: () => setActiveNav('schedules'),
                        },
                        {
                          id: 'notices',
                          icon: Megaphone,
                          labelBn: 'নোটিশ বোর্ড',
                          labelEn: 'Notices',
                          bgClass: 'bg-[#FDF2F8] border-[#FBCFE8]',
                          iconClass: 'text-[#DB2777]',
                          visible: canAccess('view_notices'),
                          action: () => setActiveNav('notices'),
                        },
                        {
                          id: 'employees',
                          icon: UserPlus,
                          labelBn: 'অনবোর্ডিং',
                          labelEn: 'Onboarding',
                          badge: 'ADMIN',
                          bgClass: 'bg-[#ECFDF5] border-[#6EE7B7]',
                          iconClass: 'text-[#047857]',
                          visible: isAdminRoleForOnboarding(currentUser.role),
                          action: () => setActiveNav('employees'),
                        },
                        {
                          id: 'reports',
                          icon: FileSpreadsheet,
                          labelBn: 'মাস ক্লোজ',
                          labelEn: 'Month Close',
                          bgClass: 'bg-[#FEFCE8] border-[#FEF08A]',
                          iconClass: 'text-[#B45309]',
                          visible: canAccess('view_salary_sheet_export') || canAccess('execute_month_lock'),
                          action: () => setActiveNav('reports'),
                        },
                      ]
                        .filter(item => item.visible)
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              item.action();
                              setViewMode('web');
                            }}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <div
                              className={`w-13 h-13 rounded-full ${item.bgClass} group-hover:scale-105 border flex items-center justify-center relative shadow-sm transition-all`}
                            >
                              <item.icon className={`w-6 h-6 ${item.iconClass} transition`} />
                              {item.badge && (
                                <span className="absolute -top-1 -right-1 bg-[#EC1C24] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#2A1A1B] mt-1.5 line-clamp-1">
                              {locale === 'bn' ? item.labelBn : item.labelEn}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Expandable "আরো দেখুন ⌄" button */}
                    <div className="text-center mt-3">
                      <button
                        onClick={() => setExpandMobileGrid(!expandMobileGrid)}
                        className="px-4 py-1.5 bg-white border border-[#EDE4DC] rounded-full text-xs font-bold text-[#EC1C24] shadow-sm hover:bg-[#FDE8E9] transition"
                      >
                        {expandMobileGrid
                          ? locale === 'bn'
                            ? 'সংক্ষিপ্ত করুন ⌃'
                            : 'Show Less ⌃'
                          : locale === 'bn'
                          ? 'আরো দেখুন ⌄'
                          : 'See More ⌄'}
                      </button>
                    </div>

                    {expandMobileGrid && (
                      <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center mt-4 pt-3 border-t border-[#EDE4DC] animate-in fade-in">
                        {isAdminRoleForOnboarding(currentUser.role) && (
                          <div
                            onClick={() => {
                              setActiveNav('employees');
                              setViewMode('web');
                            }}
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <div className="w-13 h-13 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
                              <UserPlus className="w-6 h-6 text-[#2563EB]" />
                            </div>
                            <span className="text-[11px] font-semibold mt-1">অনবোর্ডিং ও ইমপোর্ট</span>
                          </div>
                        )}

                        {canAccess('manage_role_permissions') && (
                          <div
                            onClick={() => {
                              setActiveNav('permissions');
                              setViewMode('web');
                            }}
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <div className="w-13 h-13 rounded-full bg-[#FDE8E9] text-[#EC1C24] flex items-center justify-center border border-[#EC1C24]/30">
                              <Shield className="w-6 h-6 text-[#EC1C24]" />
                            </div>
                            <span className="text-[11px] font-semibold mt-1 text-[#EC1C24]">ক্ষমতা বণ্টন</span>
                          </div>
                        )}

                        {(canAccess('manage_zkteco_devices') || canAccess('view_audit_trail')) && (
                          <div
                            onClick={() => {
                              setActiveNav('settings');
                              setViewMode('web');
                            }}
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <div className="w-13 h-13 rounded-full bg-[#F3F4F6] flex items-center justify-center border border-[#D1D5DB]">
                              <Settings className="w-6 h-6 text-[#374151]" />
                            </div>
                            <span className="text-[11px] font-semibold mt-1">সেটিংস</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* F. Live Attendance Monitor ("লাইভ অ্যাটেন্ডেন্স - কে কার আগে ঢুকছে") */}
                  <LiveAttendanceMonitor
                    currentRole={currentUser.role}
                    locale={locale}
                    currentEmpId={currentUser.empId}
                    isEmbeddedInHome={true}
                    onRequestAdjustment={() => handleOpenAdjustmentRequest(attendanceLogs[0])}
                    onNavigateLeaves={() => {
                      setActiveNav('leaves');
                      setViewMode('web');
                    }}
                  />

                  {/* E. Employee Essential Summary Gradient Card ("কর্মীর প্রয়োজনীয় তথ্য কার্ড") */}
                  {(() => {
                    const empRecord =
                      employees.find(e => e.empId === currentUser.empId) || employees[0];
                    const bloodGroup = empRecord.privateInfo?.bloodGroup || 'B+';
                    const upazilaName = empRecord.address?.permanent?.upazila || 'হবিগঞ্জ সদর';
                    return (
                      <div className="relative rounded-2xl p-4 text-white shadow-xl overflow-hidden bg-gradient-to-br from-[#EC1C24] via-[#B81119] to-[#2A080C] border border-[#FF6B57]/30">
                        {/* Subtle Glass Orbs */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[#FF9F43]/20 blur-xl pointer-events-none" />

                        {/* Card Header: Employee Identity + ID Badge */}
                        <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3 relative z-10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={currentUser.avatarUrl}
                              alt={currentUser.nameEn}
                              className="w-10 h-10 rounded-xl object-cover border border-white/60 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold truncate">
                                {locale === 'bn' ? currentUser.nameBn : currentUser.nameEn}
                              </div>
                              <div className="text-[10px] text-white/80 font-medium truncate">
                                {locale === 'bn'
                                  ? `${empRecord.employment.designationName} · ${currentUser.deptNameBn}`
                                  : `${empRecord.employment.designationName} · ${currentUser.deptNameEn}`}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-extrabold tracking-wider border border-white/20 shrink-0">
                            ID #{locale === 'bn' ? toBanglaDigits(currentUser.empId) : currentUser.empId}
                          </span>
                        </div>

                        {/* 4-Pillar Essential Info Grid inside Gradient Card */}
                        <div className="grid grid-cols-2 gap-2.5 relative z-10 text-[11px]">
                          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                            <div className="text-[10px] text-white/70">
                              {locale === 'bn' ? 'আজকের হাজিরা ও শিফট' : 'Today Shift & Status'}
                            </div>
                            <div className="font-extrabold text-white mt-0.5 flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isTodayLate ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                              />
                              <span>
                                {isTodayLate
                                  ? locale === 'bn'
                                    ? `দেরি (${toBanglaDigits(lateMinutes)} মি.)`
                                    : `Late (${lateMinutes}m)`
                                  : locale === 'bn'
                                  ? 'উপস্থিত (০৮:০০ - ১৭:০০)'
                                  : 'Present (08:00 - 17:00)'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                            <div className="text-[10px] text-white/70">
                              {locale === 'bn' ? 'অবশিষ্ট ছুটি ব্যালেন্স' : 'Available Leave'}
                            </div>
                            <div className="font-extrabold text-white mt-0.5">
                              {locale === 'bn'
                                ? `${toBanglaDigits(availableLeaveDays)} দিন (CL/SL)`
                                : `${availableLeaveDays} Days Available`}
                            </div>
                          </div>

                          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                            <div className="text-[10px] text-white/70">
                              {locale === 'bn' ? 'নিজ জেলা ও উপজেলা' : 'Home District'}
                            </div>
                            <div className="font-extrabold text-white mt-0.5 truncate">
                              {upazilaName} ({empRecord.homeDistrictId.toUpperCase()})
                            </div>
                          </div>

                          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                            <div className="text-[10px] text-white/70">
                              {locale === 'bn' ? 'ডিভাইস ও রক্তের গ্রুপ' : 'Device & Blood Group'}
                            </div>
                            <div className="font-extrabold text-white mt-0.5">
                              {locale === 'bn'
                                ? `কোড #${toBanglaDigits(empRecord.deviceCode)} · ${bloodGroup}`
                                : `Code #${empRecord.deviceCode} · ${bloodGroup}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* F. Quick Features ("দ্রুত কাজ") per §15.2-F */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#2A1A1B] uppercase tracking-wider">
                      {locale === 'bn' ? 'দ্রুত কাজ (Quick Shortcuts)' : 'Quick Shortcuts'}
                    </h4>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { label: locale === 'bn' ? 'ক্যাজুয়াল ছুটি ২ দিন' : 'Casual Leave 2D' },
                        { label: locale === 'bn' ? 'দেরি সংশোধন' : 'Late Adjustment' },
                        { label: locale === 'bn' ? 'আজকের টিম' : 'Today Team' },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveNav('leaves');
                            setViewMode('web');
                          }}
                          className="px-3.5 py-2 bg-white border border-[#EDE4DC] rounded-xl text-xs font-bold text-[#2A1A1B] shadow-sm whitespace-nowrap hover:border-[#EC1C24]"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Pastel Feature Cards */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-3 bg-[#FFF3E0] rounded-2xl flex flex-col justify-between h-24 border border-[#FFE0B2]">
                        <Gift className="w-5 h-5 text-amber-600" />
                        <span className="text-[11px] font-bold text-[#2A1A1B] leading-tight">
                          {locale === 'bn' ? 'জন্মদিন ও বার্ষিকী' : 'Birthdays'}
                        </span>
                      </div>

                      <div className="p-3 bg-[#E6F6F4] rounded-2xl flex flex-col justify-between h-24 border border-[#B2DFDB]">
                        <Percent className="w-5 h-5 text-teal-600" />
                        <span className="text-[11px] font-bold text-[#2A1A1B] leading-tight">
                          {locale === 'bn' ? 'ছুটির ক্যালেন্ডার' : 'Holidays'}
                        </span>
                      </div>

                      <div className="p-3 bg-[#FFF8E1] rounded-2xl flex flex-col justify-between h-24 border border-[#FFECB3]">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        <span className="text-[11px] font-bold text-[#2A1A1B] leading-tight">
                          {locale === 'bn' ? 'মাসের সেরা কর্মী' : 'Best Staff'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MY CHARU (PERSONAL HUB) */}
              {mobileTab === 'myCharu' && (
                <MyCharuPage
                  user={currentUser}
                  locale={locale}
                  availableLeaveDays={availableLeaveDays}
                  onNavigateLeaves={() => {
                    setActiveNav('leaves');
                    setViewMode('web');
                  }}
                  onNavigateAttendance={() => {
                    setActiveNav('attendance');
                    setViewMode('web');
                  }}
                />
              )}

              {/* TAB 3: CHECK-IN / APPROVALS */}
              {mobileTab === 'checkIn' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#E7F6EC] text-[#15803D] flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-base text-[#2A1A1B]">
                      {locale === 'bn' ? 'কারখানা বায়োমেট্রিক ও গেট পাঞ্চ' : 'Factory Biometric Check-in'}
                    </h3>
                    <p className="text-xs text-[#8C7B7C]">
                      {locale === 'bn'
                        ? 'আপনার জেডকেটেকো ডিভাইস কোড #১০৪৫ এর সাথে হেড অফিস গেট সংযুক্ত রয়েছে।'
                        : 'Device Code #1045 synced with Tongi factory gate face scanner.'}
                    </p>
                    <button
                      onClick={() => {
                        setActiveNav('attendance');
                        setViewMode('web');
                      }}
                      className="w-full py-3 bg-[#EC1C24] hover:bg-[#C4141B] text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      {locale === 'bn' ? 'সম্পূর্ণ লগ ও সামারি দেখুন' : 'Open Attendance View'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: INBOX */}
              {mobileTab === 'inbox' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#2A1A1B]">
                    {locale === 'bn' ? 'নোটিফিকেশন ইনবক্স' : 'Notification Inbox'}
                  </h3>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-3 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC] text-xs"
                    >
                      <div className="font-bold text-[#2A1A1B]">
                        {locale === 'bn' ? n.titleBn : n.titleEn}
                      </div>
                      <div className="text-[#8C7B7C] text-[11px] mt-0.5">
                        {locale === 'bn' ? n.bodyBn : n.bodyEn}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* G. Bottom Navigation (4 tabs per UI-Spec §15.2-G) */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-[#EDE4DC] flex items-center justify-around z-30 shadow-lg px-2">
              <button
                onClick={() => setMobileTab('home')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  mobileTab === 'home' ? 'text-[#EC1C24] font-bold' : 'text-[#8C7B7C]'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'হোম' : 'Home'}</span>
              </button>

              <button
                onClick={() => setMobileTab('myCharu')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  mobileTab === 'myCharu' ? 'text-[#EC1C24] font-bold' : 'text-[#8C7B7C]'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'আমার চারু' : 'My Charu'}</span>
              </button>

              <button
                onClick={() => setMobileTab('checkIn')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  mobileTab === 'checkIn' ? 'text-[#EC1C24] font-bold' : 'text-[#8C7B7C]'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">
                  {currentUser.role === 'employee'
                    ? locale === 'bn'
                      ? 'চেক-ইন'
                      : 'Check-in'
                    : locale === 'bn'
                    ? 'অনুমোদন'
                    : 'Approvals'}
                </span>
              </button>

              <button
                onClick={() => setMobileTab('inbox')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                  mobileTab === 'inbox' ? 'text-[#EC1C24] font-bold' : 'text-[#8C7B7C]'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-7 w-4 h-4 rounded-full bg-[#EC1C24] text-white flex items-center justify-center text-[9px] font-black">
                    {unreadCount}
                  </span>
                )}
                <span className="text-[10px] mt-0.5">{locale === 'bn' ? 'ইনবক্স' : 'Inbox'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL COMPONENT */}
      <AdjustmentModal
        isOpen={adjModalOpen}
        onClose={() => setAdjModalOpen(false)}
        targetRecord={adjModalRecord}
        pendingAdjustment={adjModalAdjustment}
        mode={adjModalMode}
        currentRole={currentUser.role}
        locale={locale}
        onSubmitRequest={handleSubmitAdjustment}
        onDecideAdjustment={handleDecideAdjustment}
      />
    </div>
  );
}
