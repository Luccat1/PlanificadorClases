// Phase 6 Plan 1: Tests for perDayHours branch in calculateSchedule (D-12)
// TDD RED — these tests fail before the implementation changes.

import { calculateSchedule } from '../../logic/scheduleEngine.js';

// Base fixture — all required fields present
const base = {
    startDate: '2026-03-02',          // Monday
    classDays: ['monday', 'thursday'],
    totalHours: 5,
    hoursPerSession: 2,
    hourType: 'chronological',
    recoverySessionsCount: 0,
    sessionsPerWeek: 0,               // 0 = uncapped
    customExcludedDates: [],
    recoveryExtraMinutes: 30,
    perDayHours: {},
};

// Monday 2026-03-02, Thursday 2026-03-05, Monday 2026-03-09, Thursday 2026-03-12...

describe('calculateSchedule — perDayHours (D-12)', () => {
    it('empty perDayHours behaves identically to before (uses hoursPerSession)', () => {
        const sessions = calculateSchedule({ ...base, perDayHours: {} }, []);
        // With hoursPerSession=2, totalHours=5: need 3 sessions (2+2+2 >= 5)
        expect(sessions.length).toBeGreaterThan(0);
        expect(sessions[0].chronoHours).toBe(2);
        expect(sessions[1].chronoHours).toBe(2);
    });

    it('undefined perDayHours behaves identically to before (uses hoursPerSession)', () => {
        const { perDayHours: _dropped, ...noPerDay } = base;
        const sessions = calculateSchedule(noPerDay, []);
        expect(sessions.length).toBeGreaterThan(0);
        expect(sessions[0].chronoHours).toBe(2);
    });

    it('perDayHours {monday:1.5} uses 1.5h for Monday sessions', () => {
        const sessions = calculateSchedule({
            ...base,
            perDayHours: { monday: 1.5 },
            totalHours: 3,
        }, []);
        const mondaySessions = sessions.filter(s => s.dayName === 'Lunes');
        expect(mondaySessions.length).toBeGreaterThan(0);
        expect(mondaySessions[0].chronoHours).toBeCloseTo(1.5);
    });

    it('perDayHours {thursday:1.0} uses 1.0h for Thursday sessions', () => {
        const sessions = calculateSchedule({
            ...base,
            perDayHours: { thursday: 1.0 },
            totalHours: 3,
        }, []);
        const thursdaySessions = sessions.filter(s => s.dayName === 'Jueves');
        expect(thursdaySessions.length).toBeGreaterThan(0);
        expect(thursdaySessions[0].chronoHours).toBeCloseTo(1.0);
    });

    it('day not in perDayHours map falls back to hoursPerSession', () => {
        // Only monday is in map; thursday sessions should use hoursPerSession=2
        const sessions = calculateSchedule({
            ...base,
            perDayHours: { monday: 1.5 },
            totalHours: 4,
        }, []);
        const thursdaySessions = sessions.filter(s => s.dayName === 'Jueves');
        expect(thursdaySessions.length).toBeGreaterThan(0);
        expect(thursdaySessions[0].chronoHours).toBeCloseTo(2);
    });

    it('perDayHours applies chronoHours correctly for per-day entries', () => {
        const sessions = calculateSchedule({
            ...base,
            classDays: ['monday', 'thursday'],
            perDayHours: { monday: 1.5, thursday: 1.0 },
            totalHours: 3,
        }, []);
        // Mon 2026-03-02: 1.5h, Thu 2026-03-05: 1.0h, Mon 2026-03-09: 1.5h → total 4.0h >= 3
        const monday1 = sessions.find(s => s.dateStr === '2026-03-02');
        const thursday1 = sessions.find(s => s.dateStr === '2026-03-05');
        expect(monday1).toBeDefined();
        expect(thursday1).toBeDefined();
        expect(monday1.chronoHours).toBeCloseTo(1.5);
        expect(thursday1.chronoHours).toBeCloseTo(1.0);
    });

    it('accumulated hours reflect per-day values (not uniform hoursPerSession)', () => {
        const sessions = calculateSchedule({
            ...base,
            classDays: ['monday', 'thursday'],
            perDayHours: { monday: 1.5, thursday: 1.0 },
            totalHours: 3,
        }, []);
        // Mon: accHours=1.5, Thu: accHours=2.5, Mon: accHours=4.0 (>= 3)
        expect(sessions[0].accHours).toBeCloseTo(1.5);
        expect(sessions[1].accHours).toBeCloseTo(2.5);
    });

    it('recovery session with per-day override uses perDayHours[dayKey] + recoveryBonusHours', () => {
        const sessions = calculateSchedule({
            ...base,
            classDays: ['monday'],
            perDayHours: { monday: 1.5 },
            recoverySessionsCount: 1,
            recoveryExtraMinutes: 30,   // bonus = 0.5h
            totalHours: 5,
        }, []);
        const recovery = sessions.find(s => s.isRecovery);
        expect(recovery).toBeDefined();
        // chronoHours = 1.5 + 0.5 = 2.0
        expect(recovery.chronoHours).toBeCloseTo(2.0);
    });

    it('recovery session on day NOT in perDayHours falls back to hoursPerSession + bonus', () => {
        // Thursday not in map, recovery should use base hoursPerSession=2 + 0.5 = 2.5
        const sessions = calculateSchedule({
            ...base,
            classDays: ['thursday'],
            perDayHours: { monday: 1.5 },   // thursday not in map
            recoverySessionsCount: 1,
            recoveryExtraMinutes: 30,
            totalHours: 5,
        }, []);
        const recovery = sessions.find(s => s.isRecovery);
        expect(recovery).toBeDefined();
        expect(recovery.chronoHours).toBeCloseTo(2.5);
    });
});
