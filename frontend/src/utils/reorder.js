// Swaps an item with its neighbor (direction: -1 = up, 1 = down). Returns a new array;
// no-op (same array reference) when already at the boundary.
export const moveItem = (arr, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= arr.length) return arr;
    const copy = [...arr];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
};
