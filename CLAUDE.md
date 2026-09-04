# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Web Builder Pro" — a multi-tenant School Website SaaS platform. Each school gets:
1. A public-facing school website (parents/students view content)
2. A School Admin panel (each school manages its own content)
3. A Super Admin panel (platform owner manages all schools)

Solo freelance client project (developer: Mudit, based in India).

- **Tech stack**: Node.js + Express backend, MySQL (XAMPP local dev); React + Vite frontend,
  Tailwind CSS v4, Zustand (state), Axios, `@tanstack/react-query`.
- **Auth**: JWT access token + httpOnly-cookie refresh token (see Architecture below).
- **File storage**: Cloudinary (images, videos, PDFs).
- **Rich text**: `react-quill-new` via a custom `RichTextEditor` component.
- **Image cropping**: `react-image-crop` via a custom `ImageCropModal` component.

**Local dev**:
- Backend: `http://localhost:5000` · Frontend (Vite): `http://localhost:5173`
- Example public site: `http://localhost:5173/school/st-marys-convent-school`
- DB name: `db_school_saas`
- Dev credentials: Super Admin `admin@schoolsaas.com` / `admin123`; School Admin
  `rajesh@stmarys.com` / `admin123`

A more free-form running notebook also exists at `docs/PROJECT_CONTEXT.md`, whose stated purpose
is to be pasted into a *fresh claude.ai chat* (not Claude Code) to bootstrap context there. Its
content has been folded into this file below, so you shouldn't need to open it for Claude Code
work — but if it's ever updated with newer notes than this file, treat it as the more current
source and update this file to match.

## Commands

Backend (`backend/`):
- `npm run dev` — start with nodemon (port 5000, from `.env`)
- `npm start` — start without nodemon

Frontend (`frontend/`):
- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

No test suite exists in either package yet.

## Database

MySQL via XAMPP. No migration files/ORM — schema is managed by hand (`database/` directory
holds hand-authored `.sql` snapshots for tables that aren't part of the original schema, e.g.
`tbl_enquiries.sql` — apply these by hand to any other environment, same as the rest of the
schema). Backend connects via a raw `mysql2/promise` pool (`backend/src/config/db.js`); all
queries are hand-written SQL in `*.service.js` files.

- **`tbl_schools`** — standard fields plus: `map_url`, `facebook`, `instagram`, `youtube`,
  `twitter`, `linkedin`, `hero_video_url`, `hero_video_title`, `logo_url`, `intro_message`,
  `theme` (one of `default`, `blue`, `green`, `purple`, `orange`, `dark`), `footer_bg_url`
  (optional faint background image behind the public Footer — set from admin Settings →
  Footer Background tab, wired end-to-end: upload route, `updateSchoolProfileService`
  allowlist, and `getPublicSchoolService`'s SELECT). There is also a `menu_image_url` column
  left over from an earlier full-screen "mega menu" nav design — that component
  (`MegaMenu.jsx`) no longer exists (Navbar now renders hover dropdowns directly, see
  Architecture → Frontend), so `menu_image_url` has no consumer anywhere in the current code.
  Treat it as dead/orphaned rather than wiring it up, unless a future design brings back a
  full-screen nav overlay.
- **`tbl_module_content`** — generic content store used by every module:
  `id | school_id | module_key | content (LONGTEXT, JSON) | is_published | created_at | updated_at`.
  See "Generic content system" below for the module keys in use.
- **`tbl_refresh_tokens`** — tracks issued refresh tokens (`admin_id` or `super_admin_id`,
  `expires_at`, `is_revoked`) so they can be revoked on logout.
- **`tbl_plans`** — free-form plan list the Super Admin fully designs from the Plans page
  (`name`, `tenure_years`, `storage_mb`, `price`, `description`, `features` JSON string[],
  `is_active`, `sort_order`) — create/edit/delete, any number of plans, arbitrary
  tenure/storage combos. Originally a fixed 3 (tenure_years: 1/2/3) × 3 (storage_mb:
  200/400/1024) grid seeded by `database/tbl_plans_and_billing.sql`; the free-form columns +
  dropping the `UNIQUE (tenure_years, storage_mb)` constraint are added by
  `database/tbl_plans_freeform.sql` (apply by hand, after the base script). `plans/` module
  now has full CRUD (`POST /`, `PATCH /:id` for any field, `DELETE /:id` — delete is blocked
  while any school or payment row still references the plan; deactivate instead). Consumed by
  School Admin `Billing.jsx` (flat plan-card list — pick one → Razorpay) and Super Admin
  `ManageSchools.jsx` "Assign Plan". There is no public marketing pricing page.
- **`tbl_payments`** — one row per Razorpay order (`school_id`, `plan_id`,
  `razorpay_order_id/payment_id/signature`, `status`: `created`/`paid`/`failed`), created by
  the `billing/` module when a school starts checkout.
- **`tbl_media_usage`** — append-only storage ledger, one row per Cloudinary upload
  (`school_id`, `module_key` nullable, `resource_type`, `file_size_bytes`,
  `cloudinary_public_id`). Backs both the storage-limit check and the dashboard usage
  breakdown. See "Plans & Billing" below — there's no reclaim on delete/replace yet.
- **`tbl_schools`** also has `plan_id` (FK → `tbl_plans`, nullable), `plan_start_date`,
  `plan_end_date`, and `storage_used_bytes` (denormalized running total, kept in sync with
  `tbl_media_usage` by `backend/src/utils/storage.utils.js#recordMediaUsage` so the usage bar
  is a cheap single-row read). `created_by` is nullable (self-signups have no creating Super
  Admin, unlike every prior school-creation path).

## Architecture

### Backend — modular, two-tier auth, one generic content API

`backend/src/modules/<name>/` each contain `*.routes.js` → `*.controller.js` → `*.service.js`.
Routes are wired centrally in `backend/src/routes/index.routes.js` (mounted under `/api`):
- `auth/` — login, logout, refresh
- `superAdmin/` — schools CRUD, dashboard stats, create school+admin
- `school/` — profile, settings, module selection, public school endpoint, logo upload, hero video upload
- `content/` — generic module content CRUD + file uploads (see below)

- **Auth**: `role` is either `super_admin` (table `tbl_super_admins`) or `admin` (table
  `tbl_admins`, scoped to a `school_id`). Login issues a short-lived JWT access token (returned
  in the response body) and a 7-day refresh token (set as an httpOnly cookie, tracked in
  `tbl_refresh_tokens` so it can be revoked). `backend/src/middlewares/auth.middleware.js`
  exports `protect` (verifies the `Authorization: Bearer` header), `isAdmin`, `isSuperAdmin`.
  Every protected router does `router.use(protect); router.use(isAdmin)` (or `isSuperAdmin`)
  before its route definitions — public endpoints must be declared *above* that line in the
  same router file.
- **Tenant scoping**: there is no shared tenant middleware — each admin-only controller reads
  `req.user.schoolId` (set from the JWT payload by `protect`) and passes it into the service
  layer as the scoping key. When adding a new admin endpoint, always scope queries by
  `req.user.schoolId`, never by a client-supplied school id.
- **Generic content system** (`content/` module): almost all page content — `home`, `about`,
  `fee`, `courses`, `faculty`, `infrastructure`, `sports`, `gallery`, `achievements`, `alumni`,
  `disclosure`, `tc` — is stored as JSON blobs in `tbl_module_content` keyed by `module_key`.
  One route family serves every module — **adding a new module never requires new backend
  routes/controllers**, only a new `module_key` and frontend pages:
  ```js
  router.get('/public/:schoolId/:moduleKey', getPublicModuleContent);
  router.use(protect); router.use(isAdmin);
  router.post('/upload-image', uploadContentImage.single('image'), uploadContentImageHandler);
  router.post('/upload-pdf', uploadPdf.single('pdf'), uploadPdfHandler);
  router.post('/upload-video', uploadVideo.single('video'), uploadVideoHandler);
  router.get('/:moduleKey', getModuleContent);
  router.post('/:moduleKey', saveModuleContent);
  router.patch('/:moduleKey/publish', togglePublish);
  ```
  Save and publish are intentionally separate operations with specific DB semantics — see the
  comments in `backend/src/modules/content/content.service.js`: `saveModuleContentService`
  never touches `is_published` (a prior bug reset/unpublished content on every save), and
  `togglePublishService` flips the flag server-side rather than trusting a client-sent boolean.
  Follow this pattern for any new content-mutating endpoint.
- **File uploads**: `backend/src/config/cloudinary.js` exports four preconfigured
  multer+Cloudinary uploaders with different folders/limits/resource types: `upload` (logos,
  2MB), `uploadContentImage` (5MB, resized to 1920px), `uploadPdf` (`resource_type: raw`,
  10MB), `uploadVideo` (`resource_type: video`, 50MB). Reuse these rather than configuring new
  multer storages.
- Response helpers: always respond via `sendSuccess`/`sendError` from
  `backend/src/utils/response.utils.js`, and throw `AppError` (`backend/src/utils/error.utils.js`)
  for expected/handled failures so `error.statusCode` propagates correctly.

### Frontend — React + Vite, module-driven admin, shared public components

- **`frontend/src/config/moduleRegistry.jsx`** is the single source of truth for which content
  modules exist, keyed by `key` (must exactly match the backend's `module_key` / `tbl_module_content`
  values — e.g. it's `disclosure`, not `publicDisclosure`). Adding a module means adding an
  entry here with `key`/`label`/`category`/`icon`. **Always check this file for the exact key
  name before writing any module code** — a mismatch causes the admin page to silently show a
  "Coming in Milestone 2" fallback UI instead of erroring.
- **Admin routing** (`App.jsx`): every module needs a route under `/admin/module/:key` — either
  a dedicated one (e.g. `module/about` → `AboutUs.jsx`) declared *before* the catch-all
  `module/:moduleKey` → `ModulePage.jsx`, **and** a matching entry in `modulePageMap` inside
  `frontend/src/pages/admin/ModulePage.jsx`. Missing either mapping causes the same silent
  fallback UI. Current dedicated routes/map cover: `home`, `about`, `fee`, `courses`, `faculty`,
  `infrastructure`, `sports`, `gallery`, `achievements`, `alumni`, `disclosure`, `tc`.
- **Public routing** (`App.jsx`): specific routes like `/school/:slug/about` must be declared
  before the generic `/school/:slug/:levelSlug` catch-all (`SchoolLevelPublic.jsx`), which
  otherwise intercepts them.
- **Shared public UI**: every public school page composes:
  - `components/public/Navbar.jsx` — props `{ school, slug, tc, scrollY, activeKey, forceSolid }`.
    Transparent → solid/blurred white on scroll (or always solid when `forceSolid` — used by
    pages like the announcement/event detail pages whose utility bar sits directly under the
    navbar with no dark hero to blend into); logo + school name left, top-level nav items right.
    **There is no separate full-screen mega menu overlay** — top-level items are either a plain
    link, a hover dropdown listing a group of links (some of which open a further nested flyout
    on hover, e.g. Courses/Infrastructure sub-levels), or a single top-level flyout (Sports). All
    of this is data-driven from `NAVBAR_ITEMS` in `constants/publicNav.js`, filtered per-school
    by `isModuleEnabled`/`selected_modules`.
  - `components/public/Footer.jsx` — props `{ school, slug, tc, bgImage }`. Fixed `#222831`
    background (independent of school theme for now) with an optional faint `bgImage` overlay
    (`school.footer_bg_url`, set from the admin Settings → Footer Background tab); logo (92px) +
    school name in Playfair Display; social icons (Facebook/Instagram/YouTube/Twitter/LinkedIn
    from `school.facebook/instagram/youtube/twitter/linkedin`); quick links grouped from
    `FOOTER_NAV_GROUPS`; contact section; map iframe with "Open in Maps ↗" pill; "Back to Top"
    button; copyright + "Powered by Web Builder Pro" bottom bar.

  `tc` (theme colors) comes from `getThemeColors(school.theme)` in `constants/publicNav.js`,
  returning `{ primary, secondary, light, dark }`. Usage pattern in every public page:
  ```jsx
  import Navbar from "../../components/public/Navbar";
  import Footer from "../../components/public/Footer";
  import { getThemeColors } from "../../constants/publicNav";

  const tc = getThemeColors(school.theme);
  <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="about" />
  {/* ... page content ... */}
  <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
  ```
  `constants/publicNav.js` defines `NAVBAR_ITEMS` (drives the Navbar's top-level items and their
  dropdowns/flyouts) and `FOOTER_NAV_GROUPS` (grouped quick links for the Footer) — update both
  when adding a public page that should appear in navigation. `NAVBAR_ITEMS` supports three
  shapes: a plain link (`{ key, label, path }`), a group dropdown (`{ label, links: [...] }`,
  where a link can carry static `subItems` or fetched `dynamicSubItems: 'courses' | 'infrastructure'`
  for a nested flyout), or a single top-level flyout (`{ key, label, path, subItems }`, used by
  Sports). See the file for the current full list (About Us / Academics / Sports / Gallery /
  News & Events / Admissions groups, plus the standalone Home and Mandatory Public Disclosure
  links).

- **Rich text**: content authored via `components/common/RichTextEditor.jsx` (wraps
  `react-quill-new`) is rendered on public pages with `dangerouslySetInnerHTML`. Any page doing
  this needs this CSS block (a common bug is font-size options silently not rendering because
  this block, or its `.ql-size-*` rules specifically, is missing):
  ```css
  .rte-content p { margin-bottom: 0.6em; }
  .rte-content p:last-child { margin-bottom: 0; }
  .rte-content strong { font-weight: 700; }
  .rte-content em { font-style: italic; }
  .rte-content u { text-decoration: underline; }
  .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
  .rte-content .ql-size-small { font-size: 0.75em; }
  .rte-content .ql-size-large { font-size: 1.5em; }
  .rte-content .ql-size-huge { font-size: 2.5em; }
  ```
- **Standard public page anatomy**: `<Navbar />` → hero section (90vh parallax
  or 60vh gradient, depending on page) → content sections wrapped in `Reveal`
  (IntersectionObserver fade+slide-up) → optional footer CTA section (most pages keep it; Alumni
  removed it) → `<Footer />`.
- **Standard admin page anatomy**: dark gradient hero header
  (`linear-gradient(135deg, #2d0a1a, #4a1030, #2d0520)`) with title, description,
  Published/Draft badge, Save Draft + Publish/Unpublish buttons → white card sections
  (`border: 0.5px solid #f1f5f9`, `border-radius: 16px`, subtle shadow) → bottom save bar
  duplicating Save Draft / Publish.
- **Auth**: `frontend/src/config/axios.js` is a single axios instance — access token read from
  `localStorage` and attached as `Authorization: Bearer`; a response interceptor auto-refreshes
  once via `/api/auth/refresh` (which relies on the httpOnly refresh cookie sent via
  `withCredentials`) and retries the original request on 401, redirecting to `/login` if refresh
  also fails. `store/authStore.js` (Zustand + persist) mirrors auth state and also writes the
  token to `localStorage`. Don't introduce a second axios instance or a second place that reads
  the token — route all API calls through this instance. (Note: an older project note claimed
  `sessionStorage` is used for per-tab isolation between Super Admin/School Admin logins — the
  current code actually uses `localStorage` in both `axios.js` and `authStore.js`. Trust the
  code over that note; if per-tab isolation is still a real requirement, it isn't implemented
  yet.)
- **API layer**: `frontend/src/api/*.api.js` (one file per backend module: `auth`, `school`,
  `superAdmin`, `content`) wraps axios calls — add new endpoints there rather than calling
  `axiosInstance` directly from components/pages. `content.api.js` exports
  `getModuleContentApi`, `saveModuleContentApi`, `togglePublishApi`, `getPublicModuleContentApi`,
  `uploadContentImageApi`, `uploadPdfApi`, `uploadVideoFileApi`.

## Modules built so far

| # | Module key | Admin file | Public file | Notes |
|---|-----------|-----------|-------------|-------|
| 1 | `home` | `HomePage.jsx` | part of `SchoolWebsite.jsx` | Hero, About, Stats, Highlights |
| 2 | `about` | `AboutUs.jsx` | `AboutUsPublic.jsx` | Vision/Mission ticker, History, Leadership Message, Core Values, Gallery |
| 3 | `fee` | `FeeStructure.jsx` | `FeeStructurePublic.jsx` | Class-wise dynamic fee table |
| 4 | `courses` | `Courses.jsx` | `CoursesPublic.jsx` + `SchoolLevelPublic.jsx` | 5 fixed school levels (Pre Primary, Primary, Middle, High, Senior) |
| 5 | `faculty` | `Faculty.jsx` | `FacultyPublic.jsx` | Grouped by level, 4-card carousel, rotating banner |
| 6 | `infrastructure` | `Infrastructure.jsx` | `InfrastructurePublic.jsx` | Custom categories with sidebar switcher |
| 7 | `sports` | `Sports.jsx` | `SportsPublic.jsx` | 4 sub-pages, events, certifications, "Making Us Proud", yearly award PDFs |
| 8 | `gallery` | `Gallery.jsx` | `GalleryPublic.jsx` | Nested folder trees (photo + video), lightbox, YouTube + file upload |
| 9 | `achievements` | `Achievements.jsx` | `AchievementsPublic.jsx` | Parallax hero, entry cards, certification modals |
| 10 | `alumni` | `Alumni.jsx` | `AlumniPublic.jsx` | See below |
| 11 | `disclosure` | `PublicDisclosure.jsx` | `PublicDisclosurePublic.jsx` | See below |
| 12 | `tc` | `TCInformation.jsx` | `TCInformationPublic.jsx` | See below |
| 13 | `announcements` | `Announcements.jsx` | `AnnouncementsPublic.jsx` + `AnnouncementDetailPublic.jsx` | Milestone 3, first dynamic module. See below |
| 14 | `events` | `Events.jsx` | `EventsPublic.jsx` + `EventDetailPublic.jsx` | Card grid + Upcoming/Past tabs. See below |
| 15 | `calendar` | `Calendar.jsx` | `CalendarPublic.jsx` | Month-grid academic calendar. See below |
| 16 | `circulars` | `Circulars.jsx` | `CircularsPublic.jsx` + `CircularDetailPublic.jsx` | Document-style list, PDF/link download. See below |
| 17 | `admission` | `AdmissionEnquiry.jsx` | `AdmissionEnquiryPublic.jsx` | Public form → admin inbox. See below |
| 18 | `career` | `CareerEnquiry.jsx` | `CareerEnquiryPublic.jsx` | Public form → admin inbox. See below |

All of Milestone 3 (dynamic modules) is now built.

### Alumni (key: `alumni`)
**Admin fields**: banner image, heading, description (RTE), repeatable alumni entries — photo
upload, name, batch year, achievement headline (bold line, e.g. "Currently at SRCC, cleared CA
Foundation"), testimonial (paragraph), LinkedIn URL (optional).

**Public page design**: 90vh parallax hero banner, Playfair Display heading. Vertical list
layout (not a grid) — each entry is a polaroid-style photo with shadow and a subtle per-index
tilt (`rotate(±2.5° to ±4.5deg)`); hover straightens the tilt and zooms the image. Photo
alternates left/right on odd/even entries for visual rhythm. Initials-based avatar fallback
(theme-gradient background + white initials) when no photo is set. Ornamental SVG divider
between every entry (arrow-tipped lines + 4 interlocking circles knot at center). No "Back to
Home" CTA section and no batch-year filter pills — both were tried and removed per client
request.

### Public Disclosure (key: `disclosure`)
**Critical**: `moduleRegistry.jsx` uses key `disclosure`, **not** `publicDisclosure`. Every
file — admin page, public page, `App.jsx`, `ModulePage.jsx`, `publicNav.js` — must use
`disclosure` for the module-content key (`publicNav.js`'s `DISCLOSURE_LINK` nav item also
uses `key: 'disclosure'` now, so there's no longer a second `publicDisclosure` string to
confuse it with — both are consolidated to `disclosure`).

**Admin structure**: heading, description (RTE), flexible categories (add/remove/rename). Each
category has a type toggle: `info` (label + text details) or `documents` (label + PDF upload
OR link URL OR description text — any/all three optional). Default 3 categories: "General
Information" (info type), "Documents and Information" (documents type), "Result and Academics"
(documents type). "+ Add Category" button for custom categories.

**Public page**: 60vh gradient hero (no photo banner). Each category renders as a
gradient-header card with document/info rows inside. Document rows show a PDF link ("View
Document") if `pdfUrl` exists, else a plain link if `linkUrl`, else text if `description` —
whichever is filled (filter: `r.label && (r.pdfUrl || r.linkUrl || r.description)`). Hover on
rows: `translateX(4px)` slide effect.

### TC Information (key: `tc`)
**Admin structure**: heading, description (RTE), session-based records. Session tabs (e.g.
"2022-23", "2023-24") with create/delete. Per session: bulk CSV upload (browser-parsed, no
library) OR individual "+ Add One". CSV columns: `TC_No, Student_Name, Class, PDF_URL` (flexible
— multiple column-name variants accepted). Records table is searchable, with inline edit and
per-row delete.

**Public page** (no banner): clean `#f8fafc` background, Playfair Display heading. Step 1:
session selection — cards grid showing each session's name and record count. Step 2: form — TC
No + Student Name (required) + Class (optional), "Search My TC" button. Found: detail card +
"Download TC" button (opens PDF link in new tab). Not found: tips list + school contact info.
"← Back" to change session, "Try Again"/"Change Session" buttons in the result view.

A major TC upgrade is planned (separate feature spec ready, not yet implemented): Excel upload
via SheetJS (`xlsx`, already a frontend dependency) instead of CSV; auto-detect TC format from
filename (`cbse_*.xlsx` → CBSE, `state_*.xlsx` → State Board, `icse_*.xlsx` → ICSE, other →
Default); a `frontend/src/utils/TCTemplates.js` utility with format generators (file already
exists as a stub); on-the-fly TC PDF generation via the browser print dialog (no extra library).

### Announcements & News (key: `announcements`)
First Milestone 3 module — reuses the existing generic `content/` module system as-is (no new
backend needed), same pattern as the Milestone 2 static pages: `heading`/`description` at the
top, plus a repeatable `announcements` array.

**Admin structure**: heading, description (RTE), "+ Add Announcement" prepends a new entry.
Each entry: optional image, title, date, tag (`General`/`Urgent`/`Event`/`Holiday`/`Exam
Notice` — color-coded on the public page), RTE body, "Pin to top" checkbox. No manual reorder —
display order on the public page is always computed (pinned first, then date descending), so
admin-side ordering doesn't matter.

**Public page**: no banner, clean gradient hero (same recipe as About Us/Disclosure). Cards
list with a date-badge tile on the left (day/month/year) and tag pill + title + RTE body +
optional image on the right; pinned entries get a highlighted border and a "📌 Pinned" label.

This module was the template for the other Milestone 3 content-style modules (Events &
Activities, Circulars) — same date + tag + repeatable-entry shape, reusing the generic content
system. Both the announcement and event detail pages use `forceSolid` on `Navbar` (see
Architecture → Frontend) since their utility bar sits directly under the fixed navbar with no
dark hero for a transparent navbar to blend into.

Date/time formatting for all four date-driven Milestone 3 modules (`announcements`, `events`,
`calendar`, `circulars`) is centralized in `frontend/src/utils/dateTimeFormat.js`
(`formatDate`, `formatTime`, `relativeLabel`, `shortDate`, `parseDate`, `toDateKey`, `stripHtml`,
`readingTime`) — see the non-breaking-hyphen note under Known bugs before duplicating any of this
logic in a new module.

### Events & Activities (key: `events`)
**Admin structure**: heading, description (RTE), repeatable event entries — image (optional),
title, date, time, venue (optional text), tag (`Cultural`/`Sports`/`Academic`/`Workshop`/
`Competition`/`Celebration`), RTE body. No "pinned" concept — Upcoming vs Past is always computed
from `date` vs today, both on the list page and the detail page's badge.

**Public page**: same clean gradient header as Announcements, then an Upcoming/Past segmented
tab control (counts shown per tab), then a responsive card grid (`EventCard`) — image or
tag-tinted gradient placeholder with a calendar icon, a white date-badge chip overlaid top-left,
tag pill top-right, title, venue, 2-line body preview. Upcoming sorted soonest-first, Past
sorted most-recent-first. Click → `EventDetailPublic.jsx` (mirrors `AnnouncementDetailPublic.jsx`
— white card, framed/contained image capped at 380px tall via `object-fit: contain` inside a
`#f8fafc` box so full-width never means "cropped" or "huge", meta row with date/time/venue/read
time, Upcoming/Past badge).

### Event Calendar (key: `calendar`)
**Admin structure**: heading, description (RTE), a flat repeatable list of dated items — title,
date, category (`Holiday`/`Exam`/`PTM`/`Event`/`Other`, color-coded), optional plain-text note.
Simpler than Announcements/Events: no image, no RTE body, no image upload — just a compact table
of rows (date/title/category/note per row) sorted by date for editing.

**Public page**: a month-grid calendar (`buildMonthGrid` in `CalendarPublic.jsx`, Sunday-start
week) with prev/next navigation, today highlighted with a ring, up to 3 colored category dots per
day (native `title` tooltip lists that day's entry titles), a color legend, and — since a bare
dot grid isn't very informative on its own — a full sorted list of the *currently viewed month's*
entries underneath (date badge, category dot, title, note, category pill).

### Circulars (key: `circulars`)
**Admin structure**: heading, description (RTE), repeatable circular entries — title, date, tag
(`Academic`/`Administrative`/`Fee`/`Exam`/`Holiday`/`General`), PDF upload (`uploadPdfApi`) *or*
a link URL (either/both optional), optional RTE note.

**Public page**: inbox-row list identical in spirit to Announcements' inbox (date + 📄 icon +
tag + title + note preview + chevron), click → `CircularDetailPublic.jsx` with a prominent
gradient "⬇ Download Circular" (if `pdfUrl`) or "View Circular" (if only `linkUrl`) button above
the note; if neither is set, shows "No document has been attached yet" instead of a dead button.

### Admission Enquiry & Career Enquiry (keys: `admission`, `career`)
Different in kind from every other module — these are **public form submissions read by admin**,
not admin-authored content, so they do **not** use the generic `content/` system or the
save/publish lifecycle at all.

**New backend module**: `backend/src/modules/enquiry/` (routes/controller/service, same shape as
`content/`) backed by `tbl_enquiries` (schema in `database/tbl_enquiries.sql` — **apply this by
hand to any other environment**, e.g. production, the same way the rest of the schema is
hand-managed). One table serves both enquiry types via an `enquiry_type` ENUM column; rows also
carry a `uuid` (project convention for any admin-facing entity id, matching `tbl_schools` /
`tbl_admins` — see `superAdmin.service.js`) and an `extra_data` JSON column for type-specific
fields (`studentName`/`classApplying` for admission, `position`/`resumeUrl` for career).
`POST /api/enquiry/public/:schoolId` is public (no auth); `GET /:type`, `PATCH /:uuid/status`,
`DELETE /:uuid` are `protect`+`isAdmin` and always scoped by `req.user.schoolId`, same pattern as
every other admin-only endpoint in this codebase.

**Admin UI**: both `AdmissionEnquiry.jsx` and `CareerEnquiry.jsx` are thin wrappers around one
shared `frontend/src/components/admin/EnquiryList.jsx` (inbox-style rows, New/Contacted/Closed
status dropdown, delete, expandable row for the message + extra fields) configured with a
different `type` and `extraFields` — add a new enquiry-style module by adding another thin
wrapper rather than duplicating the list UI.

**Public UI**: two standalone form pages (no shared list/detail split since there's nothing to
browse) — `AdmissionEnquiryPublic.jsx` and `CareerEnquiryPublic.jsx`, both posting through
`frontend/src/api/enquiry.api.js` (`submitEnquiryApi`). Career's form uploads a resume PDF via
the existing `uploadPdfApi` (same Cloudinary uploader `content/` already uses) before submit.
Both show an inline success state ("Enquiry Submitted!" / "Application Submitted!") with a
"Submit Another" reset rather than navigating away.

**Nav placement**: both live under a new "Admissions" `NAVBAR_ITEMS` group (see below) rather
than as flat top-level items — the navbar was already at capacity (see Known bugs) and grouping
keeps room for future modules.

### Plans & Billing (self-signup → approval → forced billing)

Different in kind from every content module — this is the platform's commercial/onboarding
flow, spanning four new backend modules plus a login-time gate, not the generic `content/`
system.

**Flow**: `/signup` (public, `Signup.jsx` → `POST /api/signup`) collects school + admin details
only — **no plan/payment at signup**. This creates the school as `status='pending'`
(`tbl_schools.status` — the existing `active|suspended|pending` ENUM is reused as the approval
gate, no new column) and fires a "request received" email via `backend/src/config/mailer.js`.
`auth.service.js`'s login check rejects `status === 'pending'` explicitly. Super Admin sees
pending requests as a "Pending" filter + Approve/Reject/Assign Plan actions bolted onto the
existing `ManageSchools.jsx` (not a separate page) — Approve flips `status` to `active` and
fires a second "you're approved" email; Reject reuses `status='suspended'`. On first login after
approval, `AdminLayout.jsx`'s `fetchModules()` effect (which already calls
`getSelectedModulesApi` on every route change for the `is_first_login` → `/admin/modules/select`
gate) also reads a new `hasActivePlan` field from that same response and force-redirects to
`/admin/billing` (`Billing.jsx`) if `plan_id IS NULL` — checked *before* the module-selection
gate. `Billing.jsx` is a flat list of plan cards (name, tenure, storage, price, features) —
pick one → Razorpay Checkout.js; `POST /api/billing/create-order` then
`/api/billing/verify-payment` (HMAC signature check) sets `plan_id`/`plan_start_date`/
`plan_end_date` (`plan_end_date` = start + the plan's `tenure_years`), which flips
`hasActivePlan` true and unlocks the rest of the admin panel.

**Pricing**: the Super Admin designs a free-form set of plans from `Plans.jsx` (name, tenure
years, storage MB/GB, ₹ price, description, features bullet list, active toggle, display
order) — see `tbl_plans` under Database. Not negotiated per school. All website modules are
included in every plan; plans differ by tenure, storage cap, price, and whatever the
`features` list says.

**Storage enforcement**: `backend/src/utils/storage.utils.js` exports `checkStorageLimitMiddleware`
(pre-check using the `Content-Length` header, wired in front of every upload route in both
`content/` and `school/`) and `recordMediaUsage` (called after a successful upload, in every
upload handler — inserts into `tbl_media_usage` and bumps `tbl_schools.storage_used_bytes`).
Cloudinary uploads are segregated per-school (`backend/src/config/cloudinary.js`'s `folder`
params are now `(req) => ...school-${req.user.schoolId}` instead of static strings) so
Cloudinary's own usage stats could be cross-checked against the ledger later if needed.
`GET /api/school/storage-usage` feeds `components/admin/StorageUsageBar.jsx` (dropped into the
School Admin `Dashboard.jsx`) — overall used/limit bar plus a per-`module_key` breakdown.
**Known gap**: there's no reclaim/decrement when content is edited/replaced — the ledger only
grows, since no code path anywhere deletes the old Cloudinary asset on replace (pre-existing gap,
not introduced by this feature). A school with no `plan_id` is treated as storage-unlimited by
`checkStorageLimit` — in practice this can't happen for real uploads since a school can't reach
any content page without an active plan (see the `AdminLayout` gate above); it only matters for
the handful of pre-existing schools created before this feature shipped (see backlog below).

**Backfilling pre-existing schools**: every school created before this feature has `plan_id
NULL`, so the `hasActivePlan` gate in `AdminLayout.jsx` applies to them too — without action,
their next login force-redirects into `/admin/billing` same as a fresh approval. Run the Super
Admin "Assign Plan" action (same button used for approvals, in `ManageSchools.jsx`) against each
pre-existing school once, before/at rollout, so no currently-working admin gets unexpectedly
routed into a forced checkout. See Outstanding backlog.

## Known bugs / non-bugs

- **Cloudinary `Request Timeout` / `http_code 499`** on upload — a network issue, not a code
  bug. Known fix: switch to mobile hotspot.
- **RTE font sizes not rendering on public pages** — always trace back to the `.rte-content` CSS
  block above being missing, or missing its `.ql-size-*` rules specifically. Check on every new
  public page that uses `dangerouslySetInnerHTML`.
- **Save silently unpublishing content** — historical bug, now fixed by design:
  `saveModuleContentService` must never write `is_published`, and `togglePublishService` must
  compute the new value server-side rather than trust the client. See Architecture → Backend.
- **Module admin page shows "Coming in Milestone 2" instead of the real form** — always a
  `module_key` mismatch between `moduleRegistry.jsx`, the `App.jsx` route, and
  `modulePageMap` in `ModulePage.jsx`. Fails silently with no console error, so check all three
  by hand.
- **Dates silently fail to parse / render as `--`** — `saveModuleContentApi` runs
  `noBreakHyphensDeep()` on all saved content (`frontend/src/api/content.api.js`), which replaces
  plain hyphens with non-breaking hyphens (U+2011) *everywhere in the JSON*, including inside
  `YYYY-MM-DD` date strings. `new Date("2026‑07‑28")` silently returns `Invalid Date`. Always
  parse dates through `frontend/src/utils/dateTimeFormat.js` (`parseDate`/`formatDate`/etc, which
  normalize dashes first) rather than calling `new Date(...)` directly on stored date fields.
- **Navbar items wrapping to two lines / overflowing at laptop widths (~1280–1366px)** — the
  navbar (`components/public/Navbar.jsx`) has no responsive breakpoint/hamburger yet, so it's
  purely a matter of the top-level `NAVBAR_ITEMS` list fitting in one line at these widths.
  Already tuned once (tighter `gap`, `letterSpacing`, `whiteSpace: nowrap` on every label, school
  name ellipsizes via `overflow:hidden`/`minWidth:0`) to fit 8 top-level items down to 1280px.
  Adding another flat top-level item will likely break this again — prefer folding new nav links
  into an existing group (`About Us`/`Academics`/`Gallery`/`News & Events`/`Admissions`) or
  creating a new group rather than a new flat `{ key, label, path }` entry.

## Outstanding backlog

- **Milestone 3 dynamic modules — done**: all six (`announcements`, `events`, `calendar`,
  `circulars`, `admission`, `career`) are built — see Modules built so far.
- **`database/tbl_enquiries.sql` not yet applied outside local dev** — remember to run it by hand
  against any other environment (staging/production) before the Admission/Career Enquiry
  modules will work there; the rest of the schema is hand-managed the same way.
- **TC Generation System upgrade** (planned, spec ready) — see TC Information section above.
- **Plans & Billing — built, not yet fully rolled out**: see the Plans & Billing section above.
  Remaining before this is live in production:
  - Apply `database/tbl_plans_and_billing.sql` **then** `database/tbl_plans_freeform.sql` to
    any other environment (same hand-applied convention as the rest of the schema).
  - Set real `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (currently blank in `.env.example`) —
    `billing/` gracefully 503s with "Payments aren't configured yet" until these are set, it
    doesn't crash the server.
  - Build the real plans (name / tenure / storage / ₹ price / features) from the Super Admin
    Plans page — the originally-seeded 9 rows are at ₹0 and can be edited or deleted.
  - Run "Assign Plan" against every pre-existing school once, before real admins hit the new
    `hasActivePlan` login gate (see Backfilling note above).
  - Not built yet: plan expiry/renewal enforcement (`plan_end_date` is stored but nothing
    blocks access once it lapses), storage reclaim on content replace/delete, and a rejection
    email (only the signup-received and approval emails are wired).

## Working style / communication notes

- Mudit communicates in Hinglish; respond in Hinglish with code comments/identifiers in
  English.
- Prefers **complete file outputs** over partial diffs for substantial changes, and often asks
  for "the full updated file" after several incremental edits.
- Cost/scale-conscious: give brief, practical explanations of why something is safe at current
  scale (a handful of schools) rather than over-engineering for scale that doesn't exist yet.
- Confirm structural/scope decisions with a quick multiple-choice question before building a
  large new module, but don't over-ask — use sensible defaults for small details.
