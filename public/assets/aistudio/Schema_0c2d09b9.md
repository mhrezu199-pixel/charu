# Charu HCM — Schema.md (Firebase Data Structure)

Cloud Firestore (Native mode), region `asia-south1` (Mumbai) — closest to Dhaka. Timezone for all business logic: `Asia/Dhaka`. Store timestamps as Firestore `Timestamp` (UTC) and a plain `dateKey` string `YYYY-MM-DD` (Dhaka local date) for day-based queries.

## 0. Conventions
- Collection names: `camelCase`. Document IDs: readable where useful (`empId_yyyyMMdd`) to make writes idempotent.
- Every document has `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- Soft delete via `isActive`/`status`; never hard-delete HR data.
- Denormalize small display fields (`empName`, `deptName`, `photoUrl`) into transaction docs (attendance, leave, OT) to avoid joins. Update with a Cloud Function when the master changes.
- Restricted data (NID, bank, salary) lives in **sub-collection `private`** so list queries on `employees` never expose it.
- Monetary values: store BDT (taka) as a number with up to 2 decimals, consistently everywhere.

## 1. Collections overview

```
users/{uid}
employees/{empId}
  └─ private/{docId}            (bank, NID, salary — restricted)
  └─ documents/{docId}          (uploaded docs metadata)
departments/{deptId}
sections/{sectionId}
designations/{desigId}
grades/{gradeId}
locations/{locId}
shifts/{shiftId}
rosters/{empId_yyyyMM}          (per-employee monthly overrides & weekly off)
holidays/{holidayId}
attendanceRaw/{punchId}         (device punches)
attendance/{empId_yyyyMMdd}     (processed daily record)
attendanceAdjustments/{adjId}
attendanceMonths/{yyyyMM}       (lock state, summary)
leaveTypes/{leaveTypeId}
leaveBalances/{empId_year}
leaveRequests/{reqId}
otRequests/{otId}
announcements/{annId}
notifications/{notifId}
mail/{mailId}                   (Trigger Email extension queue)
approvalChains/{chainId}
payrollPeriods/{yyyyMM}         (v2)
  └─ payslips/{empId}
salaryStructures/{structId}     (v2)
auditLogs/{logId}
settings/{docId}                (company, attendanceRules, otRules, leavePolicy)
counters/{name}
devices/{deviceId}              (ZKTeco devices registry)
geoStats/{scopeId}              (workforce map counts — functions only)
geoStatsPublic/{scopeId}        (sanitized counts for non-HR)
```

## 2. Document definitions

### 2.1 `users/{uid}` — auth profile (doc ID = Firebase Auth UID)
```json
{
  "empId": "20045",
  "email": "name@charu.com.bd",
  "phone": "+8801XXXXXXXXX",
  "role": "employee",          // superAdmin | hrManager | hrExecutive | hod | supervisor | employee | accounts
  "deptIds": ["casting"],      // scope for HOD/supervisor
  "isActive": true,
  "locale": "bn",              // bn | en
  "fcmTokens": ["..."],
  "mustChangePassword": true,
  "lastLoginAt": "Timestamp",
  "createdAt": "Timestamp"
}
```
Role and scope are **also** set as custom claims by an admin Cloud Function (`setUserClaims`) — rules read claims, not this doc.

### 2.2 `employees/{empId}` — doc ID = company employee ID
```json
{
  "empId": "20045",
  "deviceCode": "1045",                 // ID enrolled on ZKTeco device
  "nameEn": "Md. Rahim Uddin",
  "nameBn": "মোঃ রহিম উদ্দিন",
  "photoUrl": "gs://.../employees/20045.jpg",
  "gender": "male",
  "dob": "Timestamp",
  "phone": "...",
  "workEmail": "...",
  "address": {"permanent": {"divisionId": "sylhet", "districtId": "habiganj", "upazila": "...", "details": "..."}, "present": {"divisionId": "...", "districtId": "...", "upazila": "...", "details": "..."}},  // see §10
  "homeDistrictId": "habiganj",          // copy of address.permanent.districtId
  "employment": {
    "joinDate": "Timestamp",
    "confirmationDate": "Timestamp|null",
    "type": "permanent",                // permanent | probation | contract | worker | intern
    "deptId": "casting", "deptName": "Casting",
    "sectionId": "line-3", "sectionName": "Line 3",
    "designationId": "operator", "designationName": "Operator",
    "gradeId": "g5",
    "locationId": "factory-1",
    "managerEmpId": "10012",            // line manager
    "hodEmpId": "10003"
  },
  "schedule": {
    "defaultShiftId": "general",
    "weeklyOff": {"mode": "weekday", "weekday": 5, "customDates": []},  // weekday 0=Sun..6=Sat
    "weeklyOffUpdatedBy": "hrManagerUid"
  },
  "status": "active",                   // active | inactive | onLeave | separated
  "separation": {"date": null, "reason": null},
  "isActive": true,
  "searchKeywords": ["20045", "rahim", "রহিম"],   // for prefix search
  "createdAt": "Timestamp", "updatedAt": "Timestamp"
}
```

### 2.3 `employees/{empId}/private/{info}` — doc ID `info`
```json
{
  "nid": "...", "bloodGroup": "B+",
  "bank": {"bankName": "...", "branch": "...", "accountNo": "...", "routing": "..."},
  "family": [{"name": "...", "relation": "spouse", "phone": "..."}],
  "emergencyContact": {"name": "...", "phone": "..."},
  "salary": {"gross": 25000, "basic": 12500, "structureId": "s1"}   // v2
}
```
Readable only by `hrManager`, `superAdmin`, `accounts` (salary/bank) — and the employee for their own non-salary data.

### 2.4 Org masters
`departments/{deptId}`: `{ nameEn, nameBn, headEmpId, isActive }`
`sections/{sectionId}`: `{ deptId, nameEn, nameBn, supervisorEmpId, isActive }`
`designations/{id}`: `{ nameEn, nameBn, level }`  · `grades/{id}`: `{ name, order }`
`locations/{id}`: `{ name, type: "factory|office|showroom", geo: {lat,lng,radiusM} }`

### 2.5 `shifts/{shiftId}`
```json
{
  "name": "General", "nameBn": "জেনারেল",
  "start": "08:00", "end": "17:00",
  "crossesMidnight": false,
  "breakMinutes": 60,
  "workMinutes": 480,
  "graceMinutes": 10,
  "lateAfterMinutes": 10,
  "earlyOutBeforeMinutes": 0,
  "punchWindow": {"inFrom": "06:00", "inTo": "12:00", "outFrom": "14:00", "outTo": "23:00"},
  "color": "#1D4ED8",
  "isActive": true
}
```
Seed: `general (08:00–17:00)`, `shiftA (06:00–14:00)`, `shiftB (14:00–22:00)`, `night (22:00–06:00, crossesMidnight)`.

### 2.6 `rosters/{empId_yyyyMM}` — only when an employee deviates from default
```json
{
  "empId": "20045", "month": "2026-11",
  "days": {                       // key = dateKey
    "2026-11-05": {"shiftId": "shiftB"},
    "2026-11-13": {"type": "off"},
    "2026-11-20": {"type": "off", "reason": "swap"}
  },
  "updatedBy": "uid"
}
```
Resolution order for a day: `roster.days[date]` → `employee.schedule.weeklyOff` → holiday → default shift.

### 2.7 `holidays/{holidayId}`
`{ date: "2026-12-16", nameEn, nameBn, type: "public|company", appliesTo: ["all"] | deptIds, year: 2026 }`

### 2.8 `attendanceRaw/{punchId}` — immutable, written only by the ingest function
Doc ID = SHA-1 of `deviceId|deviceCode|timestamp` ⇒ duplicates ignored.
```json
{
  "deviceId": "zk-head-01", "deviceCode": "1045", "empId": "20045",
  "punchAt": "Timestamp", "dateKey": "2026-10-25",
  "source": "device",            // device | mobile | manual
  "verifyMode": "face",
  "ingestedAt": "Timestamp",
  "processed": false
}
```

### 2.9 `attendance/{empId_yyyyMMdd}` — processed day record (source of truth for UI/reports)
```json
{
  "empId": "20045", "empName": "Md. Rahim", "deptId": "casting", "sectionId": "line-3",
  "dateKey": "2026-10-25", "month": "2026-10", "year": 2026,
  "shiftId": "general", "shiftStart": "08:00", "shiftEnd": "17:00",
  "inAt": "Timestamp|null", "outAt": "Timestamp|null",
  "punchCount": 2,
  "workedMinutes": 495,
  "lateMinutes": 11, "isLate": true,
  "earlyOutMinutes": 0,
  "otMinutes": 15,
  "status": "late",             // present | late | absent | leave | holiday | weeklyOff | halfDay | missingPunch
  "leaveRequestId": null, "leaveTypeId": null,
  "adjusted": false, "adjustmentId": null,
  "manualEntry": false,
  "locked": false,
  "computedAt": "Timestamp"
}
```

### 2.10 `attendanceAdjustments/{adjId}`
```json
{
  "empId": "20045", "empName": "...", "deptId": "casting",
  "dateKey": "2026-10-25",
  "type": "lateWithdrawal",      // lateWithdrawal | missingIn | missingOut | other
  "requestedIn": "Timestamp|null", "requestedOut": "Timestamp|null",
  "reason": "Bus breakdown",
  "attachmentUrl": null,
  "status": "pending",           // pending | approved | rejected | cancelled
  "approverEmpId": "10003", "approverRole": "hod",
  "decidedBy": null, "decidedAt": null, "decisionNote": null,
  "createdAt": "Timestamp"
}
```

### 2.11 `attendanceMonths/{yyyyMM}`
`{ month, status: "open|locked", lockedBy, lockedAt, reopenedBy, summary: {employees, presentDays, absentDays, leaveDays, lateCount, otMinutes} }`

### 2.12 `leaveTypes/{leaveTypeId}`
```json
{
  "code": "CL", "nameEn": "Casual Leave", "nameBn": "নৈমিত্তিক ছুটি",
  "annualQuota": 10, "carryForward": false, "maxCarryDays": 0,
  "paid": true, "encashable": false,
  "allowHalfDay": true, "requiresAttachmentAfterDays": null,
  "eligibility": {"gender": "any", "minServiceMonths": 0, "employeeTypes": ["permanent","probation"]},
  "color": "#6D28D9", "isActive": true
}
```
Seed: CL, SL, EL (encashable), ML, PL, LWP, Comp-off.

### 2.13 `leaveBalances/{empId_year}`
```json
{
  "empId": "20045", "year": 2026,
  "balances": {
    "CL": {"entitled": 10, "used": 3, "pending": 1, "carried": 0},
    "SL": {"entitled": 14, "used": 0, "pending": 0, "carried": 0},
    "EL": {"entitled": 18, "used": 5, "pending": 0, "carried": 4}
  },
  "updatedAt": "Timestamp"
}
```
`available = entitled + carried − used − pending` (computed client-side).

### 2.14 `leaveRequests/{reqId}`
```json
{
  "empId": "20045", "empName": "...", "deptId": "casting", "photoUrl": "...",
  "leaveTypeId": "CL", "leaveTypeCode": "CL",
  "fromDate": "2026-11-02", "toDate": "2026-11-03",
  "halfDay": false, "totalDays": 2,
  "reason": "Family event",
  "attachmentUrl": null,
  "status": "pending",            // pending | processing | approved | rejected | cancelled
  "chain": [
    {"level": 1, "role": "supervisor", "approverEmpId": "10012", "status": "approved", "at": "Timestamp", "note": ""},
    {"level": 2, "role": "hod", "approverEmpId": "10003", "status": "pending"},
    {"level": 3, "role": "hrManager", "approverEmpId": "10001", "status": "pending"}
  ],
  "currentLevel": 2,
  "appliedBy": "uid",             // may be HR on behalf
  "appliedAt": "Timestamp",
  "finalDecisionAt": null,
  "attendanceFilled": false
}
```

### 2.15 `otRequests/{otId}`
`{ empId, empName, deptId, dateKey, shiftId, systemMinutes, requestedMinutes, approvedMinutes, dayType: "working|weeklyOff|holiday", multiplier, reason, status, approverEmpId, decidedBy, decidedAt }`

### 2.16 `approvalChains/{chainId}`
`{ scope: "leave|adjustment|ot", deptId|"*", levels: [{level, role}], isActive }`

### 2.17 `announcements/{annId}`
`{ title, titleBn, body, bodyBn, audience: {type: "all|dept|role", deptIds: [], roles: []}, pinned, publishAt, expireAt, attachmentUrl, createdBy }`

### 2.18 `notifications/{notifId}` (in-app inbox)
`{ toUid, toEmpId, type: "leave_approved|adjustment_request|absent_reminder|...", title, body, refCollection, refId, isRead, createdAt }`

### 2.19 `mail/{mailId}` — Firebase "Trigger Email from Firestore" extension
`{ to: ["x@y.com"], message: {subject, html, text}, template?: {name, data} }`

### 2.20 `auditLogs/{logId}` — write-only from functions
`{ actorUid, actorEmpId, actorRole, action: "attendance.override|leave.approve|employee.update|month.lock|...", collection, docId, before: {...}, after: {...}, reason, ip?, at }`

### 2.21 `settings/*`
- `settings/company`: `{ nameEn, nameBn, logoUrl, address, timezone: "Asia/Dhaka", weekStart: "sunday" }`
- `settings/attendanceRules`: `{ graceMinutes: 10, halfDayMinutes: 240, absentIfWorkedLessMinutes: 120, lateToAbsentRule: {enabled: false, lateCount: 3, deductDays: 1}, effectiveFrom }`
- `settings/otRules`: `{ minMinutes: 30, roundTo: 15, weeklyOffMultiplier: 2, holidayMultiplier: 2, monthlyCapHours: 60 }`
- `settings/leavePolicy`: `{ leaveYearStart: "01-01", sandwichRule: false, allowNegativeBalance: false }`

### 2.22 `devices/{deviceId}`
`{ name, model: "ZKTeco", location, lastSyncAt, status: "online|offline", apiKeyHash }`

### 2.23 v2 Payroll
`payrollPeriods/{yyyyMM}`: `{ month, status: "draft|processed|paid", totalEmployees, totalNet, createdBy }` → sub-collection `payslips/{empId}`: `{ empId, gross, deductions: {tax, pf, ...}, additions: {ot, ...}, net, presentDays, otHours, pdfUrl, sentAt }`.

---

## 3. Indexes (`firestore.indexes.json` — create as needed)
| Collection | Fields |
|---|---|
| attendance | `dateKey ASC, deptId ASC, status ASC` |
| attendance | `empId ASC, dateKey DESC` |
| attendance | `month ASC, deptId ASC, empId ASC` |
| attendanceRaw | `empId ASC, punchAt ASC` · `processed ASC, punchAt ASC` |
| leaveRequests | `empId ASC, appliedAt DESC` |
| leaveRequests | `status ASC, deptId ASC, appliedAt DESC` |
| leaveRequests | `chain approver` → use helper field `pendingApproverEmpIds` (array) + `status` |
| attendanceAdjustments | `status ASC, approverEmpId ASC, createdAt DESC` |
| otRequests | `status ASC, deptId ASC, dateKey DESC` |
| notifications | `toUid ASC, isRead ASC, createdAt DESC` |
| employees | `isActive ASC, employment.deptId ASC, nameEn ASC` |

Helper field: in `leaveRequests` add `pendingApproverEmpIds: ["10003","10001"]` so a manager's "approval inbox" is a single `array-contains` query.

---

## 4. Security rules (`firestore.rules`) — starter

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    // ---- helpers
    function signedIn()   { return request.auth != null; }
    function role()       { return request.auth.token.role; }
    function empId()      { return request.auth.token.empId; }
    function isAdmin()    { return signedIn() && role() in ['superAdmin','hrManager']; }
    function isHR()       { return signedIn() && role() in ['superAdmin','hrManager','hrExecutive']; }
    function isMgr()      { return signedIn() && role() in ['hod','supervisor']; }
    function inMyDepts(d) { return request.auth.token.deptIds is list && d in request.auth.token.deptIds; }
    function isSelf(e)    { return signedIn() && empId() == e; }
    function active()     { return signedIn() && request.auth.token.active == true; }

    // ---- users
    match /users/{uid} {
      allow read: if active() && (request.auth.uid == uid || isHR());
      allow update: if active() && request.auth.uid == uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fcmTokens','locale','lastLoginAt']);
      allow create, delete: if false;          // via Admin SDK / functions only
    }

    // ---- employees
    match /employees/{id} {
      allow read: if active() && (isHR() || isSelf(id) || (isMgr() && inMyDepts(resource.data.employment.deptId)));
      allow create, update: if active() && isHR();
      allow delete: if false;

      match /private/{doc} {
        allow read: if active() && (isAdmin() || role() == 'accounts' || (isSelf(id) && doc != 'salary'));
        allow write: if active() && isAdmin();
      }
    }

    // ---- masters (read for all signed-in, write HR Manager)
    match /{coll}/{id} {
      allow read: if active() && coll in ['departments','sections','designations','grades','locations','shifts','holidays','leaveTypes','approvalChains','settings'];
      allow write: if active() && isAdmin() && coll in ['departments','sections','designations','grades','locations','shifts','holidays','leaveTypes','approvalChains','settings'];
    }

    // ---- attendance (processed) — read-only from client
    match /attendance/{id} {
      allow read: if active() && (isHR() || isSelf(resource.data.empId)
                    || (isMgr() && inMyDepts(resource.data.deptId)) || role() == 'accounts');
      allow write: if false;                   // functions only (processDay / manual-entry callable)
    }
    match /attendanceRaw/{id} { allow read: if active() && isHR(); allow write: if false; }

    // ---- adjustments
    match /attendanceAdjustments/{id} {
      allow read: if active() && (isHR() || isSelf(resource.data.empId)
                    || (isMgr() && inMyDepts(resource.data.deptId)));
      allow create: if active() && isSelf(request.resource.data.empId)
                    && request.resource.data.status == 'pending';
      allow update: if false;                  // decisions via callable function
    }

    // ---- leave
    match /leaveRequests/{id} {
      allow read: if active() && (isHR() || isSelf(resource.data.empId)
                    || (isMgr() && inMyDepts(resource.data.deptId)));
      allow create: if active() && (isSelf(request.resource.data.empId) || isHR())
                    && request.resource.data.status == 'pending';
      allow update, delete: if false;          // approve/reject/cancel via callable functions
    }
    match /leaveBalances/{id} {
      allow read: if active() && (isHR() || id.matches(empId() + '_.*'));
      allow write: if false;
    }

    // ---- OT
    match /otRequests/{id} {
      allow read: if active() && (isHR() || isSelf(resource.data.empId) || (isMgr() && inMyDepts(resource.data.deptId)));
      allow create: if active() && (isSelf(request.resource.data.empId) || isMgr() || isHR());
      allow update: if false;
    }

    // ---- notifications, announcements
    match /notifications/{id} {
      allow read: if active() && resource.data.toUid == request.auth.uid;
      allow update: if active() && resource.data.toUid == request.auth.uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
    }
    match /announcements/{id} { allow read: if active(); allow write: if active() && isHR(); }

    // ---- workforce map aggregates (read-only from client)
    match /geoStats/{id}       { allow read: if active() && (isAdmin() || isHR() || (isMgr() && id.matches('dept_.*') && inMyDepts(id.replace('dept_','')))); allow write: if false; }
    match /geoStatsPublic/{id} { allow read: if active(); allow write: if false; }

    // ---- audit, mail, payroll
    match /auditLogs/{id}   { allow read: if active() && isAdmin(); allow write: if false; }
    match /mail/{id}        { allow read, write: if false; }
    match /payrollPeriods/{p}/payslips/{e} { allow read: if active() && (isAdmin() || role()=='accounts' || isSelf(e)); allow write: if false; }
  }
}
```
> The generic `/{coll}/{id}` block must stay narrow (explicit allow-list) — review with the emulator before production. Use `firebase emulators:start` + `@firebase/rules-unit-testing` to test each role.

### Storage rules (starter)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /employees/{empId}/photo.jpg {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role in ['superAdmin','hrManager','hrExecutive']
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /employees/{empId}/docs/{file} {
      allow read: if request.auth.token.role in ['superAdmin','hrManager','hrExecutive'] || request.auth.token.empId == empId;
      allow write: if request.auth.token.role in ['superAdmin','hrManager','hrExecutive'] && request.resource.size < 10 * 1024 * 1024;
    }
    match /attachments/{empId}/{file} {
      allow read, write: if request.auth.token.empId == empId && request.resource.size < 5 * 1024 * 1024;
    }
    match /exports/{file} { allow read: if request.auth.token.role in ['superAdmin','hrManager','hrExecutive','accounts']; allow write: if false; }
  }
}
```

---

## 5. Cloud Functions (TypeScript, Node 20, Firebase Functions v2)

| Function | Trigger | Purpose |
|---|---|---|
| `setUserClaims` | callable (admin) | Create Auth user, set `{role, empId, deptIds, active}` claims, write `users/{uid}` |
| `deactivateUser` | callable (admin) | Disable Auth user, revoke tokens, set `isActive=false` |
| `ingestPunches` | HTTPS (API key) | Validate device key, upsert `attendanceRaw` (idempotent), enqueue day processing |
| `processDay` | Firestore `onCreate attendanceRaw` + callable `reprocessRange` | Build `attendance/{empId_date}` using roster/shift/holiday/leave/adjustment |
| `nightlyClose` | scheduler 00:30 Asia/Dhaka | Mark yesterday's absences, create missing records for all active employees |
| `reminders` | scheduler 10:30 daily | Push + email absent/late reminders to employees (and summary to HOD) |
| `submitLeave` | callable | Validate balance/overlap/eligibility, create request with chain, notify first approver + HR Manager |
| `decideLeave` | callable | Approve/reject by current level; on final approval: deduct balance, write `attendance` leave rows (`attendanceFilled=true`), email employee |
| `cancelLeave` | callable | Employee cancel; restore balance |
| `decideAdjustment` | callable | HOD approve/reject → recompute day, write audit |
| `manualAttendance` | callable (HR) | Reasoned manual entry with audit |
| `decideOT` | callable | Approve/edit OT minutes |
| `lockMonth` / `reopenMonth` | callable (HR Manager) | Set `locked` on all `attendance` docs of month; summary doc |
| `exportReport` | callable | Build XLSX/PDF into Storage `exports/`, return signed URL |
| `onMasterChange` | Firestore `onUpdate employees` | Fan-out denormalized name/dept changes to open requests |
| `onEmployeeGeoWrite` | Firestore `onWrite employees` | Diff old/new `{homeDistrictId, present district, status, deptId, type, gender}`; apply `FieldValue.increment(±1)` to affected `geoStats` / `geoStatsPublic` docs |
| `rebuildGeoStats` | scheduler 03:00 + callable (admin) | Full recount to correct drift; also rebuilds sanitized docs |
| `yearRollover` | scheduler Jan 1 | Create `leaveBalances` for new year with carry-forward |
| `sendNotification` | internal helper | FCM + `notifications` doc + optional `mail` doc |

**Day-processing algorithm (`processDay`)**
1. Resolve schedule: roster override → weekly off → holiday → default shift.
2. If approved leave covers the date → status `leave`.
3. Load punches in the shift's punch window (handle `crossesMidnight`: night shift of date D uses 22:00 D → 06:00 D+1).
4. `inAt = min(punch)`, `outAt = max(punch)` (if single punch → `missingPunch`).
5. `lateMinutes = max(0, inAt − (shiftStart + grace))` → `isLate`.
6. `workedMinutes = outAt − inAt`; `otMinutes = max(0, worked − shift.workMinutes − break)` after OT rules.
7. If approved adjustment exists → apply requested times / clear late flag, `adjusted=true`.
8. No punches, working day, no leave → `absent`.
9. Write with `set(..., {merge:true})` unless `locked`.

---

## 6. Common queries (for the app)
| Need | Query |
|---|---|
| My month attendance | `attendance` where `empId == me`, `month == '2026-10'` order `dateKey` |
| Today's tiles (HR) | `attendance` where `dateKey == today` → aggregate counts (or maintain `dailySummary/{date}` doc via function for speed) |
| Dept team today | `attendance` where `dateKey == today`, `deptId == X` |
| Approval inbox | `leaveRequests` where `pendingApproverEmpIds array-contains me`, `status in [pending,processing]` |
| Employees list | `employees` where `isActive == true` order `nameEn`, paginate with `startAfter` |
| On leave today | `attendance` where `dateKey == today`, `status == 'leave'` |

**Tip:** Create `dailySummary/{yyyyMMdd}` (counts per dept/shift) updated by `processDay` so the dashboard reads **one** document, not hundreds.

## 7. Seed data checklist
Company settings · departments · sections · designations · grades · 4 shifts · leave types · holidays for the year · approval chains · attendance & OT rules · first Super Admin and HR Manager users · test employees (10).

## 8. Backup & retention
Scheduled export: `gcloud firestore export gs://<bucket>/backups/$(date +%F)` daily via Cloud Scheduler; lifecycle rule deletes after 30 days. Keep `attendanceRaw` for 3 years, `auditLogs` 7 years.

---

## 9. Additions from reference screenshots (P1/P2 — add when those features are built)
- `shifts`: add `flexibilityMinutes` (number), `checkInRules: {onTime, late, absentAfter}`, `checkOutRules: {earlyBefore, onTimeFrom}`.
- `groups/{groupId}`: `{ name, memberEmpIds: [], type: "notice|approval|team", createdBy }`.
- `assets/{assetId}`: `{ type, tag, serialNo, status: "available|issued|repair|retired", assignedEmpId, issuedAt, returnedAt }`.
- `policies/{policyId}`: `{ title, titleBn, fileUrl, version, publishedAt, requiresAck }` and `policies/{id}/acks/{empId}` = `{ ackAt }`.
- `formTemplates/{formId}` (v2): `{ name, fields: [{key, label, type, required, options}], approvalChainId }`.

---

## 10. Workforce Map data (GEO)

### 10.1 Employee address fields (replaces the plain-string address in §2.2)
```json
"address": {
  "permanent": {"divisionId": "sylhet", "districtId": "habiganj", "upazila": "Nabiganj", "details": "Village, Post"},
  "present":   {"divisionId": "dhaka",  "districtId": "gazipur",  "upazila": "Tongi",    "details": "House, Road"}
}
```
`districtId` / `divisionId` must be a value from the fixed list in §10.5 (also in `districts.json`). Add `homeDistrictId` as a **top-level copy** of `address.permanent.districtId` for simple queries and function diffing.

### 10.2 `geoStats/{scopeId}` — pre-aggregated counts (written only by functions)
Scope IDs: `all`, `dept_{deptId}`, `section_{sectionId}`, `type_{employeeType}`, `gender_{male|female|other}`, `shift_{shiftId}`; each also exists for `present` address as `present_all`, `present_dept_{id}` …
```json
{
  "scope": "all", "addressType": "permanent",
  "totalActive": 1240,
  "withDistrict": 1186,
  "notSet": 54,
  "byDistrict": {"habiganj": 248, "lakshmipur": 372, "cumilla": 110},
  "byDivision": {"sylhet": 310, "chattogram": 520},
  "districtsCovered": 38,
  "updatedAt": "Timestamp"
}
```
Percent is computed in the app: `byDistrict[id] / withDistrict`.

### 10.3 `geoStatsPublic/{scopeId}` — sanitized copy for non-HR roles
Same shape, but any district with `count < 5` is merged into `"others"`. Written by the same function.

### 10.4 Static geometry (bundled in the app, not in Firestore)
`assets/geo/bd_districts.json` — simplified GeoJSON, 64 features with `properties: {id, nameEn, nameBn, divisionId, cx, cy}` (`cx, cy` = label point). `assets/geo/districts.json` — the id/name list in §10.5.

### 10.5 Fixed list: 8 divisions and 64 districts (same data as `districts.json`)
| id | English | বাংলা | division |
|---|---|---|---|
| barguna | Barguna | বরগুনা | barishal |
| barishal | Barishal | বরিশাল | barishal |
| bhola | Bhola | ভোলা | barishal |
| jhalokathi | Jhalokathi | ঝালকাঠি | barishal |
| patuakhali | Patuakhali | পটুয়াখালী | barishal |
| pirojpur | Pirojpur | পিরোজপুর | barishal |
| bandarban | Bandarban | বান্দরবান | chattogram |
| brahmanbaria | Brahmanbaria | ব্রাহ্মণবাড়িয়া | chattogram |
| chandpur | Chandpur | চাঁদপুর | chattogram |
| chattogram | Chattogram | চট্টগ্রাম | chattogram |
| cumilla | Cumilla | কুমিল্লা | chattogram |
| coxs-bazar | Cox's Bazar | কক্সবাজার | chattogram |
| feni | Feni | ফেনী | chattogram |
| khagrachhari | Khagrachhari | খাগড়াছড়ি | chattogram |
| lakshmipur | Lakshmipur | লক্ষ্মীপুর | chattogram |
| noakhali | Noakhali | নোয়াখালী | chattogram |
| rangamati | Rangamati | রাঙ্গামাটি | chattogram |
| dhaka | Dhaka | ঢাকা | dhaka |
| faridpur | Faridpur | ফরিদপুর | dhaka |
| gazipur | Gazipur | গাজীপুর | dhaka |
| gopalganj | Gopalganj | গোপালগঞ্জ | dhaka |
| kishoreganj | Kishoreganj | কিশোরগঞ্জ | dhaka |
| madaripur | Madaripur | মাদারীপুর | dhaka |
| manikganj | Manikganj | মানিকগঞ্জ | dhaka |
| munshiganj | Munshiganj | মুন্সীগঞ্জ | dhaka |
| narayanganj | Narayanganj | নারায়ণগঞ্জ | dhaka |
| narsingdi | Narsingdi | নরসিংদী | dhaka |
| rajbari | Rajbari | রাজবাড়ী | dhaka |
| shariatpur | Shariatpur | শরীয়তপুর | dhaka |
| tangail | Tangail | টাঙ্গাইল | dhaka |
| bagerhat | Bagerhat | বাগেরহাট | khulna |
| chuadanga | Chuadanga | চুয়াডাঙ্গা | khulna |
| jashore | Jashore | যশোর | khulna |
| jhenaidah | Jhenaidah | ঝিনাইদহ | khulna |
| khulna | Khulna | খুলনা | khulna |
| kushtia | Kushtia | কুষ্টিয়া | khulna |
| magura | Magura | মাগুরা | khulna |
| meherpur | Meherpur | মেহেরপুর | khulna |
| narail | Narail | নড়াইল | khulna |
| satkhira | Satkhira | সাতক্ষীরা | khulna |
| jamalpur | Jamalpur | জামালপুর | mymensingh |
| mymensingh | Mymensingh | ময়মনসিংহ | mymensingh |
| netrokona | Netrokona | নেত্রকোণা | mymensingh |
| sherpur | Sherpur | শেরপুর | mymensingh |
| bogura | Bogura | বগুড়া | rajshahi |
| chapainawabganj | Chapainawabganj | চাঁপাইনবাবগঞ্জ | rajshahi |
| joypurhat | Joypurhat | জয়পুরহাট | rajshahi |
| naogaon | Naogaon | নওগাঁ | rajshahi |
| natore | Natore | নাটোর | rajshahi |
| pabna | Pabna | পাবনা | rajshahi |
| rajshahi | Rajshahi | রাজশাহী | rajshahi |
| sirajganj | Sirajganj | সিরাজগঞ্জ | rajshahi |
| dinajpur | Dinajpur | দিনাজপুর | rangpur |
| gaibandha | Gaibandha | গাইবান্ধা | rangpur |
| kurigram | Kurigram | কুড়িগ্রাম | rangpur |
| lalmonirhat | Lalmonirhat | লালমনিরহাট | rangpur |
| nilphamari | Nilphamari | নীলফামারী | rangpur |
| panchagarh | Panchagarh | পঞ্চগড় | rangpur |
| rangpur | Rangpur | রংপুর | rangpur |
| thakurgaon | Thakurgaon | ঠাকুরগাঁও | rangpur |
| habiganj | Habiganj | হবিগঞ্জ | sylhet |
| moulvibazar | Moulvibazar | মৌলভীবাজার | sylhet |
| sunamganj | Sunamganj | সুনামগঞ্জ | sylhet |
| sylhet | Sylhet | সিলেট | sylhet |

---

## 11. Analytics data (ANL)

All dashboard numbers come from **pre-aggregated documents** written by Cloud Functions so a dashboard reads a handful of documents, not thousands.

### 11.1 `dailySummary/{yyyyMMdd}` (extends §6 tip)
```json
{
  "dateKey": "2026-10-30", "totalScheduled": 1180,
  "present": 1040, "late": 64, "absent": 22, "leave": 41, "holiday": 0, "weeklyOff": 190,
  "otMinutes": 5400,
  "lateByArrivalBin": {"07:50": 20, "08:00": 700, "08:10": 90, "08:20": 40},
  "byDept":  {"casting": {"present": 210, "late": 14, "absent": 3, "leave": 6}},
  "byShift": {"general": {"present": 500, "late": 30, "absent": 10, "leave": 12}},
  "updatedAt": "Timestamp"
}
```

### 11.2 `monthlySummary/{yyyyMM_scope}` — scope = `all` | `dept_{id}` | `section_{id}`
```json
{
  "month": "2026-10", "scope": "all", "headcount": 1240,
  "scheduledDays": 29760, "presentDays": 26500, "lateCount": 1800, "absentDays": 900, "leaveDays": 1100,
  "leaveByType": {"CL": 420, "SL": 380, "EL": 300},
  "otMinutes": 98000,
  "attendanceRate": 0.903, "punctualityRate": 0.932, "absenteeismRate": 0.030,
  "leaveUtilization": 0.41, "avgApprovalHours": 9.5,
  "heatmap": {"2026-10-01": 0.93, "2026-10-02": 0.95},
  "locked": false, "updatedAt": "Timestamp"
}
```
Written by `processDay` (incremental) and rebuilt by `lockMonth` / `rebuildMonthlySummary`.

### 11.3 `leaveIndicators/{empId_year}` (HR-only; employee reads only the `balances` part via `leaveBalances`)
```json
{
  "empId": "20045", "year": 2026, "deptId": "casting",
  "status": "amber",                       // green | amber | red
  "usage": {"CL": 0.7, "SL": 0.2, "EL": 0.4, "total": 0.45},
  "flags": [
    {"type": "shortLeaveFreq", "severity": "info", "detail": "3 one-day leaves in Oct", "since": "2026-10-04"},
    {"type": "lowBalance", "severity": "warn", "detail": "CL 1 day left"}
  ],
  "updatedAt": "Timestamp"
}
```
Flag types: `lowBalance`, `sickSpike`, `shortLeaveFreq`, `adjacentOffPattern`, `elCapOrExpiry`, `sectionClash`, `staleApproval`. Flags are **review prompts**, never disciplinary conclusions.

### 11.4 Performance (v1 manual entry, full PMS later)
`performanceCycles/{cycleId}`: `{ name, type: "annual|confirmation|quarterly", startDate, endDate, status: "open|closed|published" }`

`appraisals/{appraisalId}`:
```json
{
  "empId": "20045", "empName": "...", "deptId": "casting", "cycleId": "2026-annual",
  "components": {"c1": 52, "c2": 12, "c3": 13, "c4": 8},       // keys/weights from settings/performanceModel
  "totalScore": 85, "ratingBand": "A",
  "attendanceRate": 0.94, "absenceRate": 0.03, "punctualityRate": 0.91,   // auto-filled from monthlySummary/attendance
  "attitudeScore": 4.5,                                         // confirmation (casual → permanent)
  "type": "annual",                                              // annual | confirmation
  "reviewerEmpId": "10003", "status": "draft|submitted|published",
  "publishedAt": null, "createdAt": "Timestamp"
}
```
`settings/performanceModel`: `{ components: [{key:"c1", label:"...", weight:60}, {key:"c2", weight:15}, {key:"c3", weight:15}, {key:"c4", weight:10}], bands: [{min:90,label:"A+"}, ...], adsWeights: {attendance:0.7, punctuality:0.3}, confirmationAttitudeWeight: "highest" }`

`performanceSummary/{cycleId_scope}`: `{ avg, distribution: {"0-59": n, "60-69": n, ...}, byDept: {deptId: avg}, byComponent: {c1: avg, ...}, top: [empId...], updatedAt }` (HR/Management only).

### 11.5 Rules additions
```
match /dailySummary/{id}   { allow read: if active() && (isAdmin() || isHR() || isMgr() || role()=='accounts'); allow write: if false; }
match /monthlySummary/{id} { allow read: if active() && (isAdmin() || isHR() || role()=='accounts' || (isMgr() && id.matches('.*_dept_.*') && inMyDepts(id.split('_dept_')[1]))); allow write: if false; }
match /leaveIndicators/{id}{ allow read: if active() && isHR(); allow write: if false; }
match /performanceCycles/{id} { allow read: if active(); allow write: if active() && isAdmin(); }
match /appraisals/{id}     { allow read: if active() && (isHR() || (isMgr() && inMyDepts(resource.data.deptId)) || (isSelf(resource.data.empId) && resource.data.status=='published')); allow create, update: if active() && (isHR() || isMgr()); allow delete: if false; }
match /performanceSummary/{id} { allow read: if active() && (isAdmin() || isHR()); allow write: if false; }
```
(`dailySummary` previously restricted; managers see all departments' counts — tighten to dept docs if HODs must not see other departments.)

### 11.6 Functions added
| Function | Trigger | Purpose |
|---|---|---|
| `updateDailySummary` | inside `processDay` | Increment counts, arrival bins, per-dept/shift |
| `rebuildMonthlySummary` | scheduler 01:00 + on `lockMonth` | Recompute monthly KPIs, heatmap, leave by type, approval turnaround |
| `computeLeaveIndicators` | scheduler 02:00 + on leave decision | Update traffic-light status and flags per employee |
| `buildPerformanceSummary` | onWrite `appraisals` | Aggregate averages, distribution, radar data |
