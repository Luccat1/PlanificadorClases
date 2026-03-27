import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSchedule } from '../useSchedule.js';

const BASE_COURSE = {
    courseName: 'Test',
    startDate: '2026-03-02',   // Monday
    sessionsPerWeek: 2,
    classDays: ['monday', 'wednesday'],
    totalHours: 10,
    hourType: 'pedagogical',
    hoursPerSession: 2,
    recoverySessionsCount: 0,
    recoveryExtraMinutes: 30,
    customExcludedDates: [],
    semester: '',
    professorName: '',
    contactEmail: '',
};

const EMPTY_COURSE = {
    courseName: '',
    startDate: '',
    sessionsPerWeek: 2,
    classDays: ['monday', 'wednesday'],
    totalHours: 40,
    hourType: 'pedagogical',
    hoursPerSession: 2,
    recoverySessionsCount: 0,
    recoveryExtraMinutes: 30,
    customExcludedDates: [],
    semester: '',
    professorName: '',
    contactEmail: '',
};

// Valid base fixture — all fields required (per project convention in STATE.md)
const validCourseData = {
    startDate: '2026-03-02',
    classDays: ['monday', 'wednesday'],
    totalHours: 4,
    hoursPerSession: 1,
    hourType: 'chronological',
    recoverySessionsCount: 0,
    recoveryExtraMinutes: 30,
    sessionsPerWeek: 0,
    customExcludedDates: [],
    courseName: '',
    semester: '',
    professorName: '',
    contactEmail: '',
};

beforeEach(() => {
    localStorage.clear();
});

describe('useSchedule — empty state', () => {
    it('returns [] when startDate is empty', () => {
        const { result } = renderHook(() => useSchedule(EMPTY_COURSE, []));
        expect(result.current).toEqual([]);
    });
});

describe('useSchedule — schedule generation', () => {
    it('returns a non-empty array when courseData has a valid startDate', () => {
        const { result } = renderHook(() => useSchedule(BASE_COURSE, []));
        expect(result.current.length).toBeGreaterThan(0);
    });

    it('each session has dateStr, number, and dayName', () => {
        const { result } = renderHook(() => useSchedule(BASE_COURSE, []));
        const first = result.current[0];
        expect(first).toHaveProperty('dateStr');
        expect(first).toHaveProperty('number');
        expect(first).toHaveProperty('dayName');
        expect(typeof first.dateStr).toBe('string');
        expect(typeof first.number).toBe('number');
    });
});

describe('useSchedule — reactivity', () => {
    it('recomputes when courseData.startDate changes', () => {
        let courseData = { ...BASE_COURSE, startDate: '2026-03-02' };
        const { result, rerender } = renderHook(
            ({ cd, h }) => useSchedule(cd, h),
            { initialProps: { cd: courseData, h: [] } }
        );
        const firstDate = result.current[0]?.dateStr;

        courseData = { ...BASE_COURSE, startDate: '2026-04-06' };  // Different Monday
        rerender({ cd: courseData, h: [] });

        const newDate = result.current[0]?.dateStr;
        expect(newDate).not.toBe(firstDate);
    });

    it('skips a holiday date when holidays array contains it', () => {
        const { result: noHoliday } = renderHook(() =>
            useSchedule(BASE_COURSE, [])
        );
        const firstSession = noHoliday.result?.current?.[0]?.dateStr ?? noHoliday.current?.[0]?.dateStr;
        // Get first session date from BASE_COURSE (2026-03-02 Monday)
        const { result: withHoliday } = renderHook(() =>
            useSchedule(BASE_COURSE, [{ date: '2026-03-02', name: 'Feriado Test' }])
        );
        // First session should NOT be 2026-03-02
        expect(withHoliday.current[0]?.dateStr).not.toBe('2026-03-02');
    });
});

describe('useSchedule — schedule validity guard (CORT-01)', () => {
    it('returns non-empty schedule when all fields are valid', () => {
        const { result } = renderHook(() => useSchedule(validCourseData, []))
        expect(result.current.length).toBeGreaterThan(0)
    })

    it('returns [] when totalHours is 0', () => {
        const { result } = renderHook(() => useSchedule({ ...validCourseData, totalHours: 0 }, []))
        expect(result.current).toEqual([])
    })

    it('returns [] when hoursPerSession is 0', () => {
        const { result } = renderHook(() => useSchedule({ ...validCourseData, hoursPerSession: 0 }, []))
        expect(result.current).toEqual([])
    })

    it('returns [] when startDate is empty', () => {
        const { result } = renderHook(() => useSchedule({ ...validCourseData, startDate: '' }, []))
        expect(result.current).toEqual([])
    })

    it('returns [] when classDays is empty', () => {
        const { result } = renderHook(() => useSchedule({ ...validCourseData, classDays: [] }, []))
        expect(result.current).toEqual([])
    })

    it('returns [] when recoveryExtraMinutes is negative', () => {
        const { result } = renderHook(() => useSchedule({ ...validCourseData, recoveryExtraMinutes: -1 }, []))
        expect(result.current).toEqual([])
    })
})
