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
});
