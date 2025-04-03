import React from "react";
import NotificationsPanel from "../Views/NotificationsPanel";

function Navbar({
    username,
    tokens,
    loading,
    isAdmin,
    onLogout,
    onTogglePaymentGateway,
    onShowAdminPanel,
}) {
    return (
        <div className="navbar navbar-expand-lg bg-primary position-relative">
            <div className="container-fluid px-3 px-md-5">
                {/* Logo */}
                <a
                    className="navbar-brand text-white fw-semibold fs-3"
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onTogglePaymentGateway(false);
                        onShowAdminPanel(false);
                    }}
                    style={{
                        fontSize: "2.5rem",
                        letterSpacing: "-0.5px",
                    }}
                >
                    TutorSync
                    <span className="ms-2 badge bg-white text-primary fs-6 align-middle">
                        PRO
                    </span>
                </a>

                <div className="ms-auto d-flex align-items-center fs-5">
                    {/* Billetera */}
                    <a
                        href="#"
                        className="text-decoration-none nav-link text-white me-5"
                        onClick={(e) => {
                            e.preventDefault();
                            onTogglePaymentGateway(true);
                        }}
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

                    {/* Configuración - Solo visible para administradores */}
                    {isAdmin && (
                        <a
                            className="nav-link text-white me-4"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onShowAdminPanel(true);
                                onTogglePaymentGateway(false);
                            }}
                        >
                            <i className="fa-solid fa-toolbox"></i>
                        </a>
                    )}

                    {/* Notificaciones - Solo para usuarios */}
                    {!isAdmin && <NotificationsPanel />}

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
    );
}

export default Navbar;
