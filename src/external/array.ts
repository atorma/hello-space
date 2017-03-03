export function combinations<T>(n: number, xs: T[]): T[][] {
    if (n < 1) return [[]];
    if (xs.length === 0) return [];

    let h = xs[0],
        tail = xs.slice(1);

    return combinations(n - 1, tail)
        .map((t) => [h].concat(t))
        .concat(combinations(n, tail));
}
