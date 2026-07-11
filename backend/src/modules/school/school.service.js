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
        throw new AppError("School nahi mili", 404);
    }

    return schools[0];
};

// ── Update School Profile ────────────────────────────
const updateSchoolProfileService = async (schoolId, data) => {
    const {
        name, phone, address, city, state, pincode,
        map_url, facebook, instagram, youtube, twitter, linkedin,
        hero_video_url, hero_video_title, logo_url, intro_message
    } = data;

    await pool.query(
        `UPDATE tbl_schools 
        SET 
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            address = COALESCE(?, address),
            city = COALESCE(?, city),
            state = COALESCE(?, state),
            pincode = COALESCE(?, pincode),
            map_url = COALESCE(?, map_url),
            facebook = COALESCE(?, facebook),
            instagram = COALESCE(?, instagram),
            youtube = COALESCE(?, youtube),
            twitter = COALESCE(?, twitter),
            linkedin = COALESCE(?, linkedin),
            hero_video_url = COALESCE(?, hero_video_url),
            hero_video_title = COALESCE(?, hero_video_title),
            logo_url = COALESCE(?, logo_url),
            intro_message = COALESCE(?, intro_message)
        WHERE id = ?`,
        [
            name, phone, address, city, state, pincode,
            map_url, facebook, instagram, youtube, twitter, linkedin,
            hero_video_url, hero_video_title, logo_url, intro_message, schoolId
        ]
    );

    const [updated] = await pool.query('SELECT * FROM tbl_schools WHERE id = ?', [schoolId]);
    return updated[0];
};

// ── Update School Settings ───────────────────────────
const updateSchoolSettingsService = async (schoolId, data) => {
    const { theme, logo_url, nav_font, heading_font } = data;

    await pool.query(
        `UPDATE tbl_schools
        SET
            theme = COALESCE(?, theme),
            logo_url = COALESCE(?, logo_url),
            nav_font = COALESCE(?, nav_font),
            heading_font = COALESCE(?, heading_font)
        WHERE id = ?`,
        [theme, logo_url, nav_font, heading_font, schoolId]
    );

    const [updated] = await pool.query('SELECT * FROM tbl_schools WHERE id = ?', [schoolId]);
    return updated[0];
};

// ── Select Modules ───────────────────────────────────
const selectModulesService = async (schoolId, modules) => {
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
        throw new AppError("Kam se kam ek module select karo", 400);
    }

    const validModules = [
        "home", "about", "fee", "courses", "faculty", "infrastructure",
        "sports", "gallery", "achievements", "alumni", "disclosure", "tc",
        "events", "calendar", "announcements", "circulars", "admission",
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
        throw new AppError("School nahi mili", 404);
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
            s.id, s.name, s.slug, s.email, s.phone, s.address,
            s.city, s.state, s.pincode, s.logo_url, s.theme,
            s.nav_font, s.heading_font,
            s.selected_modules, s.status, s.map_url,
            s.facebook, s.instagram, s.youtube, s.twitter, s.linkedin,
            s.hero_video_url, s.hero_video_title, s.intro_message
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

    return school;
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
    getDashboardStatsService,
};