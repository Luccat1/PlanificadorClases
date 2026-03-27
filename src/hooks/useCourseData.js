import { useState, useEffect, useRef } from 'react';

export const INITIAL_COURSE_DATA = {
    courseName: '',
    startDate: '',
    sessionsPerWeek: 2,
    classDays: ['monday', 'wednesday'],
    totalHours: 40,
    hourType: 'pedagogical',
    hoursPerSession: 2,
    recoverySessionsCount: 0,
    customExcludedDates: []
};

/**
 * Manages all course form state with localStorage persistence.
 * Extracted from App.jsx inline state (Phase 3 — ARCH-02).
 *
 * @returns {{
 *   courseData: object,
 *   handleInputChange: (field: string, value: any) => void,
 *   handleDayToggle: (day: string) => void,
 *   addExcludedDate: (date: string) => void,
 *   removeExcludedDate: (date: string) => void,
 *   resetCourse: () => void,
 *   INITIAL_COURSE_DATA: object
 * }}
 */
export function useCourseData() {
    const [courseData, setCourseData] = useState(() => {
        try {
            const saved = typeof window !== 'undefined'
                ? localStorage.getItem('courseData')
                : null;
            return saved ? JSON.parse(saved) : INITIAL_COURSE_DATA;
        } catch {
            return INITIAL_COURSE_DATA;
        }
    });

    // When resetCourse clears localStorage, skip the next persist effect
    const skipNextPersistRef = useRef(false);

    useEffect(() => {
        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('courseData', JSON.stringify(courseData));
            }
        } catch {
            // localStorage unavailable (private browsing, quota exceeded)
        }
    }, [courseData]);

    const handleInputChange = (field, value) =>
        setCourseData(prev => ({ ...prev, [field]: value }));

    const handleDayToggle = (day) =>
        setCourseData(prev => ({
            ...prev,
            classDays: prev.classDays.includes(day)
                ? prev.classDays.filter(d => d !== day)
                : [...prev.classDays, day]
        }));

    const addExcludedDate = (date) => {
        if (date && !courseData.customExcludedDates.includes(date)) {
            handleInputChange('customExcludedDates', [
                ...courseData.customExcludedDates, date
            ]);
        }
    };

    const removeExcludedDate = (dateToRemove) =>
        handleInputChange(
            'customExcludedDates',
            courseData.customExcludedDates.filter(d => d !== dateToRemove)
        );

    const resetCourse = () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar toda la información actual? Esto no se puede deshacer.')) {
            skipNextPersistRef.current = true;
            setCourseData(INITIAL_COURSE_DATA);
            try {
                localStorage.removeItem('courseData');
            } catch {
                // ignore
            }
        }
    };

    return {
        courseData,
        handleInputChange,
        handleDayToggle,
        addExcludedDate,
        removeExcludedDate,
        resetCourse,
        INITIAL_COURSE_DATA
    };
}
