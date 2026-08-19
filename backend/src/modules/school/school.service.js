const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");

// ── Get School Profile ───────────────────────────────
const getSchoolProfileService = async (schoolId) => {
    const [schools] = await pool.query(
        `SELECT 
            s.*,
            a.name as admin_name,
            a.email as admin_email,
            a.phone as admin_phone,
            a.profile_photo as admin_photo
        FROM tbl_schools s
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.id = ?`,
        [schoolId]
    );

    if (schools.length === 0) {
        throw new AppError("School not found", 404);
    }

    return schools[0];
};

// ── Update School Profile ────────────────────────────
// Only columns actually present as keys in `data` are written — this lets callers
// send a partial payload (e.g. just `{ welcome_banner_enabled }`) without wiping
// other fields, while still allowing an explicit `null`/'' to clear a field (e.g.
// "Remove Logo" sends `{ logo_url: null }`). A COALESCE-based UPDATE can't do the
// latter since COALESCE(NULL, logo_url) just keeps the old value.
const updateSchoolProfileService = async (schoolId, data) => {
    const allowedFields = [
        'name', 'phone', 'phone2', 'whatsapp_number', 'address', 'city', 'state', 'pincode',
        'map_url', 'facebook', 'instagram', 'youtube', 'twitter', 'linkedin',
        'hero_video_url', 'hero_video_title', 'logo_url', 'intro_message', 'intro_message_enabled',
        'welcome_banner_enabled', 'welcome_banner_url', 'welcome_banner_link',
        'footer_bg_url', 'bg_music_enabled', 'bg_music_track', 'affiliation_badges', 'custom_domain',
        'prospectus_url'
    ];

    const fieldsToUpdate = allowedFields.filter((field) =>
        Object.prototype.hasOwnProperty.call(data, field)
    );

    if (fieldsToUpdate.length > 0) {
        const setClause = fieldsToUpdate.map((field) => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map((field) => data[field]);

        await pool.query(
            `UPDATE tbl_schools SET ${setClause} WHERE id = ?`,
            [...values, schoolId]
        );
    }

    const [updated] = await pool.query('SELECT * FROM tbl_schools WHERE id = ?', [schoolId]);
    return updated[0];
};

// ── Update School Settings ───────────────────────────
const updateSchoolSettingsService = async (schoolId, data) => {
    const { theme, base_theme, logo_url, nav_font, heading_font } = data;

    await pool.query(
        `UPDATE tbl_schools
        SET
            theme = COALESCE(?, theme),
            base_theme = COALESCE(?, base_theme),
            logo_url = COALESCE(?, logo_url),
            nav_font = COALESCE(?, nav_font),
            heading_font = COALESCE(?, heading_font)
        WHERE id = ?`,
        [theme, base_theme, logo_url, nav_font, heading_font, schoolId]
    );

    const [updated] = await pool.query('SELECT * FROM tbl_schools WHERE id = ?', [schoolId]);
    return updated[0];
};

// ── Select Modules ───────────────────────────────────
const selectModulesService = async (schoolId, modules) => {
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
        throw new AppError("Select at least one module", 400);
    }

    const validModules = [
        "home", "about", "fee", "courses", "faculty", "infrastructure",
        "sports", "gallery", "achievements", "alumni", "testimonials", "disclosure", "tc",
        "events", "calendar", "announcements", "circulars", "admissionProcedure", "bookList", "admission",
        "career", "contact", "settings",
    ];

    const invalidModules = modules.filter((m) => !validModules.includes(m));
    if (invalidModules.length > 0) {
        throw new AppError(`Invalid modules: ${invalidModules.join(", ")}`, 400);
    }

    await pool.query(
        `UPDATE tbl_schools 
        SET selected_modules = ?, is_first_login = 0 
        WHERE id = ?`,
        [JSON.stringify(modules), schoolId]
    );

    return { selectedModules: modules };
};

// ── Get Selected Modules ─────────────────────────────
const getSelectedModulesService = async (schoolId) => {
    const [schools] = await pool.query(
        "SELECT selected_modules, is_first_login FROM tbl_schools WHERE id = ?",
        [schoolId]
    );

    if (schools.length === 0) {
        throw new AppError("School not found", 404);
    }

    return {
        selectedModules: schools[0].selected_modules
            ? typeof schools[0].selected_modules === "string"
                ? JSON.parse(schools[0].selected_modules)
                : schools[0].selected_modules
            : [],
        isFirstLogin: schools[0].is_first_login,
    };
};

// ── Get Public School ────────────────────────────────
const getPublicSchoolService = async (slug) => {
    const [rows] = await pool.query(
        `SELECT
            s.id, s.name, s.slug, s.email, s.phone, s.phone2, s.whatsapp_number, s.address,
            s.city, s.state, s.pincode, s.logo_url, s.theme, s.base_theme,
            s.nav_font, s.heading_font,
            s.selected_modules, s.status, s.map_url,
            s.facebook, s.instagram, s.youtube, s.twitter, s.linkedin,
            s.hero_video_url, s.hero_video_title, s.intro_message, s.intro_message_enabled,
            s.welcome_banner_enabled, s.welcome_banner_url, s.welcome_banner_link,
            s.footer_bg_url, s.bg_music_enabled, s.bg_music_track, s.affiliation_badges,
            s.prospectus_url
        FROM tbl_schools s
        WHERE s.slug = ? AND s.status = 'active'`,
        [slug]
    );

    if (rows.length === 0) {
        throw new AppError('School not found', 404);
    }

    const school = rows[0];
    school.selected_modules = typeof school.selected_modules === 'string'
        ? JSON.parse(school.selected_modules)
        : (school.selected_modules || []);
    school.affiliation_badges = typeof school.affiliation_badges === 'string'
        ? JSON.parse(school.affiliation_badges)
        : (school.affiliation_badges || []);

    return school;
};

// ── Resolve School by Custom Domain ──────────────────
// Used by the frontend on first load to detect a visitor arriving via a school's
// own connected domain (e.g. www.theirschool.com) rather than the platform's own
// host — returns just the slug, which the frontend then treats exactly like a
// normal /school/:slug visit.
const getSchoolSlugByDomainService = async (domain) => {
    const [rows] = await pool.query(
        `SELECT slug FROM tbl_schools WHERE custom_domain = ? AND status = 'active'`,
        [domain]
    );

    if (rows.length === 0) {
        throw new AppError('No school connected to this domain', 404);
    }

    return { slug: rows[0].slug };
};

const getDashboardStatsService = async () => {
    const [[schoolStats]] = await pool.query(`
        SELECT 
            COUNT(*) as total_schools,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_schools,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_schools,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_schools
        FROM tbl_schools
    `);

    const [[adminStats]] = await pool.query(`
        SELECT COUNT(*) as total_admins FROM tbl_admins
    `);

    const [recentSchools] = await pool.query(`
        SELECT id, name, slug, status, city, state, theme, logo_url, created_at
        FROM tbl_schools
        ORDER BY created_at DESC
        LIMIT 5
    `);

    return {
        total_schools: schoolStats.total_schools || 0,
        active_schools: schoolStats.active_schools || 0,
        pending_schools: schoolStats.pending_schools || 0,
        suspended_schools: schoolStats.suspended_schools || 0,
        total_admins: adminStats.total_admins || 0,
        recent_schools: recentSchools,
    };
};
module.exports = {
    getSchoolProfileService,
    updateSchoolProfileService,
    updateSchoolSettingsService,
    selectModulesService,
    getSelectedModulesService,
    getPublicSchoolService,
    getSchoolSlugByDomainService,
    getDashboardStatsService,
};