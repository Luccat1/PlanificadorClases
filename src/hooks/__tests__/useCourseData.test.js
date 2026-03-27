import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCourseData } from '../useCourseData.js';

const INITIAL = {
    courseName: '',
    startDate: '',
    sessionsPerWeek: 2,
    classDays: ['monday', 'wednesday'],
    totalHours: 40,
    hourType: 'pedagogical',
    hoursPerSession: 2,
    recoverySessionsCount: 0,
    customExcludedDates: [],
    semester: '',
    professorName: '',
    contactEmail: '',
    recoveryExtraMinutes: 30,
};

beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('useCourseData — initial state', () => {
    it('returns INITIAL_COURSE_DATA when localStorage is empty', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData).toEqual(INITIAL);
    });

    it('reads persisted courseData from localStorage on mount', () => {
        const saved = { ...INITIAL, courseName: 'Matemáticas' };
        localStorage.setItem('courseData', JSON.stringify(saved));
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.courseName).toBe('Matemáticas');
    });

    it('falls back to INITIAL when localStorage contains corrupt JSON', () => {
        localStorage.setItem('courseData', 'NOT_JSON');
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData).toEqual(INITIAL);
    });
});

describe('useCourseData — persistence', () => {
    it('persists courseData to localStorage when a field changes', () => {
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.handleInputChange('courseName', 'Física');
        });
        const stored = JSON.parse(localStorage.getItem('courseData'));
        expect(stored.courseName).toBe('Física');
    });
});

describe('useCourseData — handleInputChange', () => {
    it('updates a single field and preserves others', () => {
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.handleInputChange('totalHours', 60);
        });
        expect(result.current.courseData.totalHours).toBe(60);
        expect(result.current.courseData.sessionsPerWeek).toBe(2);
    });
});

describe('useCourseData — handleDayToggle', () => {
    it('adds a day when not already present', () => {
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.handleDayToggle('friday');
        });
        expect(result.current.courseData.classDays).toContain('friday');
    });

    it('removes a day when already present', () => {
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.handleDayToggle('monday'); // monday is in INITIAL
        });
        expect(result.current.courseData.classDays).not.toContain('monday');
    });
});

describe('useCourseData — excluded dates', () => {
    it('addExcludedDate appends a date', () => {
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.addExcludedDate('2026-09-18');
        });
        expect(result.current.courseData.customExcludedDates).toContain('2026-09-18');
    });

    it('addExcludedDate does not add duplicate', () => {
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.addExcludedDate('2026-09-18');
            result.current.addExcludedDate('2026-09-18');
        });
        expect(result.current.courseData.customExcludedDates.filter(d => d === '2026-09-18').length).toBe(1);
    });

    it('removeExcludedDate removes the matching date', () => {
        const saved = { ...INITIAL, customExcludedDates: ['2026-09-18', '2026-10-12'] };
        localStorage.setItem('courseData', JSON.stringify(saved));
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.removeExcludedDate('2026-09-18');
        });
        expect(result.current.courseData.customExcludedDates).not.toContain('2026-09-18');
        expect(result.current.courseData.customExcludedDates).toContain('2026-10-12');
    });
});

describe('useCourseData — new fields (D-12)', () => {
    it('INITIAL_COURSE_DATA contains semester with value empty string', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.semester).toBe('');
    });

    it('INITIAL_COURSE_DATA contains professorName with value empty string', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.professorName).toBe('');
    });

    it('INITIAL_COURSE_DATA contains contactEmail with value empty string', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.contactEmail).toBe('');
    });

    it('INITIAL_COURSE_DATA contains recoveryExtraMinutes with default value 30', () => {
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.recoveryExtraMinutes).toBe(30);
    });

    it('old localStorage blob missing new keys loads with defaults merged in', () => {
        // Simulate pre-D-12 localStorage (missing the 4 new fields)
        const oldData = {
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
        localStorage.setItem('courseData', JSON.stringify(oldData));
        const { result } = renderHook(() => useCourseData());
        // Old fields preserved
        expect(result.current.courseData.courseName).toBe('Matemáticas');
        // New fields filled from defaults
        expect(result.current.courseData.semester).toBe('');
        expect(result.current.courseData.recoveryExtraMinutes).toBe(30);
    });

    it('saved localStorage blob with new fields preserves their values on load', () => {
        const savedWithNew = { ...INITIAL, semester: '2026-1', recoveryExtraMinutes: 15 };
        localStorage.setItem('courseData', JSON.stringify(savedWithNew));
        const { result } = renderHook(() => useCourseData());
        expect(result.current.courseData.semester).toBe('2026-1');
        expect(result.current.courseData.recoveryExtraMinutes).toBe(15);
    });
});

describe('useCourseData — resetCourse', () => {
    it('resets courseData to INITIAL', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const saved = { ...INITIAL, courseName: 'Química' };
        localStorage.setItem('courseData', JSON.stringify(saved));
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.resetCourse();
        });
        expect(result.current.courseData).toEqual(INITIAL);
    });

    it('removes courseData key from localStorage', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        localStorage.setItem('courseData', JSON.stringify({ ...INITIAL, courseName: 'Química' }));
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.resetCourse();
        });
        expect(localStorage.getItem('courseData')).toBeNull();
    });

    it('does not reset when confirm returns false', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const saved = { ...INITIAL, courseName: 'Química' };
        localStorage.setItem('courseData', JSON.stringify(saved));
        const { result } = renderHook(() => useCourseData());
        act(() => {
            result.current.resetCourse();
        });
        expect(result.current.courseData.courseName).toBe('Química');
    });
});
