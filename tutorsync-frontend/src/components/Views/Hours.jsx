import React, { useState, useEffect } from "react";

function Hours({ selectedDate, onHourSelect, onNeedTokens }) {
    const [hours, setHours] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingInProgress, setBookingInProgress] = useState(false);

    // Función para formatear la fecha como YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedDate) {
                setHours([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const formattedDate = formatDate(selectedDate);

                // 1. Obtener TODAS las horas predefinidas
                const predefinedTimesResponse = await fetch(
                    "http://localhost:5000/api/predefined-times"
                );

                if (!predefinedTimesResponse.ok) {
                    throw new Error("Error al cargar horarios predefinidos");
                }

                const predefinedTimesData =
                    await predefinedTimesResponse.json();

                if (!predefinedTimesData.success) {
                    throw new Error("Error al obtener horarios predefinidos");
                }

                // 2. Obtener las horas DESHABILITADAS para esta fecha específica
                const disabledHoursResponse = await fetch(
                    `http://localhost:5000/api/disabled-hours/${formattedDate}`
                );

                let disabledTimeIds = [];

                if (disabledHoursResponse.ok) {
                    const disabledData = await disabledHoursResponse.json();
                    if (disabledData.success) {
                        disabledTimeIds = disabledData.disabledHours || [];
                    }
                }

                // 3. Filtrar las horas predefinidas para excluir las deshabilitadas
                let availableHours = predefinedTimesData.times
                    .filter((time) => !disabledTimeIds.includes(time.time_id))
                    .map((time) => ({
                        ...time,
                        is_booked: false, // Inicialmente no están reservadas
                    }));

                // 2. Obtener las reservas para esta fecha para saber cuáles están ocupadas
                const bookedResponse = await fetch(
                    `http://localhost:5000/api/bookings/date/${formattedDate}`
                );

                if (bookedResponse.ok) {
                    const bookedData = await bookedResponse.json();
                    if (bookedData.success) {
                        setBookedSlots(bookedData.bookedSlots || []);

                        // Marcar las horas reservadas
                        for (const hour of availableHours) {
                            const isBooked = bookedData.bookedSlots.some(
                                (slot) => slot.start_time === hour.start_time
                            );
                            if (isBooked) {
                                hour.is_booked = true;
                            }
                        }
                    }
                }

                setHours(availableHours);
                setError(null);
            } catch (err) {
                setError("Error al cargar horarios disponibles");
                console.error("Error fetching data:", err);
                setHours([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

    // Función para formatear la hora (HH:MM:SS → HH:MM)
    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : "";
    };

    // Verificar si un horario ya está reservado
    const isTimeBooked = (timeId) => {
        return bookedSlots.some((slot) => slot.time_id === timeId);
    };

    // Verificar tokens y realizar reserva
    const handleHourSelect = async (hour) => {
        if (!selectedDate) {
            console.log("No hay fecha seleccionada");
            return;
        }

        setBookingInProgress(true);

        try {
            const userData = JSON.parse(localStorage.getItem("user"));

            if (!userData || !userData.id) {
                console.error("No hay información de usuario");
                setError("Debes iniciar sesión para reservar una tutoría");
                setBookingInProgress(false);
                return;
            }

            // Primera opción: verificar tokens directamente
            const tokensResponse = await fetch(
                `http://localhost:5000/api/users/${userData.id}/tokens`
            );

            if (!tokensResponse.ok) {
                throw new Error("Error al verificar tokens");
            }

            const tokensData = await tokensResponse.json();
            console.log("Verificación de tokens:", tokensData);

            if (!tokensData.success || tokensData.tokensAvailable < 1) {
                console.log(
                    "Redirigiendo a pasarela de pagos - sin tokens suficientes"
                );
                if (onNeedTokens) {
                    onNeedTokens();
                }
                setBookingInProgress(false);
                return;
            }

            // Si tiene tokens, intentar la reserva
            const response = await fetch("http://localhost:5000/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userData.id,
                    slotId: hour.slot_id, // Usamos slot_id en lugar de time_id
                    slotDate: formatDate(selectedDate),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.needTokens) {
                    console.log(
                        "Redirigiendo a pasarela de pagos - según backend"
                    );
                    if (onNeedTokens) {
                        onNeedTokens();
                    }
                    setBookingInProgress(false);
                    return;
                }
                throw new Error(
                    errorData.message || "Error al procesar reserva"
                );
            }

            const data = await response.json();
            console.log("Respuesta de reserva:", data);

            if (data.success) {
                alert("Reserva realizada con éxito");

                // Actualizar la lista de horarios reservados localmente
                setBookedSlots([
                    ...bookedSlots,
                    { time_id: hour.time_id, start_time: hour.start_time },
                ]);

                if (onHourSelect) {
                    onHourSelect(hour, true);
                }
            }
        } catch (err) {
            console.error("Error completo:", err);
            setError(err.message || "Error al procesar la reserva");
        } finally {
            setBookingInProgress(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-4">Loading available times...</div>
        );
    }

    if (error) {
        return <div className="alert alert-danger m-2">{error}</div>;
    }

    return (
        <div className="d-flex flex-column align-items-center w-100 overflow-y-auto p-2">
            {hours.length > 0 ? (
                hours.map((hour) => {
                    // Verificar si esta hora ya está reservada
                    const booked = hour.is_booked || isTimeBooked(hour.time_id);

                    // Mostrar todos los horarios, pero deshabilitar los ya reservados
                    return (
                        <button
                            key={hour.time_id}
                            className={`btn ${
                                booked ? "btn-secondary" : "btn-outline-primary"
                            } w-50 m-2`}
                            onClick={() => !booked && handleHourSelect(hour)}
                            disabled={
                                bookingInProgress || !selectedDate || booked
                            }
                        >
                            {formatTime(hour.start_time)} -{" "}
                            {formatTime(hour.end_time)}
                            {booked && (
                                <span className="ms-2">(Reserved.)</span>
                            )}
                        </button>
                    );
                })
            ) : (
                <p className="text-center">
                    There are no available times for this date.
                </p>
            )}
        </div>
    );
}

export default Hours;
