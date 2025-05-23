import { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Hours from "./Hours";
import "./calendar.css";

function Calendar({
    userId,
    onNeedTokens,
    onBookingComplete,
    onBookingCancelled,
}) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedDateObj, setSelectedDateObj] = useState(null);
    const [monthAvailability, setMonthAvailability] = useState({});
    const [loadedMonths, setLoadedMonths] = useState({});
    const [userBookings, setUserBookings] = useState([]);

    const calendarRef = useRef(null);
    const [selectedDateCalendar, setSelectedDateCalendar] = useState(
        new Date()
    );

    // Generar array de años para el selector de años (5 años atrás, 5 años adelante)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    // Generar array de meses para el selector de meses
    const months = [
        { value: 0, label: "January" },
        { value: 1, label: "February" },
        { value: 2, label: "March" },
        { value: 3, label: "April" },
        { value: 4, label: "May" },
        { value: 5, label: "June" },
        { value: 6, label: "July" },
        { value: 7, label: "August" },
        { value: 8, label: "September" },
        { value: 9, label: "October" },
        { value: 10, label: "November" },
        { value: 11, label: "December" },
    ];

    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // Cargar las reservas del usuario
    useEffect(() => {
        const fetchUserBookings = async () => {
            if (!userId) {
                console.log("No se proporcionó userId para obtener reservas");
                setUserBookings([]);
                return;
            }

            try {
                console.log(
                    `Solicitando reservas para el usuario ${userId}...`
                );

                try {
                    // Usar el userId proporcionado como prop
                    const response = await fetch(
                        `http://localhost:5000/api/users/${userId}/bookings`
                    );

                    if (!response.ok) {
                        console.warn(
                            `La API de reservas devolvió código: ${response.status}. Continuando sin reservas de usuario.`
                        );
                        setUserBookings([]);
                        return;
                    }

                    const bookingsData = await response.json();

                    if (bookingsData.success) {
                        // Convertir las fechas a formato YYYY-MM-DD
                        const userBookingDates = bookingsData.bookings.map(
                            (booking) => formatDate(new Date(booking.slot_date))
                        );
                        console.log(
                            "Reservas del usuario obtenidas:",
                            userBookingDates
                        );
                        setUserBookings(userBookingDates);
                    } else {
                        console.error(
                            "Error en la respuesta de reservas:",
                            bookingsData.message
                        );
                        setUserBookings([]);
                    }
                } catch (apiError) {
                    console.error(
                        "Error al acceder a la API de reservas:",
                        apiError
                    );
                    setUserBookings([]);
                }
            } catch (error) {
                console.error("Error al cargar reservas del usuario:", error);
                setUserBookings([]);
            }
        };

        // Cargar las reservas del usuario cuando el componente se monta o cambia el userId
        fetchUserBookings();
    }, [userId]);

    const handleDateChange = (date) => {
        setSelectedDateCalendar(date);
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.gotoDate(date);
        }
    };

    // Manejar el cambio de año desde el dropdown
    const handleYearChange = (e) => {
        const year = parseInt(e.target.value);
        const newDate = new Date(selectedDateCalendar);
        newDate.setFullYear(year);
        handleDateChange(newDate);
    };

    // Función para cargar la disponibilidad de un mes específico
    const fetchMonthAvailability = useCallback(
        async (year, month) => {
            const monthKey = `${year}-${month}`;

            // Verificar si ya cargamos este mes
            if (loadedMonths[monthKey]) {
                console.log(
                    `Mes ${month + 1}/${year} ya está cargado, saltando`
                );
                return;
            }

            try {
                console.log(
                    `Cargando disponibilidad para el mes: ${month + 1}/${year}`
                );

                // Obtener el primer y último día del mes
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);

                const firstDayStr = formatDate(firstDay);
                const lastDayStr = formatDate(lastDay);

                console.log(`Período: ${firstDayStr} a ${lastDayStr}`);

                // 1. Obtener TODAS las horas predefinidas disponibles en el sistema
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

                // El número máximo posible de reservas por día
                const maxBookingsPerDay = predefinedTimesData.times.length;

                console.log(
                    `Número máximo de horarios por día: ${maxBookingsPerDay}`
                );

                // Crear un objeto para almacenar disponibilidad por día
                const newAvailabilityData = {};

                // Para cada día del mes
                const daysInMonth = lastDay.getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dateStr = formatDate(date);

                    // Si es un día pasado
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    try {
                        // Registrar si es un día pasado
                        const isPastDay = date < today;

                        // Obtener horas deshabilitadas para este día específico
                        const disabledHoursResponse = await fetch(
                            `http://localhost:5000/api/disabled-hours/${dateStr}`
                        );
                        let disabledTimeIds = [];

                        if (disabledHoursResponse.ok) {
                            const disabledData =
                                await disabledHoursResponse.json();
                            if (disabledData.success) {
                                disabledTimeIds =
                                    disabledData.disabledHours || [];
                            }
                        }

                        // Obtener horas reservadas para este día específico
                        const bookedResponse = await fetch(
                            `http://localhost:5000/api/bookings/date/${dateStr}`
                        );
                        let bookedSlots = [];

                        if (bookedResponse.ok) {
                            const bookedData = await bookedResponse.json();
                            if (bookedData.success) {
                                bookedSlots = bookedData.bookedSlots || [];
                            }
                        }

                        // Calcular las estadísticas de disponibilidad
                        const totalPossibleSlots =
                            maxBookingsPerDay - disabledTimeIds.length;
                        const bookedSlotsCount = bookedSlots.length;
                        const availableSlotsCount =
                            totalPossibleSlots - bookedSlotsCount;
                        const availabilityPercentage =
                            totalPossibleSlots > 0
                                ? (availableSlotsCount / totalPossibleSlots) *
                                  100
                                : 0;

                        // Verificar si el usuario tiene una reserva para este día
                        const hasUserBooking = userBookings.includes(dateStr);

                        console.log(
                            `Día ${dateStr}: Total posible: ${totalPossibleSlots}, Reservados: ${bookedSlotsCount}, Disponibles: ${availableSlotsCount}, Reserva del usuario: ${hasUserBooking}`
                        );

                        newAvailabilityData[dateStr] = {
                            totalSlots: totalPossibleSlots,
                            bookedSlots: bookedSlotsCount,
                            availableSlots: availableSlotsCount,
                            availability: availabilityPercentage,
                            isPast: isPastDay,
                            hasUserBooking: hasUserBooking,
                            _lastUpdated: null,
                        };
                    } catch (error) {
                        console.error(
                            `Error al obtener datos para ${dateStr}:`,
                            error
                        );
                        newAvailabilityData[dateStr] = {
                            error: true,
                            message: error.message,
                            hasUserBooking: userBookings.includes(dateStr),
                        };
                    }
                }

                // Actualizar el estado con los nuevos datos
                setMonthAvailability((prevData) => ({
                    ...prevData,
                    ...newAvailabilityData,
                }));

                // Marcar este mes como cargado
                setLoadedMonths((prev) => ({
                    ...prev,
                    [monthKey]: true,
                }));

                console.log(
                    `Datos de disponibilidad cargados para ${month + 1}/${year}`
                );
            } catch (error) {
                console.error(
                    `Error al cargar datos de disponibilidad para ${
                        month + 1
                    }/${year}:`,
                    error
                );
            }
        },
        [userBookings, loadedMonths]
    );

    // Cargar datos por demanda según el mes seleccionado
    useEffect(() => {
        const currentMonth = selectedDateCalendar.getMonth();
        const currentYear = selectedDateCalendar.getFullYear();

        // Cargar el mes actual
        fetchMonthAvailability(currentYear, currentMonth);

        // También podemos precargar el mes siguiente para mejor experiencia de usuario
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

        // Precargar el mes siguiente con un pequeño retraso para no saturar el servidor
        setTimeout(() => {
            fetchMonthAvailability(nextYear, nextMonth);
        }, 1000);

        setTimeout(() => {
            if (calendarRef.current) {
                const calendarApi = calendarRef.current.getApi();
                calendarApi.render();
                console.log(
                    "Calendario re-renderizado después de cargar disponibilidad"
                );
            }
        }, 1500);
    }, [selectedDateCalendar, fetchMonthAvailability]);

    const handleMonthChange = (e) => {
        const month = parseInt(e.target.value);
        const newDate = new Date(selectedDateCalendar);
        newDate.setMonth(month);
        handleDateChange(newDate);
    };

    // Función para obtener el color basado en la cantidad exacta de horas disponibles
    const getAvailabilityColor = (availableSlots) => {
        // Convertimos a número para asegurarnos
        const slots = Number(availableSlots);

        if (slots === 0) {
            return "#ff6b6b"; // Rojo - No hay horas disponibles
        } else if (slots <= 3) {
            return "#ffa502"; // Naranja - 3 o menos horas disponibles (baja disponibilidad)
        } else if (slots <= 6) {
            return "#ffdd59"; // Amarillo - 4-6 horas disponibles (disponibilidad media)
        } else {
            return "#2ed573"; // Verde - 7 o más horas disponibles (alta disponibilidad)
        }
    };

    // Función mejorada para manejar la selección de hora (evita actualizaciones duplicadas)
    const handleHourSelect = (hour, isSuccessful) => {
        console.log("Hora seleccionada:", hour);

        // Si la reserva fue exitosa, actualizar la disponibilidad
        if (isSuccessful && selectedDateObj) {
            const dateStr = formatDate(selectedDateObj);

            // Actualizar la lista de reservas del usuario inmediatamente
            if (!userBookings.includes(dateStr)) {
                const updatedUserBookings = [...userBookings, dateStr];
                setUserBookings(updatedUserBookings);
                console.log(
                    "Reserva añadida para el usuario:",
                    dateStr,
                    "Lista actualizada:",
                    updatedUserBookings
                );
            }

            // Actualizamos la disponibilidad en tiempo real para este día específico
            setMonthAvailability((prev) => {
                // Si ya procesamos esta actualización, no hacemos nada
                if (
                    prev[dateStr] &&
                    prev[dateStr]._lastUpdated === hour.time_id
                ) {
                    console.log(
                        `Evitando actualización duplicada para ${dateStr} y hora ${hour.time_id}`
                    );
                    return prev;
                }

                const updatedAvailability = { ...prev };

                // Si tenemos datos para esta fecha
                if (updatedAvailability[dateStr]) {
                    // Incrementar el contador de slots reservados
                    updatedAvailability[dateStr].bookedSlots += 1;

                    // Decrementar el contador de slots disponibles
                    updatedAvailability[dateStr].availableSlots -= 1;

                    // Verificamos que availableSlots no sea negativo
                    if (updatedAvailability[dateStr].availableSlots < 0) {
                        updatedAvailability[dateStr].availableSlots = 0;
                    }

                    // Marcar como que tiene reserva del usuario
                    updatedAvailability[dateStr].hasUserBooking = true;

                    // Añadir una marca para evitar procesar esta actualización más de una vez
                    updatedAvailability[dateStr]._lastUpdated = hour.time_id;

                    // Recalcular el porcentaje de disponibilidad
                    if (updatedAvailability[dateStr].totalSlots > 0) {
                        updatedAvailability[dateStr].availability =
                            (updatedAvailability[dateStr].availableSlots /
                                updatedAvailability[dateStr].totalSlots) *
                            100;
                    } else {
                        updatedAvailability[dateStr].availability = 0;
                    }

                    // Agregamos log para depuración
                    console.log(
                        `Actualización tras reserva: Fecha ${dateStr}`,
                        `\nSlots disponibles ahora: ${updatedAvailability[dateStr].availableSlots}`,
                        `\nColor asignado: ${getAvailabilityColor(
                            updatedAvailability[dateStr].availableSlots
                        )}`,
                        `\nUsuario tiene reserva: ${updatedAvailability[dateStr].hasUserBooking}`
                    );
                }

                return updatedAvailability;
            });

            // Forzar actualización del calendario para reflejar los cambios en el color
            setTimeout(() => {
                if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    calendarApi.render();
                    console.log(
                        "Calendario re-renderizado después de la reserva"
                    );
                }
            }, 100);

            if (onBookingComplete) {
                onBookingComplete();
            }
        }
    };

    // Función para manejar la cancelación de una reserva
    const handleHourCancel = async (hour) => {
        if (!selectedDateObj) return;

        const dateStr = formatDate(selectedDateObj);
        console.log(
            "Manejando cancelación de hora:",
            hour,
            "para fecha:",
            dateStr
        );

        // Variable para rastrear si hay más reservas para este día
        let hasMoreBookingsForDay = false;

        try {
            if (userId) {
                try {
                    const response = await fetch(
                        `http://localhost:5000/api/users/${userId}/bookings`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            // Filtrar las reservas para obtener solo las de la fecha actual
                            const bookingsForDate = data.bookings
                                ? data.bookings.filter((booking) => {
                                      const bookingDate = formatDate(
                                          new Date(booking.slot_date)
                                      );
                                      // Excluir la reserva actual que está siendo cancelada
                                      return (
                                          bookingDate === dateStr &&
                                          booking.booking_id !== hour.booking_id
                                      );
                                  })
                                : [];

                            // Si hay al menos una reserva después de excluir la que se cancela
                            hasMoreBookingsForDay = bookingsForDate.length > 0;
                            console.log(
                                `Usuario tiene ${bookingsForDate.length} reservas para ${dateStr} (excluyendo la cancelada)`
                            );
                        }
                    } else {
                        console.error(
                            "Error al obtener reservas de usuario:",
                            response.status
                        );
                        // En caso de error, asumimos que no hay más reservas
                        hasMoreBookingsForDay = false;
                    }
                } catch (fetchError) {
                    console.error("Error al obtener reservas:", fetchError);
                    hasMoreBookingsForDay = false;
                }
            }
        } catch (error) {
            console.error("Error al verificar reservas adicionales:", error);
            hasMoreBookingsForDay = false;
        }

        // Actualizar la lista de reservas del usuario
        if (!hasMoreBookingsForDay) {
            console.log(
                `Eliminando ${dateStr} de userBookings porque no quedan más reservas`
            );
            setUserBookings((prevBookings) =>
                prevBookings.filter((date) => date !== dateStr)
            );
        } else {
            console.log(
                `Manteniendo ${dateStr} en userBookings porque aún quedan ${hasMoreBookingsForDay} reservas`
            );
        }

        // Actualizamos la disponibilidad en tiempo real para este día específico
        setMonthAvailability((prev) => {
            const updatedAvailability = { ...prev };

            // Si tenemos datos para esta fecha
            if (updatedAvailability[dateStr]) {
                // Decrementar el contador de slots reservados
                updatedAvailability[dateStr].bookedSlots -= 1;

                // Asegurarnos que bookedSlots no sea negativo
                if (updatedAvailability[dateStr].bookedSlots < 0) {
                    updatedAvailability[dateStr].bookedSlots = 0;
                }

                // Incrementar el contador de slots disponibles
                updatedAvailability[dateStr].availableSlots += 1;

                updatedAvailability[dateStr].hasUserBooking =
                    hasMoreBookingsForDay;

                console.log(
                    `Estableciendo hasUserBooking=${hasMoreBookingsForDay} para ${dateStr}`
                );

                // Recalcular el porcentaje de disponibilidad
                if (updatedAvailability[dateStr].totalSlots > 0) {
                    updatedAvailability[dateStr].availability =
                        (updatedAvailability[dateStr].availableSlots /
                            updatedAvailability[dateStr].totalSlots) *
                        100;
                }
            }

            return updatedAvailability;
        });

        // Forzar actualización del calendario para reflejar los cambios en el color
        setTimeout(() => {
            if (calendarRef.current) {
                const calendarApi = calendarRef.current.getApi();
                calendarApi.render();
                console.log(
                    "Calendario re-renderizado después de la cancelación"
                );
            }
        }, 100);

        // Notificar al componente padre (Home) sobre la cancelación para actualizar tokens
        if (onBookingCancelled) {
            onBookingCancelled();
        }
    };

    const handleClick = (dateClickInfo) => {
        const date = new Date(dateClickInfo.date);

        // No permitir seleccionar fechas pasadas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return;
        }

        // Verificar si hay disponibilidad para esta fecha
        const dateStr = formatDate(date);
        const dayData = monthAvailability[dateStr];

        if (dayData && dayData.isPast) {
            // No permitir seleccionar días sin disponibilidad
            return;
        }

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const formattedDate = date.toLocaleDateString("en-EN", options);
        setSelectedDate(formattedDate);
        setSelectedDateObj(date);
    };

    return (
        <div
            className="container-fluid d-flex justify-content-center align-items-center mt-lg-0"
            style={{ minHeight: "70vh", marginTop: "35vh" }}
        >
            <div className="row w-100">
                <div className="col-12 col-lg-10 offset-lg-1 col-xl-8 offset-xl-2 ">
                    <div className="row">
                        <div className="col-12 col-lg-8 mb-3 mb-lg-0">
                            <div
                                className="calendar-container shadow-lg p-2 rounded-2"
                                style={{ height: "70vh" }}
                            >
                                <div className="mb-3 d-flex align-items-center gap-2 month-year-selectors">
                                    {/* Selector de Mes */}
                                    <div className="flex-grow-1">
                                        <select
                                            className="form-select"
                                            value={selectedDateCalendar.getMonth()}
                                            onChange={handleMonthChange}
                                            aria-label="Seleccionar mes"
                                        >
                                            {months.map((month) => (
                                                <option
                                                    key={month.value}
                                                    value={month.value}
                                                >
                                                    {month.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Selector de Año */}
                                    <div className="flex-grow-1">
                                        <select
                                            className="form-select"
                                            value={selectedDateCalendar.getFullYear()}
                                            onChange={handleYearChange}
                                            aria-label="Seleccionar año"
                                        >
                                            {years.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    height="90%"
                                    aspectRatio={1.5}
                                    expandRows={true}
                                    handleWindowResize={true}
                                    dateClick={handleClick}
                                    headerToolbar={{
                                        right: "today",
                                    }}
                                    locale="en"
                                    dayCellContent={(arg) => {
                                        // Obtener la fecha en formato YYYY-MM-DD
                                        const date = arg.date;
                                        const dateStr = formatDate(date);
                                        const dayNumber = date.getDate();

                                        // Verificar si tenemos datos de disponibilidad para esta fecha
                                        const dayData =
                                            monthAvailability[dateStr];

                                        let circleColor = "#e0e0e0"; // Color por defecto (gris)
                                        let hasUserBooking = false;
                                        let availableSlots = 0;

                                        if (dayData) {
                                            hasUserBooking =
                                                dayData.hasUserBooking;
                                            // Asegurarse de que availableSlots sea un número
                                            availableSlots = Number(
                                                dayData.availableSlots
                                            );

                                            if (
                                                dayData.isPast ||
                                                dayData.error
                                            ) {
                                                circleColor = "#e0e0e0"; // Gris para días pasados o con error
                                            } else {
                                                // Determinar el color basado en slots disponibles
                                                if (availableSlots === 0) {
                                                    circleColor = "#ff6b6b"; // Rojo - No hay disponibilidad
                                                } else if (
                                                    availableSlots <= 3
                                                ) {
                                                    circleColor = "#ffa502"; // Naranja - Baja disponibilidad
                                                } else if (
                                                    availableSlots <= 6
                                                ) {
                                                    circleColor = "#ffdd59"; // Amarillo - Media disponibilidad
                                                } else {
                                                    circleColor = "#2ed573"; // Verde - Alta disponibilidad
                                                }
                                            }
                                        }

                                        // Crear el HTML para el círculo de disponibilidad y el check de reserva
                                        return {
                                            html: `
                                                <div class="fc-daygrid-day-top">
                                                    <div class="fc-daygrid-day-number" style="text-decoration: none !important; border-bottom: none !important;">${dayNumber}</div>
                                                    <div style="display: flex; justify-content: center; margin-top: 2px; gap: 3px; text-decoration: none !important; border-bottom: none !important;">
                                                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${circleColor}; text-decoration: none !important; border-bottom: none !important;"></div>
                                                        ${
                                                            hasUserBooking
                                                                ? '<i class="fas fa-check-circle" style="color:rgb(46, 146, 213); font-size: 14px; text-decoration: none !important; border-bottom: none !important;"></i>'
                                                                : ""
                                                        }
                                                    </div>
                                                </div>
                                            `,
                                        };
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-lg-4">
                            <div
                                className="hours-container shadow-lg p-3 rounded-2"
                                style={{ height: "70vh", overflowY: "auto" }}
                            >
                                {selectedDate ? (
                                    <p className="text-primary fs-5 fw-bold text-center mt-4">
                                        {selectedDate}
                                    </p>
                                ) : (
                                    <p className="text-primary fs-4 fw-bold text-center mt-4">
                                        Selected a date
                                    </p>
                                )}
                                <Hours
                                    selectedDate={selectedDateObj}
                                    onHourSelect={handleHourSelect}
                                    onHourCancel={handleHourCancel}
                                    onNeedTokens={onNeedTokens}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calendar;
