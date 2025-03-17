import React, { useState, useEffect } from "react";

function Hours({ onHourSelect }) {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Función para obtener los horarios predefinidos
        const fetchPredefinedTimes = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/predefined-times"
                );
                const data = await response.json();

                if (data.success) {
                    setHours(data.times);
                } else {
                    setError("Error al cargar los horarios");
                }
            } catch (err) {
                setError("Error de conexión al servidor");
                console.error("Error fetching hours:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPredefinedTimes();
    }, []);

    // Función para formatear la hora (HH:MM:SS → HH:MM)
    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : "";
    };

    if (loading) {
        return <div className="text-center p-4">Cargando horarios...</div>;
    }

    if (error) {
        return <div className="alert alert-danger m-2">{error}</div>;
    }

    return (
        <div className="d-flex flex-column align-items-center w-100 overflow-y-auto p-2">
            {hours.length > 0 ? (
                hours.map((hour) => (
                    <button
                        key={hour.time_id}
                        className="btn btn-outline-primary w-50 m-2"
                        onClick={() => onHourSelect && onHourSelect(hour)}
                    >
                        {formatTime(hour.start_time)}
                    </button>
                ))
            ) : (
                <p className="text-center">No hay horarios disponibles</p>
            )}
        </div>
    );
}

export default Hours;
