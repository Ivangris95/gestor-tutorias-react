import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Hours from "./Hours";
import "./calendar.css";

function Calendar({ onNeedTokens, onBookingComplete }) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedDateObj, setSelectedDateObj] = useState(null);

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
        const formattedDate = date.toLocaleDateString("en-US", options);
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
                                <FullCalendar
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    height="100%"
                                    aspectRatio={1.5}
                                    expandRows={true}
                                    handleWindowResize={true}
                                    dateClick={handleClick}
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
                                        Select a date
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
