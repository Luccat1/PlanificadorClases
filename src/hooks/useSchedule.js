import { useMemo } from 'react';
import { calculateSchedule } from '../logic/scheduleEngine';
import { isCourseDataValid } from '../logic/validation';

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
        () => isCourseDataValid(courseData) ? calculateSchedule(courseData, holidays) : [],
        [courseData, holidays]
    );
}
