// Shared between Navbar and Footer — both need to know which of the 4 fixed
// school levels (see admin `Courses.jsx` LEVELS / public `SchoolLevelPublic.jsx` LEVEL_MAP)
// have any real content, to decide what shows up in navigation.
export const COURSE_LEVELS = [
    { key: 'primary', label: 'Primary School', path: (slug) => `/school/${slug}/primary-school` },
    { key: 'middle',  label: 'Middle School',  path: (slug) => `/school/${slug}/middle-school` },
    { key: 'high',    label: 'High School',    path: (slug) => `/school/${slug}/high-school` },
    { key: 'senior',  label: 'Senior School',  path: (slug) => `/school/${slug}/senior-school` },
];

const ABOUT_FIELDS = ['aboutHeading', 'aboutQuote', 'aboutAuthor', 'aboutAuthorDesignation', 'aboutImage'];
const UNIQUE_FIELDS = ['uniqueHeading', 'uniqueText', 'uniqueImage'];

// A level shows up in navigation as soon as it's enabled and at least one of its
// sections — About, Why Unique, or Gallery — has any real content. Filling every
// field isn't required; any single filled section is enough, per client request.
export const isLevelComplete = (data) => {
    if (!data || !data.enabled) return false;
    const hasAbout = ABOUT_FIELDS.some(f => (data[f] || '').toString().trim().length > 0);
    const hasUnique = UNIQUE_FIELDS.some(f => (data[f] || '').toString().trim().length > 0);
    const hasGallery = Array.isArray(data.gallery) && data.gallery.length > 0;
    return hasAbout || hasUnique || hasGallery;
};
