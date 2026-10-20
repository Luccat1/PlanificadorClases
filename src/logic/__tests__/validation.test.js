import { describe, it, expect } from 'vitest';
import { getFieldError, isCourseDataValid } from '../validation.js';

describe('validation logic', () => {
    const validData = {
        totalHours: 40,
        hoursPerSession: 2,
        startDate: '2026-03-02',
        classDays: ['monday'],
        recoveryExtraMinutes: 30,
    };

    it('returns null for valid fields', () => {
        expect(getFieldError('totalHours', validData)).toBeNull();
        expect(getFieldError('hoursPerSession', validData)).toBeNull();
        expect(getFieldError('startDate', validData)).toBeNull();
        expect(getFieldError('classDays', validData)).toBeNull();
        expect(getFieldError('recoveryExtraMinutes', validData)).toBeNull();
        expect(isCourseDataValid(validData)).toBe(true);
    });

    it('validates totalHours > 0', () => {
        expect(getFieldError('totalHours', { ...validData, totalHours: 0 })).toBe('Ingresa un valor mayor a 0');
        expect(getFieldError('totalHours', { ...validData, totalHours: -5 })).toBe('Ingresa un valor mayor a 0');
        expect(isCourseDataValid({ ...validData, totalHours: 0 })).toBe(false);
    });

    it('validates hoursPerSession > 0', () => {
        expect(getFieldError('hoursPerSession', { ...validData, hoursPerSession: 0 })).toBe('Ingresa un valor mayor a 0');
        expect(isCourseDataValid({ ...validData, hoursPerSession: 0 })).toBe(false);
    });

    it('validates startDate presence', () => {
        expect(getFieldError('startDate', { ...validData, startDate: '' })).toBe('Selecciona una fecha de inicio');
        expect(isCourseDataValid({ ...validData, startDate: '' })).toBe(false);
    });

    it('validates classDays has at least one day', () => {
        expect(getFieldError('classDays', { ...validData, classDays: [] })).toBe('Selecciona al menos un día de clase');
        expect(isCourseDataValid({ ...validData, classDays: [] })).toBe(false);
    });

    it('validates recoveryExtraMinutes >= 0', () => {
        expect(getFieldError('recoveryExtraMinutes', { ...validData, recoveryExtraMinutes: -1 })).toBe('Ingresa 0 o más minutos');
        expect(isCourseDataValid({ ...validData, recoveryExtraMinutes: -1 })).toBe(false);
    });

    it('returns false when courseData is null or undefined', () => {
        expect(isCourseDataValid(null)).toBe(false);
        expect(getFieldError('totalHours', null)).toBeNull();
    });
});
