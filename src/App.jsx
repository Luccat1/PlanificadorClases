import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar,
    Clock,
    BookOpen,
    AlertCircle,
    Download,
    Printer,
    Trash2,
    Plus,
    TrendingUp,
    Award,
    CalendarDays,
    Moon,
    Sun,
    LayoutGrid,
    List
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Modular Imports
import { DAY_NAMES, DAY_MAPPING, CHILEAN_HOLIDAYS_2026 } from './logic/constants';
import { getEffectiveHours, formatDateLong, getHolidayName } from './logic/utils';
import CalendarGrid from './components/CalendarGrid';

function App() {
    // --- State ---
    const [courseData, setCourseData] = useState(() => {
        try {
            const savedData = typeof window !== 'undefined' ? localStorage.getItem('courseData') : null;
            return savedData ? JSON.parse(savedData) : {
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
        } catch (e) {
            return {
                courseName: '', startDate: '', sessionsPerWeek: 2, classDays: ['monday', 'wednesday'],
                totalHours: 40, hourType: 'pedagogical', hoursPerSession: 2, recoverySessionsCount: 0, customExcludedDates: []
            };
        }
    });

    const [newExcludedDate, setNewExcludedDate] = useState('');
    const [schedule, setSchedule] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    // --- Effects ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('courseData', JSON.stringify(courseData));
        }
    }, [courseData]);

    const isDateExcluded = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0) return true; // Sunday off
        if (CHILEAN_HOLIDAYS_2026.some(h => h.date === dateStr)) return true;
        if (courseData.customExcludedDates.includes(dateStr)) return true;
        return false;
    }, [courseData.customExcludedDates]);

    // --- Core Calculation ---
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

    const addExcludedDate = () => {
        if (newExcludedDate && !courseData.customExcludedDates.includes(newExcludedDate)) {
            handleInputChange('customExcludedDates', [...courseData.customExcludedDates, newExcludedDate]);
            setNewExcludedDate('');
        }
    };

    const removeExcludedDate = (dateToRemove) => {
        handleInputChange('customExcludedDates', courseData.customExcludedDates.filter((d) => d !== dateToRemove));
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
                        >
                            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
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
                        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Plus className="text-indigo-500" size={22} />
                                Nuevo Curso
                            </h2>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre del Curso</label>
                                    <input
                                        type="text"
                                        value={courseData.courseName}
                                        onChange={(e) => handleInputChange('courseName', e.target.value)}
                                        placeholder="Ej. Diplomado en Marketing Digital"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            value={courseData.startDate}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Horas</label>
                                        <input
                                            type="number"
                                            value={courseData.totalHours}
                                            onChange={(e) => handleInputChange('totalHours', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo de Medición</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                        {['pedagogical', 'chronological', 'dgai'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => handleInputChange('hourType', type)}
                                                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all ${courseData.hourType === type
                                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hrs / Sesión</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={courseData.hoursPerSession}
                                            onChange={(e) => handleInputChange('hoursPerSession', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ses. Recuperación</label>
                                        <input
                                            type="number"
                                            value={courseData.recoverySessionsCount}
                                            onChange={(e) => handleInputChange('recoverySessionsCount', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Días de Clase</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.keys(DAY_MAPPING).filter(d => d !== 'sunday').map((day) => (
                                            <button
                                                key={day}
                                                onClick={() => handleDayToggle(day)}
                                                className={`py-2 text-xs font-bold rounded-xl border transition-all ${courseData.classDays.includes(day)
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-400'
                                                        : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-400'
                                                    }`}
                                            >
                                                {DAY_NAMES[day].substring(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fechas Excluidas</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={newExcludedDate}
                                            onChange={(e) => setNewExcludedDate(e.target.value)}
                                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                        <button onClick={addExcludedDate} className="p-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:opacity-90 transition-all">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                        {courseData.customExcludedDates.map((date) => (
                                            <div key={date} className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg group">
                                                <span className="text-xs font-medium">{date}</span>
                                                <button onClick={() => removeExcludedDate(date)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
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

                                <section className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[600px]">
                                    {viewMode === 'list' ? (
                                        <>
                                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
                                                <h2 className="text-xl font-bold">Cronograma de Clases</h2>
                                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Recuperación</span>
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-400"></div> Mitad</span>
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm border-b border-slate-100 dark:border-slate-800">
                                                        <tr>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">#</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horas</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progreso</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Notas</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {schedule.map((session) => {
                                                            const holiday = getHolidayName(session.dateStr);
                                                            return (
                                                                <tr key={session.number} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${session.isRecovery ? 'bg-amber-50/20 dark:bg-amber-900/5' : session.isMidCourse ? 'bg-violet-50/20 dark:bg-violet-900/5' : ''}`}>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`text-sm font-bold ${session.isRecovery ? 'text-amber-600' : session.isMidCourse ? 'text-violet-600' : 'text-slate-400'}`}>
                                                                            {session.number.toString().padStart(2, '0')}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-bold">{session.date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</div>
                                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{session.dayName}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-bold">{session.chronoHours}h <span className="text-[10px] font-normal text-slate-400">crono</span></div>
                                                                        {courseData.hourType !== 'chronological' && (
                                                                            <div className="text-[10px] font-bold text-indigo-500 uppercase">{session.effHours.toFixed(2)}h {courseData.hourType}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                                                                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${(session.accHours / courseData.totalHours) * 100}%` }}></div>
                                                                        </div>
                                                                        <div className="text-[10px] font-bold text-slate-400">{session.accHours.toFixed(1)} hrs</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            {holiday && <span className="px-2 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[9px] font-bold rounded-lg">{holiday}</span>}
                                                                            {session.isRecovery && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] font-bold rounded-lg">RECUPERACIÓN</span>}
                                                                            {session.isMidCourse && <span className="px-2 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded-lg shadow-sm">MITAD</span>}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <CalendarGrid sessions={schedule} />
                                    )}
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
