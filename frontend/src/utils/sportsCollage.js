// Shared between the admin "Sports at School" editor and the public Sports page —
// both need to agree on exactly where each collage photo sits (and what shape it
// is) so the admin can pick the right photo for the right slot before cropping it
// freeform (same crop tool as Infrastructure's vertical images — no locked ratio).
// Three selectable layouts: 4, 5, or 7 photos.
//
// Layouts with `scattered: true` (currently just the 4-photo layout) render as
// an overlapping, black-framed "scrapbook" collage — each slot is absolutely
// positioned inside a fixed-`aspectRatio` container via percentage `box`
// coordinates, plus a `rotate` (deg) and `z` stacking order. On narrow screens
// this collapses to a plain non-overlapping 2×2 grid (see the
// `.sports-scattered-*` mobile media query in both renderers) since rotated,
// overlapping frames don't reflow well at small sizes.
//
// Other layouts place each slot with explicit gridColumn/gridRow line numbers
// against the layout's `cols` count, with `rowHeight` (repeat(rows, `${rowHeight}px`))
// — this is exactly what SportsAtGallery on the public page renders.

export const SHAPE_LABELS = {
    extraTall: 'Extra Tall (Vertical)',
    tall: 'Tall (Vertical)',
    wide: 'Wide (Horizontal)',
    landscape: 'Landscape',
    square: 'Square',
};

export const COLLAGE_LAYOUTS = {
    // Overlapping "scrapbook" collage — 4 black-framed photos at staggered sizes/
    // positions with a slight independent rotation each, instead of a plain even
    // grid. `box` values are percentages of the scattered container (which keeps
    // `aspectRatio` fixed so the staggered layout never distorts).
    4: {
        scattered: true,
        aspectRatio: '4 / 4.6',
        slots: [
            { shape: 'tall', rotate: -3, z: 2, box: { left: '2%', top: '3%', width: '49%', height: '53%' } },
            { shape: 'tall', rotate: 2, z: 1, box: { left: '53%', top: '0%', width: '45%', height: '63%' } },
            { shape: 'tall', rotate: 2, z: 1, box: { left: '0%', top: '55%', width: '45%', height: '45%' } },
            { shape: 'landscape', rotate: -2, z: 3, box: { left: '41%', top: '61%', width: '57%', height: '39%' } },
        ],
    },
    5: {
        cols: 4,
        rows: 2,
        rowHeight: 210,
        slots: [
            { gridColumn: '1 / 2', gridRow: '1 / 3', shape: 'tall' },
            { gridColumn: '2 / 4', gridRow: '1 / 2', shape: 'wide' },
            { gridColumn: '4 / 5', gridRow: '1 / 3', shape: 'tall' },
            { gridColumn: '2 / 3', gridRow: '2 / 3', shape: 'landscape' },
            { gridColumn: '3 / 4', gridRow: '2 / 3', shape: 'landscape' },
        ],
    },
    7: {
        cols: 4,
        rows: 3,
        rowHeight: 200,
        slots: [
            { gridColumn: '1 / 2', gridRow: '1 / 4', shape: 'extraTall' },
            { gridColumn: '2 / 4', gridRow: '1 / 2', shape: 'wide' },
            { gridColumn: '4 / 5', gridRow: '1 / 3', shape: 'tall' },
            { gridColumn: '2 / 3', gridRow: '2 / 3', shape: 'landscape' },
            { gridColumn: '3 / 4', gridRow: '2 / 4', shape: 'tall' },
            { gridColumn: '2 / 3', gridRow: '3 / 4', shape: 'landscape' },
            { gridColumn: '4 / 5', gridRow: '3 / 4', shape: 'landscape' },
        ],
    },
};

export const DEFAULT_COLLAGE_LAYOUT = '7';
