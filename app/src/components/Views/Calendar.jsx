import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Hours from "./Hours";
import "./calendar.css";

function Calendar({ userId, onNeedTokens, onBookingComplete }) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedDateObj, setSelectedDateObj] = useState(null);
    const [monthAvailability, setMonthAvailability] = useState({});
    const [loadingAvailability, setLoadingAvailability] = useState(false);
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
            // Salir si no hay userId
            if (!userId) {
                console.warn("No se proporcionó userId para obtener reservas");
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
    }, [userId]); // Añadir userId como dependencia

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

    // Cargar datos de disponibilidad y reservas del usuario
    useEffect(() => {
        const fetchAvailabilityData = async () => {
            setLoadingAvailability(true);

            try {
                const currentMonth = selectedDateCalendar.getMonth();
                const currentYear = selectedDateCalendar.getFullYear();

                // Obtener el primer y último día del mes
                const firstDay = new Date(currentYear, currentMonth, 1);
                const lastDay = new Date(currentYear, currentMonth + 1, 0);

                const firstDayStr = formatDate(firstDay);
                const lastDayStr = formatDate(lastDay);

                console.log(
                    `Cargando disponibilidad para el período: ${firstDayStr} a ${lastDayStr}`
                );

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

                // El número máximo posible de reservas por día sería el número de horarios predefinidos
                const maxBookingsPerDay = predefinedTimesData.times.length;

                console.log(
                    `Número máximo de horarios por día: ${maxBookingsPerDay}`
                );

                // NO cargaremos las reservas del usuario aquí, ya tenemos un useEffect dedicado para eso
                // y así evitamos que se sobrescriba cada vez que cambiamos de mes

                // 3. Procesar cada día del mes para obtener su disponibilidad
                // Crear un objeto para almacenar disponibilidad por día
                const availabilityData = {};

                // Para cada día del mes
                const daysInMonth = lastDay.getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentYear, currentMonth, day);
                    const dateStr = formatDate(date);

                    // Si es un día pasado, marcar como no disponible
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    try {
                        // Registrar si es un día pasado (solo para fines de selección)
                        const isPastDay = date < today;

                        // 4. Obtener horas deshabilitadas para este día específico
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

                        // 5. Obtener horas reservadas para este día específico
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

                        // 6. Calcular las estadísticas de disponibilidad
                        // Número total de slots posibles = horarios predefinidos - horas deshabilitadas
                        const totalPossibleSlots =
                            maxBookingsPerDay - disabledTimeIds.length;

                        // Número de slots reservados
                        const bookedSlotsCount = bookedSlots.length;

                        // Slots disponibles = total posibles - reservados
                        const availableSlotsCount =
                            totalPossibleSlots - bookedSlotsCount;

                        // Porcentaje de disponibilidad (si hay slots posibles)
                        const availabilityPercentage =
                            totalPossibleSlots > 0
                                ? (availableSlotsCount / totalPossibleSlots) *
                                  100
                                : 0;

                        // Verificar explícitamente si el usuario tiene una reserva para este día
                        const hasUserBooking = userBookings.includes(dateStr);

                        console.log(
                            `Día ${dateStr}: Total posible: ${totalPossibleSlots}, Reservados: ${bookedSlotsCount}, Disponibles: ${availableSlotsCount}, Reserva del usuario: ${hasUserBooking}`
                        );

                        availabilityData[dateStr] = {
                            totalSlots: totalPossibleSlots,
                            bookedSlots: bookedSlotsCount,
                            availableSlots: availableSlotsCount,
                            availability: availabilityPercentage,
                            isPast: isPastDay, // Guardamos esta información solo para impedir selección
                            hasUserBooking: hasUserBooking, // Usamos la verificación explícita
                        };
                    } catch (error) {
                        console.error(
                            `Error al obtener datos para ${dateStr}:`,
                            error
                        );
                        availabilityData[dateStr] = {
                            error: true,
                            message: error.message,
                            hasUserBooking: userBookings.includes(dateStr),
                        };
                    }
                }

                setMonthAvailability(availabilityData);
                console.log(
                    "Datos de disponibilidad cargados:",
                    availabilityData
                );
            } catch (error) {
                console.error(
                    "Error al cargar datos de disponibilidad:",
                    error
                );
            } finally {
                setLoadingAvailability(false);
            }
        };

        // Cargar datos inicialmente
        fetchAvailabilityData();

        // Eliminar la actualización periódica - ahora solo se actualizará cuando se seleccione una hora
        // const intervalId = setInterval(fetchAvailabilityData, 30000);
        // return () => clearInterval(intervalId);
    }, [
        selectedDateCalendar.getMonth(),
        selectedDateCalendar.getFullYear(),
        userBookings,
    ]);

    // Manejar el cambio de mes desde el dropdown
    const handleMonthChange = (e) => {
        const month = parseInt(e.target.value);
        const newDate = new Date(selectedDateCalendar);
        newDate.setMonth(month);
        handleDateChange(newDate);
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

        if (dayData && (dayData.availableSlots === 0 || dayData.isPast)) {
            // No permitir seleccionar días sin disponibilidad
            return;
        }

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const formattedDate = date.toLocaleDateString("es-ES", options);
        setSelectedDate(formattedDate);
        setSelectedDateObj(date);
    };

    // Función para obtener el color basado en la cantidad exacta de horas disponibles
    // Cada día tiene 10 slots posibles según la tabla predefined_times
    const getAvailabilityColor = (availableSlots) => {
        // Convertimos a número para asegurarnos
        const slots = Number(availableSlots);

        if (slots === 0) {
            return "#ff6b6b"; // Rojo - No hay horas disponibles
        } else if (slots <= 5) {
            return "#ffa502"; // Naranja - 5 o menos horas disponibles
        } else if (slots <= 9) {
            return "#ffdd59"; // Amarillo - 6-9 horas disponibles
        } else {
            return "#2ed573"; // Verde - 10 horas disponibles (todas)
        }
    };

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
                const updatedAvailability = { ...prev };

                // Si tenemos datos para esta fecha
                if (updatedAvailability[dateStr]) {
                    // Incrementar el contador de slots reservados
                    updatedAvailability[dateStr].bookedSlots += 1;

                    // Decrementar el contador de slots disponibles
                    updatedAvailability[dateStr].availableSlots -= 1;

                    // Marcar como que tiene reserva del usuario
                    updatedAvailability[dateStr].hasUserBooking = true;

                    // Recalcular el porcentaje de disponibilidad (para mantener consistencia)
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
                        `Actualización tras reserva: Fecha ${dateStr}, Slots disponibles ahora: ${updatedAvailability[dateStr].availableSlots}, Usuario tiene reserva: ${updatedAvailability[dateStr].hasUserBooking}`
                    );
                }

                return updatedAvailability;
            });

            // Forzar actualización del calendario para reflejar los cambios en el color
            setTimeout(() => {
                if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    calendarApi.render(); // Esto forzará la re-renderización del calendario
                    console.log(
                        "Calendario re-renderizado después de la reserva"
                    );
                }
            }, 100); // Pequeño retraso para asegurar que el estado se ha actualizado

            // Notificar al componente padre
            if (onBookingComplete) {
                onBookingComplete();
            }
        }
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

                                {/* Indicador de carga de disponibilidad */}
                                {loadingAvailability && (
                                    <div className="availability-loading">
                                        <small>
                                            Cargando disponibilidad...
                                        </small>
                                    </div>
                                )}

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
                                        left: "prev,next",
                                        center: "title",
                                        right: "today",
                                    }}
                                    locale="es" // Soporte para español
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

                                            // Log para depuración
                                            console.log(
                                                `Renderizando día ${dateStr}: Slots disponibles = ${availableSlots}, tipo: ${typeof availableSlots}, Reserva del usuario: ${hasUserBooking}`
                                            );

                                            if (
                                                dayData.isPast ||
                                                dayData.error
                                            ) {
                                                circleColor = "#e0e0e0"; // Solo para días con error mostraremos gris
                                            } else {
                                                // Usar nuestra función para determinar el color basado en la cantidad de slots disponibles
                                                circleColor =
                                                    getAvailabilityColor(
                                                        availableSlots
                                                    );
                                                console.log(
                                                    `Color asignado para ${availableSlots} slots: ${circleColor}`
                                                );
                                            }
                                        }

                                        // Crear el HTML para el círculo de disponibilidad y el check de reserva
                                        // Hacemos más visible el check
                                        return {
                                            html: `
                                                <div class="fc-daygrid-day-top">
                                                    <div class="fc-daygrid-day-number" style="text-decoration: none !important; border-bottom: none !important;">${dayNumber}</div>
                                                    <div style="display: flex; justify-content: center; margin-top: 2px; gap: 3px; text-decoration: none !important; border-bottom: none !important;">
                                                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${circleColor}; text-decoration: none !important; border-bottom: none !important;"></div>
                                                        ${
                                                            hasUserBooking
                                                                ? '<i class="fas fa-check-circle" style="color: #2ed573; font-size: 14px; text-decoration: none !important; border-bottom: none !important;"></i>'
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
                                        Selecciona una fecha
                                    </p>
                                )}
                                <Hours
                                    selectedDate={selectedDateObj}
                                    onHourSelect={handleHourSelect}
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
