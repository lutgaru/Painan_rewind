import painanitles from '../Data/painanitles.json';

// Caching mechanism to improve performance
let lastSelectedTle: { tle: any; targetTime: number } | null = null;
const CACHE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day

export function getTLEbyDate(date: Date) {
  // Convert input date to timestamp for comparison
  const targetTime = date.getTime();
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

  // 1. Check cache: If a TLE was recently selected and the new target date is close, reuse it.
  if (lastSelectedTle && Math.abs(targetTime - lastSelectedTle.targetTime) < CACHE_THRESHOLD_MS) {
    return lastSelectedTle.tle;
  }

  // --- If cache is missed, proceed with finding the best TLE ---
  let bestTle;
  // 3. If we found TLEs in that window, find the one with the minimum time difference
  bestTle = painanitles.reduce((closest, current) => {
    const currentDiff = Math.abs(new Date(current.EPOCH).getTime() - targetTime);
    const closestDiff = Math.abs(new Date(closest.EPOCH).getTime() - targetTime);
    return currentDiff < closestDiff ? current : closest;
  });

  // 5. Update the cache with the newly found TLE and the current target time
  lastSelectedTle = { tle: bestTle, targetTime: targetTime };

  return bestTle;
}