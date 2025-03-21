import "animate.css";
import { useState, useEffect } from "react";
import Calendar from "./Views/Calendar";
import PaymentGateway from "./PaymentComponents/PaymentGateway";
import { getUserTokens } from "../services/tokenService";

function Home({ onLogout }) {
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(0);
    const [loading, setLoading] = useState(true);
    const [needTokens, setNeedTokens] = useState(false);

    // Función para obtener los tokens del usuario
    const updateTokensDisplay = async () => {
        try {
            setLoading(true);
            const tokensAmount = await getUserTokens();
            setTokens(tokensAmount);
        } catch (error) {
            console.error("Error al obtener tokens:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Obtener el usuario del localStorage
        const userString = localStorage.getItem("user");

        if (userString) {
            const user = JSON.parse(userString);
            setUsername(user.username);

            // Obtener tokens del usuario
            updateTokensDisplay();
        } else {
            setLoading(false);
        }
    }, []);

    // Manejar clic en el enlace de tokens/billetera
    const togglePaymentGateway = (e) => {
        e.preventDefault();
        setShowPaymentGateway(true); // Mostrar la pasarela
        setNeedTokens(false); // Reiniciar el estado de necesidad de tokens
    };

    // Handler para cuando se necesitan tokens (desde Calendar/Hours)
    const handleNeedTokens = () => {
        setNeedTokens(true);
        setShowPaymentGateway(true);
    };

    // Handler para cuando se completa una compra
    const handlePurchaseComplete = () => {
        updateTokensDisplay(); // Actualizar los tokens

        // Si la compra fue iniciada por necesidad (desde el calendario)
        // volver al calendario
        if (needTokens) {
            setShowPaymentGateway(false);
            setNeedTokens(false);
        }
    };

    // Handler para cuando se realiza una reserva exitosa
    const handleBookingComplete = () => {
        console.log("Reserva completada, actualizando tokens");
        updateTokensDisplay(); // Actualizar los tokens mostrados
    };

    return (
        <div style={{ height: "100vh" }} className="d-flex flex-column">
            <div className="navbar navbar-expand-lg bg-primary">
                <div className="container-fluid px-5">
                    <a
                        className="navbar-brand text-white fw-semibold fs-3"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowPaymentGateway(false);
                        }}
                    >
                        TutorSync
                    </a>

                    <div className="ms-auto d-flex align-items-center fs-5">
                        {/* Billetera */}
                        <a
                            href="#"
                            className="text-decoration-none nav-link text-white me-5"
                            onClick={togglePaymentGateway}
                        >
                            <i className="fa-solid fa-wallet"></i> :{" "}
                            {loading ? (
                                <small
                                    className="spinner-border spinner-border-sm text-bg-light"
                                    role="status"
                                    aria-hidden="true"
                                ></small>
                            ) : (
                                tokens
                            )}
                        </a>

                        {/* Configuración */}
                        <a className="nav-link text-white me-4" href="#">
                            <i className="fa-solid fa-toolbox"></i>
                        </a>

                        {/* Notificaciones */}
                        <a className="nav-link text-white me-4" href="#">
                            <i className="fa-solid fa-bell"></i>
                        </a>
                        {/* Cerrar sesión */}
                        <a
                            className="nav-link text-white"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();

                                localStorage.removeItem("user");
                                if (onLogout) {
                                    onLogout();
                                }
                            }}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="my-5 text-center text-primary">
                    Welcome back, <span className="text-dark">{username}</span>
                </h2>

                {needTokens && showPaymentGateway && (
                    <div
                        className="alert alert-info text-center mx-auto"
                        style={{ maxWidth: "600px" }}
                    >
                        <p>
                            Necesitas al menos 1 token para reservar una
                            tutoría.
                        </p>
                        <p>Por favor, compra tokens para continuar.</p>
                    </div>
                )}
            </div>
            <div className="d-flex flex-grow-1 h-75">
                {showPaymentGateway ? (
                    <PaymentGateway
                        onPurchaseComplete={handlePurchaseComplete}
                    />
                ) : (
                    <Calendar
                        onNeedTokens={handleNeedTokens}
                        onBookingComplete={handleBookingComplete}
                    />
                )}
            </div>
        </div>
    );
}

export default Home;
