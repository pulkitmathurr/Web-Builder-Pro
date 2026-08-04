// Gallery-style image fields (Announcements' `images`, Events' highlight `images`) are stored
// as an array of { url, orientation } objects so the public mosaic can size each photo's frame
// to match instead of hard-cropping it. Older saved content stored these as plain URL strings —
// normalizeImages upgrades those on read so both shapes work everywhere without a DB migration.
export const normalizeImages = (images) => (images || []).map(img =>
    typeof img === 'string' ? { url: img, orientation: 'horizontal' } : { orientation: 'horizontal', ...img }
);

export const getImageUrl = (img) => (typeof img === 'string' ? img : img?.url) || '';

export const getImageOrientation = (img) => (typeof img === 'string' ? 'horizontal' : img?.orientation) || 'horizontal';
