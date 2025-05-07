import React, { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import {
    getBookings,
    updateBookingStatus,
    getBookingDetails,
    deleteBooking,
} from "../../services/adminService";
import { useCustomAlert } from "../Alert/CustomAlert";

function BookingsManagement() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState("");
    const [bookingDetails, setBookingDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Usar nuestro hook personalizado para alertas
    const {
        showAlert,
        showConfirmDialog,
        AlertComponent,
        ConfirmDialogComponent,
    } = useCustomAlert();

    // Obtener todas las reservas
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await getBookings(filterDate || null);
            setBookings(data);
            setError(null);
        } catch (err) {
            setError("There was an error loading the bookings.");
            showAlert({
                message: "There was an error loading the bookings.",
                severity: "error",
            });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar reservas al montar el componente o cuando cambia el filtro
    useEffect(() => {
        fetchBookings();
    }, [filterDate]);

    // Manejar cambio de filtro por fecha
    const handleDateFilterChange = (e) => {
        setFilterDate(e.target.value);
    };

    // Manejar cuando una tutoría ha sido completada (sin cambios)
    const handleMarkAsCompleted = async (bookingId) => {
        showConfirmDialog({
            title: "Confirm status change.",
            message:
                "Are you sure you want to mark this tutoring session as Completed?",
            confirmButtonText: "Yes, complete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "success",
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await updateBookingStatus(bookingId, "completed");

                    // Actualizar la lista de reservas
                    setBookings(
                        bookings.map((booking) =>
                            booking.booking_id === bookingId
                                ? { ...booking, status: "completed" }
                                : booking
                        )
                    );

                    // Mostrar mensaje de éxito con nuestra alerta personalizada
                    showAlert({
                        message:
                            "Tutoring session marked as completed successfully",
                        severity: "success",
                    });
                } catch (err) {
                    setError("Error updating the status");
                    showAlert({
                        message:
                            "Error marking the tutoring session as completed",
                        severity: "error",
                    });

                    console.error(err);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // Función modificada para CANCELAR tutorías
    const handleCancelBooking = async (bookingId) => {
        showConfirmDialog({
            title: "Cancel Tutoring Session",
            message:
                "Are you sure you want to cancel this tutoring session? This will free up the time so other users can book it again.",
            confirmButtonText: "Yes, cancel",
            cancelButtonText: "No",
            confirmButtonColor: "error",
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await deleteBooking(bookingId);

                    // Actualizar la lista de reservas
                    setBookings(
                        bookings.filter(
                            (booking) => booking.booking_id !== bookingId
                        )
                    );

                    // Si el modal de detalles está abierto y es la misma reserva, cerrarlo
                    if (
                        showDetailsModal &&
                        bookingDetails &&
                        bookingDetails.booking_id === bookingId
                    ) {
                        setShowDetailsModal(false);
                    }

                    // Mostrar mensaje de éxito
                    showAlert({
                        message:
                            "Tutoring session cancelled and time slot freed up successfully",
                        severity: "success",
                    });
                } catch (err) {
                    setError("Error cancelling the tutoring session");
                    showAlert({
                        message: "Error cancelling the tutoring session",
                        severity: "error",
                    });

                    console.error(err);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // Mostrar detalles de una reserva
    const handleShowDetails = async (bookingId) => {
        try {
            setLoading(true);
            const details = await getBookingDetails(bookingId);
            setBookingDetails(details);
            setShowDetailsModal(true);
        } catch (err) {
            setError("Error getting booking details");
            showAlert({
                message: "Error getting the booking details",
                severity: "error",
            });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Formatear hora (HH:MM:SS -> HH:MM)
    const formatTime = (timeString) => {
        if (!timeString) return "";
        return timeString.substring(0, 5);
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Tutorías Asignadas</h5>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <div className="mb-3">
                    <label htmlFor="filterDate" className="form-label">
                        Filter by date
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        id="filterDate"
                        value={filterDate}
                        onChange={handleDateFilterChange}
                    />
                </div>

                {loading && <p>Loading bookings....</p>}

                {!loading && bookings.length === 0 ? (
                    <p>There are no bookings to show. </p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking.booking_id}>
                                        <td>
                                            {new Date(
                                                booking.slot_date
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {formatTime(booking.start_time)} -{" "}
                                            {formatTime(booking.end_time)}
                                        </td>
                                        <td>{booking.student_name}</td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    booking.status ===
                                                    "upcoming"
                                                        ? "bg-primary"
                                                        : booking.status ===
                                                          "completed"
                                                        ? "bg-success"
                                                        : "bg-danger"
                                                }`}
                                            >
                                                {booking.status === "upcoming"
                                                    ? "Upcoming"
                                                    : booking.status ===
                                                      "completed"
                                                    ? "Completed"
                                                    : "Cancelled"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-sm btn-info me-2"
                                                    onClick={() =>
                                                        handleShowDetails(
                                                            booking.booking_id
                                                        )
                                                    }
                                                >
                                                    Details
                                                </button>

                                                {booking.status ===
                                                    "upcoming" && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() =>
                                                                handleMarkAsCompleted(
                                                                    booking.booking_id
                                                                )
                                                            }
                                                        >
                                                            Complete
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() =>
                                                                handleCancelBooking(
                                                                    booking.booking_id
                                                                )
                                                            }
                                                            title="Cancel and free up time slot"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal para mostrar detalles de la reserva */}
                {showDetailsModal && bookingDetails && (
                    <div
                        className="modal fade show"
                        style={{
                            display: "block",
                            backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                        tabIndex="-1"
                    >
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Tutoring Session Details
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() =>
                                            setShowDetailsModal(false)
                                        }
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <h6>Student Information</h6>
                                            <p>
                                                <strong>Name:</strong>{" "}
                                                {bookingDetails.student_name}
                                            </p>
                                            <p>
                                                <strong>Email:</strong>{" "}
                                                {bookingDetails.student_email}
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>
                                                Tutoring Session Information
                                            </h6>
                                            <p>
                                                <strong>Date:</strong>{" "}
                                                {new Date(
                                                    bookingDetails.slot_date
                                                ).toLocaleDateString()}
                                            </p>
                                            <p>
                                                <strong>Time:</strong>{" "}
                                                {formatTime(
                                                    bookingDetails.start_time
                                                )}{" "}
                                                -{" "}
                                                {formatTime(
                                                    bookingDetails.end_time
                                                )}
                                            </p>
                                            <p>
                                                <strong>Tokens used:</strong>{" "}
                                                {bookingDetails.tokens_used}
                                            </p>
                                            <p>
                                                <strong>Status:</strong>{" "}
                                                {bookingDetails.status ===
                                                "upcoming"
                                                    ? "Pending"
                                                    : bookingDetails.status ===
                                                      "completed"
                                                    ? "Completed"
                                                    : "Cancelled"}
                                            </p>
                                        </div>
                                    </div>

                                    {bookingDetails.zoom_link && (
                                        <div className="row mb-3">
                                            <div className="col-12">
                                                <h6>Zoom Information</h6>
                                                <p>
                                                    <strong>Link:</strong>{" "}
                                                    <a
                                                        href={
                                                            bookingDetails.zoom_link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {
                                                            bookingDetails.zoom_link
                                                        }
                                                    </a>
                                                </p>
                                                {bookingDetails.meeting_id && (
                                                    <p>
                                                        <strong>
                                                            Meeting ID:
                                                        </strong>{" "}
                                                        {
                                                            bookingDetails.meeting_id
                                                        }
                                                    </p>
                                                )}
                                                {bookingDetails.meeting_password && (
                                                    <p>
                                                        <strong>
                                                            Password:
                                                        </strong>{" "}
                                                        {
                                                            bookingDetails.meeting_password
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {bookingDetails.notes && (
                                        <div className="row">
                                            <div className="col-12">
                                                <h6>Notes</h6>
                                                <p>{bookingDetails.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setShowDetailsModal(false)
                                        }
                                    >
                                        Close
                                    </button>

                                    {bookingDetails.status === "upcoming" && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={() => {
                                                    handleMarkAsCompleted(
                                                        bookingDetails.booking_id
                                                    );
                                                    setShowDetailsModal(false);
                                                }}
                                            >
                                                Mark as Completed
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={() => {
                                                    handleCancelBooking(
                                                        bookingDetails.booking_id
                                                    );
                                                    setShowDetailsModal(false);
                                                }}
                                            >
                                                Cancel Tutoring Session
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Componentes de alertas y diálogos */}
                <AlertComponent />
                <ConfirmDialogComponent />
            </div>
        </div>
    );
}

export default BookingsManagement;
