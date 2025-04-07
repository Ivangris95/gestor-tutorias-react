import React, { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import {
    getPredefinedTimes,
    getDisabledHoursForDate,
    disableHour,
    enableHour,
} from "../../services/adminService";
import { useCustomAlert } from "../Alert/CustomAlert";

function HourManagement() {
    const [predefinedTimes, setPredefinedTimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [disabledHours, setDisabledHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Usar nuestro hook personalizado para alertas
    const { showAlert, AlertComponent, ConfirmDialogComponent } =
        useCustomAlert();

    // Cargar todas las horas predefinidas
    const loadPredefinedTimes = async () => {
        try {
            const data = await getPredefinedTimes();
            if (data.success) {
                setPredefinedTimes(data.times);
            } else {
                setError("Error al cargar horarios predefinidos");
                showAlert({
                    message: "Error al cargar horarios predefinidos",
                    severity: "error",
                });
            }
        } catch (err) {
            setError("Error al cargar horarios predefinidos");
            showAlert({
                message: "Error al cargar horarios predefinidos",
                severity: "error",
            });
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
            showAlert({
                message: err.message || "Error al cargar horas deshabilitadas",
                severity: "error",
            });
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
            // Reemplazamos alert nativo con nuestro sistema de alertas
            showAlert({
                message: "Please select a date first",
                severity: "warning",
            });
            return;
        }

        // Verificar si la hora está deshabilitada
        const isDisabled = disabledHours.includes(timeId);

        try {
            setSaving(true);
            const userString = localStorage.getItem("user");
            const user = JSON.parse(userString);

            if (isDisabled) {
                // If it's disabled, we enable it
                await enableHour(selectedDate, timeId);
                setDisabledHours(disabledHours.filter((id) => id !== timeId));
                showAlert({
                    message: "Hour enabled successfully",
                    severity: "success",
                    duration: 3000,
                });
            } else {
                // If it's enabled, we disable it
                await disableHour(selectedDate, timeId, user.id);
                setDisabledHours([...disabledHours, timeId]);
                showAlert({
                    message: "Hour disabled successfully",
                    severity: "info",
                    duration: 3000,
                });
            }
        } catch (err) {
            console.error("Error changing hour state:", err);
            setError(err.message || "Error updating availability");
            showAlert({
                message: err.message || "Error updating availability",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    // Renderizado del componente
    return (
        <div className="card m-5 m-md-0">
            <div className="card-body m-5">
                <h5 className="card-title">
                    Schedule Management for {selectedDate}
                </h5>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
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
                        All times are enabled by default. Click to disable the
                        ones you don't want to offer:
                    </p>

                    {loading ? (
                        <p>Select a date to load the times...</p>
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

                <Alert severity="info" sx={{ mt: 3 }}>
                    <strong>Note:</strong> The blue times are available for this
                    date. Click to enable/disable.
                </Alert>

                {/* Componentes de alerta y diálogo */}
                <AlertComponent />
                <ConfirmDialogComponent />
            </div>
        </div>
    );
}

export default HourManagement;
