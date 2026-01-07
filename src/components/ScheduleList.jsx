import React from 'react';
import CalendarGrid from './CalendarGrid';
import { getHolidayName } from '../logic/utils';

/**
 * ScheduleList Component
 * Displays the generated schedule in a list or grid format.
 * 
 * @param {Object} props
 * @param {Array} props.schedule - List of generated sessions
 * @param {Object} props.courseData - Course configuration data
 * @param {string} props.viewMode - 'list' or 'calendar'
 */
function ScheduleList({ schedule, courseData, viewMode }) {
    if (viewMode === 'calendar') {
        return <CalendarGrid sessions={schedule} />;
    }

    return (
        <>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
                <h2 className="text-xl font-bold">Cronograma de Clases</h2>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Recuperación</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-400"></div> Mitad</span>
                </div>
            </div>
            {/* 
                ADDED: 'print-overflow-visible' class is a utility we will ensure exists or corresponds to 
                changes in index.css to allow full printing.
            */}
            <div className="overflow-y-auto custom-scrollbar flex-1 print-overflow-visible">
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
    );
}

export default ScheduleList;
