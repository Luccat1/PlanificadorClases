import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DAY_NAMES, DAY_MAPPING } from '../logic/constants';

/**
 * CourseForm Component
 * Displays the sidebar form for configuring course details.
 *
 * @param {Object} props
 * @param {Object} props.courseData - Current state of course settings
 * @param {Function} props.onInputChange - Handler for input field changes
 * @param {Function} props.onDayToggle - Handler for toggling class days
 * @param {Function} props.onAddDate - Handler to add an excluded date
 * @param {Function} props.onRemoveDate - Handler to remove an excluded date
 */
function CourseForm({
    courseData,
    onInputChange,
    onDayToggle,
    onAddDate,
    onRemoveDate
}) {
    const [newExcludedDate, setNewExcludedDate] = useState('');
    const [touched, setTouched] = useState({});

    const markTouched = (field) =>
        setTouched(prev => ({ ...prev, [field]: true }));

    function getError(field) {
        if (!touched[field]) return null;
        switch (field) {
            case 'totalHours':
                return (!courseData.totalHours || courseData.totalHours <= 0)
                    ? 'Ingresa un valor mayor a 0' : null;
            case 'hoursPerSession':
                return (!courseData.hoursPerSession || courseData.hoursPerSession <= 0)
                    ? 'Ingresa un valor mayor a 0' : null;
            case 'startDate':
                return !courseData.startDate
                    ? 'Selecciona una fecha de inicio' : null;
            case 'classDays':
                return courseData.classDays.length === 0
                    ? 'Selecciona al menos un día de clase' : null;
            case 'recoveryExtraMinutes':
                return (courseData.recoveryExtraMinutes == null || courseData.recoveryExtraMinutes < 0)
                    ? 'Ingresa 0 o más minutos' : null;
            default:
                return null;
        }
    }

    const handleAddDate = () => {
        if (newExcludedDate) {
            onAddDate(newExcludedDate);
            setNewExcludedDate('');
        }
    };

    return (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="text-indigo-500" size={22} />
                Nuevo Curso
            </h2>

            <div className="space-y-5">
                {/* Course Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre del Curso</label>
                    <input
                        type="text"
                        value={courseData.courseName}
                        onChange={(e) => onInputChange('courseName', e.target.value)}
                        placeholder="Ej. Diplomado en Marketing Digital"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Semestre */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        SEMESTRE
                    </label>
                    <input
                        type="text"
                        value={courseData.semester}
                        onChange={(e) => onInputChange('semester', e.target.value)}
                        placeholder="Ej. 2do Semestre 2026"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Nombre Profesor/a */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        NOMBRE PROFESOR/A
                    </label>
                    <input
                        type="text"
                        value={courseData.professorName}
                        onChange={(e) => onInputChange('professorName', e.target.value)}
                        placeholder="Ej. María González"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Email de Contacto */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        EMAIL DE CONTACTO
                    </label>
                    <input
                        type="email"
                        value={courseData.contactEmail}
                        onChange={(e) => onInputChange('contactEmail', e.target.value)}
                        placeholder="Ej. m.gonzalez@universidad.cl"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Date and Total Hours */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                        <input
                            type="date"
                            value={courseData.startDate}
                            onChange={(e) => onInputChange('startDate', e.target.value)}
                            onBlur={() => markTouched('startDate')}
                            className={`w-full px-4 py-3 rounded-xl border ${
                                getError('startDate')
                                    ? 'border-rose-400 dark:border-rose-500'
                                    : 'border-slate-200 dark:border-slate-700'
                            } bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                        />
                        {getError('startDate') && (
                            <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
                                {getError('startDate')}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Horas</label>
                        <input
                            type="number"
                            aria-label="TOTAL HORAS"
                            value={courseData.totalHours}
                            onChange={(e) => onInputChange('totalHours', parseInt(e.target.value) || 0)}
                            onBlur={() => markTouched('totalHours')}
                            className={`w-full px-4 py-3 rounded-xl border ${
                                getError('totalHours')
                                    ? 'border-rose-400 dark:border-rose-500'
                                    : 'border-slate-200 dark:border-slate-700'
                            } bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                        />
                        {getError('totalHours') && (
                            <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
                                {getError('totalHours')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Hour Type Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo de Medición</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        {['pedagogical', 'chronological', 'dgai'].map((type) => (
                            <button
                                key={type}
                                onClick={() => onInputChange('hourType', type)}
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

                {/* Hours per Session, Recovery Sessions, and Recovery Extra Minutes */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hrs / Sesión</label>
                        <input
                            type="number"
                            step="0.1"
                            aria-label="HRS / SESIÓN"
                            value={courseData.hoursPerSession}
                            onChange={(e) => onInputChange('hoursPerSession', parseFloat(e.target.value) || 0)}
                            onBlur={() => markTouched('hoursPerSession')}
                            className={`w-full px-4 py-3 rounded-xl border ${
                                getError('hoursPerSession')
                                    ? 'border-rose-400 dark:border-rose-500'
                                    : 'border-slate-200 dark:border-slate-700'
                            } bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                        />
                        {getError('hoursPerSession') && (
                            <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
                                {getError('hoursPerSession')}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ses. Recuperación</label>
                        <input
                            type="number"
                            value={courseData.recoverySessionsCount}
                            onChange={(e) => onInputChange('recoverySessionsCount', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {/* Min. Extra Recuperación — third cell in the recovery grid */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            MIN. EXTRA RECUPERACIÓN
                        </label>
                        <input
                            type="number"
                            min="0"
                            aria-label="MIN. EXTRA RECUPERACIÓN"
                            value={courseData.recoveryExtraMinutes}
                            onChange={(e) => onInputChange('recoveryExtraMinutes', parseInt(e.target.value) || 0)}
                            onBlur={() => markTouched('recoveryExtraMinutes')}
                            className={`w-full px-4 py-3 rounded-xl border ${
                                getError('recoveryExtraMinutes')
                                    ? 'border-rose-400 dark:border-rose-500'
                                    : 'border-slate-200 dark:border-slate-700'
                            } bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                        />
                        {getError('recoveryExtraMinutes') && (
                            <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
                                {getError('recoveryExtraMinutes')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Class Days */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Días de Clase</label>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.keys(DAY_MAPPING).filter(d => d !== 'sunday').map((day) => (
                            <button
                                key={day}
                                onClick={() => { onDayToggle(day); markTouched('classDays'); }}
                                className={`py-2 text-xs font-bold rounded-xl border transition-all ${courseData.classDays.includes(day)
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-400'
                                        : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-400'
                                    }`}
                            >
                                {DAY_NAMES[day].substring(0, 3)}
                            </button>
                        ))}
                    </div>
                    {getError('classDays') && (
                        <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
                            {getError('classDays')}
                        </p>
                    )}
                </div>

                {/* Excluded Dates Management */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fechas Excluidas</h3>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={newExcludedDate}
                            onChange={(e) => setNewExcludedDate(e.target.value)}
                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <button onClick={handleAddDate} className="p-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:opacity-90 transition-all">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        {courseData.customExcludedDates.map((date) => (
                            <div key={date} className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg group">
                                <span className="text-xs font-medium">{date}</span>
                                <button onClick={() => onRemoveDate(date)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CourseForm;
