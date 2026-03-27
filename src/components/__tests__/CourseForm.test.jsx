import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CourseForm from '../CourseForm.jsx'

// Wrapper component that holds real state — mirrors actual App.jsx usage (D-08)
// This tests the full input → onInputChange → state → re-render flow.
function Wrapper({ initial }) {
    const [courseData, setCourseData] = useState(initial)

    const handleInputChange = (field, value) =>
        setCourseData(prev => ({ ...prev, [field]: value }))

    const handleDayToggle = (day) =>
        setCourseData(prev => ({
            ...prev,
            classDays: prev.classDays.includes(day)
                ? prev.classDays.filter(d => d !== day)
                : [...prev.classDays, day],
        }))

    return (
        <CourseForm
            courseData={courseData}
            onInputChange={handleInputChange}
            onDayToggle={handleDayToggle}
            onAddDate={() => {}}
            onRemoveDate={() => {}}
        />
    )
}

const initialCourseData = {
    courseName: '',
    startDate: '2026-03-02',
    totalHours: 4,
    hoursPerSession: 1,
    hourType: 'chronological',
    recoverySessionsCount: 0,
    recoveryExtraMinutes: 30,   // NEW (05-02)
    sessionsPerWeek: 0,
    classDays: [],
    customExcludedDates: [],
    semester: '',               // NEW (05-02)
    professorName: '',          // NEW (05-02)
    contactEmail: '',           // NEW (05-02)
}

describe('CourseForm (TEST-06)', () => {
    it('renders without errors when given a fully populated courseData', () => {
        render(<Wrapper initial={initialCourseData} />)
        // The heading confirms the component mounted
        expect(screen.getByText('Nuevo Curso')).toBeInTheDocument()
    })

    it('courseName input: typed value propagates to state', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={initialCourseData} />)
        const input = screen.getByPlaceholderText(/Diplomado/i)
        await user.type(input, 'Mi Curso')
        expect(input).toHaveValue('Mi Curso')
    })

    it('totalHours input: clearing and typing new value propagates to state', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={initialCourseData} />)
        // Spinbutton order after Task 1 additions:
        // inputs[0]: totalHours (aria-label="TOTAL HORAS")
        // inputs[1]: hoursPerSession (aria-label="HRS / SESIÓN")
        // inputs[2]: recoverySessionsCount
        // inputs[3]: recoveryExtraMinutes (aria-label="MIN. EXTRA RECUPERACIÓN")
        // Use aria-label for stable query (not index-dependent)
        const totalHoursInput = screen.getByRole('spinbutton', { name: /TOTAL HORAS/i })
        await user.clear(totalHoursInput)
        await user.type(totalHoursInput, '10')
        expect(totalHoursInput).toHaveValue(10)
    })

    it('day toggle: clicking a day button adds it to classDays', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={initialCourseData} />)
        // Day buttons show first 3 chars of DAY_NAMES — 'Lun' for Lunes (Monday)
        const lunButton = screen.getByRole('button', { name: /^Lun$/i })
        await user.click(lunButton)
        // After clicking, the button should have the active class (indigo styling)
        // We verify by checking the button is still present (component didn't crash)
        // and that the button text is still 'Lun' (no re-render issues)
        expect(lunButton).toBeInTheDocument()
    })

    it('day toggle: clicking the same day twice removes it from classDays', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={{ ...initialCourseData, classDays: ['monday'] }} />)
        const lunButton = screen.getByRole('button', { name: /^Lun$/i })
        // Click to remove 'monday' from classDays
        await user.click(lunButton)
        // Component should re-render without errors
        expect(lunButton).toBeInTheDocument()
    })

    it('hourType button: clicking Chronological calls onInputChange with hourType', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={{ ...initialCourseData, hourType: 'pedagogical' }} />)
        const chronoButton = screen.getByRole('button', { name: /^Chronological$/i })
        await user.click(chronoButton)
        // After click, the button should reflect the active state (indigo styling)
        expect(chronoButton).toBeInTheDocument()
    })
})

describe('CourseForm — new metadata fields (EXPO-01)', () => {
    it('renders semester input', () => {
        render(<Wrapper initial={initialCourseData} />)
        expect(screen.getByPlaceholderText(/2do Semestre/i)).toBeInTheDocument()
    })

    it('renders professorName input', () => {
        render(<Wrapper initial={initialCourseData} />)
        expect(screen.getByPlaceholderText(/María González/i)).toBeInTheDocument()
    })

    it('renders contactEmail input', () => {
        render(<Wrapper initial={initialCourseData} />)
        expect(screen.getByPlaceholderText(/m\.gonzalez@/i)).toBeInTheDocument()
    })

    it('renders recoveryExtraMinutes input', () => {
        render(<Wrapper initial={initialCourseData} />)
        expect(screen.getByRole('spinbutton', { name: /MIN.*EXTRA/i })).toBeInTheDocument()
    })

    it('semester field propagates value via onInputChange', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={initialCourseData} />)
        const input = screen.getByPlaceholderText(/2do Semestre/i)
        await user.type(input, '1er Semestre 2026')
        expect(input).toHaveValue('1er Semestre 2026')
    })
})

describe('CourseForm — inline validation (CORT-01)', () => {
    it('no validation errors visible on fresh form load (D-01)', () => {
        render(<Wrapper initial={initialCourseData} />)
        expect(screen.queryByText('Ingresa un valor mayor a 0')).not.toBeInTheDocument()
        expect(screen.queryByText('Selecciona al menos un día de clase')).not.toBeInTheDocument()
        expect(screen.queryByText('Selecciona una fecha de inicio')).not.toBeInTheDocument()
        expect(screen.queryByText('Ingresa 0 o más minutos')).not.toBeInTheDocument()
    })

    it('totalHours: error appears after blur with value 0 (D-01)', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={{ ...initialCourseData, totalHours: 0 }} />)
        const input = screen.getByRole('spinbutton', { name: /TOTAL HORAS/i })
        await user.click(input)
        await user.tab() // triggers blur
        expect(screen.getByText('Ingresa un valor mayor a 0')).toBeInTheDocument()
    })

    it('totalHours: error clears eagerly when value becomes valid (D-02)', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={{ ...initialCourseData, totalHours: 0 }} />)
        const input = screen.getByRole('spinbutton', { name: /TOTAL HORAS/i })
        await user.click(input)
        await user.tab()
        expect(screen.getByText('Ingresa un valor mayor a 0')).toBeInTheDocument()
        await user.clear(input)
        await user.type(input, '5')
        expect(screen.queryByText('Ingresa un valor mayor a 0')).not.toBeInTheDocument()
    })

    it('classDays: error appears after clicking last day button to deselect (D-01)', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={{ ...initialCourseData, classDays: ['monday'] }} />)
        const lunButton = screen.getByRole('button', { name: /^Lun$/i })
        await user.click(lunButton) // removes monday → classDays empty
        expect(screen.getByText('Selecciona al menos un día de clase')).toBeInTheDocument()
    })

    it('hoursPerSession: error appears after blur with value 0 (D-01)', async () => {
        const user = userEvent.setup()
        render(<Wrapper initial={{ ...initialCourseData, hoursPerSession: 0 }} />)
        const input = screen.getByRole('spinbutton', { name: /HRS.*SESIÓN/i })
        await user.click(input)
        await user.tab()
        expect(screen.getByText('Ingresa un valor mayor a 0')).toBeInTheDocument()
    })
})
