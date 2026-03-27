import { useState, useEffect, useMemo } from 'react';
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
// Removed unused DAY_NAMES, DAY_MAPPING
import { useHolidays } from './hooks/useHolidays.js';
import { useCourseData } from './hooks/useCourseData.js';
import { useSchedule } from './hooks/useSchedule.js';
import { formatDateLong, getHolidayName } from './logic/utils';
import CourseForm from './components/CourseForm';
import ScheduleList from './components/ScheduleList';

function App() {
    // --- Extracted Hooks ---
    const {
        courseData,
        handleInputChange,
        handleDayToggle,
        addExcludedDate,
        removeExcludedDate,
        resetCourse
    } = useCourseData();

    const { holidays, holidayWarning } = useHolidays(courseData.startDate);

    const schedule = useSchedule(courseData, holidays);

    // --- Persistent UI Preferences ---
    const [darkMode, setDarkMode] = useState(() => {
        try {
            const stored = localStorage.getItem('darkMode');
            if (stored !== null) return stored === 'true';
            return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        } catch {
            return false;
        }
    });
    useEffect(() => {
        localStorage.setItem('darkMode', String(darkMode));
    }, [darkMode]);

    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem('viewMode') || 'list';
        } catch {
            return 'list';
        }
    });
    useEffect(() => {
        localStorage.setItem('viewMode', viewMode);
    }, [viewMode]);

    const exportToExcel = () => {
        if (schedule.length === 0) return;

        const workbook = XLSX.utils.book_new();
        const data = [
            ['CRONOGRAMA DE CURSO:', courseData.courseName || ''],
            ['Semestre:', courseData.semester || ''],
            ['Profesor/a:', courseData.professorName || ''],
            ['Email:', courseData.contactEmail || ''],
            ['Generado:', new Date().toLocaleDateString()],
            [],
            ['Sesión', 'Fecha', 'Día', 'Tipo', 'Horas Crono', 'Horas Curso', 'Acumuladas', 'Notas']
        ];

        schedule.forEach((s) => {
            const holiday = getHolidayName(s.dateStr, holidays);
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

                        {/* Reset Button */}
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
                        {/* Print-only metadata header — hidden on screen, visible in print/PDF (EXPO-03) */}
                        <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-300">
                            <h1 className="text-2xl font-bold">
                                {courseData.courseName || 'Cronograma de Clases'}
                            </h1>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm">
                                {courseData.semester && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Semestre</span>
                                        <p>{courseData.semester}</p>
                                    </div>
                                )}
                                {courseData.professorName && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profesor/a</span>
                                        <p>{courseData.professorName}</p>
                                    </div>
                                )}
                                {courseData.contactEmail && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
                                        <p>{courseData.contactEmail}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Generado</span>
                                    <p>{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        {holidayWarning && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl text-amber-700 dark:text-amber-400 text-sm no-print">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{holidayWarning}</span>
                            </div>
                        )}
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
                                <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">Primeras <b>{courseData.recoverySessionsCount}</b> sesiones con{' '}
                                <b>{courseData.recoveryExtraMinutes ?? 30}</b> min extra para avance rápido.</p>
                            </div>
                            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                <h4 className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm mb-1"><Calendar size={16} /> Feriados Nacionales</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Feriados nacionales obtenidos en tiempo real desde nager.date para una planificación precisa.</p>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
