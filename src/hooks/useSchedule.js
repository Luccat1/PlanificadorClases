import { useMemo } from 'react';
import { calculateSchedule } from '../logic/scheduleEngine';

/**
 * Returns false when courseData has fields that would produce a meaningless schedule.
 * Duplicate of CourseForm's getError logic — intentional (D-04: no prop threading).
 * @param {object} courseData
 * @returns {boolean}
 */
function isFormValid(courseData) {
    return (
        courseData.totalHours > 0 &&
        courseData.hoursPerSession > 0 &&
        Boolean(courseData.startDate) &&
        courseData.classDays.length > 0 &&
        (courseData.recoveryExtraMinutes ?? 0) >= 0
    );
}

/**
 * Derives the schedule from courseData and holidays using useMemo.
 * Returns [] immediately when form inputs are invalid (D-05).
 * Extracted from App.jsx (Phase 3 — ARCH-03).
 *
 * @param {object} courseData  - Full course configuration object
 * @param {Array}  holidays    - Array of { date: string, name: string }
 * @returns {Array} schedule   - Array of session objects, or [] if inputs are invalid
 */
export function useSchedule(courseData, holidays) {
    return useMemo(
        () => isFormValid(courseData) ? calculateSchedule(courseData, holidays) : [],
        [courseData, holidays]
    );
}
