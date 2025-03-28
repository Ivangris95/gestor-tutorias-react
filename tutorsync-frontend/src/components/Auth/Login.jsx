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
            <div className="row min-vh-100">
                <div className="col-12 d-flex justify-content-center align-items-center py-4">
                    <div
                        className="card shadow-lg border-0"
                        style={{ maxWidth: "900px", width: "100%" }}
                    >
                        <div className="row g-0" style={{ minHeight: "550px" }}>
                            {/* Panel izquierdo - Solo visible en md y más grande */}
                            <div className="col-lg-7 col-md-6 bg-primary text-white d-none d-md-block">
                                <div className="d-flex flex-column justify-content-center align-items-center h-100 p-5">
                                    <h1 className="mb-4">TutorSync</h1>
                                    <p className="m-4">
                                        Lorem ipsum dolor sit amet consectetur
                                        adipisicing elit. Esse commodi error
                                        eaque in. Provident dignissimos esse non
                                        labore nulla? Quibusdam distinctio
                                        necessitatibus a ex ratione illo nam
                                        excepturi ad et?
                                    </p>
                                </div>
                            </div>

                            {/* Panel de login/registro */}
                            <div className="col-12 col-md-6 col-lg-5">
                                <div className="card-body p-4">
                                    {/* Logo y texto visible solo en dispositivos pequeños */}
                                    <div className="d-md-none text-center mb-4">
                                        <h1 className="text-primary">
                                            TutorSync
                                        </h1>
                                        <p className="text-muted mb-4">
                                            Lorem ipsum dolor sit amet
                                            consectetur adipisicing elit. Esse
                                            commodi error eaque in. Provident
                                            dignissimos esse non labore nulla?
                                        </p>
                                    </div>

                                    <div className="text-center mb-4">
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
