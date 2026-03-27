const CACHE_KEY_PREFIX = 'holidays_CL_';

/**
 * Fetches Chilean public holidays for a given year.
 * Checks localStorage first; fetches from nager.date if not cached.
 * Filters to global===true holidays only (regional holidays excluded).
 * Uses localName (Spanish) for the name field.
 *
 * @param {number} year
 * @returns {Promise<{ holidays: Array<{date: string, name: string}>, fromCache: boolean }>}
 */
export async function fetchHolidaysForYear(year) {
    const cacheKey = `${CACHE_KEY_PREFIX}${year}`;

    // 1. Check localStorage cache first
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            return { holidays: JSON.parse(cached), fromCache: true };
        }
    } catch (_) {
        // JSON parse error or localStorage unavailable — fall through to fetch
    }

    // 2. Fetch from nager.date API
    const response = await fetch(
        `https://date.nager.at/api/v3/publicholidays/${year}/CL`
    );
    if (!response.ok) {
        throw new Error(`nager.date API error: ${response.status}`);
    }
    const raw = await response.json();

    // 3. Filter regional holidays and map to internal shape
    // global: false entries are region-specific (e.g., Arica only) — exclude nationally
    const holidays = raw
        .filter(h => h.global === true)
        .map(h => ({ date: h.date, name: h.localName }));

    // 4. Write to cache (non-fatal if localStorage is full or unavailable)
    try {
        localStorage.setItem(cacheKey, JSON.stringify(holidays));
    } catch (_) {
        // Non-fatal — schedule generation proceeds without caching
    }

    return { holidays, fromCache: false };
}
