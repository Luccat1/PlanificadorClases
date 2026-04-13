import { useState } from 'react';
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
    const [perDayEnabled, setPerDayEnabled] = useState(false);

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

                {/* Section: INFORMACIÓN DEL CURSO */}
                <div className="pt-5 pb-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        INFORMACIÓN DEL CURSO
                    </p>
                    <hr className="border-t border-slate-200 dark:border-slate-700" />
                </div>

                {/* Nombre del Curso */}
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

                {/* Section: CONFIGURACIÓN DE HORARIO */}
                <div className="pt-5 pb-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        CONFIGURACIÓN DE HORARIO
                    </p>
                    <hr className="border-t border-slate-200 dark:border-slate-700" />
                </div>

                {/* Fecha Inicio + Total Horas */}
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

                {/* Tipo de Medición */}
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

                {/* Hrs / Sesión */}
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
                        <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">{getError('hoursPerSession')}</p>
                    )}
                </div>

                {/* Per-day variable duration toggle (D-10) */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={perDayEnabled}
                            onChange={(e) => {
                                const on = e.target.checked;
                                setPerDayEnabled(on);
                                if (!on) {
                                    onInputChange('perDayHours', {});
                                }
                            }}
                            className="w-4 h-4 rounded accent-indigo-500"
                        />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Duración Variable por Día
                        </span>
                    </label>
                    {perDayEnabled && courseData.classDays.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            {courseData.classDays.map((day) => (
                                <div key={day} className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {DAY_NAMES[day].substring(0, 3).toUpperCase()}. HRS
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        aria-label={`HRS ${DAY_NAMES[day].substring(0, 3).toUpperCase()}`}
                                        value={courseData.perDayHours?.[day] ?? courseData.hoursPerSession}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || courseData.hoursPerSession;
                                            onInputChange('perDayHours', {
                                                ...courseData.perDayHours,
                                                [day]: val
                                            });
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: DÍAS Y FRECUENCIA */}
                <div className="pt-5 pb-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        DÍAS Y FRECUENCIA
                    </p>
                    <hr className="border-t border-slate-200 dark:border-slate-700" />
                </div>

                {/* Días de Clase */}
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

                {/* Ses. Máx. por Semana (D-01, D-03, D-04) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ses. Máx. por Semana
                    </label>
                    <input
                        type="number"
                        min="0"
                        aria-label="SES. MÁX. POR SEMANA"
                        value={courseData.sessionsPerWeek}
                        onChange={(e) => onInputChange('sessionsPerWeek', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">0 = sin límite</p>
                </div>

                {/* Section: SESIONES CON TIEMPO EXTRA */}
                <div className="pt-5 pb-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        SESIONES CON TIEMPO EXTRA
                    </p>
                    <hr className="border-t border-slate-200 dark:border-slate-700" />
                </div>

                {/* Recovery fields 2-col grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Ses. con Tiempo Extra count */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            N.º Sesiones
                        </label>
                        <input
                            type="number"
                            min="0"
                            aria-label="N.º SESIONES CON TIEMPO EXTRA"
                            value={courseData.recoverySessionsCount}
                            onChange={(e) => onInputChange('recoverySessionsCount', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {/* Min. extra */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Min. Extra
                        </label>
                        <input
                            type="number"
                            min="0"
                            aria-label="MIN. EXTRA"
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
                            <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">{getError('recoveryExtraMinutes')}</p>
                        )}
                    </div>
                </div>

                {/* Dynamic helper text (D-06) */}
                {courseData.recoverySessionsCount > 0 && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Las primeras <b className="text-slate-500 dark:text-slate-400">{courseData.recoverySessionsCount}</b> sesiones durarán{' '}
                        <b className="text-slate-500 dark:text-slate-400">{courseData.recoveryExtraMinutes}</b> min adicionales.
                    </p>
                )}

                {/* Non-blocking warning when recovery count may exceed total sessions (D-09) */}
                {courseData.recoverySessionsCount > 0 &&
                    courseData.hoursPerSession > 0 &&
                    courseData.recoverySessionsCount >= Math.ceil(courseData.totalHours / courseData.hoursPerSession) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Hay más sesiones con tiempo extra configuradas que las sesiones estimadas del curso.
                    </p>
                )}

                {/* Section: FECHAS EXCLUIDAS */}
                <div className="pt-5 pb-1">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        FECHAS EXCLUIDAS
                    </p>
                    <hr className="border-t border-slate-200 dark:border-slate-700" />
                </div>

                <div className="space-y-4">
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
