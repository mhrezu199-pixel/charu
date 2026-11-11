# Charu HCM — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Charu HCM (Human Capital Management) |
| **Company** | Charu Ceramic Industries Ltd — "Stylish Living" |
| **Owner** | HR Department |
| **Version** | 1.0 (Draft for build) |
| **Date** | 25 Oct 2026 |
| **Stack** | Flutter (Android first, Web for HR admin) · Firebase (Auth, Firestore, Storage, Functions, FCM, Hosting) |
| **Companion docs** | `App-Flow.md` · `UI-Spec.md` · `TRD.md` · `Schema.md` · `Plan.md` |

---

## 1. Overview

### 1.1 Problem
HR work at Charu is spread across spreadsheets, a failed legacy attendance system and manual follow-up. Attendance from face-recognition devices, leave approvals, late-mark adjustments, overtime and salary-sheet preparation take HR many hours each month and are error-prone.

### 1.2 Vision
**Charu HCM** is one smart, simple system where every employee, supervisor, Head of Department (HOD) and HR officer handles daily people-work — attendance, leave, OT, schedules, requests and reports — in minutes, not hours. It is branded, bilingual (বাংলা / English) and built for factory and office staff alike.

### 1.3 Goals and success metrics
| Goal | Metric (90 days after launch) |
|---|---|
| Remove manual attendance compilation | Monthly attendance closing time ↓ from days to < 2 hours |
| Digital leave process | ≥ 95% of leave requests raised in-app |
| Faster approvals | Median approval time < 24 h |
| Accurate salary input | Excel/CSV salary-sheet export with 0 manual re-entry |
| Adoption | ≥ 90% of office staff and ≥ 70% of factory staff active monthly |

### 1.4 Non-goals (v1)
- Recruitment / ATS, training/LMS, expense claims.
- Full statutory payroll calculation (Phase 2 — v1 only exports the attendance/leave/OT inputs for the salary sheet).
- iOS release (code stays iOS-ready; store release later).

---

## 2. Users and roles

| Role | Who | Main needs |
|---|---|---|
| **Super Admin** | IT / HR Head | Full control, settings, role assignment, audit log |
| **HR Manager** | HR lead | Everything in HR; final approvals; policy; reports; weekly-off control |
| **HR Executive** | HR officers | Employee data, attendance review, leave entry, exports |
| **HOD** | Head of Department | Approve leave/adjustments/OT for department; department reports |
| **Supervisor / Line Manager** | Section / line lead | First-level approval, team attendance, roster view |
| **Employee** | All staff | Own attendance, leave, OT, payslip (Phase 2), profile, notices |
| **Accounts (view)** | Payroll / Accounts | Read-only attendance/leave/OT summaries and exports |

Permission model: **RBAC with Firebase custom claims** (`role`, `deptIds`, `empId`) — see `Schema.md`.

---

## 3. Scope and release plan

| Phase | Modules |
|---|---|
| **MVP (v1.0)** | Auth & RBAC · Employee master · Org structure · Shifts & weekly off · Attendance (device sync + manual) · Late mark & adjustment · Leave · Overtime · Dashboard (My Space + Workspace) · Notifications (push + email) · Reports + Excel export · Announcements · Audit log · Bangla/English · **Workforce Map (district)** · **Analytics dashboards (attendance, leave, leave indicator)** |
| **v1.1** | Holiday calendar polish, geo-fenced mobile check-in (for non-device staff), document vault, employee self-service profile change requests |
| **v2.0 (Payroll Hub)** | Salary structure, payroll run, payslip PDF, tax/deduction rules, bank advice |
| **v2.x** | Performance management (appraisals), disciplinary workflow (show-cause letters), asset management, exit/clearance |

---

## 4. Business rules (configurable in Settings — confirm with HR)

1. **Shifts:** General 08:00–17:00 · A 06:00–14:00 · B 14:00–22:00 · Night 22:00–06:00 (crosses midnight). Additional shifts can be created.
2. **Punches:** two punches per day (IN / OUT) from face-recognition devices; first punch of the shift window = IN, last = OUT.
3. **Late rule:** IN later than shift start + **10 minutes** grace → **Late**, shown in **red**.
4. **Late-mark withdrawal:** employee raises an *Attendance Adjustment*; **HOD approval** removes the red mark. HR can override with reason (audited).
5. **Weekly off:** per employee, **not the same date for everyone**; set only by HR Manager (fixed weekday or custom roster). Working on weekly off/holiday is flagged for OT/compensatory rules.
6. **Leave flow:** employee applies → line manager/HOD approves per chain → HR Manager is notified → on final approval, missing attendance for those dates **auto-fills as Leave** and the employee gets an email + push.
7. **Auto reminders:** absence or lateness triggers an automatic reminder to the employee (push + email).
8. **Absent:** no punches and no approved leave/holiday/weekly-off for a working day.
9. **Month lock:** HR closes a month; closed months become read-only except via audited HR Manager reopen.
10. **Overtime:** OT hours = worked hours beyond shift hours (min threshold and rounding configurable); OT needs prior or post approval by HOD.

> Assumptions above come from the described factory process. Items to verify are in **§12 Open questions**.

---

## 5. Functional requirements

Priority: **P0** must-have MVP · **P1** should-have · **P2** later.

### 5.1 Authentication & access (AUTH)
| ID | Requirement | Pri |
|---|---|---|
| AUTH-1 | Login with Employee ID or email + password; "Remember me"; "Forgot password" email reset | P0 |
| AUTH-2 | Accounts are created by HR only (no public sign-up); first-login forced password change | P0 |
| AUTH-3 | Role-based menus and data access enforced in UI **and** Firestore rules | P0 |
| AUTH-4 | Session timeout and optional device biometric unlock | P1 |
| AUTH-5 | Deactivate user instantly on exit/termination | P0 |

**Acceptance:** an Employee cannot read another employee's record even by calling Firestore directly.

### 5.2 Dashboard (DASH)
Two tabs like the reference: **My Space** (personal) and **Workspace** (managers/HR).
- **My Space (P0):** today's shift, big **Check-in status** card, attendance overview (Day/Week/Month/Year) with Present / On Leave / Absent / Late %, leave balance chips, my request statuses (leave, attendance adjustment, OT), my schedule (rosters), notices, my team.
- **Workspace (P0, managers/HR):** today's attendance tiles (Total · Present · Absent · On Leave · Late), pending approvals (Leave · Adjustment · OT), who is on leave today, department-wise attendance, shift-wise headcount, quick actions.
- Pull-to-refresh, skeleton loaders, real-time updates via Firestore listeners.

### 5.3 Employee management (EMP)
| ID | Requirement | Pri |
|---|---|---|
| EMP-1 | Employee list with search, filters (department, section, shift, status, grade), sort, export | P0 |
| EMP-2 | Add/Edit employee in tabbed form: General · Personal · Employment · Family · Bank · Documents | P0 |
| EMP-3 | Fields: employee ID (unique), name (EN/BN), photo, phone, email, NID, DOB, gender, blood group, address (division → district → upazila for permanent and present), join date, department, section/line, designation, grade, employee type (permanent/probation/contract/worker), reporting manager, shift, weekly off, status | P0 |
| EMP-4 | Status: Active / Inactive / On Leave / Separated; separation date and reason | P0 |
| EMP-5 | Bulk import from Excel template with row-level error report | P0 |
| EMP-6 | Photo upload with compression; document upload (NID, certificates) | P1 |
| EMP-7 | Profile change request by employee, approved by HR | P1 |
| EMP-8 | Bank info visible only to HR Manager/Accounts roles | P0 |

### 5.4 Organization & settings (ORG)
Department, section/line, designation, grade, employee type, office/factory location, holiday calendar, company profile, policies. CRUD for HR Manager/Super Admin. **P0**

### 5.5 Shifts, weekly off and roster (SHIFT)
| ID | Requirement | Pri |
|---|---|---|
| SHIFT-1 | Shift master: name, start, end, break, working hours, grace minutes, crosses-midnight flag, status | P0 |
| SHIFT-2 | Assign default shift per employee; bulk assign by department/section | P0 |
| SHIFT-3 | **Per-employee weekly off** (weekday or custom dates); only HR Manager can edit | P0 |
| SHIFT-4 | Monthly roster grid (employee × day) with drag/tap-to-change and copy-from-last-month | P1 |
| SHIFT-5 | Shift swap request between employees (approval) | P2 |
| SHIFT-6 | Employee sees own upcoming schedule (day / night roster cards as in reference) | P0 |

### 5.6 Attendance (ATT)
| ID | Requirement | Pri |
|---|---|---|
| ATT-1 | **Device sync:** ZKTeco punches pushed from the head-office server into Firestore `attendanceRaw` through a secure bridge (see §8.3) | P0 |
| ATT-2 | Daily processing (Cloud Function): map punches to shift, compute IN/OUT, worked hours, late minutes, early-out, status (Present/Late/Absent/Leave/Holiday/Weekly-off/Half-day) | P0 |
| ATT-3 | Employee attendance log: calendar + list; late days in red | P0 |
| ATT-4 | Manager/HR attendance grid (employee × date, month/week toggle) matching the "Employee Summary" reference | P0 |
| ATT-5 | **Adjustment request** (missing punch / late withdrawal) with reason and optional attachment → HOD approval → recalculation | P0 |
| ATT-6 | Manual attendance entry by HR (audited, reason required) | P0 |
| ATT-7 | Auto-fill Leave into missing days on approval | P0 |
| ATT-8 | Auto reminders for absence/late (scheduled function, daily) | P0 |
| ATT-9 | Mobile check-in/out with GPS geofence for staff without device | P1 |
| ATT-10 | Month close/lock and reopen | P0 |
| ATT-11 | Reprocess a date range after rule/shift change | P0 |

**Acceptance (late rule):** shift 08:00, punch 08:11 → status *Late*, red; punch 08:10 → *Present*. Approved adjustment → status *Present*, `adjusted=true`, red mark removed, audit entry written.

### 5.7 Leave management (LV)
| ID | Requirement | Pri |
|---|---|---|
| LV-1 | Leave types (Casual, Sick, Earned, Maternity, Paternity, Unpaid, Compensatory …) with annual quota, carry-forward, encashable flag, gender/probation eligibility | P0 |
| LV-2 | Balance per employee per leave year (entitled / used / pending / available) | P0 |
| LV-3 | Apply for leave: type, date range, half-day option, reason, attachment (e.g. medical) | P0 |
| LV-4 | Multi-level approval chain (Line Manager → HOD → HR Manager), configurable per department | P0 |
| LV-5 | Statuses: Pending → Processing → Approved / Rejected / Cancelled; shown as colour chips | P0 |
| LV-6 | HR Manager notified on every request; employee gets push + **email** on approval/rejection | P0 |
| LV-7 | On approval, deduct balance and auto-fill attendance | P0 |
| LV-8 | Overlap, balance and policy validation (block or warn) | P0 |
| LV-9 | Leave calendar (team view) and "On leave today" widget | P1 |
| LV-10 | Earn-leave (EL) encashment calculation report | P1 |
| LV-11 | HR can apply leave on behalf of an employee | P0 |

### 5.8 Overtime (OT)
| ID | Requirement | Pri |
|---|---|---|
| OT-1 | Auto-computed OT candidates from attendance (hours beyond shift) | P0 |
| OT-2 | OT request / post-approval by HOD, with edit of approved hours | P0 |
| OT-3 | OT rules: minimum minutes, rounding, weekly-off/holiday multiplier, monthly cap | P1 |
| OT-4 | OT summary per employee/department/month and export | P0 |

### 5.9 Reports and exports (RPT)
All reports filter by date range, department, section, shift, employee type; export **XLSX / CSV / PDF**. **P0 for first five.**
1. Daily attendance report (with late/absent lists)
2. Monthly attendance sheet (employee × day grid with P/A/L/H/W/LT codes)
3. **Salary-sheet input export** (present days, absent, leave by type, late count, OT hours, weekly-off/holiday work)
4. Leave balance & leave register
5. OT report
6. Late / absenteeism analytics (trend charts, top lists)
7. Headcount & turnover (P1)
8. EL encashment (P1)

### 5.10 Notifications and communication (NTF)
- Push (FCM) + in-app inbox + **email** (Firebase *Trigger Email* extension via SMTP).
- Events: request submitted/approved/rejected, absence/late reminder, month-close, new announcement, birthday/anniversary (P2).
- Announcements/notice board with audience targeting (all, department, role). **P0**

### 5.11 Audit and compliance (AUD)
Immutable audit log of create/update/delete/approve/override actions with who, when, before/after. Searchable by HR Manager/Super Admin. **P0**

### 5.12 Localization (L10N)
Full UI in **English and বাংলা** (switch in profile), Bangla numerals optional, Bangla-safe fonts, BDT currency, Bangladesh date format `DD MMM YYYY`, timezone `Asia/Dhaka`. **P0**

### 5.13 Workforce Map — where our people come from (GEO)

**Purpose:** show HR and management, on a Bangladesh district map, which districts our employees come from, with live percentages. It updates automatically whenever employee data changes.

| ID | Requirement | Pri |
|---|---|---|
| GEO-1 | Each employee has **permanent address** and **present address** with **division → district (64) → upazila**, chosen from a fixed list (no free-text district) | P0 |
| GEO-2 | **Workforce Map** screen: Bangladesh district map where districts that have employees are **highlighted** with a red gradient; stronger colour = higher share; districts with no employees stay soft neutral | P0 |
| GEO-3 | **Auto-update:** when HR adds, edits, transfers or separates an employee, the map and numbers update in real time (no manual refresh) | P0 |
| GEO-4 | Below the map: headline **"N/64 districts"**, coverage progress bar, and a ranked list "district — **% of employees** (count)" e.g. Habiganj 20%, Lakshmipur 30% | P0 |
| GEO-5 | Tap a district → sheet with count, %, department breakdown; HR/Admin can open the employee list for that district | P0 |
| GEO-6 | Filters: department, section, shift, employee type, gender; toggle **Permanent / Present address**; toggle **% / count**; Division view | P1 |
| GEO-7 | Data-completeness indicator: "% of profiles with district set" and list of employees missing a district | P1 |
| GEO-8 | Share as poster image / PDF (map + numbers + Charu footer) for management meetings | P1 |
| GEO-9 | Privacy: only HR Manager / Admin see counts and names per district; HOD sees own department; other roles (if enabled) see a **sanitized view** where districts with fewer than 5 employees are grouped as "Others" | P0 |
| GEO-10 | Works for active employees only by default; "include separated" toggle for HR | P1 |

**Percent rule:** `district % = employees in district ÷ active employees with a district recorded × 100`. Employees without a district are shown separately as "Not set".

**Acceptance:** HR changes an employee's permanent district from Cumilla to Habiganj → within 5 seconds Cumilla's share drops, Habiganj's rises, the Habiganj district pulses once, and the ranked list re-orders.

> Dictation note: "Hobbyganj" is read as **Habiganj (হবিগঞ্জ)** and "Luxembourg" as **Lakshmipur (লক্ষ্মীপুর)**. Please confirm.

### 5.14 Analytics Dashboards — attendance, leave, leave indicator, performance (ANL)

**Purpose:** give management, HR, HODs and employees a premium, animated, gradient-chart view of workforce health: who is present, who is on leave, where leave risk is building, and how performance is trending.

**Dashboards (tabs):** `Overview` · `Attendance` · `Leave` · `Leave Indicator` · `Performance` · (employee-only) `My Insights`.

| ID | Requirement | Pri |
|---|---|---|
| ANL-1 | **Overview:** KPI cards with sparklines and trend chips (Headcount, Attendance %, Late %, Absent %, On leave today, OT hours, Avg performance) + 12-month attendance wave chart + department ranking | P0 |
| ANL-2 | **Attendance dashboard:** attendance-rate wave (12 months), daily trend (30 days), Present/Late/Absent/Leave **donut**, arrival-time histogram, attendance heatmap calendar, department and shift comparison bars, top-10 late and top-10 absent lists, OT trend | P0 |
| ANL-3 | **Leave dashboard:** leave-by-type **donut**, monthly leave trend (stacked gradient area), leave heatmap (who is out, by day), department leave utilization bars, approval-turnaround gauge, upcoming leave timeline, EL liability (days and encashment estimate) | P0 |
| ANL-4 | **Leave Indicator:** per-employee and per-department **gauges** showing used vs entitled with traffic-light zones, plus an alert list (see rules below) | P0 |
| ANL-5 | **Performance dashboard:** average score trend by cycle, score distribution (histogram/bell), department radial comparison, component **radar** (e.g., the four appraisal components), leaderboard, confirmation-due list | P1 |
| ANL-6 | **My Insights** (every employee): my attendance donut, punctuality streak, my leave gauges, my monthly worked hours; my performance only after HR publishes it | P1 |
| ANL-7 | Filters on every dashboard: period (7D / 30D / 3M / 12M / custom), department, section, shift, employee type | P0 |
| ANL-8 | Tap any chart element → drill-down sheet (e.g., tap Cumilla's bar → employees) with role-based access | P1 |
| ANL-9 | Export dashboard or a single chart as PNG/PDF (board-meeting ready) | P1 |
| ANL-10 | All charts are **animated, gradient** charts (draw-in, count-up, smooth transitions) per UI-Spec §18; Lite mode for low-end phones | P0 |
| ANL-11 | Numbers on dashboards must equal the reports (same formulas, same month-lock rules) | P0 |

**Metric definitions (configurable in Settings)**
| Metric | Formula |
|---|---|
| Attendance rate | (Present + Late days) ÷ scheduled working days |
| Punctuality rate | On-time present days ÷ (Present + Late days) |
| Absenteeism rate | Absent days ÷ scheduled working days |
| Leave utilization | Leave days used ÷ leave days entitled |
| Approval turnaround | Median hours from application to final decision |
| Attendance Discipline Score (ADS, v1 performance proxy) | 70% attendance rate + 30% punctuality rate (weights editable) |
| Performance score (appraisal) | Weighted sum of appraisal components using the weights in `settings/performanceModel` (default taken from the PMS appraisal form: 60 / 15 / 15 / 10 — map the four components to your form) |

**Leave Indicator rules (traffic light, configurable)**
- **Balance status:** Green ≥ 50% balance left · Amber 20–50% · Red < 20% (per leave type and total).
- **Alerts for HR review (not accusations):** sick leave > 5 days in 90 days · ≥ 3 one-day leaves in a month · repeated leave adjacent to weekly off/holiday (≥ 3 times in 90 days) · EL balance above cap or near year-end expiry · > 15% of a section on leave on the same day · pending approvals older than 48 h.
- Pattern alerts are visible to **HR Manager/HR Executive only**. Employees see only their own balances.

**Performance data in v1:** until the full PMS module (v2.x) exists, HR enters appraisal scores through a simple form (cycle, employee, component scores, rating band, attitude score for casual → permanent confirmation). The dashboard reads those scores and the automatic attendance/absence data.

**Access:** HR Manager/Admin/Management: all. HR Executive: all except salary-linked data. HOD/Supervisor: own department. Employee: My Insights only. Accounts: Attendance and Leave tabs (read-only).

**Acceptance:** approving a leave updates the Leave donut, the department bar and the employee's leave gauge within 5 seconds, with a smooth animated transition; the monthly attendance rate on the dashboard matches the Monthly Attendance Report to the decimal.

---

## 6. Key user flows

**Late withdrawal:** Employee sees red *Late* → *Request adjustment* → reason → Supervisor/HOD gets push → Approve → function recalculates the day → employee notified, red mark cleared.

**Leave:** Apply → validations → chain approval → HR Manager notified → final approve → balance deducted → attendance auto-filled → email to employee.

**Month close:** HR reviews exceptions list (missing punches, unapproved requests) → resolves → *Lock month* → export salary-sheet input.

---

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Dashboard < 2 s on 4G mid-range Android; list screens paginated (20–50 rows); monthly grid for 1,000 employees < 4 s |
| Scale | Design for 2,000 employees, 1M attendance docs/year |
| Availability | Firebase managed; target 99.9%; offline read cache; offline-queued requests |
| Security | Firebase Auth, custom claims, strict Firestore/Storage rules, App Check, TLS, least privilege, no secrets in app, PII only readable by authorized roles |
| Privacy | NID, bank, salary classified *Restricted*; data stays in a chosen Firebase region (e.g. `asia-south1`) |
| Usability | Large touch targets (≥ 48 dp), works for low-literacy users via icons + Bangla labels, WCAG AA contrast |
| Device support | Android 8.0+ (API 26+), 2 GB RAM; app size < 40 MB |
| Observability | Crashlytics, Analytics (events), Performance Monitoring, function logs & alerts |
| Backup | Daily Firestore export to Cloud Storage; 30-day retention |
| Auditability | Every override and approval traceable |

---

## 8. Architecture

### 8.1 Overview
```
Flutter app (Android + Web)
   │  Riverpod · go_router · Firestore SDK
   ▼
Firebase Auth ── custom claims (role, deptIds, empId)
Cloud Firestore ── employees, attendance, leave, ot, ...
Cloud Storage  ── photos, documents, exports
Cloud Functions (TypeScript)
   ├─ onPunchCreated → processDay
   ├─ nightly: dailyClose, absence/late reminders
   ├─ onLeaveApproved → fill attendance, deduct balance
   ├─ onRequestChange → notifications
   └─ exportReport (XLSX/PDF)
FCM (push) · Trigger Email (SMTP) · Crashlytics · App Check

ZKTeco devices ── Head Office server ── Bridge service ──HTTPS(API key/service account)──► Cloud Function `ingestPunches`
```

### 8.2 Client architecture
Feature-first folders, Riverpod state, repository pattern over Firestore, freezed models, `go_router` with role guards, `flutter_localizations` + ARB files for EN/BN. Details in `TRD.md`.

### 8.3 Attendance device integration
Face devices store punches on the Head Office server. A small **bridge service** (Python or Node) runs on that server, reads new punches (ZKTeco SDK/ADMS push or DB read), de-duplicates and POSTs batches to the `ingestPunches` HTTPS function with a secret key. Punches are idempotent (`deviceId + empCode + timestamp` hash). If the bridge is offline, punches queue locally and back-fill later. *The bridge is the only on-premise component.*

### 8.4 Cost note
Firestore, Auth, Hosting fit the free Spark plan for development; **Cloud Functions require the Blaze (pay-as-you-go) plan**. For ~1–2k employees expect low monthly cost; set budget alerts.

---

## 9. Screen inventory (MVP)

| # | Screen | Roles |
|---|---|---|
| 1 | Splash / Login / Forgot password | All |
| 2 | Dashboard — My Space | All |
| 3 | Dashboard — Workspace | Mgr, HR |
| 4 | Employee list / profile / add-edit (tabs) | HR, Mgr (view) |
| 5 | Attendance — my log | All |
| 6 | Attendance — team grid / employee summary | Mgr, HR |
| 7 | Adjustment request + approvals | All / HOD |
| 8 | Leave — my leaves, apply, balance | All |
| 9 | Leave — requests (approval inbox), register | Mgr, HR |
| 10 | OT — requests/approvals/summary | All / HOD / HR |
| 11 | Schedules / roster / shifts master | HR, all (view own) |
| 12 | Reports hub + export | HR, HOD, Accounts |
| 13 | Notifications inbox, Announcements | All |
| 14 | Settings: org, leave types, holidays, rules, roles | HR Mgr, Admin |
| 15 | Audit log | Admin, HR Mgr |
| 16 | Profile & language | All |

---

## 10. Analytics events (examples)
`login_success`, `leave_applied`, `leave_approved`, `adjustment_requested`, `report_exported`, `month_locked`, `punch_ingest_batch`.

## 11. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Device/bridge downtime → missing punches | Queue + back-fill, "missing punch" exception report, manual entry |
| Wrong rule configuration | Rules in Settings with effective dates; reprocess tool; audit |
| Low smartphone use among workers | Kiosk/shared-tablet mode and HR-assisted requests (LV-11, ATT-6) |
| Data privacy | Role rules, restricted fields in sub-collections, App Check |
| Scope creep (payroll) | Locked MVP; payroll in v2 |
| Vendor cost surprise | Budget alerts, efficient reads (summary docs), pagination |

## 12. Open questions (please confirm)
1. Exact shift list and grace minutes — correct as in §4?
2. Half-day, early-out and "late 3 = 1 day cut" rules?
3. OT rules: rate multipliers, minimum minutes, approval before/after?
4. Leave types, annual quotas, carry-forward, EL encashment formula?
5. Approval chain per department (Supervisor → HOD → HR)?
6. Number of employees at launch; share of workers with smartphones?
7. Does the head-office server allow outbound HTTPS to the cloud (for the bridge)?
8. Email sender domain/SMTP provider available?
9. Do Accounts need payroll in v1 or only exports?

## 13. Definition of done (MVP)
All P0 requirements implemented, Firestore rules tested with the emulator, 90% pass on UAT with 20 pilot users (HR + 2 departments) for one full month cycle, signed-off salary-sheet export matching the manual sheet.

---

## 14. Additional items learned from reference screenshots (to confirm)

| Item | Seen in | Decision |
|---|---|---|
| Shift **flexibility** (e.g. 60 min) and separate **check-in / check-out rules** | Shift table | P1 — add `flexibilityMinutes`, `checkInRules`, `checkOutRules` to shifts; MVP uses grace minutes only |
| Employee tabs: **Peer, Teams, Groups** | Employees | P1 — Teams = department/section; Groups = custom employee groups for notices and approvals |
| HR Management tabs: Team, Group, Shift, **Office Location**, **Session** | HR Management | MVP: Shift, Office Location. Session (shift sessions) = P2 |
| **Policies** page | Sidebar | P1 — upload/publish PDF policies, employee acknowledges |
| **Form Builder** | Sidebar | P2 — custom request forms |
| **ACL** (access control) | Sidebar | P0 — Settings › Roles & Access (assign role, department scope) |
| **Assets** | Sidebar | P1.1 — laptop/phone/uniform/ID card issue & return |
| **Bank Info** | Sidebar | P0 inside Employee (restricted) |
| **Payroll Hub / Salary Structure / Payroll Setup** | Sidebar | v2 |
| **Integration** | Sidebar | P0 as Settings › Devices (ZKTeco bridge status) |
| Dashboard **Workspace / My Space** | Dashboard | P0 (already in §5.2) |
| Reports: Attendance rate, Absent rate by month | Reports | P0 |
