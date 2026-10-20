/**
 * Validation rules and helpers for course data.
 * Consolidates form error messaging (CourseForm) and schedule generation validity guards (useSchedule).
 */

/**
 * Returns an error message for a given field if invalid, or null if valid.
 *
 * @param {string} field - Field name to validate
 * @param {object} courseData - Current course configuration
 * @returns {string|null} Error message or null
 */
export function getFieldError(field, courseData) {
    if (!courseData) return null;
    switch (field) {
        case 'totalHours':
            return (!courseData.totalHours || courseData.totalHours <= 0)
                ? 'Ingresa un valor mayor a 0' : null;
        case 'hoursPerSession':
            return (!courseData.hoursPerSession || courseData.hoursPerSession <= 0)
                ? 'Ingresa un valor mayor a 0' : null;
        case 'startDate':
            return !courseData.startDate
                ? 'Selecciona una fecha de inicio' : null;
        case 'classDays':
            return (!courseData.classDays || courseData.classDays.length === 0)
                ? 'Selecciona al menos un día de clase' : null;
        case 'recoveryExtraMinutes':
            return (courseData.recoveryExtraMinutes == null || courseData.recoveryExtraMinutes < 0)
                ? 'Ingresa 0 o más minutos' : null;
        default:
            return null;
    }
}

/**
 * Returns true if all mandatory courseData fields are valid for schedule calculation.
 *
 * @param {object} courseData
 * @returns {boolean}
 */
export function isCourseDataValid(courseData) {
    if (!courseData) return false;
    const requiredFields = [
        'totalHours',
        'hoursPerSession',
        'startDate',
        'classDays',
        'recoveryExtraMinutes'
    ];
    return requiredFields.every(field => getFieldError(field, courseData) === null);
}
