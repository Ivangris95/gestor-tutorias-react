import "animate.css";
import { useState, useEffect } from "react";
import Calendar from "./Views/Calendar";
import PaymentGateway from "./PaymentComponents/PaymentGateway";

function Home({ onLogout }) {
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [username, setUsername] = useState("");
    const [tokens, setTokens] = useState(0);
    const [loading, setLoading] = useState(true);

    // Función para obtener los tokens del usuario
    const fetchUserTokens = async () => {
        try {
            // Obtener el usuario del localStorage
            const userString = localStorage.getItem("user");
            if (!userString) {
                return 0;
            }

            const user = JSON.parse(userString);
            const userId = user.id;

            // Realizar la petición para obtener tokens
            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/users/${userId}/tokens`
            );

            if (!response.ok) {
                throw new Error("Error al obtener tokens");
            }

            const data = await response.json();
            console.log("Tokens obtenidos:", data);
            return data.tokensAvailable || 0;
        } catch (error) {
            console.error("Error al obtener tokens:", error);
            return 0;
        }
    };

    // Función para actualizar los tokens
    const updateTokensDisplay = async () => {
        setLoading(true);
        try {
            const tokenAmount = await fetchUserTokens();
            console.log("Actualizando tokens a:", tokenAmount);
            setTokens(tokenAmount);
        } catch (error) {
            console.error("Error al actualizar tokens:", error);
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
    }, [showPaymentGateway]); // Ejecutar cuando cambia showPaymentGateway

    const togglePaymentGateway = (e) => {
        e.preventDefault();
        setShowPaymentGateway(!showPaymentGateway);
    };

    // Handler para cuando se completa una compra - Mejorado
    const handlePurchaseComplete = () => {
        console.log("Compra completada - Actualizando tokens...");

        // Forzar actualización de tokens inmediatamente
        updateTokensDisplay();

        // Cerrar la pasarela después de la compra
        setShowPaymentGateway(false);
    };

    return (
        <div style={{ height: "100vh" }} className="d-flex flex-column">
            <div className="navbar navbar-expand-lg bg-primary">
                <div className="container-fluid px-5">
                    <a
                        className="navbar-brand text-white fw-semibold fs-3"
                        href="#"
                    >
                        TutorSync
                    </a>

                    <div className="ms-auto d-flex align-items-center fs-5">
                        <a className="nav-link text-white me-4" href="#">
                            <i className="fa-regular fa-user"></i>
                        </a>

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
                    Welcome to TutorSync{" "}
                    <span className="text-dark">{username}</span>
                </h2>
                <a
                    href="#"
                    className="text-decoration-none"
                    onClick={togglePaymentGateway}
                >
                    <p className="text-center text-primary fs-4">
                        <i className="fa-solid fa-wallet"></i> :{" "}
                        {loading ? (
                            <small
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                            ></small>
                        ) : (
                            tokens
                        )}
                    </p>
                </a>
            </div>
            <div className="d-flex flex-grow-1 h-75">
                {showPaymentGateway ? (
                    <PaymentGateway
                        onPurchaseComplete={handlePurchaseComplete}
                    />
                ) : (
                    <Calendar />
                )}
            </div>
        </div>
    );
}

export default Home;
