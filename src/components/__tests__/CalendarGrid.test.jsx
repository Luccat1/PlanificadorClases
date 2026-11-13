import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarGrid from '../CalendarGrid.jsx';

describe('CalendarGrid', () => {
    const sessions = [
        {
            number: 1,
            date: new Date(2026, 2, 2), // March 2, 2026
            dateStr: '2026-03-02',
            dayName: 'Lunes',
            isRecovery: false,
            isMidCourse: false,
            effHours: 2,
            chronoHours: 2,
            accHours: 2,
        }
    ];

    it('renders session badge on the session date', () => {
        render(<CalendarGrid sessions={sessions} holidays={[]} />);
        expect(screen.getByText('S1 (2.0h)')).toBeInTheDocument();
    });

    it('renders holiday name when holidays array contains a holiday for that month', () => {
        const holidays = [
            { date: '2026-03-20', name: 'Feriado Especial' }
        ];
        render(<CalendarGrid sessions={sessions} holidays={holidays} />);
        expect(screen.getByText('Feriado Especial')).toBeInTheDocument();
    });

    it('updates visible month when sessions change with key reset', () => {
        const marchSessions = [
            {
                number: 1,
                date: new Date(2026, 2, 2), // March 2, 2026
                dateStr: '2026-03-02',
                dayName: 'Lunes',
                effHours: 2,
                chronoHours: 2,
                accHours: 2,
            }
        ];
        const septSessions = [
            {
                number: 1,
                date: new Date(2026, 8, 1), // September 1, 2026
                dateStr: '2026-09-01',
                dayName: 'Martes',
                effHours: 2,
                chronoHours: 2,
                accHours: 2,
            }
        ];

        const { rerender } = render(
            <CalendarGrid key={marchSessions[0]?.dateStr ?? 'empty'} sessions={marchSessions} holidays={[]} />
        );
        expect(screen.getByText(/marzo.*2026/i)).toBeInTheDocument();

        rerender(
            <CalendarGrid key={septSessions[0]?.dateStr ?? 'empty'} sessions={septSessions} holidays={[]} />
        );
        expect(screen.getByText(/septiembre.*2026/i)).toBeInTheDocument();
    });
});
