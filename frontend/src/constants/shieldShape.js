// ── Shared shield/crest clip-path used for the Home Page "Homepage Highlight"
// photos — single source of truth so the admin crop tool's preview overlay,
// the admin thumbnail preview, and the public page all render the exact same
// shape. Path is in objectBoundingBox units (0–1), so it scales with whatever
// box it's applied to as long as that box keeps SHIELD_ASPECT (width/height). ──
export const SHIELD_PATH_D = 'M0.5,0 C0.75,0 1,0.09 1,0.2 L1,0.6 C1,0.86 0.78,0.97 0.5,1 C0.22,0.97 0,0.86 0,0.6 L0,0.2 C0,0.09 0.25,0 0.5,0 Z';
export const SHIELD_ASPECT = 3 / 4;
