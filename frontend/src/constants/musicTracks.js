// Curated preset of royalty-free/CC0 background music tracks a school admin can
// pick from (Settings -> Background Music). Schools do NOT upload their own audio
// file — this avoids copyright issues entirely. `tbl_schools.bg_music_track` stores
// a track's `key`, never a URL, so swapping the underlying file later needs no
// data migration.
//
// The actual .mp3 files live in frontend/public/audio/ (see the README there) and
// are NOT bundled by default — add real royalty-free files before enabling this
// feature for a school.
export const MUSIC_TRACKS = [
    { key: 'calm-piano', label: 'Calm Piano', description: 'Soft, minimal — good for a serene tone', url: '/audio/calm-piano.mp3' },
    { key: 'uplifting-strings', label: 'Uplifting Strings', description: 'Warm, hopeful — good for admissions season', url: '/audio/uplifting-strings.mp3' },
    { key: 'soft-ambient', label: 'Soft Ambient', description: 'Airy, background-friendly, no melody hooks', url: '/audio/soft-ambient.mp3' },
    { key: 'gentle-morning', label: 'Gentle Morning', description: 'Light acoustic guitar, cheerful', url: '/audio/gentle-morning.mp3' },
];

export const getMusicTrack = (key) => MUSIC_TRACKS.find((t) => t.key === key) || null;
