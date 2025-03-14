import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Hours from "./Hours";
import "./calendar.css";

function Calendar() {
    const [selectedDate, setSelectedDate] = useState("");

    const handleClick = (dateClickInfo) => {
        const date = new Date(dateClickInfo.date);

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const formattedDate = date.toLocaleDateString("en-US", options);
        setSelectedDate(formattedDate);
    };

    return (
        <div className="flex-grow-1">
            <div className="d-flex justify-content-center align-items-center h-100 pb-5">
                <div className="col-4 h-75 shadow-lg p-2 rounded-2 border">
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
                <div className="col-2 h-75 m-3 d-flex flex-column align-items-center shadow-lg p-3 rounded-2">
                    {selectedDate ? (
                        <p className="text-primary fs-5 fw-bold">
                            {selectedDate}
                        </p>
                    ) : (
                        <p className="text-primary fs-4 fw-bold">
                            Select a date
                        </p>
                    )}
                    <Hours />
                </div>
            </div>
        </div>
    );
}

export default Calendar;
