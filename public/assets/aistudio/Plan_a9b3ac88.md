# Charu HCM — Plan.md (Build Plan & Task Tracker)

**Purpose:** tells you and the AI agent **what to build, in what order, and when a phase is done.** Work one phase at a time. After each phase: run the app, review, commit, tick the boxes, then move on.

**Current phase:** `Phase 0` ← update this line after every phase so the agent always knows where we are.

Read first: `PRD.md` (what) · `App-Flow.md` (journeys) · `UI-Spec.md` (look) · `TRD.md` (how) · `Schema.md` (data).

---

## 0. Working agreement with the AI agent
1. One phase per session. Agent first writes a short plan, then waits for approval.
2. Agent must follow the six docs; if something is missing or conflicting it **asks** instead of guessing.
3. Never change `Schema.md` field names without approval; if the data model must change, update `Schema.md` in the same commit.
4. After every task: `flutter analyze`, `flutter test`, run on emulator, then commit.
5. You (HR owner) review on the emulator using the **Phase checklist**, not by reading code.

Commit message format: `phase-3: add shift master and roster grid`.

---

## 1. Timeline overview (part-time, 1 HR owner + AI agent)

| Week | Phase | Output | Milestone |
|---|---|---|---|
| 0 | Prep | Accounts, tools, Firebase projects, docs in repo | **M0** Ready to code |
| 1 | 0–1 | Theme, shell, localization, login, roles | **M1** Secure login works |
| 2 | 2–3 | Org masters, employees, shifts, weekly off, roster | **M2** HR data in system |
| 3–4 | 4–5 | Attendance engine, device bridge, adjustments | **M3** Real punches → attendance |
| 5 | 6 | Leave end-to-end | **M4** Leave without paper |
| 6 | 7–8 | OT, dashboards, notifications, notices | **M5** Daily-use ready |
| 7–8 | 9, 9B, 9C | Reports, exports, month lock, **Workforce Map**, **Analytics dashboards** | **M6** Salary input export + live district map + animated dashboards |
| 8 | 10 | Hardening, rules tests, release build | **M7** Pilot build |
| 9–12 | Pilot | 20 users, one department, one month cycle | **M8** UAT sign-off |
| 13+ | Rollout | Department by department, v1.1 backlog | **M9** Company-wide |

---

## 2. Prep (Week 0)

- [ ] Install Flutter, Android Studio (SDK 34, emulator), JDK 17, Node 20, Git, Firebase CLI, FlutterFire CLI, Antigravity (see TRD §12.1)
- [ ] `flutter doctor -v` all green; Android licenses accepted
- [ ] Create Firebase projects `charu-hcm-dev` and `charu-hcm-prod`; Blaze plan + budget alerts on dev/prod
- [ ] Enable Auth (email/password), Firestore (`asia-south1`), Storage, FCM, Crashlytics, App Check
- [ ] Install *Trigger Email from Firestore* extension with company SMTP (dev first)
- [ ] Create Flutter project `charu_hcm` (package `com.charuceramic.hcm`), `flutterfire configure`, `firebase init`
- [ ] Create GitHub repo, protect `main`
- [ ] Copy six docs into `/docs`, logo into `assets/brand/`
- [ ] Add agent rules file (TRD §13)
- [ ] **Confirm open questions** (PRD §12): shifts, grace, OT rules, leave quotas, approval chains

**Done when:** empty app runs on emulator, repo has docs, Firebase connected.

---

## 3. Phases

### Phase 0 — Scaffold, theme, localization, shell
**Goal:** the app looks like Charu and switches language.
- [ ] `app_colors.dart`, `app_theme.dart` from UI-Spec §12
- [ ] Riverpod, go_router, ARB (EN + BN), language toggle persisted
- [ ] Shared widgets: `CharuAppBar`, `KpiCard`, `StatusChip`, `AvatarTile`, `SectionCard`, `EmptyState`, `SkeletonList`, `PrimaryButton`
- [ ] Adaptive shell: 4-tab bottom nav (mobile, UI-Spec §15.2-G) / black sidebar (≥ 840 px)
- [ ] `HeroHeader`, `SheetContainer`, `ServiceTile`, `ExpandableGrid`, `PromoCarousel`, `QuickChip`, `PastelFeatureCard`, `AlertCard`, `BottomTabBar` (UI-Spec §15.4) with mock data
- [ ] Debug "component gallery" screen
- [ ] **Chart theme and chart primitives** prepared with mock data (UI-Spec §18.2) 
- [ ] **Luxury motion system** (UI-Spec §16): ivory/noir/wine tokens, `AppGradients`, `GradientText`, `AuroraBackground`, `CountUpText`, `MotionPrefs` (Lite mode), skeleton shimmer
- [ ] Flavors `dev` / `prod`

**Review checklist:** colours match #EC1C24/black; Bangla text uses Hind Siliguri; sidebar active pill correct; gallery shows all statuses.

**Prompt:**
```
Read /docs (all six files). Do Phase 0 from Plan.md only. Implement theme exactly from UI-Spec §12, Riverpod + go_router + ARB EN/BN,
shared widgets listed in Plan Phase 0, adaptive shell (bottom nav mobile / black sidebar web), a debug component gallery, and dev/prod flavors.
No backend yet. Run flutter analyze and tests. Show me a plan first.
```

### Phase 1 — Auth, roles, guards
**Goal:** secure login, roles control what you see.
- [ ] Login screen (UI-Spec §7.1), forgot password, force password change
- [ ] Employee ID → email mapping (`<empId>@charu.hcm`) or real email
- [ ] Custom claims (`role`, `empId`, `deptIds`, `active`); role guards in router
- [ ] Functions: `setUserClaims`, `deactivateUser`
- [ ] `firestore.rules` + `storage.rules` starter from Schema §4
- [ ] Emulator rule tests for each role
- [ ] Seed first Super Admin and HR Manager

**Review:** login as each role → different menus; employee cannot open HR screens by URL; deactivated user is blocked.

**Prompt:**
```
Do Phase 1. Follow App-Flow F1 and Schema §2.1, §4 and TRD §4. Implement Firebase Auth login, forgot password, forced password change,
custom claims via setUserClaims/deactivateUser functions, role-based routing, firestore.rules and rules tests with the emulator. Seed an admin script in /tools.
```

### Phase 2 — Org masters and Employees
**Goal:** HR can manage people data.
- [ ] CRUD: departments, sections, designations, grades, locations (HR Manager)
- [ ] Employees list: search, filters, pagination, status chip (UI-Spec §7.4)
- [ ] Add/Edit employee stepper (UI-Spec §7.5); photo upload; restricted data in `private`
- [ ] Create login for employee (calls `setUserClaims`)
- [ ] Excel bulk import with error report; export
- [ ] Seed 10 test employees and 2 departments

**Review:** HR Executive cannot see bank/salary; duplicate ID blocked; import shows row errors.

**Prompt:**
```
Do Phase 2 per PRD §5.3–5.4, App-Flow F9 and Schema §2.2–2.4. Build org masters CRUD, employee list/add/edit (stepper), photo upload, private sub-collection,
create-login action, Excel import/export. Use pagination and skeleton/empty/error states. Add seed script.
```

### Phase 3 — Shifts, weekly off, roster, holidays
**Goal:** every employee has a known schedule.
- [ ] Shifts master (seed General 8–5, A 6–2, B 2–10, Night 10–6 crossing midnight)
- [ ] Default shift per employee; bulk assign by department/section
- [ ] **Per-employee weekly off**, editable by HR Manager only
- [ ] Monthly roster grid + copy last month (P1 can slip)
- [ ] Holiday calendar
- [ ] My Schedule cards (UI-Spec §6.7)
- [ ] Pure function `resolveDaySchedule()` with unit tests (roster → weekly off → holiday → default)

**Review:** change one employee's weekly off; schedule updates; non-HR-Manager cannot edit.

**Prompt:**
```
Do Phase 3 per PRD §5.5, App-Flow F10, Schema §2.5–2.7. Implement shifts, assignment, per-employee weekly off (HR Manager only), roster grid, holidays,
My Schedule cards, and a tested pure function resolveDaySchedule shared by app and functions logic.
```

### Phase 4 — Attendance engine and device bridge
**Goal:** real punches become correct daily attendance.
- [ ] Functions: `ingestPunches` (API key, idempotent), `processDay`, `reprocessRange`, `nightlyClose`
- [ ] `dailySummary/{date}` maintained for dashboards
- [ ] Late rule (10 min grace → red), absent, weekly off, holiday, missing punch, night shift
- [ ] Unit + emulator tests for all those cases
- [ ] `tools/simulate_punches.ts` for fake punches
- [ ] Flutter: My Attendance (calendar + list), Day Detail, Team Grid / Employee Summary (UI-Spec §6.6)
- [ ] Settings › Devices screen (last sync)
- [ ] **ZKTeco bridge** service on Head Office server (TRD §6) — start with 1 device and 20 employees

**Review:** simulate punches at 08:10 and 08:11 → Present vs Late; night shift crossing midnight; reprocess works; duplicates ignored.

**Prompt:**
```
Do Phase 4 per PRD §5.6, App-Flow F2/F4, Schema §2.8–2.11 and §5 (processDay algorithm), TRD §6–7.
Write functions ingestPunches, processDay, reprocessRange, nightlyClose with tests (late grace 10 min, night shift, missing punch, weekly off, holiday, absent).
Then Flutter attendance screens (my log, day detail, team grid) and tools/simulate_punches.ts. Do NOT let clients write attendance.
```
**Separate prompt (bridge):**
```
Write a Python Windows-service bridge: read punches from a ZKTeco device (pyzk) since a SQLite checkpoint, batch 200, POST to ingestPunches with x-api-key,
retry with backoff, local queue, heartbeat every 5 min, config via .env. Include README with install steps.
```

### Phase 5 — Adjustments and approvals inbox
**Goal:** withdraw late marks and fix missing punches.
- [ ] Employee request form (type, reason, attachment)
- [ ] HOD approvals inbox (`pendingApproverEmpIds` query)
- [ ] `decideAdjustment` function: recompute day, clear red mark, audit
- [ ] In-app + push notification (basic)
- [ ] HR manual attendance entry with reason (audited)

**Review:** late → request → HOD approves → red mark gone; reject shows note; closed month blocked.

**Prompt:**
```
Do Phase 5 per App-Flow F5 and PRD ATT-5/ATT-6. Implement adjustment request UI, approvals inbox, decideAdjustment and manualAttendance callable functions with auditLogs, and basic notifications.
```

### Phase 6 — Leave management
**Goal:** leave without paper.
- [ ] Leave types, balances, year rollover function (seed CL, SL, EL, ML, PL, LWP)
- [ ] Apply form (half-day, attachment), validations (balance, overlap, eligibility)
- [ ] Approval chain, `submitLeave` / `decideLeave` / `cancelLeave`
- [ ] Final approval: deduct balance (transaction), auto-fill attendance as Leave, **email employee**, notify HR Manager
- [ ] UI: My Leaves, Balance, Requests table (UI-Spec §7.7), approval card
- [ ] HR apply-on-behalf; On-leave-today widget

**Review:** full chain test with 3 users; balance correct after cancel/reject; attendance shows Leave; email arrives.

**Prompt:**
```
Do Phase 6 per PRD §5.7, App-Flow F6/F7, Schema §2.12–2.14. Implement leave types, balances, apply form with validations, approval chain callables
(submitLeave, decideLeave, cancelLeave) using transactions, auto-fill attendance, Trigger Email docs, HR notification, and the Leaves screens from UI-Spec §7.7.
```

### Phase 7 — Overtime
**Goal:** OT approved and ready for salary.
- [ ] OT candidates from attendance (rules in `settings/otRules`)
- [ ] HOD approve/edit minutes; employee OT request (post-approval)
- [ ] OT summary by employee/department/month

**Review:** worked 9h30 on 8h shift → OT candidate; rounding and min minutes correct; weekly-off OT multiplier flagged.

**Prompt:**
```
Do Phase 7 per PRD §5.8, App-Flow F8, Schema §2.15 and §2.21 (otRules). Build OT candidates in processDay, approval UI with editable minutes, decideOT callable, summary views, with tests for rounding and thresholds.
```

### Phase 8 — Dashboards, notifications, notices
**Goal:** the app is pleasant to open every day.
- [ ] **Home** (UI-Spec §15.2) and **আমার চারু** (§15.3) with real data: status pill, role-based service grid, notice carousel, quick chips; Workspace dashboard for managers/HR (UI-Spec §7.3) reading `dailySummary`
- [ ] FCM push (token lifecycle, foreground/background), notification inbox
- [ ] Announcements with audience targeting
- [ ] Scheduled reminders (absent/late) via email + push

**Review:** KPI numbers equal real attendance; dashboard < 2 s; push opens correct screen.

**Prompt:**
```
Do Phase 8 per PRD §5.2/5.10, App-Flow F13, UI-Spec §7.2–7.3. Build both dashboards from dailySummary, FCM push with deep links, notification inbox, announcements with audience, and a scheduled reminders function.
```

### Phase 9 — Reports, exports, month close
**Goal:** HR closes the month in under 2 hours.
- [ ] Reports: daily, monthly grid (P/A/L/H/W/LT), **salary-sheet input**, leave register, OT, analytics charts
- [ ] Export XLSX / CSV / PDF; background export for large data
- [ ] Month close checklist, `lockMonth` / `reopenMonth`
- [ ] EL encashment report (P1)
- [ ] (Workforce Map is built in Phase 9B)

**Review:** export vs your manual salary sheet for the pilot department — numbers match.

**Prompt:**
```
Do Phase 9 per PRD §5.9, App-Flow F11/F12. Implement the reports hub, XLSX/CSV/PDF export (exportReport function for large data), month close checklist with lockMonth/reopenMonth, and charts with fl_chart per UI-Spec §6.9.
```

### Phase 9B — Workforce Map (Bangladesh districts)
**Goal:** HR sees where employees come from, updated live. *(Needs Phase 2 employee data.)*
- [ ] Employee form: division → district → upazila dropdowns for permanent and present address; `homeDistrictId` copy (Schema §10.1); seed `districts.json`
- [ ] Prepare map geometry (`tools/geo/`), licence checked, `assets/geo/bd_districts.json` ≤ 300 KB, tests for 64 features
- [ ] Functions: `onEmployeeGeoWrite`, `rebuildGeoStats`; docs `geoStats/*` and sanitized `geoStatsPublic/*`; rules + tests
- [ ] Flutter: `DistrictMapView` (CustomPainter + InteractiveViewer), labels, coverage bar, ranked list with %, district sheet (UI-Spec §17)
- [ ] Live updates + pulse animation; reveal animation; Lite mode behaviour
- [ ] Filters (dept/section/type/gender, permanent/present, %/count), missing-district list
- [ ] Poster export (PNG/PDF)

**Review:** change an employee's district → map and % update within 5 s; sanitized view hides districts < 5; map first paint < 500 ms on a low-end phone; looks like UI-Spec §17.

**Prompt:**
```
Do Phase 9B per PRD §5.13, App-Flow F16, UI-Spec §16–17, Schema §10 and TRD §15.
1) Add division/district/upazila address fields to the employee form using assets/geo/districts.json.
2) Write tools/geo script notes and use assets/geo/bd_districts.json (64 features) to build DistrictMapView with CustomPainter, InteractiveViewer, gradient fill, labels, tap selection.
3) Implement onEmployeeGeoWrite and rebuildGeoStats Cloud Functions with tests, plus rules for geoStats and geoStatsPublic.
4) Build the Workforce Map screen exactly per UI-Spec §17 with live Firestore listener, count-up, reveal and pulse animations, and Lite mode.
```

### Phase 9C — Analytics dashboards (animated gradient charts)
**Goal:** management and HR see attendance, leave, leave-indicator and performance in premium animated charts. *(Needs Phases 4, 6, 7 data; Phase 9 reports formulas.)*
- [ ] `ChartTheme`, `MotionPrefs`, `ChartCard`, and chart widgets: wave, gradient bars, pill progress, **gradient donut**, leave gauge, ring cluster, heatmap calendar, radar, histogram, leaderboard, timeline (UI-Spec §18.3, §18.7)
- [ ] Functions: `updateDailySummary` (in `processDay`), `rebuildMonthlySummary`, `computeLeaveIndicators`, `buildPerformanceSummary` + tests (Schema §11)
- [ ] Dashboards: Overview, Attendance, Leave, Leave Indicator (UI-Spec §18.5–18.6), filters, drill-down sheets
- [ ] Performance: appraisal cycles + simple appraisal entry form, `settings/performanceModel`, Performance tab, publish to employee
- [ ] **My Insights** for employees
- [ ] Rules for new collections + tests; Lite mode verified on a low-end phone
- [ ] Export card/screen as PNG/PDF

**Review:** approve a leave → donut, gauge and department bar update within 5 s with animation; dashboard monthly attendance % equals the Monthly Attendance Report; HR sees alerts, employee does not; Lite mode shows the same numbers without animation.

**Prompt:**
```
Do Phase 9C per PRD §5.14, App-Flow F17, UI-Spec §18, Schema §11 and TRD §16.
1) Build the reusable animated gradient chart widgets exactly as UI-Spec §18.3/18.7 (use fl_chart for wave/bar/radar, CustomPainter for donut/gauge/heatmap), with ChartTheme and MotionPrefs (Lite mode).
2) Implement the aggregation Cloud Functions and tests (dailySummary, monthlySummary, leaveIndicators, performanceSummary) using shared formula code.
3) Build the dashboard tabs (Overview, Attendance, Leave, Leave Indicator, Performance, My Insights) with filters, drill-down, live pulse updates, and golden tests for charts.
Keep reads per dashboard <= 20; never query raw attendance for charts.
```

### Phase 10 — Hardening and release
**Goal:** safe, fast, installable.
- [ ] Rules tests for every role × collection; fix gaps
- [ ] App Check enforced; Crashlytics, Analytics, Performance traces
- [ ] Accessibility pass (TalkBack, 130% text) and performance pass
- [ ] Backups scheduled; budget alerts verified
- [ ] Icons, splash, signing keystore (backed up), `flutter build appbundle` and split APK
- [ ] Web build deployed to Hosting (HR admin)
- [ ] README, runbooks, CHANGELOG; tag `v1.0.0-pilot`

**Prompt:**
```
Do Phase 10 per TRD §4, §5, §10–12. Audit security rules with emulator tests, enable App Check, add Crashlytics/Analytics/Performance, perform accessibility and performance fixes,
configure backups, prepare signing and release builds, write README and runbooks. Produce a security and performance review report.
```

---

## 4. Pilot and rollout

| Step | Activity | Owner |
|---|---|---|
| 1 | Train 20 pilot users (HR + 2 departments) — 30-min session, Bangla quick-guide | HR |
| 2 | Run parallel with current process for **one full month** | HR |
| 3 | Compare exports vs manual sheets; log defects | HR + Dev |
| 4 | Fix, re-test, freeze | Dev |
| 5 | UAT sign-off (HR Manager, Accounts, 2 HODs) | Management |
| 6 | Roll out by department (1–2 per week); HR-assisted requests for workers | HR |
| 7 | Support window: daily check of device sync, errors, feedback | HR + Dev |

**Go-live checklist**
- [ ] All P0 requirements met (PRD)
- [ ] 0 critical / 0 high defects open
- [ ] Prod Firebase configured; rules deployed; backups running
- [ ] Device bridge stable for 2 weeks
- [ ] Users created and trained; Bangla guide shared
- [ ] Rollback plan: keep manual process available for first month-end

---

## 5. Backlog (after MVP)

| Version | Items |
|---|---|
| **v1.1** | Mobile geo-fenced check-in, document vault, profile change requests, assets, policies with acknowledgement, holiday calendar polish |
| **v1.2** | Shift swap, groups, birthday/anniversary notices, dark mode |
| **v2.0** | Payroll Hub (salary structure, payroll run, payslips PDF, send payslips), bank advice |
| **v2.x** | Performance management (PMS), disciplinary/show-cause workflow, form builder, exit and clearance, iOS release |

---

## 6. Definition of done (every task)
- [ ] Matches `PRD.md` requirement ID and `App-Flow.md` journey
- [ ] UI follows `UI-Spec.md` (tokens, components, EN + BN)
- [ ] Data matches `Schema.md`; rules updated and tested
- [ ] Loading, empty, error, offline states handled
- [ ] Unit/widget tests added; `flutter analyze` clean
- [ ] Works on Android emulator (and web if HR screen)
- [ ] Commit pushed; Plan.md ticked; "Current phase" updated

## 7. Progress log (update after each phase)

| Date | Phase | Status | Notes / decisions |
|---|---|---|---|
| | Prep | ☐ | |
| | 0 | ☐ | |
| | 1 | ☐ | |
| | 2 | ☐ | |
| | 3 | ☐ | |
| | 4 | ☐ | |
| | 5 | ☐ | |
| | 6 | ☐ | |
| | 7 | ☐ | |
| | 8 | ☐ | |
| | 9 | ☐ | |
| | 10 | ☐ | |
