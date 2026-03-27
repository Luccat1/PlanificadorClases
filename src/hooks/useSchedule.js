import { useMemo } from 'react';
import { calculateSchedule } from '../logic/scheduleEngine';

/**
 * Derives the schedule from courseData and holidays using useMemo.
 * Recomputes synchronously whenever courseData or holidays changes.
 * Extracted from App.jsx (Phase 3 — ARCH-03).
 *
 * @param {object} courseData  - Full course configuration object
 * @param {Array}  holidays    - Array of { date: string, name: string }
 * @returns {Array} schedule   - Array of session objects from calculateSchedule
 */
export function useSchedule(courseData, holidays) {
    return useMemo(
        () => calculateSchedule(courseData, holidays),
        [courseData, holidays]
    );
}
