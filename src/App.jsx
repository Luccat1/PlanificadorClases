import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar,
    BookOpen,
    AlertCircle,
    Download,
    Printer,
    TrendingUp,
    Award,
    CalendarDays,
    Moon,
    Sun,
    List,
    LayoutGrid,
    Trash
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Modular Imports
import { DAY_NAMES, DAY_MAPPING, CHILEAN_HOLIDAYS_2026 } from './logic/constants';
import { getEffectiveHours, formatDateLong, getHolidayName } from './logic/utils';
import CalendarGrid from './components/CalendarGrid';
import CourseForm from './components/CourseForm';
import ScheduleList from './components/ScheduleList';

function App() {
    // --- State Initialization ---
    // Initial default state for resetting
    const initialCourseData = {
        courseName: '',
        startDate: '',
        sessionsPerWeek: 2,
        classDays: ['monday', 'wednesday'],
        totalHours: 40,
        hourType: 'pedagogical',
        hoursPerSession: 2,
        recoverySessionsCount: 0,
        customExcludedDates: []
    };

    const [courseData, setCourseData] = useState(() => {
        try {
            const savedData = typeof window !== 'undefined' ? localStorage.getItem('courseData') : null;
            return savedData ? JSON.parse(savedData) : initialCourseData;
        } catch (e) {
            return initialCourseData;
        }
    });

    const [schedule, setSchedule] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    // --- Effects ---
    // Persist data to localStorage whenever courseData changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('courseData', JSON.stringify(courseData));
        }
    }, [courseData]);

    // --- Logic Helpers ---

    /**
     * strict check if a date should be skipped in the schedule
     */
    const isDateExcluded = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0) return true; // Sunday off
        if (CHILEAN_HOLIDAYS_2026.some(h => h.date === dateStr)) return true;
        if (courseData.customExcludedDates.includes(dateStr)) return true;
        return false;
    }, [courseData.customExcludedDates]);

    /**
     * Core Algorithm: Calculates the entire class schedule based on configuration.
     * Iterates day by day until total required hours are met.
     */
    const calculateSchedule = useCallback(() => {
        if (!courseData.startDate || courseData.classDays.length === 0) {
            setSchedule([]);
            return;
        }

        const startObj = new Date(courseData.startDate + 'T00:00:00');
        const targetDayNums = courseData.classDays.map((d) => DAY_MAPPING[d]);

        const effNormal = getEffectiveHours(courseData.hoursPerSession, courseData.hourType);
        const effRecovery = getEffectiveHours(courseData.hoursPerSession + 0.5, courseData.hourType);

        if (effNormal <= 0) {
            setSchedule([]);
            return;
        }

        let sessions = [];
        let current = new Date(startObj);
        let sessionCount = 0;
        let accumulatedEff = 0;
        let midCourseFound = false;
        let safetyCounter = 0;

        const totalHoursNeeded = courseData.totalHours;

        // Loop until we reach the target hours or hit a safety limit
        while (accumulatedEff < totalHoursNeeded && safetyCounter < 1500) {
            const dayNum = current.getDay();

            if (targetDayNums.includes(dayNum) && !isDateExcluded(current)) {
                sessionCount++;
                const isRecovery = sessionCount <= courseData.recoverySessionsCount;
                const currentEff = isRecovery ? effRecovery : effNormal;

                const prevEff = accumulatedEff;
                accumulatedEff += currentEff;

                const isMid = !midCourseFound && prevEff < (totalHoursNeeded / 2) && accumulatedEff >= (totalHoursNeeded / 2);
                if (isMid) midCourseFound = true;

                const dayKey = Object.keys(DAY_MAPPING).find((key) => DAY_MAPPING[key] === dayNum) || 'monday';

                sessions.push({
                    number: sessionCount,
                    date: new Date(current),
                    dateStr: current.toISOString().split('T')[0],
                    dayName: DAY_NAMES[dayKey],
                    isRecovery,
                    isMidCourse: isMid,
                    chronoHours: isRecovery ? courseData.hoursPerSession + 0.5 : courseData.hoursPerSession,
                    effHours: currentEff,
                    accHours: accumulatedEff
                });
            }

            current.setDate(current.getDate() + 1);
            safetyCounter++;
        }

        setSchedule(sessions);
    }, [courseData, isDateExcluded]);

    useEffect(() => {
        calculateSchedule();
    }, [courseData, calculateSchedule]);

    // --- Handlers ---
    
    const handleInputChange = (field, value) => {
        setCourseData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDayToggle = (day) => {
        setCourseData((prev) => ({
            ...prev,
            classDays: prev.classDays.includes(day)
                ? prev.classDays.filter((d) => d !== day)
                : [...prev.classDays, day]
        }));
    };

    const addExcludedDate = (date) => {
        if (date && !courseData.customExcludedDates.includes(date)) {
            handleInputChange('customExcludedDates', [...courseData.customExcludedDates, date]);
        }
    };

    const removeExcludedDate = (dateToRemove) => {
        handleInputChange('customExcludedDates', courseData.customExcludedDates.filter((d) => d !== dateToRemove));
    };

    /**
     * Resets the application state to a blank slate
     */
    const resetCourse = () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar toda la información actual? Esto no se puede deshacer.')) {
            setCourseData(initialCourseData);
            setSchedule([]);
            localStorage.removeItem('courseData');
        }
    };

    const exportToExcel = () => {
        if (schedule.length === 0) return;

        const workbook = XLSX.utils.book_new();
        const data = [
            ['CRONOGRAMA DE CURSO: ' + (courseData.courseName || 'Sin Nombre')],
            ['Fecha de Generación: ' + new Date().toLocaleDateString()],
            [],
            ['Sesión', 'Fecha', 'Día', 'Tipo', 'Horas Crono', 'Horas Curso', 'Acumuladas', 'Notas']
        ];

        schedule.forEach((s) => {
            const holiday = getHolidayName(s.dateStr);
            let notes = [];
            if (holiday) notes.push('Feriado: ' + holiday);
            if (s.isMidCourse) notes.push('MITAD DEL CURSO');

            data.push([
                s.number,
                s.date.toLocaleDateString(),
                s.dayName,
                s.isRecovery ? 'Recuperación' : 'Normal',
                s.chronoHours,
                s.effHours.toFixed(2),
                s.accHours.toFixed(2),
                notes.join(' | ')
            ]);
        });

        const sheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Cronograma');
        XLSX.writeFile(workbook, `Cronograma_${courseData.courseName || 'Curso'}.xlsx`);
    };

    const stats = useMemo(() => {
        if (schedule.length === 0) return null;
        const endDateStr = schedule[schedule.length - 1].dateStr;
        const startDate = schedule[0].date;
        const endDate = schedule[schedule.length - 1].date;
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1;

        return {
            endDate: endDateStr,
            totalSessions: schedule.length,
            weeks,
            avgHoursPerWeek: (courseData.totalHours / weeks).toFixed(1)
        };
    }, [schedule, courseData.totalHours]);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 no-print">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                            <CalendarDays size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                                Planificador Pro
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gestión inteligente de cronogramas académicos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List size={16} /> Lista
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutGrid size={16} /> Grid
                            </button>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-500 transition-all"
                            title="Cambiar tema"
                        >
                            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
                        </button>
                        
                        {/* New Reset Button */}
                        <button 
                            onClick={resetCourse}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-rose-500 hover:text-rose-500 transition-all"
                            title="Eliminar todo / Reiniciar"
                        >
                            <Trash size={20} />
                        </button>

                        <div className="flex gap-2">
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95">
                                <Download size={18} /> Excel
                            </button>
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-rose-600/20 transition-all active:scale-95">
                                <Printer size={18} /> PDF
                            </button>
                        </div>
                    </div>
                </header>

                <main className="grid lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-4 space-y-6 no-print">
                        <CourseForm 
                            courseData={courseData}
                            onInputChange={handleInputChange}
                            onDayToggle={handleDayToggle}
                            onAddDate={addExcludedDate}
                            onRemoveDate={removeExcludedDate}
                        />
                    </aside>

                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {schedule.length > 0 ? (
                            <>
                                <section className="grid sm:grid-cols-3 gap-4">
                                    <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-indigo-600/20">
                                        <TrendingUp size={24} className="mb-4 opacity-70" />
                                        <p className="text-sm font-medium opacity-80">Sesiones Totales</p>
                                        <h3 className="text-3xl font-bold">{stats.totalSessions}</h3>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                                        <Award size={24} className="mb-4 text-emerald-500" />
                                        <p className="text-sm font-medium text-slate-500">Término Estimado</p>
                                        <h3 className="text-lg font-bold">{formatDateLong(stats.endDate)}</h3>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                                        <Calendar size={24} className="mb-4 text-amber-500" />
                                        <p className="text-sm font-medium text-slate-500">Intensidad <span className="text-[10px] font-normal text-slate-400">(hrs/sem)</span></p>
                                        <h3 className="text-lg font-bold">{stats.avgHoursPerWeek} <span className="text-xs font-normal text-slate-400">promedio</span></h3>
                                    </div>
                                </section>

                                {/* Schedule Container - Refactored into ScheduleList */}
                                <section className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col ${viewMode === 'list' ? 'h-[600px] print-h-auto' : ''}`}>
                                    <ScheduleList 
                                        schedule={schedule}
                                        courseData={courseData}
                                        viewMode={viewMode}
                                    />
                                </section>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-slate-300"><BookOpen size={64} /></div>
                                <div><h3 className="text-xl font-bold">Listos para empezar</h3><p className="text-slate-500 max-w-xs mx-auto">Configura los detalles del curso en el panel lateral para generar el cronograma automático.</p></div>
                            </div>
                        )}

                        <footer className="grid sm:grid-cols-2 gap-4 no-print">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                <h4 className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-1"><AlertCircle size={16} /> Recuperación Activa</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">Primeras <b>{courseData.recoverySessionsCount}</b> sesiones con 30 min extra para avance rápido.</p>
                            </div>
                            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                <h4 className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm mb-1"><Calendar size={16} /> Feriados Nacionales</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Detección automática de feriados chilenos 2026 para una planificación real.</p>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
