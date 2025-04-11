import "animate.css";
import { useState, useEffect, useRef, use } from "react";
import Calendar from "./Views/Calendar";
import PaymentGateway from "./PaymentComponents/PaymentGateway";
import AdminPanel from "./AdminComponents/AdminPanel";
import Navbar from "../components/Navbar/Navbar";
import { getUserTokens } from "../services/tokenService";

function Home({ onLogout }) {
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(0);
    const [loading, setLoading] = useState(true);
    const [needTokens, setNeedTokens] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userId, setUserId] = useState(null); // Añadimos un state para el ID del usuario
    const navbarRef = useRef();

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

            // Guardar el ID del usuario para pasarlo al Calendar
            setUserId(user.id);

            // Verificar si el usuario es administrador
            console.log("Objeto usuario:", user);
            setIsAdmin(user.isAdmin === true || user.isAdmin === 1);

            // Obtener tokens del usuario
            updateTokensDisplay();
        } else {
            setLoading(false);
        }
    }, []);

    // Manejar clic en el enlace de tokens/billetera
    const handleTogglePaymentGateway = (value) => {
        setShowPaymentGateway(value);
        if (!value) {
            setNeedTokens(false);
        }
    };

    // Handler para cuando se necesitan tokens (desde Calendar/Hours)
    const handleNeedTokens = () => {
        setNeedTokens(true);
        setShowPaymentGateway(true);
    };

    // Handler para cuando se completa una compra
    const handlePurchaseComplete = () => {
        updateTokensDisplay(); // Actualizar los tokens
        setShowPaymentGateway(false);

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

        // Activar la animación de la campana cuando se completa una reserva
        if (navbarRef.current) {
            // Animar la campana
            const bellIcon = navbarRef.current.querySelector(
                ".notification-bell .fa-bell"
            );
            if (bellIcon) {
                bellIcon.classList.add(
                    "animate__animated",
                    "animate__swing",
                    "animate__repeat-2"
                );
                setTimeout(() => {
                    bellIcon.classList.remove(
                        "animate__animated",
                        "animate__swing",
                        "animate__repeat-2"
                    );
                }, 2000);
            }
        }
    };

    // Handler para mostrar/ocultar el panel de administración
    const handleShowAdminPanel = (value) => {
        setShowAdminPanel(value);
    };

    return (
        <div className="d-flex flex-column vh-100">
            {/* Navbar - Pasamos la referencia para poder animar la campana */}
            <div ref={navbarRef}>
                <Navbar
                    username={username}
                    tokens={tokens}
                    loading={loading}
                    isAdmin={isAdmin}
                    onLogout={onLogout}
                    onTogglePaymentGateway={handleTogglePaymentGateway}
                    onShowAdminPanel={handleShowAdminPanel}
                />
            </div>

            <div>
                {!showPaymentGateway && (
                    <>
                        <h2 className="my-4 text-center text-primary">
                            Welcome back,{" "}
                            <span className="text-dark">{username}</span>
                        </h2>
                        <a
                            href="#"
                            className="my-4 text-center text-primary fs-4"
                            style={{ textDecoration: "none" }}
                            onClick={(e) => {
                                e.preventDefault();
                                handleTogglePaymentGateway(true);
                            }}
                        >
                            <p className="flashing">Buy your tokens here!</p>
                        </a>
                    </>
                )}

                {needTokens && showPaymentGateway && (
                    <div
                        className="alert alert-info text-center mx-auto"
                        style={{ maxWidth: "600px" }}
                    >
                        <p>
                            You need at least 1 token to book a tutoring session
                        </p>
                        <p>Please purchase tokens to continue.</p>
                    </div>
                )}
            </div>

            <div className="d-flex flex-grow-1 h-75">
                {showPaymentGateway ? (
                    <PaymentGateway
                        onPurchaseComplete={handlePurchaseComplete}
                    />
                ) : showAdminPanel ? (
                    <AdminPanel />
                ) : (
                    <Calendar
                        userId={userId}
                        onNeedTokens={handleNeedTokens}
                        onBookingComplete={handleBookingComplete}
                    />
                )}
            </div>
        </div>
    );
}

export default Home;
