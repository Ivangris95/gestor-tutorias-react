import React, { useState, useEffect } from "react";
import {
    getAvailableSlots,
    addAvailableSlot,
    deleteAvailableSlot,
    getBookings,
    updateBookingStatus,
    getBookingDetails,
} from "../../services/adminService";
import HourManagement from "../AdminComponents/HourManagement";

function AdminPanel() {
    const [activeTab, setActiveTab] = useState("hours");

    return (
        <div className="container-fluid m-5 mb-0">
            <div className="row mb-4">
                <div className="col">
                    <h3 className="text-primary">Admin Panel</h3>
                    <p className="text-muted">
                        Manage available hours and check assigned tutoring
                        sessions.
                    </p>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${
                                    activeTab === "hours" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("hours")}
                            >
                                Hours Settings
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${
                                    activeTab === "bookings" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("bookings")}
                            >
                                Assigned Tutoring Sessions
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    {activeTab === "hours" ? (
                        <HourManagement />
                    ) : (
                        <BookingsManagement />
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente para gestionar las horas disponibles
function HoursManagement() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        slotDate: "",
        startTime: "",
        endTime: "",
        slotDuration: 60, // Mantenemos este valor por defecto aunque no se muestre en el formulario
    });

    // Obtener horarios disponibles
    const fetchSlots = async () => {
        try {
            setLoading(true);
            const data = await getAvailableSlots();
            setSlots(data);
            setError(null);
        } catch (err) {
            setError("Error al cargar horarios disponibles");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar horarios al montar el componente
    useEffect(() => {
        fetchSlots();
        // Mientras desarrollamos, usemos datos de prueba si la API falla
        if (slots.length === 0) {
            setSlots([
                {
                    slot_id: 1,
                    slot_date: "2025-03-26",
                    start_time: "10:00:00",
                    end_time: "11:00:00",
                    is_booked: 0,
                    created_by: 1,
                    slot_duration: 60,
                },
                {
                    slot_id: 2,
                    slot_date: "2025-03-26",
                    start_time: "12:00:00",
                    end_time: "13:00:00",
                    is_booked: 1,
                    created_by: 1,
                    slot_duration: 60,
                },
            ]);
        }
    }, []);

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            // Obtener el ID del usuario actual (admin) del localStorage
            const userString = localStorage.getItem("user");
            const user = JSON.parse(userString);

            const slotData = {
                ...formData,
                createdBy: user.id, // Asumiendo que tienes el ID del usuario en localStorage
            };

            await addAvailableSlot(slotData);

            // Limpiar formulario
            setFormData({
                slotDate: "",
                startTime: "",
                endTime: "",
                slotDuration: 60, // Mantenemos el valor predeterminado
            });

            // Recargar horarios
            fetchSlots();

            // Mostrar mensaje de éxito (podrías usar un toast o alerta)
            alert("Horario creado correctamente");
        } catch (err) {
            setError("Error al crear horario");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Manejar eliminación de horario
    const handleDelete = async (slotId) => {
        if (!window.confirm("¿Estás seguro de eliminar este horario?")) {
            return;
        }

        try {
            setLoading(true);
            await deleteAvailableSlot(slotId);

            // Actualizar lista de horarios filtrando el eliminado
            setSlots(slots.filter((slot) => slot.slot_id !== slotId));

            // Mostrar mensaje de éxito
            alert("Horario eliminado correctamente");
        } catch (err) {
            setError("Error al eliminar horario");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Formatear hora para mostrar
    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(":");
        return `${hours}:${minutes}`;
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Available Hours Settings"</h5>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="slotDate" className="form-label">
                            Date
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            id="slotDate"
                            value={formData.slotDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="startTime" className="form-label">
                            Start time
                        </label>
                        <input
                            type="time"
                            className="form-control"
                            id="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="endTime" className="form-label">
                            End time
                        </label>
                        <input
                            type="time"
                            className="form-control"
                            id="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Campo de duración eliminado */}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Añadiendo..." : "Añadir Hora Disponible"}
                    </button>
                </form>

                <hr />

                <h6 className="mb-3">Configured hours:</h6>

                {loading && <p>Loading schedules...</p>}

                {!loading && slots.length === 0 ? (
                    <p>No schedules configured.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Start time</th>
                                    <th>End time</th>
                                    <th>Status</th>
                                    <th>User</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map((slot) => (
                                    <tr key={slot.slot_id}>
                                        <td>
                                            {new Date(
                                                slot.slot_date
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>{formatTime(slot.start_time)}</td>
                                        <td>{formatTime(slot.end_time)}</td>
                                        <td>
                                            {slot.is_booked ? (
                                                <span className="badge bg-danger">
                                                    Reserved
                                                </span>
                                            ) : (
                                                <span className="badge bg-success">
                                                    Available
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {slot.is_booked
                                                ? slot.student_name ||
                                                  "Usuario reservado"
                                                : slot.created_by_username ||
                                                  "Admin"}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() =>
                                                    handleDelete(slot.slot_id)
                                                }
                                                disabled={
                                                    slot.is_booked || loading
                                                }
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Componente para ver las tutorías asignadas
function BookingsManagement() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Obtener todas las reservas
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await getBookings(filterDate || null);
            setBookings(data);
            setError(null);
        } catch (err) {
            setError("Error al cargar reservas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar reservas al montar el componente
    useEffect(() => {
        fetchBookings();
        // Datos de prueba en caso de que la API falle
        if (bookings.length === 0) {
            setBookings([
                {
                    booking_id: 1,
                    slot_date: "2025-03-26",
                    start_time: "10:00:00",
                    end_time: "11:00:00",
                    student_name: "Juan Pérez",
                    status: "upcoming",
                    tokens_used: 1,
                },
                {
                    booking_id: 2,
                    slot_date: "2025-03-27",
                    start_time: "15:00:00",
                    end_time: "16:00:00",
                    student_name: "Ana García",
                    status: "completed",
                    tokens_used: 1,
                },
            ]);
        }
    }, [filterDate]);

    // Manejar cambio de filtro por fecha
    const handleDateFilterChange = (e) => {
        setFilterDate(e.target.value);
    };

    // Manejar cambio de estado de reserva
    const handleStatusChange = async (bookingId, newStatus) => {
        if (
            !window.confirm(
                `¿Estás seguro de cambiar el estado a "${newStatus}"?`
            )
        ) {
            return;
        }

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

            // Mostrar mensaje de éxito
            alert("Estado actualizado correctamente");
        } catch (err) {
            setError("Error al actualizar estado");
            console.error(err);
        } finally {
            setLoading(false);
        }
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Formatear fecha y hora
    const formatDateTime = (date, time) => {
        const formattedDate = new Date(date).toLocaleDateString();
        const [hours, minutes] = time.split(":");
        return `${formattedDate} ${hours}:${minutes}`;
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Tutorías Asignadas</h5>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <div className="mb-3">
                    <label htmlFor="filterDate" className="form-label">
                        Filtrar por fecha
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        id="filterDate"
                        value={filterDate}
                        onChange={handleDateFilterChange}
                    />
                </div>

                {loading && <p>Cargando reservas...</p>}

                {!loading && bookings.length === 0 ? (
                    <p>No hay reservas para mostrar.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Estudiante</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
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
                                                    ? "Pendiente"
                                                    : booking.status ===
                                                      "completed"
                                                    ? "Completada"
                                                    : "Cancelada"}
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
                                                    Detalles
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
                                                            Completar
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
                                                            Cancelar
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
            </div>
        </div>
    );
}

export default AdminPanel;
