import React, { useState, useEffect } from "react";
import {
    getPredefinedTimes,
    getDisabledHoursForDate,
    disableHour,
    enableHour,
} from "../../services/adminService";

function HourManagement() {
    const [predefinedTimes, setPredefinedTimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [disabledHours, setDisabledHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Cargar todas las horas predefinidas
    const loadPredefinedTimes = async () => {
        try {
            const data = await getPredefinedTimes();
            if (data.success) {
                setPredefinedTimes(data.times);
            } else {
                setError("Error al cargar horarios predefinidos");
            }
        } catch (err) {
            setError("Error al cargar horarios predefinidos");
            console.error(err);
        }
    };

    // Cargar las horas deshabilitadas para una fecha específica
    const loadDisabledHoursForDate = async (date) => {
        if (!date) return;

        try {
            setLoading(true);
            console.log("Iniciando carga de horas deshabilitadas para:", date);

            // Usar el servicio actualizado
            console.log("Llamando a getDisabledHoursForDate");
            const data = await getDisabledHoursForDate(date);
            console.log("Respuesta recibida:", data);

            if (data.success) {
                console.log("Horas deshabilitadas:", data.disabledHours);
                setDisabledHours(data.disabledHours || []);
            } else {
                throw new Error(
                    data.message || "Error al cargar horas deshabilitadas"
                );
            }
        } catch (err) {
            console.error("Error al cargar horas deshabilitadas:", err);
            setError(err.message || "Error al cargar horas deshabilitadas");
            // Si hay un error, asumimos que no hay horas deshabilitadas
            setDisabledHours([]);
        } finally {
            console.log("Finalizando carga, estableciendo loading=false");
            setLoading(false);
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        loadPredefinedTimes();
    }, []);

    // Cuando cambia la fecha, cargar las horas deshabilitadas para esa fecha
    useEffect(() => {
        console.log("useEffect ejecutado con:", {
            selectedDate,
            predefinedTimesLength: predefinedTimes.length,
        });
        if (selectedDate && predefinedTimes.length > 0) {
            console.log("Llamando a loadDisabledHoursForDate");
            loadDisabledHoursForDate(selectedDate);
        } else {
            console.log(
                "Condiciones no cumplidas, estableciendo disabledHours=[]"
            );
            setDisabledHours([]);
        }
    }, [selectedDate, predefinedTimes]);
    // Manejar cambio de fecha
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    // Formatear hora (HH:MM:SS -> HH:MM)
    const formatTime = (timeString) => {
        return timeString.substring(0, 5);
    };

    // Alternar estado habilitado/deshabilitado de una hora
    const toggleHourEnabled = async (timeId) => {
        if (!selectedDate) {
            alert("Por favor, selecciona una fecha primero");
            return;
        }

        // Verificar si la hora está deshabilitada
        const isDisabled = disabledHours.includes(timeId);

        try {
            setSaving(true);
            const userString = localStorage.getItem("user");
            const user = JSON.parse(userString);

            if (isDisabled) {
                // Si está deshabilitada, la habilitamos
                await enableHour(selectedDate, timeId);
                setDisabledHours(disabledHours.filter((id) => id !== timeId));
            } else {
                // Si está habilitada, la deshabilitamos
                await disableHour(selectedDate, timeId, user.id);
                setDisabledHours([...disabledHours, timeId]);
            }
        } catch (err) {
            console.error("Error al cambiar estado de hora:", err);
            setError(err.message || "Error al actualizar disponibilidad");
        } finally {
            setSaving(false);
        }
    };

    // Renderizado del componente
    return (
        <div className="card m-5 m-md-0">
            <div className="card-body m-5">
                <h5 className="card-title">
                    Hours Management for {selectedDate}
                </h5>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                        <button
                            type="button"
                            className="btn-close float-end"
                            onClick={() => setError(null)}
                            aria-label="Close"
                        ></button>
                    </div>
                )}

                <div className="mb-3">
                    <label htmlFor="dateSelect" className="form-label">
                        Date
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        id="dateSelect"
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                </div>

                <div className="mb-3">
                    <p>
                        All hours are enabled by default. Click to disable the
                        ones you don't want to offer:
                    </p>

                    {loading ? (
                        <p>Select a date to load schedules...</p>
                    ) : (
                        <div className="d-flex flex-wrap gap-2">
                            {predefinedTimes.map((time) => (
                                <button
                                    key={time.time_id}
                                    className={`btn ${
                                        disabledHours.includes(time.time_id)
                                            ? "btn-outline-secondary"
                                            : "btn-primary"
                                    }`}
                                    onClick={() =>
                                        toggleHourEnabled(time.time_id)
                                    }
                                    disabled={saving}
                                >
                                    {formatTime(time.start_time)} -{" "}
                                    {formatTime(time.end_time)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="alert alert-info">
                    <strong>Note:</strong> The hours in blue are enabled for
                    this date. Click to disable/enable.
                </div>
            </div>
        </div>
    );
}

export default HourManagement;
