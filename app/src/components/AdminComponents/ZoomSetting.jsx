import React, { useState, useEffect } from "react";

function ZoomSettings() {
    const [zoomStatus, setZoomStatus] = useState({
        connected: false,
        expiryDate: null,
    });
    const [loading, setLoading] = useState(true);

    // Extraer la función fuera del useEffect para que sea accesible
    const checkZoomStatus = async () => {
        try {
            setLoading(true);
            console.log("Verificando estado de conexión con Zoom...");
            const response = await fetch(
                "http://localhost:5000/api/zoom/status"
            );
            const data = await response.json();

            console.log("Respuesta del endpoint de estado:", data);

            if (data.success) {
                setZoomStatus(data.status);
                console.log("Estado actualizado:", data.status);
            }
        } catch (error) {
            console.error("Error verificando estado de Zoom:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Llamar a la función al montar el componente
        checkZoomStatus();
    }, []);

    // Función para iniciar autorización con Zoom
    const connectZoom = () => {
        // Abrir ventana modal para autorización
        const zoomAuthWindow = window.open(
            "http://localhost:5000/api/auth/zoom",
            "_blank",
            "width=800,height=600"
        );

        // Verificar el estado periódicamente después de la autorización
        const checkInterval = setInterval(() => {
            if (zoomAuthWindow && zoomAuthWindow.closed) {
                clearInterval(checkInterval);
                console.log(
                    "Ventana de autorización cerrada, verificando estado..."
                );
                // Esperar un momento para que los tokens se guarden
                setTimeout(() => {
                    checkZoomStatus();
                }, 1000);
            }
        }, 500);
    };

    return (
        <div className="card">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Zoom settings.</h5>
            </div>
            <div className="card-body">
                {loading ? (
                    <div className="text-center p-3">
                        <div
                            className="spinner-border text-primary"
                            role="status"
                        >
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <h6>Connection status.</h6>
                            {zoomStatus.connected ? (
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle me-2"></i>
                                    Connected to Zoom.
                                    {zoomStatus.expiryDate && (
                                        <div className="small mt-2">
                                            Token expira:{" "}
                                            {new Date(
                                                zoomStatus.expiryDate
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Not connected to the Zoom API.
                                </div>
                            )}
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={connectZoom}
                        >
                            {zoomStatus.connected
                                ? "Reconnect with Zoom."
                                : "Connect with Zoom."}
                        </button>

                        {zoomStatus.connected ? (
                            <div className="mt-4">
                                <div className="alert alert-info">
                                    <h6 className="alert-heading">
                                        Important information.
                                    </h6>
                                    <p>
                                        The system will automatically generate
                                        Zoom links for the scheduled tutorials.
                                    </p>
                                    <p>
                                        The links will be available 24 hours
                                        before each tutorial.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <div className="alert alert-warning">
                                    <h6 className="alert-heading">
                                        Action required.
                                    </h6>
                                    <p>
                                        So that the tutorials can include video
                                        conferences, it's necessary to connect
                                        the application with Zoom.
                                    </p>
                                    <p>
                                        Click on the "Connect with Zoom" button
                                        and authorize access.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ZoomSettings;
