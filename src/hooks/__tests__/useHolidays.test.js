import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { useHolidays } from '../useHolidays.js';

beforeEach(() => {
    localStorage.clear();
});

describe('useHolidays', () => {
    it('returns empty holidays and null warning when startDate is empty', () => {
        const { result } = renderHook(() => useHolidays(''));
        expect(result.current.holidays).toEqual([]);
        expect(result.current.holidayWarning).toBeNull();
    });

    it('fetches startYear and startYear+1 and returns merged holidays', async () => {
        const { result } = renderHook(() => useHolidays('2026-03-01'));
        await waitFor(() => {
            expect(result.current.holidays.length).toBeGreaterThan(0);
        });
        expect(result.current.holidayWarning).toBeNull();
        // Should contain both 2026 and 2027 holidays (merged from two fetches)
        const has2026 = result.current.holidays.some(h => h.date.startsWith('2026-'));
        const has2027 = result.current.holidays.some(h => h.date.startsWith('2027-'));
        expect(has2026).toBe(true);
        expect(has2027).toBe(true);
    });

    it('merged result includes known holidays from both years', async () => {
        const { result } = renderHook(() => useHolidays('2026-03-01'));
        await waitFor(() => {
            expect(result.current.holidays.length).toBeGreaterThan(0);
        });
        const newYear2026 = result.current.holidays.find(h => h.date === '2026-01-01');
        const newYear2027 = result.current.holidays.find(h => h.date === '2027-01-01');
        expect(newYear2026).toEqual({ date: '2026-01-01', name: 'Año Nuevo' });
        expect(newYear2027).toEqual({ date: '2027-01-01', name: 'Año Nuevo' });
    });

    it('sets holidayWarning and returns [] when API fails and cache is empty', async () => {
        server.use(
            http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
                return HttpResponse.error();
            })
        );
        const { result } = renderHook(() => useHolidays('2026-03-01'));
        await waitFor(() => {
            expect(result.current.holidayWarning).not.toBeNull();
        });
        expect(result.current.holidays).toEqual([]);
    });

    it('holidayWarning is a Spanish string mentioning feriados', async () => {
        server.use(
            http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
                return HttpResponse.error();
            })
        );
        const { result } = renderHook(() => useHolidays('2026-03-01'));
        await waitFor(() => {
            expect(result.current.holidayWarning).not.toBeNull();
        });
        expect(result.current.holidayWarning.toLowerCase()).toContain('feriados');
    });

    it('uses cache and skips network when both years are cached', async () => {
        const holidays2026 = [{ date: '2026-01-01', name: 'Año Nuevo' }];
        const holidays2027 = [{ date: '2027-01-01', name: 'Año Nuevo' }];
        localStorage.setItem('holidays_CL_2026', JSON.stringify(holidays2026));
        localStorage.setItem('holidays_CL_2027', JSON.stringify(holidays2027));

        let networkCalled = false;
        server.use(
            http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
                networkCalled = true;
                return HttpResponse.json([]);
            })
        );

        const { result } = renderHook(() => useHolidays('2026-03-01'));
        await waitFor(() => {
            expect(result.current.holidays.length).toBeGreaterThan(0);
        });
        expect(networkCalled).toBe(false);
    });
});
