// Phase 6 Plan 1: Tests for updated INITIAL_COURSE_DATA defaults (D-02, D-12)
// TDD RED — these tests fail before the implementation changes.

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCourseData, INITIAL_COURSE_DATA } from '../useCourseData.js';

beforeEach(() => {
    localStorage.clear();
});

describe('useCourseData — sessionsPerWeek default (D-02)', () => {
    it('INITIAL_COURSE_DATA has sessionsPerWeek: 0 (no cap)', () => {
        expect(INITIAL_COURSE_DATA.sessionsPerWeek).toBe(0);
    });

    it('hook returns sessionsPerWeek: 0 when localStorage is empty', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.sessionsPerWeek).toBe(0);
    });

    it('old localStorage blob with sessionsPerWeek: 2 preserves the saved value (user preference)', () => {
        const oldBlob = {
            courseName: 'Matemáticas',
            startDate: '2026-03-02',
            sessionsPerWeek: 2,
            classDays: ['monday'],
            totalHours: 40,
            hourType: 'pedagogical',
            hoursPerSession: 2,
            recoverySessionsCount: 0,
            customExcludedDates: [],
        };
        localStorage.setItem('courseData', JSON.stringify(oldBlob));
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.sessionsPerWeek).toBe(2);
    });

    it('old localStorage blob without sessionsPerWeek gets default 0', () => {
        const blobNoSpw = {
            courseName: 'Química',
            startDate: '2026-03-02',
            classDays: ['tuesday'],
            totalHours: 30,
            hourType: 'pedagogical',
            hoursPerSession: 2,
            recoverySessionsCount: 0,
            customExcludedDates: [],
        };
        localStorage.setItem('courseData', JSON.stringify(blobNoSpw));
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.sessionsPerWeek).toBe(0);
    });
});

describe('useCourseData — perDayHours default (D-12)', () => {
    it('INITIAL_COURSE_DATA has perDayHours: {} (empty map)', () => {
        expect(INITIAL_COURSE_DATA.perDayHours).toEqual({});
    });

    it('hook returns perDayHours: {} when localStorage is empty', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.perDayHours).toEqual({});
    });

    it('old localStorage blob without perDayHours gets default {} via spread merge', () => {
        const oldBlob = {
            courseName: 'Física',
            startDate: '2026-03-02',
            sessionsPerWeek: 0,
            classDays: ['monday'],
            totalHours: 40,
            hourType: 'pedagogical',
            hoursPerSession: 2,
            recoverySessionsCount: 0,
            customExcludedDates: [],
        };
        localStorage.setItem('courseData', JSON.stringify(oldBlob));
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.perDayHours).toEqual({});
    });

    it('saved localStorage blob with perDayHours preserves the saved map', () => {
        const savedBlob = {
            courseName: 'Física',
            startDate: '2026-03-02',
            sessionsPerWeek: 0,
            classDays: ['monday', 'thursday'],
            totalHours: 40,
            hourType: 'pedagogical',
            hoursPerSession: 2,
            perDayHours: { monday: 1.5, thursday: 1.0 },
            recoverySessionsCount: 0,
            customExcludedDates: [],
            semester: '',
            professorName: '',
            contactEmail: '',
            recoveryExtraMinutes: 30,
        };
        localStorage.setItem('courseData', JSON.stringify(savedBlob));
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.perDayHours).toEqual({ monday: 1.5, thursday: 1.0 });
    });
});
