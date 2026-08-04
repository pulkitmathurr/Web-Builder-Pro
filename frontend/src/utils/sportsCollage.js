// Shared between the admin "Sports at School" editor and the public Sports page —
// both need to agree on exactly where each collage photo sits (and what shape it
// is) so the admin can pick the right photo for the right slot before cropping it
// freeform (same crop tool as Infrastructure's vertical images — no locked ratio).
// Three selectable layouts: 4, 5, or 7 photos.
//
// Layouts with `square: true` (currently just the 4-photo layout) render as a
// plain auto-flowing grid where every cell is forced to a 1:1 aspect-ratio, so
// they stay perfectly square regardless of container width — no slot placement
// or row-height math needed.
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
    // Simple even 2×2 grid — every photo takes exactly one square quadrant.
    4: {
        cols: 2,
        rows: 2,
        square: true,
        slots: [
            { shape: 'square' },
            { shape: 'square' },
            { shape: 'square' },
            { shape: 'square' },
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
