import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHolidayName } from '../logic/utils';

const CalendarGrid = ({ sessions }) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const firstDate = sessions.length > 0 ? new Date(sessions[0].dateStr + 'T00:00:00') : new Date();
        return new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    });

    const changeMonth = (offset) => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthName = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
                <h2 className="text-lg font-bold capitalize">{monthName}</h2>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase pb-2">{d}</div>
                    ))}
                    {days.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;

                        const dayStr = day.toString().padStart(2, '0');
                        const monthStr = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
                        const dateStr = `${currentMonth.getFullYear()}-${monthStr}-${dayStr}`;
                        const daySessions = sessions.filter((s) => s.dateStr === dateStr);
                        const holiday = getHolidayName(dateStr);

                        return (
                            <div key={dateStr} className={`aspect-square p-1 rounded-xl border flex flex-col transition-all overflow-hidden ${daySessions.length > 0
                                    ? (daySessions[0].isRecovery ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/40' :
                                        daySessions[0].isMidCourse ? 'bg-violet-50 border-violet-200 dark:bg-violet-900/10 dark:border-violet-900/40' :
                                            'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-950')
                                    : 'bg-white border-slate-50 dark:bg-slate-900 dark:border-slate-800/50'
                                }`}>
                                <span className={`text-[10px] font-bold ${daySessions.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{day}</span>
                                {daySessions.map((s) => (
                                    <div key={s.number} className="mt-1 px-1 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-bold truncate">
                                        S{s.number} ({s.effHours.toFixed(1)}h)
                                    </div>
                                ))}
                                {holiday && <div className="mt-auto text-[7px] text-rose-500 font-bold truncate leading-none">{holiday}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
