const CACHE_KEY_PREFIX = 'holidays_CL_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Fetches Chilean public holidays for a given year.
 * Checks localStorage first; fetches from nager.date if not cached or expired.
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
            const parsed = JSON.parse(cached);
            // Backward compatibility with raw array or { data, cachedAt }
            if (Array.isArray(parsed)) {
                return { holidays: parsed, fromCache: true };
            }
            if (parsed && Array.isArray(parsed.data)) {
                const age = Date.now() - (parsed.cachedAt || 0);
                if (age < CACHE_TTL_MS) {
                    return { holidays: parsed.data, fromCache: true };
                }
            }
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

    // 4. Write to cache with timestamp (non-fatal if localStorage is full or unavailable)
    try {
        localStorage.setItem(
            cacheKey,
            JSON.stringify({ data: holidays, cachedAt: Date.now() })
        );
    } catch (_) {
        // Non-fatal — schedule generation proceeds without caching
    }

    return { holidays, fromCache: false };
}
