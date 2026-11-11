# Charu HCM — UI-Spec.md (UI & Design System)

Design system and UI specification for AI coding agents and designers. **Follow this file strictly when generating Flutter UI.**

Brand: **CHARU — Stylish Living** · Style: bold, modern, clean · Palette: **Red + Black + White** · Reference for layout ideas: Rysenova HCM (dashboard cards, left nav, status chips, tabbed lists), restyled to Charu's black/red identity.

---

## 1. Design principles
> **Global direction update:** the app follows the **Luxury Gradient Motion Language in §16** (animated gradients, minimalist, super-luxury, ivory + noir + red). Where §16 conflicts with §2–§6, §16 wins on mobile.

1. **Black & red, used with discipline** — black for structure (nav, headers), white for working surfaces, red only for primary actions, key highlights and alerts.
2. **Clarity for factory + office** — big numbers, icon + label, Bangla-first friendly, minimal text entry.
3. **One glance status** — Present / Late / Absent / Leave must be recognisable by colour *and* icon.
4. **Fast** — skeletons not spinners, 1–2 taps to apply leave/adjustment.
5. **Consistent** — only components defined here.

---

## 2. Color tokens

### Brand
| Token | Hex | Use |
|---|---|---|
| `brandRed` | `#EC1C24` | Primary buttons, active nav indicator, key numbers, logo diamond |
| `brandRedDark` | `#C4141B` | Pressed / hover |
| `brandRedTint` | `#FDE8E9` | Red-tinted backgrounds, selected rows |
| `pureBlack` | `#000000` | Sidebar, app bar, headings, logo |
| `ink` | `#0D0D0D` | Primary text on light |
| `charcoal` | `#1A1A1A` | Dark surfaces/cards in dark areas |
| `graphite` | `#2B2B2B` | Dividers on dark |

### Neutrals
| Token | Hex | Use |
|---|---|---|
| `white` | `#FFFFFF` | Cards, surfaces |
| `bg` | `#F6F6F7` | App background |
| `border` | `#E5E5E8` | Card/input borders |
| `textSecondary` | `#6B6B73` | Secondary text |
| `textDisabled` | `#A8A8B0` | Disabled |

### Semantic (status)
| Status | Foreground | Background | Icon |
|---|---|---|---|
| Present / Approved / Active | `#15803D` | `#E7F6EC` | check_circle |
| **Late** | `#EC1C24` | `#FDE8E9` | schedule |
| Absent / Rejected | `#B91C1C` | `#FEE2E2` | cancel |
| Pending | `#B45309` | `#FEF3C7` | hourglass_top |
| Processing / Info | `#1D4ED8` | `#E0EAFF` | autorenew |
| On Leave | `#6D28D9` | `#EDE9FE` | beach_access |
| Holiday | `#0E7490` | `#E0F4F8` | celebration |
| Weekly off | `#52525B` | `#EDEDEF` | weekend |
| Inactive | `#6B6B73` | `#EDEDEF` | pause_circle |

> Rule: Late is the only status that uses pure brand red as text — it must stand out as a "red mark".

### Dark mode (optional v1.1)
Background `#0D0D0D`, surface `#1A1A1A`, text `#F5F5F5`, red unchanged.

---

## 3. Typography
- **English / numerals:** `Inter` (fallback Roboto)
- **Bangla:** `Hind Siliguri` (fallback Noto Sans Bengali). Font family must switch with locale; never render Bangla with Inter.
- Optional display (login hero/splash only): `Orbitron`-like geometric look is NOT used in UI; the logo carries that style.

| Style | Size / Weight | Use |
|---|---|---|
| `displayNumber` | 32 / 700 | Dashboard KPI numbers |
| `h1` | 24 / 700 | Screen titles |
| `h2` | 20 / 600 | Section titles |
| `h3` | 16 / 600 | Card titles |
| `body` | 14 / 400 | Default text |
| `bodyStrong` | 14 / 600 | Names, values |
| `caption` | 12 / 400 | Meta, helper |
| `chip` | 12 / 600 | Status chips |
| `button` | 14 / 600 | Buttons |

Line height 1.4 (Bangla 1.55). Min tap-text size 14.

---

## 4. Spacing, shape, elevation
- Spacing scale (dp): 4, 8, 12, 16, 20, 24, 32, 48. Screen padding 16 (mobile) / 24 (tablet/web).
- Radius: card 16, button 12, input 12, chip 8, avatar full, bottom sheet top 24.
- Elevation: cards use 1px border `#E5E5E8` + very soft shadow `0 2 8 rgba(0,0,0,0.06)`. No heavy shadows.
- Icons: Material Symbols Rounded, 24 (20 in chips), stroke weight 400.
- Avatars: 40 (list), 56 (profile header), 96 (profile page); placeholder = grey circle with person icon, initials fallback.

---

## 5. Layout and navigation

### Mobile (< 600 px)
> **Updated by §15:** mobile uses a hero header (not a plain black bar) and a 4-tab bar: Home · আমার চারু · Check-in/Requests · Inbox. The older 5-tab lists below are superseded.

- **Top bar:** black, 56 dp, Charu mark (diamond + "CHARU") left, bell with red badge and avatar right.
- **Bottom navigation (5 max):**
  - Employee: Home · Attendance · Leave · Requests · Menu
  - Manager/HR: Home · Team · Approvals (red badge) · Reports · Menu
- Active tab: red icon + label, black bar; inactive: grey.
- **FAB** (red, bottom-right) context actions: *Apply leave*, *New request*.

### Tablet / Web (≥ 840 px) — HR admin
Left **sidebar**, 248 dp wide, `pureBlack`:
- Logo top; sections: **Dashboard, Reports, HR Management** (Employees, Attendance, Leaves, Overtime, Schedules), **Facilities**, **Payroll** (v2), **Settings**.
- Active item: white pill (`#FFFFFF`, black text) with red left indicator 4 dp — mirrors reference's white-pill selected item, in brand colours.
- Section labels: uppercase, 11 / 600, `#8A8A93`.
Top bar: global search, bell, profile menu (role under name).
Content max width 1440, cards in a 12-column grid, 24 gap.

---

## 6. Components

### 6.1 Buttons
| Type | Style |
|---|---|
| Primary | bg `brandRed`, white text, height 48, radius 12; pressed `brandRedDark`; disabled `#F3B4B7` |
| Secondary | white bg, 1px black border, black text |
| Tertiary / text | red text, no bg |
| Destructive | bg `#B91C1C` (never same as primary — add confirm dialog) |
| Icon button | 40×40, radius 12, border `#E5E5E8` |

### 6.2 Inputs
Filled white, 1px `#E5E5E8`, radius 12, height 52; focus border `brandRed` 1.5; error border `#B91C1C` + helper text; floating labels; dropdown with search for long lists; date picker uses brand red as primary. Password field with eye toggle.

### 6.3 Cards
White, radius 16, padding 16, header row (title h3 + optional action). **KPI card:** caption label top, `displayNumber` value, optional delta chip (↑ green / ↓ red) like the reference's "+2%" chips.

### 6.4 Status chip
Height 28, radius 8, padding 8×12, icon 16 + label (chip style), colours from §2 semantic table. Leave-type chips use soft lavender `#EEF0FF` bg, `#3730A3` text.

### 6.5 Lists and tables
- Mobile: list tile with avatar, name (bodyStrong), "designation · #empId" caption, trailing chip.
- Web: data table, sticky header `#F6F6F7`, row height 64, hover `#FAFAFA`, checkbox column, sortable headers, pagination/infinite scroll, row actions kebab.
- Empty state: illustration (simple line art in grey with a red accent), title, one CTA.

### 6.6 Attendance grid (Employee Summary)
Rows = employee (avatar + name + designation), columns = dates (today's date in a red filled circle, white text). Cell: status text coloured per §2 with clock icon and `9:00 am – 6:00 pm / 8 hr 0 min` caption; Late cell uses red text + red dot. Weekend/holiday cells grey. Horizontal scroll with frozen first column.

### 6.7 Roster / schedule cards
Left colour bar 4 dp + time range: Day = blue-tint, Evening = violet-tint, Night = indigo, Early-morning = amber tint (like reference), grouped under "Day Roster / Night Roster" headings with calendar icon.

### 6.8 Check-in card (My Space)
Black card, radius 20, white text: date, shift name + time, big **Check-in / Check-out** button (red, 56 dp). After punch: green tick + time. If device-only staff: card shows "Today's punches" read-only.

### 6.9 Donut / charts
`fl_chart`. Use the semantic palette: Present green `#15803D`, Absent dark red `#B91C1C`, Leave violet `#6D28D9`, Late brand red `#EC1C24`, OT black. Bar charts: bars `brandRed` (primary series) and `#1A1A1A` (secondary). Show values on bars; axis labels 12 px.

### 6.10 Tabs
Underlined tabs: active text black 600 with 3 dp red underline; inactive `#6B6B73`.

### 6.11 Dialogs, sheets, toasts
Confirm dialog radius 20; bottom sheets for filters (Filter, View). Snackbars black with white text, red action. Success toast uses green icon.

### 6.12 Skeleton / loading
Shimmer in `#EDEDEF`→`#F6F6F7`. Pull-to-refresh indicator red.

### 6.13 Approval card
Avatar, name, leave type chip, date range, days count, reason (2 lines), buttons **Reject** (secondary, red text) and **Approve** (primary). Swipe actions optional.

---

## 7. Screen specifications (key screens)

### 7.1 Login
Split layout on web: left black panel with CHARU logo (white version, red diamond) + tagline "Stylish Living — Smart HR"; right white form: "Hi there!" (red caption) → **Log in to your account** (h1), Employee ID/Email, Password, Remember me, Forgot password?, Login (primary full-width). Mobile: black top 35% with logo, white sheet with form.

### 7.2 Dashboard — My Space
> **Mobile Home layout is now defined in §15 (hero header + service grid).** The widgets below remain available inside "আমার চারু" and on web/tablet.

1. Greeting "Hi, {Name}" + date
2. Check-in card
3. KPI row (scroll): Present %, Late %, Absent %, On Leave % with period dropdown (Day/Week/Month/Year)
4. Leave requests status: Pending / Used / Available + latest requests with chips
5. Attendance request status
6. My Schedule (roster cards)
7. Notices
8. My Team avatars (+N)

### 7.3 Dashboard — Workspace
KPI tiles: Total · Present · Absent · On Leave · Late → Pending approvals (Leave, Adjustment, OT) → On leave today list with type chips → Attendance overview (week selector) → Department-wise bar chart → Schedule panel with employee selector.

### 7.4 Employees
Header: title, **Export**, **Settings**, red **+ New** button. Tabs: Employees · Peer · Teams · Groups. Search, Filter, View. Table/list columns: Name (avatar, designation, #id), Work email, Contact, Joining date, Status dropdown chip.

### 7.5 Add employee
Left vertical stepper (General, Personal, Employment, Family Members, Bank Info, Documents) + right form panel with header strip `#F6F6F7`; sticky Save (black) and Save & next (red). Mobile: stepper becomes top progress.

### 7.6 Attendance
Tabs: Employee Log · Employee Summary · Check-in · Summary. Date navigator (‹ month ›), *Today* button (red tint), Week/Month dropdown, Filter, View. Grid per §6.6.

### 7.7 Leaves
Tabs: Employee Requests · Employee Balance · Requests · Balance. Year selector, Filter, View, **+ New**. Table: Employee, Application date, Leave types (chips), Status (chips), Total days, Review as (Line Manager / HOD / HR).

### 7.8 Reports
Left employee list + right statistics (donut + Attendance Summary tiles: On-time check-in, Late check-in, Early check-out, Total working hours) + Attendance Report table (Date, Schedule, Check-in, Check-out, Worked hours, Difference — negative differences in red). Bar-chart reports for Attendance Rate / Absent Rate by month.

### 7.9 Payroll Hub (v2)
Left list of periods, right employee table (Gross, Tax/Deduction, Net, *View* payslip), primary button **Send payslips to all employees**.

---

## 8. Motion
150–250 ms ease-out; page transition = fade-through; list items fade-slide in (staggered 30 ms, max 8). No decorative animation on data screens. Respect reduce-motion.

## 9. Accessibility
Contrast ≥ 4.5:1 (red `#EC1C24` on white = 4.2:1 → use only for ≥ 14 px bold text or icons; use `brandRedDark` `#C4141B` for small red text). Never colour-only status. Semantics labels in Bangla and English. Dynamic text up to 130%.

## 10. Localization in UI
All strings via ARB (`app_en.arb`, `app_bn.arb`). Date: `25 Oct 2026` / `২৫ অক্টোবর ২০২৬`. Number formatting optional Bangla digits. Longer Bangla labels must wrap, never truncate key actions.

## 11. Assets
- Logo: `assets/brand/charu_logo_black.png` (provided, black on white) and a white version for dark surfaces; keep the red diamond as `#EC1C24`.
- App icon: black rounded square with the red diamond and white "C" mark.
- Illustrations: flat line art, grey + red accent. Avatars: user photos or placeholder.

---

## 12. Flutter theme (copy into `lib/core/theme/`)

```dart
// app_colors.dart
import 'package:flutter/material.dart';

class AppColors {
  static const brandRed = Color(0xFFEC1C24);
  static const brandRedDark = Color(0xFFC4141B);
  static const brandRedTint = Color(0xFFFDE8E9);
  static const black = Color(0xFF000000);
  static const ink = Color(0xFF0D0D0D);
  static const charcoal = Color(0xFF1A1A1A);
  static const graphite = Color(0xFF2B2B2B);
  static const bg = Color(0xFFF6F6F7);
  static const border = Color(0xFFE5E5E8);
  static const textSecondary = Color(0xFF6B6B73);

  // status
  static const presentFg = Color(0xFF15803D), presentBg = Color(0xFFE7F6EC);
  static const lateFg = brandRed,             lateBg = brandRedTint;
  static const absentFg = Color(0xFFB91C1C),  absentBg = Color(0xFFFEE2E2);
  static const pendingFg = Color(0xFFB45309), pendingBg = Color(0xFFFEF3C7);
  static const processingFg = Color(0xFF1D4ED8), processingBg = Color(0xFFE0EAFF);
  static const leaveFg = Color(0xFF6D28D9),   leaveBg = Color(0xFFEDE9FE);
  static const holidayFg = Color(0xFF0E7490), holidayBg = Color(0xFFE0F4F8);
  static const offFg = Color(0xFF52525B),     offBg = Color(0xFFEDEDEF);
}
```

```dart
// app_theme.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

ThemeData buildTheme({required bool bangla}) {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brandRed,
      primary: AppColors.brandRed,
      onPrimary: Colors.white,
      secondary: AppColors.black,
      surface: Colors.white,
      error: AppColors.absentFg,
    ),
    scaffoldBackgroundColor: AppColors.bg,
  );
  final text = bangla
      ? GoogleFonts.hindSiliguriTextTheme(base.textTheme)
      : GoogleFonts.interTextTheme(base.textTheme);

  return base.copyWith(
    textTheme: text.apply(bodyColor: AppColors.ink, displayColor: AppColors.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.black,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brandRed,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.black,
        side: const BorderSide(color: AppColors.black),
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.brandRed, width: 1.5),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: AppColors.brandRedTint,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
    tabBarTheme: const TabBarThemeData(
      labelColor: AppColors.black,
      unselectedLabelColor: AppColors.textSecondary,
      indicatorColor: AppColors.brandRed,
    ),
  );
}
```

### Reusable widgets to build first (`lib/shared/widgets/`)
`CharuAppBar`, `CharuSidebar`, `KpiCard`, `StatusChip(status)`, `LeaveTypeChip`, `AvatarTile`, `SectionCard`, `PrimaryButton`, `EmptyState`, `SkeletonList`, `ApprovalCard`, `AttendanceCell`, `RosterCard`, `DateRangeNavigator`, `FilterSheet`, `ConfirmDialog`.

## 13. Do / Don't for AI generation
- **Do** use only tokens above; extract widgets; keep screens < 300 lines; support EN/BN; handle loading/empty/error states for every list.
- **Don't** hard-code colours or strings; don't use navy/blue as brand (reference app is blue — we are black/red); don't use red for success; don't add new fonts.

---

## 14. Reference screenshot map (Rysenova → Charu HCM)

Reference screenshots are for **layout ideas only**. Do not copy Rysenova branding, names, avatars or its navy/blue colours. Re-skin everything with Charu black/red.

| Screenshot | Reference screen | Charu HCM screen | Take from it | Change for Charu |
|---|---|---|---|---|
| SS1 | Dashboard → Workspace | Dashboard — Workspace (§7.3) | KPI tiles (Total/Present/Absent/On Leave), Pending approvals tiles, On-leave-today list with leave chips, Schedules panel with employee picker | Black sidebar, red active indicator, Late tile in red |
| SS10 | Dashboard → My Space | Dashboard — My Space (§7.2) | Check-out card with shift name, Day/Week/Month/Year dropdown, % tiles with delta chips, request status lists, roster cards | Check-in card is black with red button |
| SS2 | Employees list | Employees (§7.4) | Tabs (Employees/Peer/Teams/Groups), Export/Settings/New, table with avatar + designation + #id, status dropdown chip | Red **+ New** button |
| SS8 | Add new employee | Add employee (§7.5) | Left stepper: General, Personal, Employment, Family Members, Bank Info, See more; photo upload; Save | Add Documents step; Save = black, Save & next = red |
| SS3 | Attendance → Employee Summary | Attendance grid (§6.6) | Date columns, today as filled circle, status text + clock icon + time range + hours, weekend/holiday cells | Today circle red; Late cell red |
| SS4, SS11 | Leaves → Employee Requests | Leaves (§7.7) | Tabs, year selector, leave-type chips, status chips (Pending/Processing/Approved/Rejected), Total days, "Review As" | Same chips using Charu semantic palette |
| SS9 | HR Management → Shift | Shifts master | Shift name chip, duration, break, working hours, **flexibility (60 min)**, **check-in rules**, **check-out rules**, status | Keep rules columns; grace = 10 min default |
| SS12 | Reports | Reports (§7.8) | Employee list + donut (Present/Absent/Leave) + Attendance Summary tiles + Attendance Report table with Difference (−1 Hour in red) | Present green, Late red, OT black |
| SS13 | Reports → Attendance/Absent rate | Report charts | Monthly bar chart with % labels, KPI strip (Total Employee, Working days, Total working hour, On Leave, Holiday) | Bars brand red |
| SS5 | Payroll Hub → Payslips | Payroll Hub (v2, §7.9) | Period list on left, employee table (Gross, Tax, Net, View), "Send payslips to all employees" | v2 only |
| SS7 | Login | Login (§7.1) | Simple centered form: greeting, Email, Password, Remember me, Forgot password, Login | Split layout with black brand panel |
| SS6 | Marketing landing page | Not needed | — | — |
| Logo | Charu logo | App bar, splash, login | Black wordmark + red diamond | Use white version on black |

### Extra navigation items seen in the reference (sidebar of SS8/SS11)
General Settings (Profile, Company, Policies, Form Builder) · HR Management · Leaves · Employment · ACL · Payroll (Salary Structure, Payroll Setup) · Facilities (Bank Info, Assets) · Integration.
Charu mapping: Profile → My Profile · Company → Settings › Company · Policies → Settings › Policies · Form Builder → v2 · ACL → Settings › Roles & Access · Salary Structure/Payroll Setup → v2 · Bank Info → Employee › Bank · Assets → v1.1 · Integration → Settings › Devices (ZKTeco bridge).

---

## 15. Home Page Pattern (modern "super-app" style) — reference set A

Reference: two screenshots of a popular Bangladeshi mobile-wallet app (Home tab + "My" tab). We copy the **layout pattern** (hero header, rounded white sheet, icon grid, promo carousel, personal shortcuts, 4-tab bar), **not** its pink branding, icons, logo or wording. Charu version = black + red.

**This section replaces the mobile Home layout in §7.2 and the bottom-nav lists in §5 for the mobile app.** Web/tablet keeps the sidebar layout.

### 15.1 What we learned from the reference
| Pattern | Reference behaviour | Why it works |
|---|---|---|
| Hero header | Tall coloured header with soft illustration (hills, sun), avatar + name initials top-left, round icon buttons top-right | Friendly, brand-owning first impression |
| Rounded white sheet | Content slides over the header with big top corners | Modern, clear separation |
| Reveal pill | Pill under the name: tap to reveal balance | Privacy + one-tap value |
| Service grid | 4 columns × 2 rows of soft circle icons + bold Bangla labels, 3rd row blurred with "See more" | Fast access to top tasks, expandable |
| Promo carousel | Full-width rounded banner, dot indicator | Notices/campaigns |
| Quick features | Chips for recent/saved actions, then pastel feature cards | Repeat tasks in 1 tap |
| "My" tab | Alert card (complete info), points card + feature card side by side, favourites as initial-avatar circles with "Manage", saved items cards | Personal dashboard |
| Bottom tab bar | 4 tabs: Home · My · Scan · Inbox (badge count); active = filled coloured icon + coloured label | Simple, thumb-friendly |
| Typography | Bangla-first, bold, large labels | Readable for all literacy levels |

### 15.2 Charu Home — layout (top to bottom, mobile 360 dp wide)

**A. Hero header (height ≈ 140 dp + status bar)**
- Background: vertical gradient `#000000 → #1A1A1A → #EC1C24` (black at top, red glow at bottom edge), with a subtle **ceramic-tile / diamond pattern** (the logo's red diamond repeated at 6–8% opacity) and soft hills/sun silhouette optional in `#FFFFFF` 6% opacity. No photos.
- Top-left: avatar 44 dp, white 2 dp ring; initials fallback (e.g., "MH") in white 14/700 above the pill.
- Under name: **white pill** (radius 12, height 40, 14/600 text) — default text "আপনার সাথে, সবসময়" (tagline) → after login shows **status pill**: `আজকের শিফট: জেনারেল 8:00–5:00` or, tappable **"আমার ছুটির ব্যালেন্স দেখুন"** (reveals leave balance inline, like "see balance"; second tap hides). Late state: pill turns red tint with "আজ দেরি — 11 মিনিট".
- Top-right: two 44 dp white circle buttons: **Search** and **Charu mark** (red diamond) with tiny menu badge → opens side menu (Profile, Language, Settings, Logout).
- Header collapses on scroll to a 56 dp black app bar (avatar + search + bell).

**B. White sheet** — overlaps header by 24 dp, top radius 24, background `#FFFFFF`; page padding 16.

**C. Alert card (conditional)** — pink-tint (`brandRedTint`) card, header "তথ্য হালনাগাদ করুন" + red `!` badge; inner white card with illustration, 2-line message, chevron. Triggers: profile incomplete, password expiring, pending acknowledgement, missing punch to fix. Max 1 at a time.

**D. Primary service grid** (4 columns, 2 rows visible)
- Cell: icon circle **56 dp**, fill `#F6F6F7`, icon 28 dp duotone (black line + red accent), label below 13/600, centred, max 2 lines, Bangla first.
- Row gap 20, column gap 8. Third row **blurred preview** + centred pill button **"আরো দেখুন ⌄"** (white, red text, radius 12, shadow) expands the grid inline; collapsed by default.
- Items are **role-based and ordered by usage**:

| Slot | Employee | Supervisor / HOD | HR |
|---|---|---|---|
| 1 | হাজিরা (My Attendance) | অনুমোদন (Approvals) | কর্মী (Employees) |
| 2 | ছুটির আবেদন (Apply Leave) | টিম হাজিরা (Team) | হাজিরা রিভিউ |
| 3 | সংশোধন (Adjustment) | ছুটি (Leave requests) | ছুটি অনুমোদন |
| 4 | ওভারটাইম (OT) | ওভারটাইম | ওভারটাইম |
| 5 | রোস্টার/শিফট (Schedule) | রোস্টার | রোস্টার |
| 6 | নোটিশ (Notices) | নোটিশ | নোটিশ পাঠান |
| 7 | ছুটির তালিকা (Holidays) | রিপোর্ট | রিপোর্ট |
| 8 | পলিসি (Policies) | ওভারটাইম রিপোর্ট | মাস ক্লোজ |
| More | পে-স্লিপ (v2), আইডি কার্ড, ডিরেক্টরি, সহায়তা | কর্মী তালিকা, ডিরেক্টরি | সেটিংস, ডিভাইস, অডিট |

Approval items show a small red count badge.

**E. Promo / Notice carousel** — height 112 dp, radius 16, auto-play 5 s, **dot indicator** (active = pill 16×6 white, inactive 6 dp circles at 50% white) over the banner bottom. Content: pinned announcements, safety campaign, "Employee of the month", holiday notice (HR uploads image + title + deep link). Fallback: black card with red diamond and text.

**F. Quick features ("দ্রুত কাজ")** — section title 16/700.
- Row of 3 **chips** (white, 1 px border, radius 12, height 48, icon + label): recent or saved actions such as `ক্যাজুয়াল ছুটি ২ দিন`, `দেরি সংশোধন`, `আজকের টিম`. Auto-filled from last actions; long-press to pin.
- Below: 3 **pastel feature cards** (radius 16, height ≈ 120, icon top-left, title bottom): 
  - 🎁 `জন্মদিন ও বার্ষিকী` (tint `#FFF3E0`)
  - ％ `ছুটির ক্যালেন্ডার` (tint `#E6F6F4`)
  - 🏆 `মাসের সেরা` / perfect attendance (tint `#FFF8E1`)

**G. Bottom navigation** (height 64 dp + safe area, white, top border/soft shadow)
| Tab | Icon | Employee | Notes |
|---|---|---|---|
| 1 | Home (house) | **হোম** | Home content A–F |
| 2 | Person/wallet-style card | **আমার চারু** | "My Charu" personal page (§15.3) |
| 3 | QR / fingerprint | **চেক-ইন** (QR scan) | P1: scan location QR / geo check-in. If employee uses device only → tab shows **অনুরোধ (Requests)** instead (HR-configurable). |
| 4 | Envelope + badge | **ইনবক্স** | Notifications + approvals count badge (red circle, white 12/700) |
- Active tab: **filled red icon + red label**, inactive: outline `#4B4B52` + label; label 12/600. Managers: tab 3 = **অনুমোদন**.

### 15.3 "My Charu" tab (personal page, same hero header without search)
1. **Alert card** (profile/NID/bank/emergency contact incomplete).
2. **Two cards side by side** (height 120, radius 16):
   - Left white card: label "ছুটির ব্যালেন্স", gold-ring star/coin icon replaced by **leave ring icon**, big number (e.g., "১২ দিন"), red text link "বিস্তারিত".
   - Right tinted card (green `#E7F6EC`): "এই মাসে নিখুঁত হাজিরা" with streak count and leaf/trophy illustration, chevron.
3. **আমার টিম / প্রিয় সহকর্মী** ("My team"): row of 56 dp circle avatars with initials on soft random pastel (`#B39DDB`, `#90B4D4`, `#D49BC2`, `#E0DC8F`), name below (1 line, ellipsis), dashed circle **"যোগ করুন"**, red "ম্যানেজ" link at right of the section title.
4. **আমার অনুমোদনকারী / যোগাযোগ** (my Supervisor, HOD, HR): two cards per row (white, border, radius 16): teal-tint icon circle 40 dp + name (14/700) + phone/ext (14/400); tap = call/WhatsApp sheet.
5. **আমার সেভ করা ডকুমেন্ট** (saved docs): pay-slip PDFs (v2), appointment letter, ID card, leave approvals; horizontal cards, "ম্যানেজ" link.
6. Profile summary, language switch (বাংলা/English), logout.

### 15.4 Component specs added
| Component | Spec |
|---|---|
| `HeroHeader` | Height 140 + inset; gradient + pattern; avatar, status pill, 2 round buttons; collapses to app bar on scroll |
| `StatusPill` | White, radius 12, 40 dp, tap to reveal; states: tagline, shift, late (red tint), on leave (violet tint), holiday (teal tint) |
| `RoundIconButton` | 44 dp white circle, 1 px `#E5E5E8`, icon 22 dp |
| `SheetContainer` | White, top radius 24, overlaps header by 24 dp |
| `ServiceTile` | 56 dp circle + label; badge optional (red 18 dp circle) |
| `ExpandableGrid` | Collapsed 2 rows + blurred third row + "আরো দেখুন" pill; animated height 250 ms |
| `PromoCarousel` | 112 dp, radius 16, dot indicator, auto-play, deep links |
| `QuickChip` | 48 dp, radius 12, icon + label, long-press pin |
| `PastelFeatureCard` | Radius 16, tint bg, icon 32 dp, title 14/700 |
| `AlertCard` | Red-tint outer card with header + inner white card + chevron |
| `PersonAvatarRow` | 56 dp initials circles + "যোগ করুন" dashed circle |
| `ContactCard` | Border card with icon circle, name, number |
| `BottomTabBar` | 4 tabs, active red filled, inbox badge |

### 15.5 Behaviour
- Pull-to-refresh on Home; skeletons for grid (circles + 2 text lines) and banner.
- Grid order adapts to usage (top-8 by taps in last 30 days, HR can lock defaults).
- Numbers and dates localized (Bangla numerals when language = বাংলা).
- Haptic light on tab change and reveal pill.
- Dark header + light sheet in both themes; status bar icons white on header.
- Accessibility: tiles ≥ 48 dp touch, labels readable at 130% font; badge count announced ("৩টি অপেক্ষমান").

### 15.6 Flutter sketch (for the agent)
```dart
// features/home/presentation/home_screen.dart
CustomScrollView(slivers: [
  SliverPersistentHeader(pinned: true, delegate: HeroHeaderDelegate()), // collapses to app bar
  SliverToBoxAdapter(child: SheetContainer(child: Column(children: [
    if (alert != null) AlertCard(alert),
    ExpandableGrid(items: servicesForRole(role)),
    PromoCarousel(items: notices),
    QuickSection(chips: recentActions, cards: pastelFeatures),
  ]))),
]);
```
Bottom bar: `NavigationBar` themed per §12 with red indicator; Inbox tab uses `Badge`.

### 15.7 Do / Don't (home)
- **Do** keep the hero black→red, white sheet, soft grey icon circles, Bangla-first labels.
- **Don't** reuse the reference app's pink, logo, illustrations, text or icon artwork; don't show more than 8 tiles before "See more"; don't put financial-style balance (salary) on Home in v1.

### 15.8 Reference set A — screenshot map
| Screenshot | Reference screen | Charu screen |
|---|---|---|
| Home A1 | Home tab: header + balance pill + 4×2 service grid + blurred row + promo carousel + quick feature chips + pastel cards | **Home** (§15.2) |
| Home A2 | "My" tab: alert card, points + promo cards, favourite numbers, favourite agents, saved bills, 4-tab bar with inbox badge | **আমার চারু** (§15.3) |

> More reference screenshots will be added as set B, C… in this section.

---

## 16. Luxury Gradient Motion Language (global direction — applies to every screen)

**Direction from the owner:** the whole app uses **animated gradients**, a **minimalist** layout and a **super-luxury** feel. Brand stays **Charu red `#EC1C24` + black**; luxury comes from restraint, depth, light and motion — not from extra colours.

### 16.1 Principles
1. **Less, but better:** one hero idea per screen, generous white space (24–32 dp between sections), max 2 font weights per screen.
2. **Black as luxury base, red as light:** deep black surfaces with a red glow; red is *light*, not paint.
3. **Hairlines over boxes:** 0.5–1 dp warm hairline dividers instead of heavy borders; shadows are soft and tinted (`rgba(236,28,36,0.08)`), never grey and heavy.
4. **Motion with meaning:** animation reveals data or confirms an action; never decorative noise.
5. **Quiet confidence:** big gradient numbers, small spaced-out overline labels (like the logo's wide-tracked "STYLISH LIVING").

### 16.2 Token overrides (these replace the matching neutrals in §2 for the mobile app)
| Token | Value | Use |
|---|---|---|
| `ivory` (new `bg`) | `#FBF6F2` | App background (warm cream, as in the reference map poster) |
| `ivorySurface` | `#FFFFFF` | Cards on ivory |
| `hairline` (new `border`) | `#EDE4DC` | Dividers, card borders |
| `inkSoft` | `#2A1A1B` | Primary text on ivory (warm black) |
| `mutedWarm` | `#8C7B7C` | Secondary text |
| `coral` | `#FF6B57` | Light end of red gradients only (never text on white) |
| `wine` | `#8E0F15` | Deep end of red gradients |
| `noir` | `#000000` | Hero base |
| `noirWine` | `#2A0A0C` | Black → wine glow |

### 16.3 Gradient set
| Name | Stops | Use |
|---|---|---|
| `gRed` | `coral #FF6B57 → red #EC1C24 → wine #8E0F15` (top-left → bottom-right) | Map fill, key numbers, progress bars, primary CTA highlight |
| `gNoir` | `#000000 → #141414 → #2A0A0C` (top → bottom) | Hero header, check-in card, sidebar |
| `gAurora` | `noir` base + 2–3 blurred radial blobs (`red 35%`, `coral 20%`, `wine 30%`) moving slowly | Home hero (§15), login panel |
| `gIvory` | `#FFFFFF → #FBF6F2` (top → bottom) | Light sheets and cards |
| `gGlass` | `white 8% → white 3%` + 1 dp border `white 14%` + blur 16 | Cards over dark hero only |
| `gGold-free` | — | **No gold.** Luxury is red/black/ivory only |

Gradient text (big numbers): `ShaderMask` with `gRed`.

### 16.4 Typography for luxury
- Display numbers: Inter / Hind Siliguri **700**, 36–48 sp, gradient fill.
- Overline labels: 11–12 sp, **UPPERCASE letter-spacing 1.5** for **English only**. **Never apply letter-spacing to Bangla text** (it breaks conjuncts).
- Body 14 sp weight 400, line height 1.5 (Bangla 1.6). Titles 600, not 700+ (lighter = more refined).

### 16.5 Shape and depth
Cards radius **20–24**, hero sheet radius **28**, buttons radius **14**, chips **10**. Elevation = soft tinted shadow `0 12 32 rgba(236,28,36,0.08)`; no elevation on list rows.

### 16.6 Motion spec
| Motion | Where | Spec |
|---|---|---|
| **Aurora drift** | Hero header | 2–3 blurred blobs drift on 14–20 s loops, ease-in-out, opacity 0.2–0.4 |
| **Gradient sweep** | Primary buttons, KPI cards on appear | 700 ms linear highlight moving left→right once |
| **Card rise** | Lists/cards on first appear | fade 0→1 + translateY 12→0, 320 ms `easeOutCubic`, stagger 40 ms, max 8 items |
| **Count-up** | KPI numbers, percentages | 800 ms `easeOutCubic` from 0 |
| **Progress fill** | Bars/rings | 1000 ms `easeOutQuart` |
| **Map reveal** | Workforce Map (§17) | districts fill in sequence, 18 ms stagger, 700 ms total |
| **Live pulse** | Changed data (map district, KPI) | 1 glow pulse 1200 ms when a value changes in real time |
| **Page transition** | Navigation | fade-through 220 ms; shared-element for avatar/hero |
| **Press feedback** | Buttons, tiles | scale 0.97, 90 ms, light haptic |
| **Skeleton** | Loading | shimmer in `#F1E8E1 → #FBF6F2` |

**Motion budget rules (important for factory phones with 2 GB RAM):**
1. **At most one continuously looping animation per screen** (the aurora). Everything else plays once.
2. Pause loops when the app is in background or the widget is off-screen (`TickerMode`, `VisibilityDetector`).
3. Wrap animated painters in `RepaintBoundary`; avoid `BackdropFilter` on scrolling lists — use blur only on the hero and sheets.
4. **Lite mode:** auto-enable on low-RAM devices (`Platform` memory check / frame-time sampling) or Android Battery Saver, or when OS "reduce motion" is on → aurora becomes a **static** gradient, no stagger, no blur. User can toggle in Profile › "Smooth animations".
5. Target 60 fps; if average frame time > 20 ms for 3 s, drop to Lite mode automatically.

### 16.7 Flutter building blocks (add to `shared/widgets/` and `core/theme/`)
```dart
// core/theme/app_gradients.dart
import 'package:flutter/material.dart';

class AppGradients {
  static const gRed = LinearGradient(
    begin: Alignment.topLeft, end: Alignment.bottomRight,
    colors: [Color(0xFFFF6B57), Color(0xFFEC1C24), Color(0xFF8E0F15)],
  );
  static const gNoir = LinearGradient(
    begin: Alignment.topCenter, end: Alignment.bottomCenter,
    colors: [Color(0xFF000000), Color(0xFF141414), Color(0xFF2A0A0C)],
  );
  static const gIvory = LinearGradient(
    begin: Alignment.topCenter, end: Alignment.bottomCenter,
    colors: [Color(0xFFFFFFFF), Color(0xFFFBF6F2)],
  );
}

// shared/widgets/gradient_text.dart
class GradientText extends StatelessWidget {
  const GradientText(this.text, {super.key, required this.style, this.gradient = AppGradients.gRed});
  final String text; final TextStyle style; final Gradient gradient;
  @override
  Widget build(BuildContext context) => ShaderMask(
    blendMode: BlendMode.srcIn,
    shaderCallback: (r) => gradient.createShader(Rect.fromLTWH(0, 0, r.width, r.height)),
    child: Text(text, style: style),
  );
}

// shared/widgets/aurora_background.dart  (sketch)
// StatefulWidget + AnimationController(duration: 18s)..repeat(reverse: true)
// CustomPainter draws gNoir then 3 radial gradients whose centers = Offset(lerp(a,b,t), ...).
// Wrap in RepaintBoundary; if (liteMode) paint once and don't start the controller.

// shared/widgets/count_up_text.dart  (sketch)
// TweenAnimationBuilder<double>(tween: Tween(begin: 0, end: value), duration: 800ms, curve: Curves.easeOutCubic, builder: ...)
```

### 16.8 Component restyle summary
| Component | Luxury treatment |
|---|---|
| Hero header | `gAurora`, avatar with 2 dp white ring, glass pill |
| KPI card | `ivorySurface`, hairline, big `GradientText` number, overline label, count-up |
| Primary button | Solid red with one-time gradient sweep on appear; pressed `wine` |
| Status chip | Soft tint bg, no border, 10 dp radius |
| Lists | No card per row; hairline separators; avatar 44 dp |
| Bottom bar | White, 0.5 dp top hairline, active = red filled icon with tiny red dot |
| Check-in card | `gNoir` + glass, big time in white, red CTA |
| Charts | Gradient bars (`gRed`, rounded 8), no gridlines except baseline hairline |
| Empty states | Single thin-line illustration, red accent dot |

---

## 17. Workforce Map (Bangladesh districts) — screen spec

Reference: an infographic-style Bangladesh district map (cream background, highlighted districts in an orange→pink gradient with dark labels, big "26/64" counter, progress bar and footer). We reproduce the **style** — not the artwork, name or branding — in Charu colours. Map geometry comes from an open boundary dataset (see TRD §15).

### 17.1 Purpose and access
Shows where employees come from (permanent district by default). **HR Manager, HR Executive, Admin: full. HOD: own department. Management/others: sanitized view** (GEO-9). Entry points: Reports › **Workforce Map**, Workspace dashboard tile, Home grid item **কর্মী মানচিত্র** (HR role), web sidebar.

### 17.2 Layout (mobile, top to bottom)
1. **Header block** on `ivory`: overline (English: `WORKFORCE MAP`; Bangla: "কর্মী মানচিত্র", small, `mutedWarm`) · **Title** "আমাদের কর্মী, আমাদের বাংলাদেশ" (h1, `inkSoft`, 700) · top-right big counter **`৩৮`** in `GradientText` + `/৬৪` in `mutedWarm` (count-up).
2. **Filter row** (horizontal chips, 40 dp): `স্থায়ী ঠিকানা | বর্তমান ঠিকানা` segmented · Department ▾ · Section ▾ · Type ▾ · `% | জন` toggle · Division view. (P1 for filters; default = all active, permanent, %.)
3. **Map canvas** — fills width, aspect ≈ 3:4 (≈ 360×480 dp), pinch-zoom 1×–6×, pan, double-tap zoom, bounded to country.
   - Districts **without** employees: fill `#F2E4DA`, hairline `#FFFFFF` 0.6 dp.
   - Districts **with** employees: fill = `gRed` shader across the map bounds, **opacity 0.35 → 1.0** by share (scaled to the top district), white hairline 0.8 dp.
   - **Labels:** dark `inkSoft` 11–12 sp 600 text with 2 dp white halo + small dark dot at label point (like the reference). Zoomed out: label only top 12 districts; zoom ≥ 2×: label all highlighted; zoom ≥ 4×: label all 64.
   - **Selected** district: raised look (white 1.5 dp outline, soft glow), others dim to 85%.
   - Ocean/outside area: `ivory` (no blue).
4. **Coverage strip:** thin progress bar `gRed` over `#F2E4DA` (height 8, radius 4) filling to `districtsCovered/64`; below-left bold text "**৫৯% জেলা কভার হয়েছে**"; below-right small `mutedWarm` "৩৮টি জেলা · ৮টির মধ্যে ৭টি বিভাগ".
5. **Ranked list ("কোন জেলা থেকে কত জন")** — this is the number display under the map: each row = rank · district name · gradient bar (width ∝ share) · **`30%`** (bold) · `(৩৭২ জন)` `mutedWarm`. Top 5 shown, "সব দেখুন" expands. Example rows: লক্ষ্মীপুর 30% · হবিগঞ্জ 20% · কুমিল্লা 9%. "অন্যান্য" row appears in sanitized view; "ঠিকানা নেই: ৫৪ জন" row for missing data (links to fix list, HR only).
6. **Footer card** (like the reference poster footer): "Charu Ceramic · Stylish Living" mini logo + "ডেটা আপডেট: এইমাত্র" with a tiny live dot (green pulse when connected).

### 17.3 Interactions
| Gesture | Result |
|---|---|
| Tap district | Selected state + **bottom sheet**: name (BN/EN), `count`, `%`, mini bar vs top district, department breakdown chips, (HR) **"কর্মী তালিকা দেখুন"** → filtered Employee list |
| Tap row in ranked list | Map zooms/centres on that district and selects it |
| Long-press map | Compare mode (P2) |
| Pull-to-refresh | Forces re-read of `geoStats` |
| Share (top-right) | Generates 3:4 **poster image/PDF** (map + counter + top 5 + Charu footer) via `RepaintBoundary.toImage` (GEO-8) |
| Division toggle | Colours whole divisions by share; labels = division names |

### 17.4 Animations
1. **On open:** counter counts up; districts reveal in descending order of share, 18 ms stagger (fade 0→target opacity + tiny scale 0.98→1), coverage bar fills, ranked rows rise in.
2. **Live update (GEO-3):** Firestore listener on `geoStats/{scope}`; on change → affected districts **pulse** once (glow ring 1200 ms), numbers count from old → new, ranked list re-orders with animated position change (`AnimatedList`/implicit), small toast "হবিগঞ্জ আপডেট হয়েছে" (optional, HR only).
3. **Filter change:** cross-fade fills over 400 ms (no flicker).
4. Reduce motion / Lite mode: no stagger and no pulse; values change instantly.

### 17.5 Web / tablet
Two-column: left map (max 720 px), right column with filters, counter, coverage bar, ranked list (scrollable) and selected-district panel. Hover shows tooltip "হবিগঞ্জ — ২০% · ২৪৮ জন".

### 17.6 States
Loading: map silhouette skeleton in `#F2E4DA` with shimmer. Empty (no districts set): outline map + message "কর্মীদের জেলা তথ্য যোগ করুন" + CTA (HR). Error: Retry. Offline: last cached snapshot + "অফলাইন" tag.

### 17.7 Accessibility
Ranked list is the accessible equivalent of the map (screen-reader order by share). Colour is never the only carrier: % text is always visible in the list/sheet. Min tap target for small districts: tap resolves to nearest district within 12 dp.

### 17.8 Components to build
`WorkforceMapScreen`, `DistrictMapView` (CustomPainter + InteractiveViewer), `DistrictLabelLayer`, `CoverageBar`, `DistrictRankList`, `DistrictSheet`, `MapFilterBar`, `MapPosterExporter`, `LiveDot`, `CountUpText`, `GradientText`.

### 17.9 Reference set B — screenshot map
| Screenshot | Reference | Charu screen |
|---|---|---|
| Map poster (Bangladesh travel map, "26/64") | Cream background, gradient-highlighted districts, dark haloed labels with dots, big gradient counter, progress bar, footer branding | **Workforce Map** (§17.2) |

---

## 18. Analytics Dashboards & Animated Gradient Chart System

Reference set C: three dark analytics dashboard screenshots (a stock-site "dashboard chart" illustration with glowing wave charts, ring clusters and a world map; a stock-site "modern dark analytics dashboard" with KPI cards, a teal→purple area chart, heatmap bars and a calendar; and a design-gallery "next-gen analytics" board with smooth wave lines, gradient bar columns, an activity timeline and progress bars). We take the **style and chart types only** — never the files, names or artwork (they are licensed stock/portfolio work) — and recolour everything to Charu **noir + red/coral/wine** gradients.

> "Pipe graph" in the brief is read as **pie / donut graph**. Please confirm.

### 18.1 Analytics theme ("Noir cockpit")
Analytics screens switch to a dark premium surface (Home stays ivory). Transition: ivory → noir with a 250 ms fade-through so it feels like entering a cockpit.

| Token | Value |
|---|---|
| `nBg` | `#0B0B0D` (page) |
| `nCard` | `#141417 → #1A1012` vertical gradient (cards) |
| `nHair` | `rgba(255,255,255,0.08)` (card border, gridlines) |
| `nText` | `rgba(255,255,255,0.92)`; secondary `0.60`; tertiary `0.38` |
| `nGlow` | `rgba(236,28,36,0.25)` (soft glow behind key charts) |

Card: radius 20, padding 16, 1 dp `nHair` border, optional inner top highlight (white 6%). Title 14/600, overline 11 uppercase (English only), value 28–36/700 (gradient on key numbers).

### 18.2 Chart colour system (dark)
| Series / meaning | Gradient (light → deep) |
|---|---|
| Primary / attendance / headline | `coral #FF6B57 → red #EC1C24 → wine #8E0F15` |
| Present / approved / good | `#6EE7A8 → #22A06B → #15803D` |
| Late | `#FF8A7A → #EC1C24` |
| Absent | `#FF5A5F → #8E0F15` |
| Leave | `#C4B5FD → #8B5CF6 → #6D28D9` |
| OT | `#FFFFFF → #9A9AA3` |
| Holiday / weekly off | `#67E8F9 → #0E7490` / `#9A9AA3 → #52525B` |
| Amber (warning) | `#FCD34D → #F59E0B` |
Rule: **red-family is the hero colour**; other colours appear only to carry status meaning. Max 4 hues per chart. Always add a legend or direct labels (never colour-only).

### 18.3 Chart catalogue (what to build)
| # | Chart | Used for | Look and behaviour |
|---|---|---|---|
| C1 | **KPI card + sparkline** | Headcount, Attendance %, Late %, Absent %, OT, Avg performance | Overline label, big gradient number (count-up), trend chip (↑ green / ↓ red, "+2.1%"), 40 dp smooth sparkline with gradient stroke and glow dot at last point |
| C2 | **Gradient wave (smooth area) chart** | 12-month attendance rate, leave trend, performance trend | Curved line 3 dp, gradient stroke (coral→red), area fill gradient (red 35% → transparent), soft glow under line, hairline gridlines, last value dot pulsing, scrub with crosshair + glass tooltip, optional second series in `#FFFFFF` 40% dashed |
| C3 | **Gradient bar columns** | Monthly absence, department comparison, OT by month, arrival-time histogram | Rounded-top bars (radius 8, width 14–18), gradient bottom `wine` → top `coral`, selected bar glows and others dim to 55%, value label above on selection, baseline hairline only |
| C4 | **Pill progress bars** | Department attendance, leave utilization, shift fill (like "browser usage" rows) | Row: avatar/icon · label · gradient pill (height 8) · `%` right-aligned; bars fill left→right staggered |
| C5 | **Gradient donut / pie ("pipe") chart** | Present/Late/Absent/Leave mix, leave by type | Ring thickness 16% of diameter, **rounded caps**, 4° gaps, sweep gradient per segment, centre shows total (count-up) + caption; tap segment → it pops out 6 dp and centre shows that segment's value; legend chips below with % |
| C6 | **Radial gauge / semicircle** (Leave Indicator) | Used vs entitled, turnaround time, attendance target | 180°–270° arc, zone gradient green → amber → red behind a thin track, needle or filled arc animates with slight overshoot, centre value + status chip ("সবুজ / হলুদ / লাল") |
| C7 | **Ring cluster** | Dept/shift completion (50/70/30/25 style) | 3–5 mini donuts 56 dp with % centre, gradient stroke, labels below |
| C8 | **Heatmap calendar** | Attendance by day, who is on leave by day | 7×N grid, cell radius 6, intensity gradient from `#2A0A0C` → `coral`; weekend cells outline only; tap cell → day sheet |
| C9 | **Radar (spider) chart** | Performance components per department/employee | 4–6 axes, gradient fill 30% red, glowing outline, comparison polygon in white 40% |
| C10 | **Histogram / bell** | Score distribution | Gradient columns + smooth curve overlay |
| C11 | **Leaderboard** | Top performers, top late/absent (HR only) | Rank, avatar, name, gradient bar, score; rank 1–3 with subtle red glow |
| C12 | **Timeline lollipop** | Upcoming leave, monthly milestones | Vertical line, dots with ring, labels left (month), values right |
| C13 | **Stat trio / chips** | Pending approvals, flags count | Pills with count and mini icon |
| C14 | **Alert list with indicator dots** | Leave Indicator alerts | Traffic-light dot (green/amber/red), title, detail, "View" action |

### 18.4 Animation spec (charts)
| Chart | Entrance (plays once when first visible) | On data change | Interaction |
|---|---|---|---|
| Wave (C2) | Line **draws left→right** over 1200 ms `easeOutCubic` (clip-reveal), area fades in 600 ms after, last dot pulses | Morph points 500 ms | Drag = crosshair + haptic tick on each point; tooltip glass |
| Bars (C3) | Grow from baseline, 60 ms stagger, 700 ms each `easeOutBack` (tiny overshoot) | Height tween 500 ms | Tap = select/glow; long-press = compare |
| Donut (C5) | Sweep clockwise 0→360° in 1000 ms `easeOutCubic`, centre count-up | Segments tween 600 ms | Tap = pop-out segment |
| Gauge (C6) | Arc fills / needle springs 900 ms with 4% overshoot | Spring to new value | Tap = zone breakdown |
| Progress (C4) | Fill left→right 800 ms, 50 ms stagger | Tween 400 ms | — |
| Heatmap (C8) | Diagonal wave fade-in 600 ms | Cross-fade 300 ms | Tap = day sheet |
| Radar (C9) | Polygon scales from centre 800 ms | Morph 500 ms | Tap axis = label detail |
| KPI number | Count-up 800 ms | Count old→new 500 ms | — |
Page transitions between dashboard tabs: shared fade + slide 8 dp, 220 ms. Live changes (e.g., a leave approved) trigger one soft **pulse** on the affected element (1200 ms).

**Budget (same rules as §16.6):** only animate charts that are on screen; entrance runs once per session per chart; at most one looping effect (the glow dot); `RepaintBoundary` per chart; **Lite mode** = no draw-in, solid fills, instant values; downsample series to ≤ 60 points; no blur layers in lists.

### 18.5 Dashboard layouts

**Mobile (≤ 600 px)** — top: segmented scroll tabs `ওভারভিউ · হাজিরা · ছুটি · লিভ ইন্ডিকেটর · পারফরম্যান্স` (active = red underline + white text) → filter chips row (`৩০ দিন ▾`, `বিভাগ ▾`, `শিফট ▾`) → vertical stack of cards.

| Tab | Card order |
|---|---|
| **Overview** | KPI carousel (C1 ×6) → Attendance wave 12M (C2) → Today donut (C5) → Department ranking (C4) → Alerts (C14, top 3) |
| **Attendance** | Wave 12M (C2) → Daily trend 30D (C2 small) → Status donut (C5) → Arrival-time histogram (C3) → Heatmap calendar (C8) → Dept bars (C3/C4) → Shift ring cluster (C7) → Top late / Top absent (C11) → OT trend (C3) |
| **Leave** | Leave-by-type donut (C5) → Monthly leave stacked area (C2) → Leave heatmap (C8) → Dept utilization (C4) → Approval turnaround gauge (C6) → Upcoming leave timeline (C12) → EL liability card (C1) |
| **Leave Indicator** | Summary trio: Green / Amber / Red counts (C13) → My-department gauge (C6) → Per-leave-type gauges (CL, SL, EL) (C6 ×3) → Alerts (C14) with filters (severity, type, dept) → Employee list sorted by risk with small gauge per row |
| **Performance** | Avg score trend (C2) → Score distribution (C10) → Component radar (C9) → Dept ring cluster (C7) → Leaderboard (C11) → Confirmation-due list |
| **My Insights** (employee) | My attendance donut (C5) → Punctuality streak (C1) → My leave gauges (C6) → Worked-hours bars (C3) → My performance (after publish) |

**Web / tablet (≥ 840 px) — 12-column bento grid, 24 dp gap, sidebar visible**
```
Row 1:  [KPI 3 cols] [KPI 3 cols] [KPI 3 cols] [KPI 3 cols]
Row 2:  [Attendance wave 8 cols, tall]            [Status donut 4 cols]
Row 3:  [Dept bars 4]  [Arrival histogram 4]      [Heatmap calendar 4]
Row 4:  [Leave donut 4] [Leave gauges 4]          [Alerts list 4]
Row 5:  [Top late 6]                              [Top absent 6]
```
Sticky filter bar at top; hover tooltips; click-through drill-down; export button per card.

### 18.6 Leave Indicator specifics
- **Gauge zones:** balance left → Green ≥ 50%, Amber 20–50%, Red < 20% (zones drawn as gradient segments; value marker is a glowing dot on the arc).
- **Status chip:** `সবুজ` / `হলুদ` / `লাল` with icon (check / warning / error) so it isn't colour-only.
- **Alert row:** dot + title ("সিক লিভ বেশি — ৬ দিন/৯০ দিন"), detail, employee avatar, `রিভিউ` button; severity sorting; "HR review only" badge.
- Tone: neutral wording ("review suggested"), never "suspicious".

### 18.7 Flutter implementation guide

**Libraries:** `fl_chart` for line/bar/radar; **custom painters** for donut, gauge, heatmap, sparkline glow (full control of gradients and animation).

```dart
// Wave chart with gradient stroke + gradient area (fl_chart)
LineChartData waveData(List<FlSpot> spots) => LineChartData(
  gridData: FlGridData(show: true, drawVerticalLine: false,
    getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x14FFFFFF), strokeWidth: 1)),
  borderData: FlBorderData(show: false),
  titlesData: const FlTitlesData(topTitles: AxisTitles(), rightTitles: AxisTitles()),
  lineBarsData: [
    LineChartBarData(
      spots: spots, isCurved: true, curveSmoothness: 0.35, barWidth: 3,
      gradient: const LinearGradient(colors: [Color(0xFFFF6B57), Color(0xFFEC1C24)]),
      dotData: const FlDotData(show: false),
      belowBarData: BarAreaData(
        show: true,
        gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [const Color(0xFFEC1C24).withOpacity(0.35), Colors.transparent]),
      ),
    ),
  ],
);
// Use: LineChart(waveData(spots), duration: const Duration(milliseconds: 500), curve: Curves.easeOutCubic)
// Draw-in reveal: wrap in ClipRect + Align(alignment: Alignment.centerLeft, widthFactor: t) with t from a one-shot AnimationController (0→1, 1200 ms).
```

```dart
// Gradient bar rod
BarChartRodData rod(double y) => BarChartRodData(
  toY: y, width: 16,
  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
  gradient: const LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter,
    colors: [Color(0xFF8E0F15), Color(0xFFEC1C24), Color(0xFFFF6B57)]),
);
```

```dart
// Gradient donut with rounded caps (custom painter, animated by t = 0..1)
class DonutSegment { DonutSegment(this.value, this.colors); final double value; final List<Color> colors; }

class GradientDonutPainter extends CustomPainter {
  GradientDonutPainter(this.segments, this.t, {this.selected});
  final List<DonutSegment> segments; final double t; final int? selected;

  @override
  void paint(Canvas canvas, Size size) {
    final total = segments.fold<double>(0, (a, s) => a + s.value);
    if (total == 0) return;
    final stroke = size.shortestSide * 0.16;
    final rect = (Offset.zero & size).deflate(stroke / 2 + 6);
    const gap = 0.07; // radians
    var start = -math.pi / 2;
    for (var i = 0; i < segments.length; i++) {
      final full = segments[i].value / total * 2 * math.pi;
      final sweep = math.max(0.0, full * t - gap);
      final shift = (i == selected) ? 6.0 : 0.0;            // pop-out
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
            startAngle: start, endAngle: start + math.max(sweep, 0.01),
            colors: segments[i].colors).createShader(rect);
      canvas.save();
      final mid = start + full / 2;
      canvas.translate(math.cos(mid) * shift, math.sin(mid) * shift);
      canvas.drawArc(rect, start + gap / 2, sweep, false, paint);
      canvas.restore();
      start += full * t;
    }
  }
  @override
  bool shouldRepaint(covariant GradientDonutPainter old) => old.t != t || old.selected != selected || old.segments != segments;
}
// Wrap: TweenAnimationBuilder<double>(tween: Tween(begin: 0, end: 1), duration: const Duration(milliseconds: 1000), curve: Curves.easeOutCubic, builder: (_, t, __) => CustomPaint(painter: GradientDonutPainter(segs, t)))
```

```dart
// Leave Indicator gauge (concept): draw track (white 8%), zone arcs with gradient (green→amber→red),
// then a value arc/marker animated with TweenAnimationBuilder + Curves.easeOutBack. Centre Text uses CountUpText + StatusChip.
```

**Reusable chart widgets** (`shared/charts/`): `ChartCard`, `KpiSparkCard`, `WaveChart`, `GradientBarChart`, `PillProgressRow`, `GradientDonut`, `LeaveGauge`, `RingCluster`, `HeatmapCalendar`, `RadarChartCard`, `Histogram`, `Leaderboard`, `TimelineLollipop`, `AlertRow`, `ChartLegend`, `ChartTooltip`, `ChartTheme` (colours from §18.2), `MotionPrefs` (Lite mode).

### 18.8 Accessibility and data honesty
- Each chart has a **screen-reader summary** ("Attendance rate October 90.3%, up 2.1 points from September") and a "table view" toggle (P1).
- Axes start at zero for bars; wave charts for percentages show min/max labels; avoid exaggerating trends with truncated axes unless labelled.
- Numbers use the same formulas as reports (PRD §5.14); show "as of" time and a "locked month" badge.
- Colour is never the only carrier: legends, labels, icons and chips accompany gradients.

### 18.9 Reference set C — screenshot map
| Screenshot | What it shows | Charu equivalent |
|---|---|---|
| Stock "Dashboard chart. Analysis data graph…" | Glowing wave charts with KPI sparklines, mini ring clusters (50/70/30/25%), bar columns, horizontal bars, world map | KPI sparklines (C1), ring clusters (C7), bars (C3, C4); map → Workforce Map (§17) |
| Stock "Modern Dark Analytics Dashboard UI" | KPI cards with change chips, teal→purple area chart, heatmap bars, calendar, team-productivity rings | KPI cards (C1), wave (C2), heatmap calendar (C8), rings (C7) |
| Gallery "Next-Gen Analytics Dashboard" | Smooth wave line + gradient fill, gradient bar columns, daily-activity timeline, progress rows with icons | Wave (C2), bars (C3), timeline (C12), pill progress rows (C4) |
