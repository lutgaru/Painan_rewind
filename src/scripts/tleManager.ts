import painanitles from '../Data/painanitles.json';

export function getTLEbyDate(date: Date) {
  // Convert input date to timestamp for comparison
  const targetTime = date.getTime();

  // Find the closest TLE by comparing epoch dates
  return painanitles.reduce((closest, current) => {
    // Convert epoch string to Date object
    const epochDate = new Date(current.EPOCH);
    const currentDiff = Math.abs(epochDate.getTime() - targetTime);
    
    // If this is our first iteration, set as closest
    if (!closest) return current;

    // Compare time differences to find closest
    const closestDiff = Math.abs(new Date(closest.EPOCH).getTime() - targetTime);
    
    return currentDiff < closestDiff ? current : closest;
  });
}