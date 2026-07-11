# Web Builder Pro — School Website SaaS Platform — Project Context

> **How to use this file:** Upload this file at the start of a new Claude chat, then say
> "This is my project context, please read it" before continuing work. This gives Claude
> full context without needing the entire old conversation history.

---

## 1. Project Overview

A **multi-tenant School Website SaaS platform** called "Web Builder Pro". Each school gets:
1. A **Super Admin Panel** (platform owner manages all schools)
2. A **School Admin Panel** (each school manages its own content)
3. A **Public-facing school website** (parents/students view content)

**Developer:** Mudit, freelance full-stack developer based in India, working solo on this client project.

---

## 2. Tech Stack

- **Backend:** Node.js + Express, MySQL (XAMPP local dev)
- **Frontend:** React + Vite, Tailwind CSS v4, Zustand (state), Axios
- **Auth:** JWT via HttpOnly cookies + refresh tokens; `sessionStorage` used per-tab so Super Admin and School Admin can be logged in simultaneously in different tabs
- **File storage:** Cloudinary (images, videos, PDFs)
- **Rich text:** `react-quill-new` via a custom `RichTextEditor` component
- **Image cropping:** `react-image-crop` via a custom `ImageCropModal` component

**Local paths:**
- Project root: `C:\Users\mudit\Desktop\school-saas\`
- Backend runs on `http://localhost:5000`
- Frontend (Vite) runs on `http://localhost:5173`
- Public site example: `http://localhost:5173/school/st-marys-convent-school`

**Dev credentials:**
- Super Admin: `admin@schoolsaas.com` / `admin123`
- School Admin: `rajesh@stmarys.com` / `admin123`
- DB name: `db_school_saas`

---

## 3. Database

### `tbl_schools`
Standard fields plus: `map_url`, `facebook`, `instagram`, `youtube`, `twitter`, `linkedin`,
`hero_video_url`, `hero_video_title`, `logo_url`, `intro_message`, `theme` (one of:
`default`, `blue`, `green`, `purple`, `orange`, `dark`).

Also needs: `menu_image_url` (for MegaMenu background image) and `footer_bg_url` (for Footer
background image) — these fields are used by the shared public components but may not yet be
added via the admin Settings page.

### `tbl_module_content`
Generic content store used by every module:
```
id | school_id | module_key | content (LONGTEXT, JSON) | is_published | created_at | updated_at
```
Module keys in use: `home`, `about`, `fee`, `courses`, `faculty`, `infrastructure`, `sports`,
`gallery`, `achievements`, `alumni`, `disclosure`, `tc`.

No new backend code is ever needed for a new module — the same generic API
(`/api/content/:moduleKey`) handles any key. This is intentional.

---

## 4. Backend Structure

`backend/src/modules/`:
- `auth/` — login, logout, refresh
- `superAdmin/` — schools CRUD, dashboard stats, create school+admin
- `school/` — profile, settings, modules, public endpoint, logo upload, video upload
- `content/` — generic module content CRUD + file uploads

### Key files
- `src/routes/index.routes.js` — registers all route groups
- `src/modules/content/content.service.js` — getModuleContent, saveModuleContent, togglePublish, getPublicModuleContent
- `src/modules/content/content.routes.js`:
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
- `src/config/cloudinary.js` — exports `upload` (logos, 2MB), `uploadContentImage` (5MB,
  1920px), `uploadPdf` (raw resource_type, 10MB), `uploadVideo` (video resource_type, 50MB)

### Known recurring issue
Cloudinary uploads sometimes fail with `Request Timeout / http_code 499` — not a code bug.
Fix: switch to mobile hotspot.

---

## 5. Frontend Structure

`frontend/src/`:
- `api/content.api.js` — `getModuleContentApi`, `saveModuleContentApi`, `togglePublishApi`,
  `getPublicModuleContentApi`, `uploadContentImageApi`, `uploadPdfApi`, `uploadVideoFileApi`
- `api/school.api.js`, `auth.api.js`, `superAdmin.api.js`
- `config/axios.js` — uses `sessionStorage` (tab isolation)
- `store/authStore.js` — Zustand + persist (sessionStorage)
- `components/common/ProtectedRoute.jsx`, `RichTextEditor.jsx`, `ImageCropModal.jsx`
- `layouts/SuperAdminLayout.jsx`, `layouts/AdminLayout.jsx`

### Shared Public Components (NEW — Milestone 2)
All public pages now import from these shared components instead of duplicating navbar/menu/footer:

- **`frontend/src/constants/publicNav.js`** — exports:
  - `getThemeColors(theme)` — returns `{ primary, secondary, light, dark }` for the given theme key
  - `PUBLIC_NAV_GROUPS` — accordion menu structure (3 groups: About, Academics, Highlights), each with `links[]` array
  - `PUBLIC_NAV_LINKS` — flat list for Footer quick links (all links as `{ key, label, path: (slug) => string }`)

- **`frontend/src/components/public/Navbar.jsx`** — props: `{ school, slug, tc, scrollY, onMenuOpen }`. Transparent → solid white on scroll. Logo + school name left, hamburger right.

- **`frontend/src/components/public/MegaMenu.jsx`** — props: `{ open, onClose, school, slug, tc, activeKey, menuImage }`. Full-screen overlay, accordion groups, optional `menuImage` background, `activeKey` highlights current page link.

- **`frontend/src/components/public/Footer.jsx`** — props: `{ school, slug, tc, bgImage }`.
  - Fixed `#222831` background (grey/blue, independent of school theme for now)
  - Logo (92px), school name in Playfair Display
  - Social media icons: Facebook, Instagram, YouTube, Twitter, LinkedIn (from `school.facebook/instagram/youtube/twitter/linkedin`)
  - Quick links in **2 columns** (split from `PUBLIC_NAV_LINKS`)
  - Contact section (address, phone, email)
  - **Map iframe** ("Our Location" section) with "Open in Maps ↗" overlay pill
  - **Back to Top** button (bordered, with up-arrow icon)
  - Bottom bar: copyright + "Powered by Web Builder Pro"

### Usage pattern in every public page:
```jsx
import Navbar from "../../components/public/Navbar";
import MegaMenu from "../../components/public/MegaMenu";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

const tc = getThemeColors(school.theme);
// ... in JSX:
<Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} onMenuOpen={() => setMenuOpen(true)} />
<MegaMenu open={menuOpen} onClose={() => setMenuOpen(false)} school={school} slug={slug} tc={tc} activeKey="about" menuImage={school.menu_image_url} />
// ... page content ...
<Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
```

### Admin pages built (`src/pages/admin/modules/`)
`HomePage.jsx`, `AboutUs.jsx`, `FeeStructure.jsx`, `Courses.jsx`, `Faculty.jsx`,
`Infrastructure.jsx`, `Sports.jsx`, `Gallery.jsx`, `Achievements.jsx`,
`Alumni.jsx`, `PublicDisclosure.jsx`, `TCInformation.jsx`

### Public pages built (`src/pages/school/`)
`SchoolWebsite.jsx`, `AboutUsPublic.jsx`, `FeeStructurePublic.jsx`, `CoursesPublic.jsx`,
`FacultyPublic.jsx`, `SchoolLevelPublic.jsx`, `InfrastructurePublic.jsx`, `SportsPublic.jsx`,
`GalleryPublic.jsx`, `AchievementsPublic.jsx`, `AlumniPublic.jsx`,
`PublicDisclosurePublic.jsx`, `TCInformationPublic.jsx`, `SchoolNotFound.jsx`

---

## 6. Routing Pattern (`App.jsx`)

**Critical rule:** specific public routes must be before the generic `/:levelSlug` catch-all.

```jsx
<Route path="/school/:slug" element={<SchoolWebsite />} />
<Route path="/school/:slug/about" element={<AboutUsPublic />} />
<Route path="/school/:slug/fee" element={<FeeStructurePublic />} />
<Route path="/school/:slug/faculty" element={<FacultyPublic />} />
<Route path="/school/:slug/infrastructure/:categorySlug" element={<InfrastructurePublic />} />
<Route path="/school/:slug/infrastructure" element={<InfrastructurePublic />} />
<Route path="/school/:slug/sports/:pageSlug" element={<SportsPublic />} />
<Route path="/school/:slug/sports" element={<SportsPublic />} />
<Route path="/school/:slug/gallery/:tab" element={<GalleryPublic />} />
<Route path="/school/:slug/gallery" element={<GalleryPublic />} />
<Route path="/school/:slug/achievements" element={<AchievementsPublic />} />
<Route path="/school/:slug/alumni" element={<AlumniPublic />} />
<Route path="/school/:slug/public-disclosure" element={<PublicDisclosurePublic />} />
<Route path="/school/:slug/tc" element={<TCInformationPublic />} />
<Route path="/school/:slug/:levelSlug" element={<SchoolLevelPublic />} /> {/* generic, LAST */}
<Route path="/school-not-found" element={<SchoolNotFound />} />
```

Admin side:
```jsx
<Route path="module/home" element={<HomePage />} />
<Route path="module/about" element={<AboutUs />} />
<Route path="module/fee" element={<FeeStructure />} />
<Route path="module/courses" element={<Courses />} />
<Route path="module/faculty" element={<Faculty />} />
<Route path="module/infrastructure" element={<Infrastructure />} />
<Route path="module/sports" element={<Sports />} />
<Route path="module/gallery" element={<Gallery />} />
<Route path="module/achievements" element={<Achievements />} />
<Route path="module/alumni" element={<Alumni />} />
<Route path="module/disclosure" element={<PublicDisclosure />} />
<Route path="module/tc" element={<TCInformation />} />
<Route path="module/:moduleKey" element={<ModulePage />} /> {/* generic, LAST */}
```

### `modulePageMap` in `ModulePage.jsx`
```js
const modulePageMap = {
    'home': '/admin/module/home',
    'about': '/admin/module/about',
    'fee': '/admin/module/fee',
    'courses': '/admin/module/courses',
    'faculty': '/admin/module/faculty',
    'infrastructure': '/admin/module/infrastructure',
    'sports': '/admin/module/sports',
    'gallery': '/admin/module/gallery',
    'achievements': '/admin/module/achievements',
    'alumni': '/admin/module/alumni',
    'disclosure': '/admin/module/disclosure',
    'tc': '/admin/module/tc',
};
```

**CRITICAL:** Every time a new module is built with a dedicated admin page, BOTH the `App.jsx`
route AND this `modulePageMap` entry must be added — missing either one causes the module to
show the "Coming in Milestone 2" fallback UI instead of the real admin form.

---

## 7. Design System / Reused Patterns

### Theme colors
```js
// Now accessed via getThemeColors() from publicNav.js instead of copy-pasting per page
import { getThemeColors } from "../../constants/publicNav";
const tc = getThemeColors(school.theme);
// Returns: { primary, secondary, light, dark }
```

### Rich text rendering CSS (required on EVERY public page using `dangerouslySetInnerHTML`)
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
**Common bug:** If font-size changes in RTE don't reflect on frontend, it's always this CSS
block missing `.ql-size-*` rules. Check every public page.

### Standard public page anatomy
1. `<Navbar />` (shared component, props: school/slug/tc/scrollY/onMenuOpen)
2. `<MegaMenu />` (shared component, props: open/onClose/school/slug/tc/activeKey/menuImage)
3. Hero section (90vh parallax or 60vh gradient depending on page)
4. Content sections with `Reveal` (IntersectionObserver fade+slide-up)
5. Footer CTA section (optional — Alumni removed this, most others keep it)
6. `<Footer />` (shared component, props: school/slug/tc/bgImage)

### Standard admin page anatomy
1. Dark gradient hero header (`linear-gradient(135deg, #2d0a1a, #4a1030, #2d0520)`) with
   title, description, Published/Draft badge, Save Draft + Publish/Unpublish buttons
2. White card sections (`border: 0.5px solid #f1f5f9`, `borderRadius: 16px`, subtle shadow)
3. Bottom save bar duplicating Save Draft / Publish

### `publicNav.js` link structure
```js
// PUBLIC_NAV_GROUPS (for MegaMenu accordion):
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

---

## 8. Modules Built So Far

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
| 10 | `alumni` | `Alumni.jsx` | `AlumniPublic.jsx` | See §9 for details |
| 11 | `disclosure` | `PublicDisclosure.jsx` | `PublicDisclosurePublic.jsx` | See §9 for details |
| 12 | `tc` | `TCInformation.jsx` | `TCInformationPublic.jsx` | See §9 for details |

---

## 9. Module Details — Milestone 2 (newly built)

### Alumni (key: `alumni`)
**Admin fields:** Banner image, Heading, Description (RTE), repeatable alumni entries:
- Photo upload, Name, Batch Year, Achievement Headline (bold line like "Currently at SRCC, cleared CA Foundation"),
  Testimonial (paragraph), LinkedIn URL (optional)

**Public page design:**
- 90vh parallax hero banner, Playfair Display heading
- Vertical list layout (NOT grid) — each alumnus: polaroid-style photo with shadow + subtle
  per-index tilt (`rotate(±2.5° to ±4.5°deg)`), hover → tilt straightens + image zooms
- Photo alternates left/right on odd/even entries for visual rhythm
- Initials-based avatar fallback (theme gradient bg + white initials letters) when no photo
- Ornamental SVG divider between every entry (arrow-tipped lines + 4 interlocking circles knot center)
- No "Back to Home" CTA section (removed per request)
- No batch-year filter pills (removed per request — was added then removed)

### Public Disclosure (key: `disclosure`)
**⚠️ CRITICAL:** moduleRegistry.js uses key `disclosure` (NOT `publicDisclosure`).
All files — admin, public, App.jsx, ModulePage.jsx, publicNav.js — must use `disclosure`.

**Admin structure:** Heading, Description (RTE), flexible categories (add/remove/rename):
- Each category has a type toggle: `info` (label + text details) or `documents` (label + PDF upload OR link URL OR description text — any/all three optional)
- Default 3 categories: "General Information" (info type), "Documents and Information" (documents type), "Result and Academics" (documents type)
- "+ Add Category" button for custom categories

**Public page:**
- 60vh gradient hero (no photo banner)
- Each category = gradient-header card + document/info rows inside
- Document rows show: PDF link ("View Document") if pdfUrl exists, OR plain link if linkUrl, OR text if description — whichever is filled (filter: `r.label && (r.pdfUrl || r.linkUrl || r.description)`)
- Hover on rows: translateX(4px) slide effect

### TC Information (key: `tc`)
**Admin structure:** Heading, Description (RTE), **session-based records**:
- Session tabs (e.g. "2022-23", "2023-24") — create/delete sessions
- Per session: bulk CSV upload (browser-parsed, no library) OR individual "+ Add One"
- CSV columns: `TC_No, Student_Name, Class, PDF_URL` (all flexible, multiple column name variants accepted)
- Records table: searchable, edit inline, delete per row

**Public page (no banner):**
- Clean `#f8fafc` background, Playfair Display heading
- Step 1: Session selection — cards grid showing each session (name, record count)
- Step 2: Form — TC No + Student Name (required) + Class (optional), "Search My TC" button
- Found: detail card + "Download TC" button (opens PDF link in new tab)
- Not found: tips list + school contact info
- "← Back" to change session, "Try Again" / "Change Session" buttons in result

**⚠️ NOTE:** A major TC upgrade is planned (separate feature prompt ready):
- Excel upload (SheetJS: `npm install xlsx`) instead of CSV
- Auto-detect TC format from filename: `cbse_*.xlsx` → CBSE, `state_*.xlsx` → State Board, `icse_*.xlsx` → ICSE, other → Default
- `frontend/src/utils/TCTemplates.js` utility with format generators
- On-the-fly TC PDF generation (browser print approach, no extra library)
- This upgrade needs to be implemented in a new chat using the dedicated feature prompt

---

## 10. Outstanding Module Backlog

**Dynamic modules (not yet started):**
- Events & Activities, Announcements, Circulars, Admission Enquiry, Career Enquiry
- These need date-based listing/filtering UI patterns

**School Settings admin improvements needed:**
- Add `menu_image_url` and `footer_bg_url` upload fields to the Settings admin page
  so school admins can set the MegaMenu background image and Footer background image

**TC Generation System (planned, prompt ready):**
- See §9 TC section for details — major upgrade to current basic TC module

---

## 11. Working Style Notes (for Claude, in any new chat)

- Mudit communicates in Hinglish; respond in Hinglish with code in English.
- Prefers **complete file outputs** over partial diffs for substantial changes.
- When delivering multiple files, use the file-creation/present_files flow (downloadable files).
- Often asks "give me the full updated file" after several incremental edits.
- Cost/scale conscious — brief practical explanations of why something is safe at current
  scale (handful of schools), without over-engineering.
- Confirm structural/scope decisions with a quick multiple-choice question before building
  large new modules, but don't over-ask — proceed with sensible defaults for small details.
- **ALWAYS check `moduleRegistry.js` for exact module key names** before writing any module
  code — key mismatches (e.g. `publicDisclosure` vs `disclosure`) cause the admin page to
  show the "Coming in Milestone 2" fallback UI silently with no obvious error.