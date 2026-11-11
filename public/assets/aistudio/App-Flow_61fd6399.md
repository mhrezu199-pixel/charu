# Charu HCM — App-Flow.md (User Journeys & Navigation)

**Purpose:** describes how each user moves through the app, step by step: screens, actions, system reactions, and failure cases. Use with `PRD.md` (what), `UI-Spec.md` (look) and `Schema.md` (data).

Notation: `[Screen]` = screen · `(Action)` = tap/input · `→` = navigates · `⚙` = system/Cloud Function action · `⚠` = error/edge case.

---

## 1. Navigation map

### 1.1 App entry
```
Splash (black, Charu logo)
  ├─ no session → [Login] → (Login ok)
  │        ├─ mustChangePassword = true → [Change Password] → [Home]
  │        └─ else → [Home]
  └─ session valid → [Home]
```

### 1.2 Home by role
> **Mobile bottom nav is superseded by UI-Spec §15:** 4 tabs — Home · আমার চারু (My Charu) · Check-in (or Requests/Approvals by role) · Inbox (badge). Web sidebar stays as below.

| Role | Bottom nav (mobile) | Sidebar (web) |
|---|---|---|
| Employee | Home · Attendance · Leave · Requests · Menu | Dashboard · Attendance · Leaves · Requests · Notices · Profile |
| Supervisor / HOD | Home · Team · Approvals · Reports · Menu | Dashboard · Team Attendance · Approvals · Leaves · OT · Reports |
| HR Executive | Home · Employees · Attendance · Leaves · Menu | Dashboard · Reports · HR Management · Settings (limited) |
| HR Manager / Super Admin | Home · Employees · Approvals · Reports · Menu | Everything + Settings, Roles & Access, Audit Log, Month Lock |
| Accounts | Home · Reports · Menu | Dashboard · Reports (read-only) |

### 1.3 Screen tree
```
Home
 ├─ Dashboard: My Space | Workspace (managers/HR)
 ├─ Attendance
 │    ├─ My Log (calendar/list) ── Day Detail ── Request Adjustment
 │    ├─ Team Grid / Employee Summary (managers/HR)
 │    └─ Manual Entry (HR)
 ├─ Leave
 │    ├─ My Leaves ── Leave Detail
 │    ├─ Apply Leave
 │    ├─ Balance
 │    └─ Requests Inbox (approvers) ── Request Detail
 ├─ Overtime: My OT | Approvals | Summary
 ├─ Schedules: My Schedule | Roster Grid (HR) | Shifts Master (HR)
 ├─ Employees (HR): List ── Profile ── Add/Edit (General, Personal, Employment, Family, Bank, Documents)
 ├─ Reports: Daily | Monthly Grid | Salary Input | Leave Register | OT | Analytics
 ├─ Notices: Announcements | Notifications Inbox
 ├─ Settings (HR Mgr/Admin): Company, Org Masters, Leave Types, Holidays, Attendance Rules, OT Rules, Approval Chains, Roles & Access, Devices
 ├─ Audit Log (Admin)
 └─ Profile: My Info, Language (বাংলা/English), Change Password, Logout
```

---

## 2. Core flows

### F1. Login and first-time setup
1. [Login] (Employee ID or email, password) → (Login).
2. ⚙ Firebase Auth validates; app reads custom claims (`role`, `empId`, `deptIds`, `active`).
3. If `mustChangePassword` → [Change Password] (new password rules) → ⚙ flag cleared → [Home].
4. ⚙ Register FCM token; request notification permission (explain why in plain Bangla/English).
5. ⚠ Wrong password: inline error; after 5 fails temporary lock (Firebase). ⚠ `active=false`: "Your account is inactive. Contact HR." ⚠ Offline: "No internet connection."
6. (Forgot password) → enter ID/email → ⚙ reset email → confirmation.

### F2. Daily attendance (device-based staff)
1. Employee punches face device at the gate.
2. ⚙ Bridge sends punch → `ingestPunches` → `attendanceRaw` → `processDay`.
3. ⚙ `attendance/{empId_date}` created/updated: status Present or Late (red).
4. Employee opens [Home › My Space]: check-in card shows today's punches read-only.
5. If **Late** → red chip "Late 11 min" with (Request adjustment) shortcut.

### F3. Daily attendance (mobile check-in — P1, staff without device)
1. [Home] (Check-in) → ⚙ app checks GPS inside geofence of assigned location.
2. ✔ inside → punch saved with `source: mobile` → card shows time.
3. ⚠ outside geofence → "You are not at the work location" (no punch). ⚠ GPS off → prompt to enable. ⚠ Mock location → blocked and logged.

### F4. View attendance
1. [Attendance › My Log] → month navigator, calendar dots: green present, red late, dark-red absent, violet leave, grey off.
2. (Tap day) → [Day Detail]: shift, IN/OUT, worked hours, late minutes, OT, status, adjustment status.
3. Managers: [Team Grid] → filter (dept, shift, date range) → (tap cell) → Day Detail for that employee → (Add manual entry) HR only.

### F5. Late withdrawal / missing punch adjustment
1. Employee: [Day Detail] → (Request adjustment) → form: type, correct time (for missing punch), reason (required), attachment (optional) → (Submit).
2. ⚙ `attendanceAdjustments` created `pending`; push + in-app notification to HOD (and Supervisor if chain requires).
3. HOD: [Approvals] badge → [Request Detail] (employee, date, punches, reason) → (Approve) or (Reject + note required).
4. ⚙ `decideAdjustment`: on approve → recalculate day, clear red mark, `adjusted=true`, write audit; notify employee. On reject → notify with note.
5. ⚠ Month locked → "This month is closed. Contact HR Manager." ⚠ Duplicate pending request for same day → blocked. ⚠ Request older than policy window (e.g., 7 days) → blocked or flagged.

### F6. Apply for leave
1. [Leave › Apply] (or FAB) → choose type → date range / half-day → reason → attachment if required → (Submit).
2. Client pre-checks: balance, overlap, holidays/weekly-off not counted, eligibility, notice rules. ⚠ Failures show inline reasons ("Casual leave balance: 1 day, requested 2").
3. ⚙ `submitLeave`: creates request with approval chain (e.g., Supervisor → HOD → HR Manager), reserves balance as *pending*, notifies first approver **and** HR Manager.
4. Employee sees status chip **Pending → Processing → Approved/Rejected**, with who is currently reviewing ("Review as: HOD").
5. (Cancel) allowed while pending/processing → ⚙ balance restored; after approval → cancel request goes to HR.
6. HR can apply on behalf of an employee (select employee first).

### F7. Approve leave (approver)
1. Push → [Approvals] → (tap request) → [Request Detail]: employee, type, dates, days, balance after, team members also on leave those dates, reason, attachment.
2. (Approve) → next level, or if final → ⚙ `decideLeave` final: deduct balance, auto-fill attendance as Leave for each working day, email + push to employee, notify HR Manager.
3. (Reject) → note required → ⚙ balance released, notify employee.
4. ⚠ Two approvers act at once → second sees "Already decided". ⚠ Balance changed since request → warning banner for HR.

### F8. Overtime
1. ⚙ After `processDay`, if worked beyond shift (per OT rules) → OT candidate created `pending`.
2. HOD [OT › Approvals] → reviews system minutes → can edit approved minutes → (Approve/Reject).
3. ⚙ `approvedMinutes` stored; employee notified; included in OT report and salary-sheet export.
4. Employees may also (Request OT) for planned work (post-approval allowed per rule).

### F9. Employee master (HR)
1. [Employees › + New] → stepper: General (photo, ID, name EN/BN) → Personal → Employment (dept, section, designation, grade, manager, shift, weekly off) → Family → Bank (restricted) → Documents → (Save).
2. ⚙ Validate unique Employee ID and Device Code; create `employees/{id}` + `private/info`.
3. (Create login) → ⚙ `setUserClaims` → temporary password shown once/emailed.
4. Bulk import: (Import) → download template → upload Excel → preview with row errors → (Confirm).
5. Status change to **Separated** → ⚙ disable login, keep history, require separation date.
6. ⚠ Duplicate ID/device code → inline error. ⚠ HR Executive cannot see salary/bank → fields hidden.

### F10. Shifts, weekly off, roster (HR)
1. [Settings › Shifts] → (+ New) name, start/end, break, grace, crosses-midnight → Save.
2. [Employee › Employment] or [Roster Grid] → set weekly-off weekday or custom dates per employee (**HR Manager only**).
3. [Roster Grid]: employee × day → (tap cell) choose Shift / Off → ⚙ writes `rosters` → *Reprocess affected days* prompt.
4. Employee sees [My Schedule] cards (Day/Evening/Night rosters).
5. ⚠ Changing a closed month → blocked.

### F11. Month close (HR)
1. [Reports › Month Close] → exceptions list: missing punches, pending adjustments, pending leave/OT.
2. Resolve items (links jump to each request) → (Lock Month) → confirm dialog.
3. ⚙ `lockMonth`: marks attendance `locked`, writes summary and audit.
4. (Export Salary Input) → XLSX/CSV download.
5. Reopen: HR Manager only, reason required, audited.

### F12. Reports and export
1. [Reports] → pick report → filters (date range, dept, section, shift, type) → (Run) → table/chart.
2. (Export) → XLSX / CSV / PDF → ⚙ `exportReport` or client-side generation → file saved/shared.
3. ⚠ > 5,000 rows → run as background export and notify when ready.

### F13. Notices and notifications
1. HR [Notices › + New] → title/body (EN/BN), audience (all/dept/role), pin, expiry → (Publish) → ⚙ push to audience.
2. Employee taps push → [Notice Detail] → marked read.
3. Bell icon → inbox list (unread red dot); (Mark all read).
4. Reminders: ⚙ daily absent/late reminder to employee and summary to HOD.

### F14. Settings and access (Admin / HR Manager)
1. [Settings › Roles & Access] → select employee → assign role + department scope → ⚙ `setUserClaims` → user must re-login.
2. [Settings › Leave Types / Holidays / Rules / Approval Chains] → edit with effective date → audit entry.
3. [Settings › Devices] → status of ZKTeco bridge, last sync time, (Rotate API key).

### F15. Language and profile
(Profile) → (Language: বাংলা/English) → UI switches instantly, saved to `users.locale`. (Change password), (Logout) → ⚙ remove FCM token.

### F16. Workforce Map (where our people come from)
1. **Capture (HR):** [Employees › Add/Edit › Personal/Address] → choose **Division → District → Upazila** for *permanent* and *present* address (dropdowns from the fixed 64-district list) → (Save).
2. ⚙ `onEmployeeGeoWrite` compares old vs new district/status/department/type/gender and increments or decrements the matching `geoStats` and `geoStatsPublic` documents.
3. **View:** [Reports › Workforce Map] (or Home tile "কর্মী মানচিত্র") → map reveals with animation, counter "৩৮/৬৪", ranked list with percentages.
4. **Live update:** while the screen is open, a Firestore listener refreshes numbers; the changed district pulses.
5. (Tap district) → sheet with count, %, department split → (HR) (View employees) → filtered Employee list.
6. (Filters) permanent/present, department, section, type, % or count → map recolours.
7. (Share) → poster image/PDF for meetings.
8. **Fix missing data:** row "ঠিকানা নেই: N জন" → list of employees without district → open profile → add district.
9. ⚠ Employee changes district while map is open → no manual refresh needed. ⚠ Separated employee → removed from active counts. ⚠ Non-HR roles see only sanitized view (districts with < 5 employees shown as "অন্যান্য"). ⚠ Offline → cached last snapshot with "অফলাইন" tag.

### F17. Analytics dashboards
1. **Open:** Home tile "ড্যাশবোর্ড/বিশ্লেষণ" (managers/HR) or Reports › Analytics → app transitions to the noir cockpit → default tab **Overview**.
2. **Switch tab:** Overview · Attendance · Leave · Leave Indicator · Performance (employees see **My Insights** only).
3. **Filter:** period chip (7D/30D/3M/12M/custom), department, section, shift, type → ⚙ reads pre-aggregated `dailySummary` / `monthlySummary` docs → charts animate to new values.
4. **Explore:** drag on the wave chart (crosshair + tooltip) · tap a bar/donut segment (highlight + centre value) · tap a heatmap cell (day sheet) · tap a gauge (zone breakdown).
5. **Drill-down:** tap a department bar → department view; HR/HOD: (View employees) → filtered employee list; HOD limited to own department.
6. **Leave Indicator:** gauge shows department/leave-type status; alert list sorted by severity → (Review) opens employee leave history with the flag reason → HR can (Mark reviewed) or (Add note). No automatic action is taken against the employee.
7. **Performance:** HR opens cycle → (Add appraisal) form (components, rating band, attitude for confirmation) → ⚙ `buildPerformanceSummary` → charts update; (Publish) makes the employee's own result visible in My Insights.
8. **Export:** (Share) on a card or screen → PNG/PDF with Charu footer.
9. **Live:** a leave approval or punch changes today's numbers while the screen is open → affected chart element pulses and animates to the new value.
10. ⚠ No data for period → empty state "এই সময়ের তথ্য নেই". ⚠ Month not closed → "চলমান মাস" badge. ⚠ No access → hidden tab. ⚠ Offline → cached snapshot with "অফলাইন". ⚠ Lite mode → same numbers, no animation.

---

## 3. Approval matrix (default — configurable)

| Request | Level 1 | Level 2 | Level 3 | Notified |
|---|---|---|---|---|
| Leave ≤ 3 days | Supervisor | HOD | — | HR Manager |
| Leave > 3 days | Supervisor | HOD | HR Manager | HR Manager |
| Attendance adjustment | HOD | — | — | HR Exec |
| OT | HOD | — | — | HR Exec |
| Weekly-off change | HR Manager | — | — | Employee |
| Manual attendance entry | HR Executive | HR Manager (audit review) | — | — |

---

## 4. State machines

**Leave request:** `pending` → `processing` (after level 1) → `approved` | `rejected`; `pending/processing` → `cancelled`.
**Adjustment:** `pending` → `approved` | `rejected` | `cancelled`.
**Attendance day:** `present`, `late`, `absent`, `leave`, `holiday`, `weeklyOff`, `halfDay`, `missingPunch` → (adjustment) → recalculated; `locked` after month close.
**Employee:** `active` ↔ `inactive`; `active` → `onLeave`; any → `separated` (terminal).

---

## 5. Empty, loading and error states (apply to every screen)
| State | Behaviour |
|---|---|
| Loading | Shimmer skeleton matching the layout |
| Empty | Grey line illustration + one sentence + primary action (e.g., "No leave requests yet — Apply leave") |
| No permission | "You don't have access to this page" + back to Home |
| Offline | Banner "Offline — showing saved data"; requests queue and sync later |
| Server error | Friendly message + Retry; log to Crashlytics |
| Form errors | Inline under field, scroll to first error |
| Destructive action | Confirm dialog with consequences in plain words |

## 6. Notification triggers (summary)
| Event | To | Channel |
|---|---|---|
| Leave submitted | First approver, HR Manager | Push + in-app |
| Leave approved/rejected | Employee | Push + in-app + **Email** |
| Adjustment submitted | HOD | Push + in-app |
| Adjustment decided | Employee | Push + in-app |
| Absent / Late | Employee (HOD summary) | Push + Email |
| OT awaiting approval | HOD | Push + in-app |
| New notice | Audience | Push + in-app |
| Month locked | HR team | In-app |
| Device offline > 15 min | HR Manager, Admin | Push |

## 7. Accessibility and language in flows
- Every flow works in Bangla and English; dates and numbers follow locale.
- Primary actions reachable by thumb (bottom area) on mobile.
- Status is always icon + text, never colour only.
- For workers with low smartphone use: HR-assisted flows (apply on behalf, manual entry) must exist for every employee request.
