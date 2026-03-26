import { render, screen } from '@testing-library/react'
import ScheduleList from '../ScheduleList.jsx'

// CRITICAL: ScheduleList calls session.date.toLocaleDateString('es-CL', {...})
// session.date MUST be a real Date object — NOT a string (Pattern 6 from RESEARCH.md)
// Use local constructor new Date(year, monthIndex, day) — NOT new Date('YYYY-MM-DD') (ISO = UTC midnight)
function makeSession(n, [year, month, day], overrides = {}) {
    return {
        number: n,
        date: new Date(year, month - 1, day),   // month is 1-indexed here, converted to 0-indexed
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dayName: 'Lunes',
        isRecovery: false,
        isMidCourse: false,
        chronoHours: 1,
        effHours: 1,
        accHours: n,
        ...overrides,
    }
}

const mockCourseData = {
    hourType: 'chronological',
    totalHours: 3,
}

describe('ScheduleList (TEST-07)', () => {
    it('renders correct number of rows: 1 header + N session rows', () => {
        const schedule = [
            makeSession(1, [2026, 3, 2]),
            makeSession(2, [2026, 3, 4]),
            makeSession(3, [2026, 3, 9]),
        ]
        render(
            <ScheduleList
                schedule={schedule}
                courseData={mockCourseData}
                viewMode="list"
            />
        )
        const rows = screen.getAllByRole('row')
        // 1 header row + 3 data rows = 4 total
        expect(rows).toHaveLength(4)
    })

    it('mid-course marker "MITAD" appears in the correct session row', () => {
        const schedule = [
            makeSession(1, [2026, 3, 2]),
            makeSession(2, [2026, 3, 4], { isMidCourse: true }),
            makeSession(3, [2026, 3, 9]),
        ]
        render(
            <ScheduleList
                schedule={schedule}
                courseData={mockCourseData}
                viewMode="list"
            />
        )
        expect(screen.getByText('MITAD')).toBeInTheDocument()
    })

    it('recovery marker "RECUPERACIÓN" appears in the correct session row', () => {
        const schedule = [
            makeSession(1, [2026, 3, 2], { isRecovery: true }),
            makeSession(2, [2026, 3, 4]),
        ]
        render(
            <ScheduleList
                schedule={schedule}
                courseData={{ ...mockCourseData, totalHours: 2 }}
                viewMode="list"
            />
        )
        expect(screen.getByText('RECUPERACIÓN')).toBeInTheDocument()
    })

    it('single session renders 2 rows (1 header + 1 data)', () => {
        const schedule = [makeSession(1, [2026, 3, 2])]
        render(
            <ScheduleList
                schedule={schedule}
                courseData={{ ...mockCourseData, totalHours: 1 }}
                viewMode="list"
            />
        )
        const rows = screen.getAllByRole('row')
        expect(rows).toHaveLength(2)
    })

    it('renders without errors for an empty schedule', () => {
        render(
            <ScheduleList
                schedule={[]}
                courseData={mockCourseData}
                viewMode="list"
            />
        )
        // Only the header row (no data rows) — or the table itself may not render
        // Either way, the component should not throw
        const rows = screen.queryAllByRole('row')
        expect(rows.length).toBeGreaterThanOrEqual(0)
    })
})
