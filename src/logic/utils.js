import { CHILEAN_HOLIDAYS_2026 } from './constants';

/**
 * @param {number} chronologicalHours
 * @param {string} hourType
 */
export const getEffectiveHours = (chronologicalHours, hourType) => {
    const multipliers = {
        pedagogical: 60 / 45,
        dgai: 60 / 35,
        chronological: 1
    };
    return chronologicalHours * (multipliers[hourType] || 1);
};

/**
 * @param {string} dateStr
 */
export const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * @param {string} dateStr
 */
export const getHolidayName = (dateStr) => {
    const holiday = CHILEAN_HOLIDAYS_2026.find(h => h.date === dateStr);
    return holiday ? holiday.name : null;
};
