import { useState, useEffect } from 'react';
import { fetchHolidaysForYear } from '../services/holidayApi.js';

/**
 * Fetches Chilean public holidays for the course's years from nager.date API.
 * Always fetches startYear and startYear+1 to cover multi-year courses
 * without needing to know the computed endDate (avoids circular dependency).
 *
 * @param {string} startDate  'YYYY-MM-DD' or ''
 * @returns {{ holidays: Array<{date:string, name:string}>, holidayWarning: string|null }}
 */
export function useHolidays(startDate) {
    const [holidays, setHolidays] = useState([]);
    const [holidayWarning, setHolidayWarning] = useState(null);

    useEffect(() => {
        if (!startDate) return;

        const startYear = new Date(startDate + 'T00:00:00').getFullYear();
        // Always fetch startYear and startYear+1 to cover courses that span
        // into the following year (e.g., Nov 2026 → Mar 2027).
        const years = [startYear, startYear + 1];

        let cancelled = false;

        Promise.all(years.map(y => fetchHolidaysForYear(y)))
            .then(results => {
                if (cancelled) return;
                const merged = results.flatMap(r => r.holidays);
                setHolidays(merged);
                setHolidayWarning(null);
            })
            .catch(() => {
                if (cancelled) return;
                setHolidays([]);
                setHolidayWarning(
                    'No se pudo obtener los feriados nacionales. El cronograma se generará sin feriados automáticos.'
                );
            });

        return () => {
            cancelled = true;
        };
    }, [startDate]);

    return { holidays, holidayWarning };
}
