import React, { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import { useCustomAlert } from "../Alert/CustomAlert"; // Importar nuestro hook personalizado

function Hours({ selectedDate, onHourSelect, onHourCancel, onNeedTokens }) {
    const [hours, setHours] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [cancelInProgress, setCancelInProgress] = useState(false);

    // Utilizar nuestro hook personalizado
    const {
        showAlert,
        showConfirmDialog,
        AlertComponent,
        ConfirmDialogComponent,
    } = useCustomAlert();

    // Función para formatear la fecha como YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // Obtener el ID del usuario actual del localStorage al cargar el componente
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData && userData.id) {
            setCurrentUserId(parseInt(userData.id));
        }
    }, []);

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
                        is_booked: false,
                        booked_by_current_user: false,
                        booking_id: null,
                    }));

                // 4. Obtener las reservas para esta fecha para saber cuáles están ocupadas
                const bookedResponse = await fetch(
                    `http://localhost:5000/api/bookings/date/${formattedDate}`
                );

                if (bookedResponse.ok) {
                    const bookedData = await bookedResponse.json();
                    console.log("Datos de horas reservadas:", bookedData);

                    if (bookedData.success) {
                        setBookedSlots(bookedData.bookedSlots || []);

                        // También obtener las reservas del usuario actual para esta fecha
                        // para asegurar que los botones de cancelación sean visibles después de recargar
                        const userBookingsForDate = [];

                        if (currentUserId) {
                            try {
                                const userBookingsResponse = await fetch(
                                    `http://localhost:5000/api/users/${currentUserId}/bookings`
                                );

                                if (userBookingsResponse.ok) {
                                    const userBookingsData =
                                        await userBookingsResponse.json();

                                    if (userBookingsData.success) {
                                        // Filtrar solo las reservas para la fecha actual
                                        userBookingsForDate.push(
                                            ...userBookingsData.bookings.filter(
                                                (booking) =>
                                                    formatDate(
                                                        new Date(
                                                            booking.slot_date
                                                        )
                                                    ) === formattedDate
                                            )
                                        );
                                        console.log(
                                            "Reservas del usuario para hoy:",
                                            userBookingsForDate
                                        );
                                    }
                                }
                            } catch (err) {
                                console.error(
                                    "Error al obtener reservas del usuario:",
                                    err
                                );
                            }
                        }

                        // Marcar las horas reservadas y quién las reservó
                        for (const hour of availableHours) {
                            // Primero verificar en las reservas generales
                            const bookedSlot = bookedData.bookedSlots.find(
                                (slot) => slot.start_time === hour.start_time
                            );

                            if (bookedSlot) {
                                hour.is_booked = true;
                                hour.booked_by = parseInt(bookedSlot.user_id);
                                hour.booking_id = bookedSlot.booking_id;
                            }

                            // Ahora verificar específicamente las reservas del usuario actual
                            const userBooking = userBookingsForDate.find(
                                (booking) => {
                                    // Comparar por hora de inicio, ya que tenemos el objeto completo de la reserva
                                    const bookingHour =
                                        booking.start_time.substring(0, 5);
                                    const hourStartTime =
                                        hour.start_time.substring(0, 5);
                                    return bookingHour === hourStartTime;
                                }
                            );

                            // Si encontramos una reserva del usuario actual, marcarla
                            if (userBooking) {
                                hour.is_booked = true;
                                hour.booked_by = currentUserId;
                                hour.booked_by_current_user = true;
                                hour.booking_id = userBooking.booking_id;
                            } else if (hour.booked_by === currentUserId) {
                                // Si ya detectamos que es del usuario en el paso anterior
                                hour.booked_by_current_user = true;
                            }
                        }
                    }
                }

                setHours(availableHours);
                setError(null);
            } catch (err) {
                setError("Error loading available times");
                console.error("Error fetching data:", err);
                setHours([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, currentUserId]);

    // Función para formatear la hora (HH:MM:SS → HH:MM)
    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : "";
    };

    // Función para verificar si una hora ya ha pasado
    const isTimePassed = (startTimeString) => {
        if (!selectedDate) return false;

        // Crear un objeto Date completo combinando la fecha seleccionada y la hora
        const [hours, minutes] = startTimeString.split(":");
        const fullDateTime = new Date(selectedDate);
        fullDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        // Obtener la hora actual
        const now = new Date();

        // Comparar si la hora seleccionada es anterior a la hora actual
        return fullDateTime < now;
    };

    // Función para verificar si falta menos de una hora para la tutoría
    const isWithinOneHourBefore = (startTimeString) => {
        if (!selectedDate) return false;

        // Crear un objeto Date completo combinando la fecha seleccionada y la hora
        const [hours, minutes] = startTimeString.split(":");
        const tutoringTime = new Date(selectedDate);
        tutoringTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        // Obtener la hora actual
        const now = new Date();

        // Calcular la diferencia en milisegundos
        const diffMs = tutoringTime - now;

        // Convertir a minutos
        const diffMinutes = diffMs / (1000 * 60);

        // Verificar si falta menos de 60 minutos (1 hora)
        return diffMinutes >= 0 && diffMinutes < 60;
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

        // Mostrar diálogo de confirmación antes de proceder
        showConfirmDialog({
            title: "Confirm Reservation",
            message: `Are you sure you want to reserve a tutoring session on ${new Date(
                selectedDate
            ).toLocaleDateString()} from ${formatTime(
                hour.start_time
            )} to ${formatTime(
                hour.end_time
            )}? This will use 1 token from your account.`,
            confirmButtonText: "Confirm Reservation",
            cancelButtonText: "Cancel",
            confirmButtonColor: "primary",
            onConfirm: async () => {
                setBookingInProgress(true);

                try {
                    const userData = JSON.parse(localStorage.getItem("user"));

                    if (!userData || !userData.id) {
                        console.error("No hay información de usuario");
                        setError("You must log in to book a tutoring session");

                        showAlert({
                            message:
                                "You must log in to book a tutoring session",
                            severity: "error",
                        });

                        setBookingInProgress(false);
                        return;
                    }

                    // Primera opción: verificar tokens directamente
                    const tokensResponse = await fetch(
                        `http://localhost:5000/api/users/${userData.id}/tokens`
                    );

                    if (!tokensResponse.ok) {
                        throw new Error("Error verifying tokens");
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

                    // Verificar que la hora tiene timeId
                    if (!hour.time_id) {
                        throw new Error(
                            "The selected time doesn't have a valid ID"
                        );
                    }

                    // Datos a enviar al servidor
                    const bookingData = {
                        userId: userData.id,
                        timeId: hour.time_id,
                        slotDate: formatDate(selectedDate),
                    };

                    console.log("Datos enviados para reserva:", bookingData);

                    // Si tiene tokens, intentar la reserva
                    const response = await fetch(
                        "http://localhost:5000/api/bookings",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(bookingData),
                        }
                    );

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
                            errorData.message || "Error processing reservation"
                        );
                    }

                    const data = await response.json();
                    console.log("Respuesta de reserva:", data);

                    if (data.success) {
                        showAlert({
                            message: "Reservation successfully made",
                            severity: "success",
                            customStyles: {
                                backgroundColor: "#4caf50",
                                color: "white",
                            },
                        });

                        // Actualizar la lista de horarios reservados localmente
                        const newBookedSlot = {
                            time_id: hour.time_id,
                            start_time: hour.start_time,
                            user_id: userData.id,
                            booking_id: data.bookingId,
                        };

                        setBookedSlots([...bookedSlots, newBookedSlot]);

                        // Actualizar la lista de horas para mostrar la nueva reserva en verde
                        setHours((prevHours) =>
                            prevHours.map((h) => {
                                if (h.time_id === hour.time_id) {
                                    return {
                                        ...h,
                                        is_booked: true,
                                        booked_by: parseInt(userData.id),
                                        booked_by_current_user: true,
                                        booking_id: data.bookingId,
                                    };
                                }
                                return h;
                            })
                        );

                        if (onHourSelect) {
                            onHourSelect(hour, true);
                        }
                    }
                } catch (err) {
                    console.error("Error completo:", err);
                    setError(
                        err.message || "Error processing the reservation."
                    );

                    showAlert({
                        message:
                            err.message || "Error processing the reservation.",
                        severity: "error",
                        duration: 5000,
                    });
                } finally {
                    setBookingInProgress(false);
                }
            },
        });
    };

    // Abrir el diálogo de confirmación para cancelar
    const openCancelDialog = (hour, event) => {
        // Detener propagación para evitar que el clic en la X afecte al botón completo
        event.stopPropagation();

        // Verificar si falta menos de una hora
        if (isWithinOneHourBefore(hour.start_time)) {
            showAlert({
                message:
                    "The reservation cannot be canceled less than 1 hour before it starts.",
                severity: "warning",
            });
            return;
        }

        if (!hour.booking_id) {
            console.error("No se puede cancelar: falta ID de reserva", hour);
            showAlert({
                message:
                    "The reservation cannot be canceled: incomplete information.",
                severity: "error",
            });
            return;
        }

        // Abrir diálogo de confirmación
        showConfirmDialog({
            title: "Are you sure you want to cancel this reservation?",
            message:
                "The token used to make this reservation will be returned to you.",
            confirmButtonText: "Confirm",
            cancelButtonText: "Cancel",
            confirmButtonColor: "error",
            onConfirm: () => handleCancelBooking(hour),
        });
    };

    // Función para cancelar una reserva
    const handleCancelBooking = async (hour) => {
        setCancelInProgress(true);

        try {
            const userData = JSON.parse(localStorage.getItem("user"));

            if (!userData || !userData.id) {
                throw new Error("No hay información de usuario");
            }

            // Depuración
            console.log("Enviando solicitud de cancelación:", {
                url: `http://localhost:5000/api/bookings/${hour.booking_id}/cancel`,
                userId: userData.id,
                bookingId: hour.booking_id,
            });

            const response = await fetch(
                `http://localhost:5000/api/bookings/${hour.booking_id}/cancel`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: userData.id,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Error canceling reservation."
                );
            }

            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            if (data.success) {
                showAlert({
                    message:
                        "Reservation successfully canceled. 1 token has been returned to your account.",
                    severity: "success",
                });

                // Actualizar la lista de horas reservadas localmente
                setBookedSlots(
                    bookedSlots.filter(
                        (slot) => !(slot.time_id === hour.time_id)
                    )
                );

                // Actualizar el estado de las horas para reflejar la cancelación
                setHours((prevHours) =>
                    prevHours.map((h) => {
                        if (h.time_id === hour.time_id) {
                            return {
                                ...h,
                                is_booked: false,
                                booked_by: null,
                                booked_by_current_user: false,
                                booking_id: null,
                            };
                        }
                        return h;
                    })
                );

                // Notificar al componente Calendar sobre la cancelación
                if (onHourCancel) {
                    onHourCancel(hour);
                } else if (onHourSelect) {
                    onHourSelect(hour, true);
                }
            }
        } catch (err) {
            console.error("Error al cancelar reserva:", err);
            setError(err.message || "Error canceling reservation.");

            showAlert({
                message: err.message || "Error canceling reservation.",
                severity: "error",
            });
        } finally {
            setCancelInProgress(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-4">Loading available times...</div>
        );
    }

    if (error) {
        return (
            <Alert severity="error" className="m-2">
                {error}
            </Alert>
        );
    }

    return (
        <div className="d-flex flex-column align-items-center justify-content-evenly w-100 h-100 p-0">
            {hours.length > 0 ? (
                hours.map((hour) => {
                    // Verificar si esta hora ya está reservada o ha pasado
                    const booked = hour.is_booked || isTimeBooked(hour.time_id);
                    const isPast = isTimePassed(hour.start_time);
                    const isWithinOneHour = isWithinOneHourBefore(
                        hour.start_time
                    );

                    // Determinar el estilo del botón según quién reservó
                    let buttonClass = "btn-outline-primary";
                    let content = (
                        <>
                            {formatTime(hour.start_time)} -{" "}
                            {formatTime(hour.end_time)}
                        </>
                    );

                    if (booked) {
                        if (hour.booked_by_current_user) {
                            return (
                                <div
                                    key={hour.time_id}
                                    className="d-flex justify-content-between align-items-center w-75 m-2"
                                >
                                    <div className="btn btn-success flex-grow-1 text-start d-flex justify-content-between align-items-center">
                                        <span>
                                            {formatTime(hour.start_time)} -{" "}
                                            {formatTime(hour.end_time)}
                                            <i className="fa-solid fa-check ms-2"></i>
                                        </span>

                                        {isWithinOneHour && !isPast && (
                                            <span className="badge bg-warning text-dark ms-auto">
                                                Coming
                                            </span>
                                        )}
                                    </div>

                                    {/* Solo deshabilitar el botón de cancelación cuando falte menos de una hora */}
                                    {!isPast && (
                                        <button
                                            className="btn btn-sm btn-danger ms-1 rounded-3 fs-6"
                                            onClick={(e) =>
                                                openCancelDialog(hour, e)
                                            }
                                            disabled={
                                                isWithinOneHour ||
                                                cancelInProgress
                                            }
                                            style={{
                                                padding: "5.5px 10.5px",
                                                opacity: isWithinOneHour
                                                    ? "0.65"
                                                    : "1",
                                            }}
                                            title={
                                                isWithinOneHour
                                                    ? "It's not possible to cancel less than 1 hour before."
                                                    : "Cancel booking."
                                            }
                                        >
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            );
                        } else {
                            buttonClass = "btn-secondary";
                            content = (
                                <>
                                    {formatTime(hour.start_time)} -{" "}
                                    {formatTime(hour.end_time)}
                                    <i className="fa-solid fa-check ms-2"></i>
                                </>
                            );
                        }
                    } else if (isPast) {
                        buttonClass = "btn-secondary";
                        content = (
                            <>
                                {formatTime(hour.start_time)} -{" "}
                                {formatTime(hour.end_time)}
                            </>
                        );
                    }

                    // Para slots no reservados o reservados por otros usuarios
                    if (!hour.booked_by_current_user) {
                        return (
                            <button
                                key={hour.time_id}
                                className={`btn ${buttonClass} w-75 m-1`}
                                onClick={() =>
                                    !booked && !isPast && handleHourSelect(hour)
                                }
                                disabled={
                                    bookingInProgress ||
                                    !selectedDate ||
                                    booked ||
                                    isPast
                                }
                            >
                                {content}
                            </button>
                        );
                    }

                    return null;
                })
            ) : (
                <p className="text-center">
                    There are no available times for this date.
                </p>
            )}

            {/* Incluir los componentes de alerta y diálogo */}
            <AlertComponent />
            <ConfirmDialogComponent />
        </div>
    );
}

export default Hours;
