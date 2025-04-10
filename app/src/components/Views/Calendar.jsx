import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Hours from "./Hours";
import "./calendar.css";

function Calendar({ onNeedTokens, onBookingComplete }) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedDateObj, setSelectedDateObj] = useState(null);

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

    const handleHourSelect = (hour, isSuccessful) => {
        console.log("Hora seleccionada:", hour);

        // Si la reserva fue exitosa, notificar al componente padre
        if (isSuccessful && onBookingComplete) {
            onBookingComplete();
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
                                <div className="mb-3 d-flex align-items-center gap-2">
                                    {/* Selector de Mes */}
                                    <div className="flex-grow-1">
                                        <select
                                            className="form-select"
                                            style={{ cursor: "pointer" }}
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
                                            style={{ cursor: "pointer" }}
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
                                        left: "prev,next",
                                        center: "title",
                                        right: "today",
                                    }}
                                    locale="en"
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
