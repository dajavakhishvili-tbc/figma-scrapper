/**
 * Compute Levenshtein distance between two strings.
 * Includes early termination when distance exceeds maxDistance.
 */
export function levenshteinDistance(a: string, b: string, maxDistance = Infinity): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for memory efficiency
  if (a.length > b.length) [a, b] = [b, a];

  const aLen = a.length;
  const bLen = b.length;

  // Early termination: length difference alone exceeds max
  if (bLen - aLen > maxDistance) return maxDistance + 1;

  let prev = new Array(aLen + 1);
  let curr = new Array(aLen + 1);

  for (let i = 0; i <= aLen; i++) prev[i] = i;

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j;
    let rowMin = j;

    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1,      // deletion
        curr[i - 1] + 1,  // insertion
        prev[i - 1] + cost // substitution
      );
      rowMin = Math.min(rowMin, curr[i]);
    }

    // Early termination
    if (rowMin > maxDistance) return maxDistance + 1;

    [prev, curr] = [curr, prev];
  }

  return prev[aLen];
}

/** Compute similarity ratio (0.0 to 1.0) between two strings. */
export function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}
