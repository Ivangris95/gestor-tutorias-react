import React, { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import {
    getBookings,
    updateBookingStatus,
    getBookingDetails,
} from "../../services/adminService";
import { useCustomAlert } from "../Alert/CustomAlert"; // Importamos nuestro hook personalizado

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
            setError("Error loading reservations");
            showAlert({
                message: "Error loading the reservations",
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

    // Manejar cambio de estado de reserva
    const handleStatusChange = async (bookingId, newStatus) => {
        // En lugar de window.confirm, usamos nuestro diálogo personalizado
        showConfirmDialog({
            title: "Confirm state change",
            message: `Are you sure you want to change the state to "${
                newStatus === "completed" ? "Completed" : "Canceled"
            }?"`,
            confirmButtonText: "Yes, change",
            cancelButtonText: "Cancel",
            confirmButtonColor: newStatus === "completed" ? "success" : "error",
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await updateBookingStatus(bookingId, newStatus);

                    // Actualizar la lista de reservas
                    setBookings(
                        bookings.map((booking) =>
                            booking.booking_id === bookingId
                                ? { ...booking, status: newStatus }
                                : booking
                        )
                    );

                    // Mostrar mensaje de éxito con nuestra alerta personalizada
                    showAlert({
                        message: "State updated successfully",
                        severity: "success",
                    });
                } catch (err) {
                    setError("Error updating state");
                    showAlert({
                        message: "Error updating reservation state",
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
            setError("Error al obtener detalles de la reserva");
            showAlert({
                message: "Error al obtener los detalles de la reserva",
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
                <h5 className="card-title">Assigned Tutorials.</h5>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <div className="mb-3">
                    <label htmlFor="filterDate" className="form-label">
                        Filter by date.
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        id="filterDate"
                        value={filterDate}
                        onChange={handleDateFilterChange}
                    />
                </div>

                {loading && <p>Loading reservations....</p>}

                {!loading && bookings.length === 0 ? (
                    <p>There are no reservations to show.</p>
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
                                                                handleStatusChange(
                                                                    booking.booking_id,
                                                                    "completed"
                                                                )
                                                            }
                                                        >
                                                            Complete
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    booking.booking_id,
                                                                    "cancelled"
                                                                )
                                                            }
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
                                        Detalles de la Tutoría
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
                                            <h6>Información del Estudiante</h6>
                                            <p>
                                                <strong>Nombre:</strong>{" "}
                                                {bookingDetails.student_name}
                                            </p>
                                            <p>
                                                <strong>Email:</strong>{" "}
                                                {bookingDetails.student_email}
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>Información de la Tutoría</h6>
                                            <p>
                                                <strong>Fecha:</strong>{" "}
                                                {new Date(
                                                    bookingDetails.slot_date
                                                ).toLocaleDateString()}
                                            </p>
                                            <p>
                                                <strong>Horario:</strong>{" "}
                                                {formatTime(
                                                    bookingDetails.start_time
                                                )}{" "}
                                                -{" "}
                                                {formatTime(
                                                    bookingDetails.end_time
                                                )}
                                            </p>
                                            <p>
                                                <strong>
                                                    Tokens utilizados:
                                                </strong>{" "}
                                                {bookingDetails.tokens_used}
                                            </p>
                                            <p>
                                                <strong>Estado:</strong>{" "}
                                                {bookingDetails.status ===
                                                "upcoming"
                                                    ? "Pendiente"
                                                    : bookingDetails.status ===
                                                      "completed"
                                                    ? "Completada"
                                                    : "Cancelada"}
                                            </p>
                                        </div>
                                    </div>

                                    {bookingDetails.zoom_link && (
                                        <div className="row mb-3">
                                            <div className="col-12">
                                                <h6>Información de Zoom</h6>
                                                <p>
                                                    <strong>Enlace:</strong>{" "}
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
                                                            ID de Reunión:
                                                        </strong>{" "}
                                                        {
                                                            bookingDetails.meeting_id
                                                        }
                                                    </p>
                                                )}
                                                {bookingDetails.meeting_password && (
                                                    <p>
                                                        <strong>
                                                            Contraseña:
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
                                                <h6>Notas</h6>
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
                                        Cerrar
                                    </button>

                                    {bookingDetails.status === "upcoming" && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={() => {
                                                    handleStatusChange(
                                                        bookingDetails.booking_id,
                                                        "completed"
                                                    );
                                                    setShowDetailsModal(false);
                                                }}
                                            >
                                                Marcar como Completada
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={() => {
                                                    handleStatusChange(
                                                        bookingDetails.booking_id,
                                                        "cancelled"
                                                    );
                                                    setShowDetailsModal(false);
                                                }}
                                            >
                                                Cancelar Tutoría
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
