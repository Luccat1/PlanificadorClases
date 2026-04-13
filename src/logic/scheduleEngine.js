// src/logic/scheduleEngine.js
// No React imports. No side effects. All inputs as parameters.

import { DAY_MAPPING, DAY_NAMES } from './constants';
import { getEffectiveHours } from './utils';

// Re-export so consumers can import getEffectiveHours from here (ARCH-01)
export { getEffectiveHours };

/**
 * Formats a Date object as 'YYYY-MM-DD' using local time (not UTC).
 * Uses local accessors (getFullYear/getMonth/getDate) — timezone-safe for Chilean users.
 * @param {Date} d
 * @returns {string}
 */
function toLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Returns the 'YYYY-MM-DD' of the Monday that anchors the calendar week
 * containing the given date (Mon–Sun definition).
 * @param {Date} date
 * @returns {string}
 */
function getWeekKey(date) {
    const d = new Date(date); // copy — do not mutate caller's date
    const day = d.getDay();   // 0=Sun, 1=Mon...6=Sat
    const diff = (day === 0) ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toLocalDateStr(d);
}

/**
 * Returns true if the date should be excluded from the schedule.
 * @param {Date} date
 * @param {Array<{date: string, name: string}>} holidays
 * @param {string[]} customExcludedDates
 * @returns {boolean}
 */
export function isDateExcluded(date, holidays, customExcludedDates) {
    const dateStr = toLocalDateStr(date);
    if (date.getDay() === 0) return true; // Sunday
    if (holidays.some(h => h.date === dateStr)) return true;
    if (customExcludedDates.includes(dateStr)) return true;
    return false;
}

/**
 * Calculates the full session schedule.
 * Pure function — no React, no side effects, no global state.
 * @param {object} courseData
 * @param {Array<{date: string, name: string}>} holidays
 * @returns {object[]} session array
 */
export function calculateSchedule(courseData, holidays) {
    if (!courseData.startDate || courseData.classDays.length === 0) {
        return [];
    }

    const startObj = new Date(courseData.startDate + 'T00:00:00');
    const targetDayNums = courseData.classDays.map(d => DAY_MAPPING[d]);

    const effNormal = getEffectiveHours(courseData.hoursPerSession, courseData.hourType);
    const recoveryBonusHours = (courseData.recoveryExtraMinutes ?? 30) / 60;
    const effRecovery = getEffectiveHours(
        courseData.hoursPerSession + recoveryBonusHours,
        courseData.hourType
    );

    if (effNormal <= 0) return [];

    const sessions = [];
    const weekSessionCounts = new Map();
    const current = new Date(startObj);
    let sessionCount = 0;
    let accumulatedEff = 0;
    let midCourseFound = false;
    let safetyCounter = 0;

    while (accumulatedEff < courseData.totalHours && safetyCounter < 1500) {
        const dayNum = current.getDay();

        if (
            targetDayNums.includes(dayNum) &&
            !isDateExcluded(current, holidays, courseData.customExcludedDates)
        ) {
            // sessionsPerWeek cap check (CORT-03)
            const weekKey = getWeekKey(current);
            const weekCount = weekSessionCounts.get(weekKey) || 0;
            if (courseData.sessionsPerWeek > 0 && weekCount >= courseData.sessionsPerWeek) {
                current.setDate(current.getDate() + 1);
                safetyCounter++;
                continue;
            }
            weekSessionCounts.set(weekKey, weekCount + 1);

            const dayKey =
                Object.keys(DAY_MAPPING).find(k => DAY_MAPPING[k] === dayNum) || 'monday';

            // Per-day variable duration (D-12)
            const perDayHours = courseData.perDayHours || {};
            const hasPerDay = Object.keys(perDayHours).length > 0 && perDayHours[dayKey] != null;
            const baseHours = hasPerDay ? perDayHours[dayKey] : courseData.hoursPerSession;
            const effDay = getEffectiveHours(baseHours, courseData.hourType);
            const effDayRecovery = getEffectiveHours(baseHours + recoveryBonusHours, courseData.hourType);

            sessionCount++;
            const isRecovery = sessionCount <= courseData.recoverySessionsCount;
            const currentEff = isRecovery ? effDayRecovery : effDay;
            const prevEff = accumulatedEff;
            accumulatedEff += currentEff;

            const isMid =
                !midCourseFound &&
                prevEff < courseData.totalHours / 2 &&
                accumulatedEff >= courseData.totalHours / 2;
            if (isMid) midCourseFound = true;

            sessions.push({
                number: sessionCount,
                date: new Date(current),
                dateStr: toLocalDateStr(current),   // timezone-safe local date string
                dayName: DAY_NAMES[dayKey],
                isRecovery,
                isMidCourse: isMid,
                chronoHours: isRecovery ? baseHours + recoveryBonusHours : baseHours,
                effHours: currentEff,
                accHours: accumulatedEff
            });
        }

        current.setDate(current.getDate() + 1);
        safetyCounter++;
    }

    return sessions;
}
