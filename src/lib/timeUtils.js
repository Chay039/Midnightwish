/**
 * Midnightwish Dynamic Timezone Logic
 */

export const COUNTRIES = [
  { name: "India", code: "IN", tz: "Asia/Kolkata" },
  { name: "United States (Eastern)", code: "US-E", tz: "America/New_York" },
  { name: "United States (Central)", code: "US-C", tz: "America/Chicago" },
  { name: "United States (Pacific)", code: "US-P", tz: "America/Los_Angeles" },
  { name: "United Kingdom", code: "UK", tz: "Europe/London" },
  { name: "Australia (Sydney)", code: "AU", tz: "Australia/Sydney" },
  { name: "United Arab Emirates", code: "AE", tz: "Asia/Dubai" },
  { name: "Canada (Toronto)", code: "CA", tz: "America/Toronto" },
  { name: "Singapore", code: "SG", tz: "Asia/Singapore" }
];

/**
 * Returns the UTC Date object corresponding to 12:00 AM in the requested timezone.
 * We approximate this by creating a date, formatting it in the target zone, and finding the offset.
 */
export function getMidnightForTimezone(targetDateStr, timeZone) {
  // Simplest cross-environment approach for Next.js to find midnight
  // In a real robust system, use date-fns-tz
  return new Date(); // Placeholder for UI mapping
}

export function formatLocalTimeForUser(utcDate) {
  return new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(utcDate || new Date());
}

/**
 * Get current time string in a specific timezone
 */
export function getCurrentTimeInZone(timeZone) {
  try {
    const options = { timeZone, hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date());
  } catch (e) {
    return '--:--';
  }
}

/**
 * Figure out exactly what your local time is when it hits Midnight in a target timezone.
 * @param {string} timeZone e.g. "Asia/Kolkata"
 * @returns {string} e.g. "1:30 PM CDT"
 */
export function getLocalMidnightEquivalent(timeZone) {
   // A simple hack to find "Midnight today" in that timezone, then format locally
   const d = new Date();
   const str = d.toLocaleString("en-US", { timeZone });
   const localObj = new Date(str);
   // We find how many hours ahead/behind the target timezone is relative to our local localObj
   const offsetMs = d.getTime() - localObj.getTime();
   
   // Set a date exactly at midnight
   const midnightTarget = new Date();
   midnightTarget.setHours(0, 0, 0, 0);
   
   // Apply reverse offset
   const localEquiv = new Date(midnightTarget.getTime() + offsetMs);

   return new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit'
   }).format(localEquiv);
}
