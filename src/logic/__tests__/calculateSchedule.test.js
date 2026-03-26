import { calculateSchedule } from '../../logic/scheduleEngine.js'

// Minimal courseData fixture — ALL fields required (omitting any produces unexpected results)
const base = {
    startDate: '2026-03-02',          // Monday
    classDays: ['monday', 'wednesday'],
    totalHours: 4,
    hoursPerSession: 1,
    hourType: 'chronological',
    recoverySessionsCount: 0,
    sessionsPerWeek: 0,               // 0 = uncapped
    customExcludedDates: [],
}

// ─── TEST-03: calculateSchedule correctness ───────────────────────────────────

describe('calculateSchedule — basic correctness (TEST-03)', () => {
    it('returns empty array when startDate is missing', () => {
        const sessions = calculateSchedule({ ...base, startDate: '' }, [])
        expect(sessions).toHaveLength(0)
    })

    it('returns empty array when classDays is empty', () => {
        const sessions = calculateSchedule({ ...base, classDays: [] }, [])
        expect(sessions).toHaveLength(0)
    })

    it('schedules the correct number of sessions (4h total, 1h/session → 4 sessions)', () => {
        const sessions = calculateSchedule(base, [])
        expect(sessions).toHaveLength(4)
    })

    it('accumulated hours of last session reaches totalHours', () => {
        const sessions = calculateSchedule(base, [])
        const last = sessions[sessions.length - 1]
        expect(last.accHours).toBeGreaterThanOrEqual(base.totalHours)
    })

    it('skips holiday dates (holiday on 2026-03-02 → first session is 2026-03-04)', () => {
        const holidays = [{ date: '2026-03-02', name: 'Test Holiday' }]
        const sessions = calculateSchedule(base, holidays)
        expect(sessions[0].dateStr).toBe('2026-03-04')
    })

    it('skips customExcludedDates (excluded 2026-03-02 → first session is 2026-03-04)', () => {
        const sessions = calculateSchedule(
            { ...base, customExcludedDates: ['2026-03-02'] },
            []
        )
        expect(sessions[0].dateStr).toBe('2026-03-04')
    })

    it('mid-course marker appears exactly once at the crossing point', () => {
        const sessions = calculateSchedule(base, [])
        const midSessions = sessions.filter(s => s.isMidCourse)
        expect(midSessions).toHaveLength(1)
        // With 4h total and 1h/session: crossing at 2h; session 2 (accHours=2) is the first to cross 2h
        expect(midSessions[0].number).toBe(2)
    })

    it('first recovery session has chronoHours = hoursPerSession + 0.5 and isRecovery=true', () => {
        const sessions = calculateSchedule({ ...base, recoverySessionsCount: 1 }, [])
        expect(sessions[0].isRecovery).toBe(true)
        expect(sessions[0].chronoHours).toBe(base.hoursPerSession + 0.5)
    })

    it('non-recovery sessions have isRecovery=false and chronoHours = hoursPerSession', () => {
        const sessions = calculateSchedule({ ...base, recoverySessionsCount: 1 }, [])
        expect(sessions[1].isRecovery).toBe(false)
        expect(sessions[1].chronoHours).toBe(base.hoursPerSession)
    })
})

// ─── TEST-04: sessionsPerWeek cap ────────────────────────────────────────────

describe('calculateSchedule — sessionsPerWeek cap (TEST-04)', () => {
    it('sessionsPerWeek=2 with Mon/Wed/Fri caps at 2 per week (Friday skipped)', () => {
        const courseData = {
            ...base,
            startDate: '2026-03-02',  // Monday
            classDays: ['monday', 'wednesday', 'friday'],
            totalHours: 6,
            sessionsPerWeek: 2,
        }
        const sessions = calculateSchedule(courseData, [])
        // Week 1 (Mar 2–6): Monday + Wednesday = 2. Friday skipped.
        const week1 = sessions.filter(s => s.dateStr >= '2026-03-02' && s.dateStr <= '2026-03-06')
        expect(week1).toHaveLength(2)
        const week1Dates = week1.map(s => s.dateStr)
        expect(week1Dates).toContain('2026-03-02')
        expect(week1Dates).toContain('2026-03-04')
        expect(week1Dates).not.toContain('2026-03-06')
    })

    it('sessionsPerWeek=0 is uncapped — all qualifying days are scheduled', () => {
        const courseData = {
            ...base,
            startDate: '2026-03-02',
            classDays: ['monday', 'wednesday', 'friday'],
            totalHours: 3,
            sessionsPerWeek: 0,
        }
        const sessions = calculateSchedule(courseData, [])
        // With 3h total and 1h/session, should schedule 3 sessions (Mon, Wed, Fri of week 1)
        expect(sessions).toHaveLength(3)
    })

    it('year-boundary edge case: sessionsPerWeek=1 across Dec/Jan boundary', () => {
        // Dec 28 2026 is Monday (last week of 2026)
        // Jan 4 2027 is Monday (first week of 2027)
        // weekKey rollover must produce distinct keys for these two weeks
        const courseData = {
            ...base,
            startDate: '2026-12-28',
            classDays: ['monday'],
            totalHours: 2,
            hoursPerSession: 1,
            sessionsPerWeek: 1,
        }
        const sessions = calculateSchedule(courseData, [])
        expect(sessions).toHaveLength(2)
        expect(sessions[0].dateStr).toBe('2026-12-28')
        expect(sessions[1].dateStr).toBe('2027-01-04')
    })
})

// ─── TEST-05: timezone UTC-3 regression ──────────────────────────────────────

describe('calculateSchedule — timezone correctness (TEST-05)', () => {
    it('dateStr is correct and not off-by-one (UTC-3 regression)', () => {
        // In UTC-3: new Date('2026-03-02') parses as UTC midnight → local time is 2026-03-01T21:00:00
        // scheduleEngine uses startDate + 'T00:00:00' (local midnight) and toLocalDateStr (local accessors)
        // Both prevent the UTC-midnight-shift bug.
        const courseData = {
            ...base,
            startDate: '2026-03-02',
            classDays: ['monday'],
            totalHours: 1,
        }
        const sessions = calculateSchedule(courseData, [])
        expect(sessions[0].dateStr).toBe('2026-03-02')
    })

    it('session.date local accessors return correct year/month/day (not UTC-shifted)', () => {
        const courseData = {
            ...base,
            startDate: '2026-03-02',
            classDays: ['monday'],
            totalHours: 1,
        }
        const sessions = calculateSchedule(courseData, [])
        const d = sessions[0].date
        // These local accessors must return 2026-03-02 — not 2026-03-01 (UTC shift bug)
        expect(d.getFullYear()).toBe(2026)
        expect(d.getMonth()).toBe(2)   // 0-indexed: 2 = March
        expect(d.getDate()).toBe(2)
    })
})
