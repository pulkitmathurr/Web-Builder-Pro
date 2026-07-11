// Shared between Navbar and Footer — both need to know which of the 4 fixed
// school levels (see admin `Courses.jsx` LEVELS / public `SchoolLevelPublic.jsx` LEVEL_MAP)
// are fully filled in, to decide what shows up in navigation.
export const COURSE_LEVELS = [
    { key: 'primary', label: 'Primary School', path: (slug) => `/school/${slug}/primary-school` },
    { key: 'middle',  label: 'Middle School',  path: (slug) => `/school/${slug}/middle-school` },
    { key: 'high',    label: 'High School',    path: (slug) => `/school/${slug}/high-school` },
    { key: 'senior',  label: 'Senior School',  path: (slug) => `/school/${slug}/senior-school` },
];

const REQUIRED_TEXT_FIELDS = [
    'bannerImage', 'aboutHeading', 'aboutQuote', 'aboutAuthor',
    'aboutAuthorDesignation', 'aboutImage', 'uniqueHeading', 'uniqueText', 'uniqueImage',
];

// A level only counts as "filled" when every single field for it has been set —
// enabled alone isn't enough, per client request (partial levels must stay hidden).
export const isLevelComplete = (data) => {
    if (!data || !data.enabled) return false;
    const allTextFilled = REQUIRED_TEXT_FIELDS.every(f => (data[f] || '').toString().trim().length > 0);
    const hasGallery = Array.isArray(data.gallery) && data.gallery.length > 0;
    const hasContacts = Array.isArray(data.contacts) && data.contacts.length > 0;
    return allTextFilled && hasGallery && hasContacts;
};
