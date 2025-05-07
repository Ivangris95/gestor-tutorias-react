import { useState } from "react";
import SingIn from "./SingIn";
import Singup from "./Singup";
import "animate.css";

function Login({ onLoginSuccess }) {
    const [isSignIn, setIsSignIn] = useState(true);
    const [animationClass, setAnimationClass] = useState("animate__fadeIn");

    const toggleForm = (showSignIn) => {
        setAnimationClass("animate__fadeOut");
        setTimeout(() => {
            setIsSignIn(showSignIn);
            setAnimationClass("animate__fadeIn");
        }, 100);
    };

    const handleAuthentication = () => {
        if (onLoginSuccess) {
            onLoginSuccess();
        }
    };

    return (
        <div className="container-fluid">
            <div className="row min-vh-100 ">
                <div className="col-12 d-flex justify-content-center align-items-center py-4">
                    <div
                        className="card shadow-lg border-0"
                        style={{ maxWidth: "900px", width: "100%" }}
                    >
                        <div className="row g-1" style={{ minHeight: "550px" }}>
                            {/* Panel izquierdo - Solo visible en md y más grande */}
                            <div className="col-lg-7 col-md-6 bg-primary text-white d-none d-md-block rounded-start-2">
                                <div className="d-flex flex-column justify-content-center align-items-center h-100 p-5">
                                    <h1
                                        className="mb-4 fw-bold"
                                        style={{
                                            fontSize: "2.5rem",
                                            letterSpacing: "-0.5px",
                                        }}
                                    >
                                        TutorSync
                                        <span className="ms-2 badge bg-white text-primary fs-6 align-middle">
                                            PRO
                                        </span>
                                    </h1>
                                    <p
                                        className="m-4 lead"
                                        style={{
                                            lineHeight: "1.8",
                                            fontSize: "1.1rem",
                                            fontWeight: 400,
                                            textAlign: "center",
                                        }}
                                    >
                                        TutorSync is a cutting-edge educational
                                        platform that connects professionals and
                                        instructors with students in a dynamic
                                        and personalized learning environment.
                                        <br />
                                        <br />
                                        We facilitate educational excellence
                                        through innovative tools that allow you
                                        to create, manage, and participate in
                                        high-quality learning experiences.
                                    </p>
                                    <div className="mt-3 d-flex gap-2">
                                        <span className="badge bg-white text-primary fs-6">
                                            Live classes
                                        </span>
                                        <span className="badge bg-white text-primary fs-6">
                                            Engaging learning
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Panel de login/registro */}
                            <div className="col-12 col-md-6 col-lg-5">
                                <div className="card-body p-4">
                                    {/* Logo y texto visible solo en dispositivos pequeños */}
                                    <div className="d-md-none text-center mb-4">
                                        <h1
                                            className="text-primary fw-bold"
                                            style={{ fontSize: "2rem" }}
                                        >
                                            TutorSync
                                            <span className="ms-2 badge bg-primary text-white fs-6 align-middle">
                                                PRO
                                            </span>
                                        </h1>
                                        <p className="text-muted mb-4">
                                            La plataforma educativa que
                                            transforma la manera de enseñar y
                                            aprender en línea.
                                        </p>
                                    </div>

                                    <div className="text-center mb-4 mt-5">
                                        <div
                                            className="btn-group"
                                            role="group"
                                            aria-label="Toggle between Sign In and Sign Up"
                                        >
                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="btnradio"
                                                id="btnradio1"
                                                autoComplete="off"
                                                checked={isSignIn}
                                                onChange={() =>
                                                    toggleForm(true)
                                                }
                                            />
                                            <label
                                                className="btn btn-outline-primary"
                                                htmlFor="btnradio1"
                                            >
                                                Sign In
                                            </label>

                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="btnradio"
                                                id="btnradio2"
                                                autoComplete="off"
                                                checked={!isSignIn}
                                                onChange={() =>
                                                    toggleForm(false)
                                                }
                                            />
                                            <label
                                                className="btn btn-outline-primary"
                                                htmlFor="btnradio2"
                                            >
                                                Sign Up
                                            </label>
                                        </div>
                                    </div>

                                    {/* Contenedor animado */}
                                    <div
                                        className={`animate__animated ${animationClass}`}
                                    >
                                        {isSignIn ? (
                                            <SingIn
                                                onAuthenticate={
                                                    handleAuthentication
                                                }
                                            />
                                        ) : (
                                            <Singup
                                                onAuthenticate={
                                                    handleAuthentication
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
