import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { fetchHolidaysForYear } from '../holidayApi.js';

beforeEach(() => {
    localStorage.clear();
});

describe('fetchHolidaysForYear', () => {
    it('fetches from API and returns mapped holidays (localName as name)', async () => {
        const result = await fetchHolidaysForYear(2026);
        expect(result.fromCache).toBe(false);
        expect(result.holidays).toBeInstanceOf(Array);
        expect(result.holidays.length).toBeGreaterThan(0);
        // Must use localName (Spanish) not English name
        const newYear = result.holidays.find(h => h.date === '2026-01-01');
        expect(newYear).toBeDefined();
        expect(newYear.name).toBe('Año Nuevo');
    });

    it('returns fromCache:true and skips network on cache hit', async () => {
        const cached = [{ date: '2026-01-01', name: 'Año Nuevo' }];
        localStorage.setItem('holidays_CL_2026', JSON.stringify(cached));

        let networkCalled = false;
        server.use(
            http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
                networkCalled = true;
                return HttpResponse.json([]);
            })
        );

        const result = await fetchHolidaysForYear(2026);
        expect(result.fromCache).toBe(true);
        expect(result.holidays).toEqual(cached);
        expect(networkCalled).toBe(false);
    });

    it('writes holidays to localStorage after successful fetch', async () => {
        await fetchHolidaysForYear(2026);
        const stored = localStorage.getItem('holidays_CL_2026');
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored);
        expect(parsed).toBeInstanceOf(Array);
        expect(parsed.length).toBeGreaterThan(0);
        expect(parsed[0]).toHaveProperty('date');
        expect(parsed[0]).toHaveProperty('name');
    });

    it('filters out global:false (regional) holidays', async () => {
        const result = await fetchHolidaysForYear(2026);
        // 2026-06-07 is the Arica regional holiday (global: false) in MSW fixture
        const aricaHoliday = result.holidays.find(h => h.date === '2026-06-07');
        expect(aricaHoliday).toBeUndefined();
    });

    it('throws when API returns error status', async () => {
        server.use(
            http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
                return HttpResponse.error();
            })
        );
        await expect(fetchHolidaysForYear(2026)).rejects.toThrow();
    });

    it('recovers from corrupt localStorage and fetches from API', async () => {
        localStorage.setItem('holidays_CL_2026', 'INVALID_JSON_{{{');
        const result = await fetchHolidaysForYear(2026);
        expect(result.fromCache).toBe(false);
        expect(result.holidays).toBeInstanceOf(Array);
        expect(result.holidays.length).toBeGreaterThan(0);
    });
});
