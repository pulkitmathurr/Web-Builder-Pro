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
exists but is currently empty). Backend connects via a raw `mysql2/promise` pool
(`backend/src/config/db.js`); all queries are hand-written SQL in `*.service.js` files.

- **`tbl_schools`** — standard fields plus: `map_url`, `facebook`, `instagram`, `youtube`,
  `twitter`, `linkedin`, `hero_video_url`, `hero_video_title`, `logo_url`, `intro_message`,
  `theme` (one of `default`, `blue`, `green`, `purple`, `orange`, `dark`). Also needs
  `menu_image_url` (MegaMenu background) and `footer_bg_url` (Footer background) — these are
  already consumed by the shared public components but are **not yet exposed on the admin
  Settings page** (see Outstanding Backlog).
- **`tbl_module_content`** — generic content store used by every module:
  `id | school_id | module_key | content (LONGTEXT, JSON) | is_published | created_at | updated_at`.
  See "Generic content system" below for the module keys in use.
- **`tbl_refresh_tokens`** — tracks issued refresh tokens (`admin_id` or `super_admin_id`,
  `expires_at`, `is_revoked`) so they can be revoked on logout.

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
  - `components/public/Navbar.jsx` — props `{ school, slug, tc, scrollY, onMenuOpen }`.
    Transparent → solid white on scroll; logo + school name left, hamburger right.
  - `components/public/MegaMenu.jsx` — props `{ open, onClose, school, slug, tc, activeKey, menuImage }`.
    Full-screen overlay, accordion groups, optional `menuImage` background, `activeKey`
    highlights the current page's link.
  - `components/public/Footer.jsx` — props `{ school, slug, tc, bgImage }`. Fixed `#222831`
    background (independent of school theme for now); logo (92px) + school name in Playfair
    Display; social icons (Facebook/Instagram/YouTube/Twitter/LinkedIn from
    `school.facebook/instagram/youtube/twitter/linkedin`); quick links in 2 columns (split from
    `PUBLIC_NAV_LINKS`); contact section; map iframe with "Open in Maps ↗" pill; "Back to Top"
    button; copyright + "Powered by Web Builder Pro" bottom bar.

  `tc` (theme colors) comes from `getThemeColors(school.theme)` in `constants/publicNav.js`,
  returning `{ primary, secondary, light, dark }`. Usage pattern in every public page:
  ```jsx
  import Navbar from "../../components/public/Navbar";
  import MegaMenu from "../../components/public/MegaMenu";
  import Footer from "../../components/public/Footer";
  import { getThemeColors } from "../../constants/publicNav";

  const tc = getThemeColors(school.theme);
  <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} onMenuOpen={() => setMenuOpen(true)} />
  <MegaMenu open={menuOpen} onClose={() => setMenuOpen(false)} school={school} slug={slug} tc={tc} activeKey="about" menuImage={school.menu_image_url} />
  {/* ... page content ... */}
  <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
  ```
  `constants/publicNav.js` also defines `PUBLIC_NAV_GROUPS` (MegaMenu accordion, 3 groups) and
  `PUBLIC_NAV_LINKS` (flat list for Footer quick links) — update both when adding a public page
  that should appear in navigation. Current shape:
  ```js
  // PUBLIC_NAV_GROUPS:
  [
    { label: 'About', links: [
      { key: 'about', label: 'About Us', path: (slug) => `/school/${slug}/about` },
      { key: 'faculty', label: 'Faculty', path: (slug) => `/school/${slug}/faculty` },
      { key: 'infrastructure', label: 'Infrastructure', path: (slug) => `/school/${slug}/infrastructure` },
      { key: 'alumni', label: 'Alumni', path: (slug) => `/school/${slug}/alumni` },
      { key: 'tc', label: 'TC Information', path: (slug) => `/school/${slug}/tc` },
    ]},
    { label: 'Academics', links: [
      { key: 'courses', label: 'Courses', path: (slug) => `/school/${slug}/courses` },
      { key: 'fee', label: 'Fee Structure', path: (slug) => `/school/${slug}/fee` },
      { key: 'publicDisclosure', label: 'Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` },
    ]},
    { label: 'Highlights', links: [
      { key: 'sports', label: 'Sports', path: (slug) => `/school/${slug}/sports` },
      { key: 'gallery', label: 'Gallery', path: (slug) => `/school/${slug}/gallery/photo` },
      { key: 'achievements', label: 'Achievements', path: (slug) => `/school/${slug}/achievements` },
    ]},
  ]
  ```
  (Note the `publicDisclosure` link `key` here is just a nav-item id, unrelated to the
  `disclosure` module-content key — don't confuse the two.)

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
- **Standard public page anatomy**: `<Navbar />` → `<MegaMenu />` → hero section (90vh parallax
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
| 4 | `courses` | `Courses.jsx` | `CoursesPublic.jsx` + `SchoolLevelPublic.jsx` | 4 fixed school levels |
| 5 | `faculty` | `Faculty.jsx` | `FacultyPublic.jsx` | Grouped by level, 4-card carousel, rotating banner |
| 6 | `infrastructure` | `Infrastructure.jsx` | `InfrastructurePublic.jsx` | Custom categories with sidebar switcher |
| 7 | `sports` | `Sports.jsx` | `SportsPublic.jsx` | 4 sub-pages, events, certifications, "Making Us Proud", yearly award PDFs |
| 8 | `gallery` | `Gallery.jsx` | `GalleryPublic.jsx` | Nested folder trees (photo + video), lightbox, YouTube + file upload |
| 9 | `achievements` | `Achievements.jsx` | `AchievementsPublic.jsx` | Parallax hero, entry cards, certification modals |
| 10 | `alumni` | `Alumni.jsx` | `AlumniPublic.jsx` | See below |
| 11 | `disclosure` | `PublicDisclosure.jsx` | `PublicDisclosurePublic.jsx` | See below |
| 12 | `tc` | `TCInformation.jsx` | `TCInformationPublic.jsx` | See below |

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
`disclosure` for the module-content key (the `publicDisclosure` string only appears as an
unrelated nav-link `key` in `PUBLIC_NAV_GROUPS`, see above).

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

## Outstanding backlog

- **Dynamic modules not yet started**: Events & Activities, Announcements, Circulars, Admission
  Enquiry, Career Enquiry (already have registry entries under the `dynamic` category in
  `moduleRegistry.jsx`, but no admin/public pages). These will need date-based listing/filtering
  UI patterns not yet established elsewhere in the codebase.
- **Settings admin gap**: `menu_image_url` and `footer_bg_url` upload fields need to be added to
  the admin Settings page so school admins can actually set the MegaMenu/Footer background
  images the shared public components already support.
- **TC Generation System upgrade** (planned, spec ready) — see TC Information section above.

## Working style / communication notes

- Mudit communicates in Hinglish; respond in Hinglish with code comments/identifiers in
  English.
- Prefers **complete file outputs** over partial diffs for substantial changes, and often asks
  for "the full updated file" after several incremental edits.
- Cost/scale-conscious: give brief, practical explanations of why something is safe at current
  scale (a handful of schools) rather than over-engineering for scale that doesn't exist yet.
- Confirm structural/scope decisions with a quick multiple-choice question before building a
  large new module, but don't over-ask — use sensible defaults for small details.
