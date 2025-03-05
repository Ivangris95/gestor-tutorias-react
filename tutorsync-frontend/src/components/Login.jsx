import { useState } from "react";
import SingIn from "./SIngin";
import Singup from "./Singup";
import "animate.css";

function Login() {
    const [isSignIn, setIsSignIn] = useState(true);
    const [animationClass, setAnimationClass] = useState("animate__fadeIn");

    const toggleForm = (showSignIn) => {
        setAnimationClass("animate__fadeOut");
        setTimeout(() => {
            setIsSignIn(showSignIn);
            setAnimationClass("animate__fadeIn");
        }, 100);
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
        >
            <div
                className="row d-flex justify-content-center align-items-center w-50  shadow-lg"
                style={{ height: "60%" }}
            >
                <div className="col-7 h-100 text-center d-flex flex-column justify-content-center align-items-center bg-primary text-white">
                    <h1 className="mb-4">TutorSync</h1>
                    <p className="m-4">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Esse commodi error eaque in. Provident dignissimos esse
                        non labore nulla? Quibusdam distinctio necessitatibus a
                        ex ratione illo nam excepturi ad et?
                    </p>
                </div>
                <div className="col-5 h-100 text-lg-center">
                    <div
                        className="btn-group m-5"
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
                            onChange={() => toggleForm(true)}
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
                            onChange={() => toggleForm(false)}
                        />
                        <label
                            className="btn btn-outline-primary"
                            htmlFor="btnradio2"
                        >
                            Sign Up
                        </label>
                    </div>

                    {/* Contenedor animado */}
                    <div className={`animate__animated ${animationClass}`}>
                        {isSignIn ? <SingIn /> : <Singup />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
