import React, { useState, useEffect, useRef } from "react";
import { useCustomAlert } from "../Alert/CustomAlert";

function NotificationsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const panelRef = useRef();

    // Usar nuestro hook personalizado para alertas
    const { showAlert, AlertComponent, ConfirmDialogComponent } =
        useCustomAlert();

    // Verificar si una tutoría ya ha finalizado
    const hasTutorialEnded = (booking) => {
        const now = new Date();
        const tutorDate = new Date(booking.slot_date);

        const [hours, minutes] = booking.end_time.split(":");
        tutorDate.setHours(parseInt(hours, 10));
        tutorDate.setMinutes(parseInt(minutes, 10));

        return now > tutorDate;
    };

    // Obtener las tutorías pendientes del usuario
    const fetchPendingTutorials = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtener el usuario del localStorage
            const userData = JSON.parse(localStorage.getItem("user"));

            if (!userData || !userData.id) {
                throw new Error("User information not found");
            }

            const response = await fetch(
                `http://localhost:5000/api/users/${userData.id}/bookings?status=upcoming`
            );

            if (!response.ok) {
                throw new Error("Error loading pending tutorials");
            }

            const data = await response.json();

            if (data.success) {
                // Filtrar para excluir tutorías que ya han terminado
                const activeBookings = data.bookings.filter(
                    (booking) => !hasTutorialEnded(booking)
                );
                setNotifications(activeBookings || []);

                // Si hay notificaciones, activar la animación
                if (activeBookings && activeBookings.length > 0) {
                    triggerAnimation();
                }
            } else {
                throw new Error(data.message || "Error loading tutorials");
            }
        } catch (err) {
            console.error("Error loading pending tutorials:", err);
            setError(err.message || "Error loading pending tutorials");
        } finally {
            setLoading(false);
        }
    };

    // Función para activar la animación de la campana
    const triggerAnimation = () => {
        setIsAnimating(true);

        // Detener la animación después de unos segundos
        setTimeout(() => {
            setIsAnimating(false);
        }, 2000);
    };

    // Función para unirse a una reunión de Zoom
    const joinZoomMeeting = (booking) => {
        // Si ya tiene enlace de Zoom, usar ese
        if (booking.zoom_link) {
            window.open(booking.zoom_link, "_blank");
            return;
        }

        // Si no tiene enlace pero tenemos los datos de la reunión, construir la URL
        if (booking.meeting_id) {
            const baseUrl = "https://zoom.us/j/";
            let zoomUrl = `${baseUrl}${booking.meeting_id}`;

            // Añadir contraseña si está disponible
            if (booking.meeting_password) {
                zoomUrl += `?pwd=${booking.meeting_password}`;
            }

            window.open(zoomUrl, "_blank");
            return;
        }

        // Si no hay datos suficientes, mostrar un mensaje con nuestra alerta personalizada
        showAlert({
            message: "The Zoom link for this tutorial is not available yet.",
            severity: "warning",
            duration: 5000,
        });
    };

    // Cargar tutorías al montar el componente
    useEffect(() => {
        fetchPendingTutorials();

        // También podríamos configurar un intervalo para refrescar periódicamente
        const interval = setInterval(() => {
            fetchPendingTutorials();
        }, 60000); // Actualizar cada minuto

        return () => clearInterval(interval);
    }, []);

    // Activar animación cuando se detectan notificaciones por primera vez
    useEffect(() => {
        // Solo activar la animación cuando notifications cambia de 0 a un valor mayor
        if (notifications.length > 0) {
            triggerAnimation();
        }
    }, [notifications.length]);

    // Controlar apertura y cierre del panel
    const togglePanel = (e) => {
        e.preventDefault();
        if (!isOpen) {
            fetchPendingTutorials();
        }
        setIsOpen(!isOpen);
    };

    // Cerrar el panel al hacer clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                !event.target.classList.contains("notification-bell") &&
                !event.target.parentElement.classList.contains(
                    "notification-bell"
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Formatear la fecha para mostrarla de forma legible
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-EN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Formatear la hora (HH:MM:SS -> HH:MM)
    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : "";
    };

    // Verificar si la tutoría está próxima a comenzar (30 minutos o menos)
    const isAboutToStart = (booking) => {
        const now = new Date();
        const tutorDate = new Date(booking.slot_date);

        // Configurar la fecha de la tutoría con la hora correcta
        const [hours, minutes] = booking.start_time.split(":");
        tutorDate.setHours(parseInt(hours, 10));
        tutorDate.setMinutes(parseInt(minutes, 10));

        // Calcular la diferencia en minutos
        const diffMs = tutorDate - now;
        const diffMinutes = Math.floor(diffMs / 60000);

        // Está próxima a comenzar si faltan 30 minutos o menos y aún no ha pasado
        return diffMinutes <= 30 && diffMinutes >= -60; // Consideramos "próxima" hasta 1 hora después del inicio
    };

    // Función para mostrar mensaje después de actualizar
    const handleRefresh = () => {
        fetchPendingTutorials();
        showAlert({
            message: "Tutorial list updated successfully",
            severity: "success",
            duration: 5000,
        });
    };

    return (
        <div className="position-relative d-flex justify-content-center align-cotent-center">
            {/* Icono de campana con indicador de notificaciones y animación */}
            <a
                href="#"
                className="nav-link text-white me-4 notification-bell"
                onClick={togglePanel}
            >
                <i
                    className={`fa-solid fa-bell ${
                        isAnimating
                            ? "animate__animated animate__swing animate__repeat-2"
                            : ""
                    }`}
                    style={{
                        transformOrigin: "top center",
                        display: "inline-block",
                    }}
                ></i>
            </a>

            {/* Panel de notificaciones */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="card position-absolute top-100 end-25 translate-middle-x shadow animate__animated animate__fadeIn mx-auto"
                    style={{
                        width: "300px",
                        maxHeight: "500px",
                        overflowY: "auto",
                        zIndex: 1050,
                    }}
                >
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Pending Tutorials</h6>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            aria-label="Close"
                            onClick={() => setIsOpen(false)}
                        ></button>
                    </div>

                    <div className="card-body p-0">
                        {loading && (
                            <div className="text-center p-3">
                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                >
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </div>
                                <p className="mt-2">Loading tutorials...</p>
                            </div>
                        )}

                        {error && (
                            <div
                                className="alert alert-danger m-3"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {!loading && !error && notifications.length === 0 && (
                            <div className="text-center p-4">
                                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                                <p>You have no pending tutorials.</p>
                            </div>
                        )}

                        {!loading && !error && notifications.length > 0 && (
                            <ul className="list-group list-group-flush">
                                {notifications.map((booking) => {
                                    const tutorSessionSoon =
                                        isAboutToStart(booking);
                                    return (
                                        <li
                                            key={booking.booking_id}
                                            className={`list-group-item p-3 ${
                                                tutorSessionSoon
                                                    ? "bg-light"
                                                    : ""
                                            }`}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="mb-0">
                                                    Tutorial
                                                    {tutorSessionSoon && (
                                                        <span className="badge bg-warning text-dark ms-2">
                                                            Soon!
                                                        </span>
                                                    )}
                                                </h6>
                                                <span className="badge bg-primary rounded-pill">
                                                    {formatDate(
                                                        booking.slot_date
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mb-1">
                                                <strong>Schedule:</strong>{" "}
                                                {formatTime(booking.start_time)}{" "}
                                                - {formatTime(booking.end_time)}
                                            </p>

                                            <p className="mb-1">
                                                <strong>Tutor: </strong>Jhon Doe
                                            </p>

                                            {/* Botón para unirse a Zoom con ícono destacado */}
                                            <div className="mt-3">
                                                <button
                                                    className={`btn ${
                                                        tutorSessionSoon
                                                            ? "btn-success animate__animated animate__pulse animate__infinite"
                                                            : "btn-outline-primary"
                                                    } w-100`}
                                                    onClick={() =>
                                                        joinZoomMeeting(booking)
                                                    }
                                                >
                                                    <i className="fa-solid fa-video me-2"></i>
                                                    {tutorSessionSoon
                                                        ? "Join meeting now"
                                                        : "Access meeting"}
                                                </button>

                                                {(booking.meeting_id ||
                                                    booking.zoom_link) && (
                                                    <div className="small mt-2 text-muted">
                                                        {booking.meeting_id && (
                                                            <p className="small mb-0">
                                                                <strong>
                                                                    Meeting ID:
                                                                </strong>{" "}
                                                                {
                                                                    booking.meeting_id
                                                                }
                                                            </p>
                                                        )}

                                                        {booking.meeting_password && (
                                                            <p className="small mb-0">
                                                                <strong>
                                                                    Password:
                                                                </strong>{" "}
                                                                {
                                                                    booking.meeting_password
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {!booking.meeting_id &&
                                                    !booking.zoom_link && (
                                                        <p className="text-muted small mt-2">
                                                            The Zoom link will
                                                            be available 30
                                                            minutes before the
                                                            tutorial.
                                                        </p>
                                                    )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {!loading && notifications.length > 0 && (
                        <div className="card-footer text-center">
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={handleRefresh}
                            >
                                <i className="fas fa-sync-alt me-1"></i> Update
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Componentes de alerta y diálogo */}
            <AlertComponent />
            <ConfirmDialogComponent />
        </div>
    );
}

// Método para exportar la función de animación para que pueda ser llamada desde otros componentes
NotificationsPanel.triggerBellAnimation = (ref) => {
    if (ref && ref.current) {
        ref.current
            .querySelector(".fa-bell")
            .classList.add(
                "animate__animated",
                "animate__swing",
                "animate__repeat-2"
            );
        setTimeout(() => {
            ref.current
                .querySelector(".fa-bell")
                .classList.remove(
                    "animate__animated",
                    "animate__swing",
                    "animate__repeat-2"
                );
        }, 2000);
    }
};

export default NotificationsPanel;
