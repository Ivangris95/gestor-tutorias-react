import "animate.css";
import { useState, useEffect } from "react";
import Calendar from "./Calendar";
import PaymentGateway from "./PaymentGateway";
import Login from "./Login";

function Home({ onLogout }) {
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);

    const togglePaymentGateway = (e) => {
        e.preventDefault();
        setShowPaymentGateway(!showPaymentGateway);
    };

    return (
        <div style={{ height: "100vh" }} className="d-flex flex-column">
            <div className="navbar navbar-expand-lg bg-primary ">
                <div className="container-fluid px-5">
                    <a
                        className="navbar-brand text-white fw-semibold fs-3"
                        href="./index.html"
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
                    Welcome to TutorSync {/*username*/}
                </h2>
                <a
                    href="#"
                    className="text-decoration-none"
                    onClick={togglePaymentGateway}
                >
                    <p className="text-center text-primary fs-4">
                        <i className="fa-solid fa-wallet  "></i> : 0{/*tokens*/}
                    </p>
                </a>
            </div>
            <div className="d-flex flex-grow-1 h-75">
                {showPaymentGateway ? (
                    {
                        /*<PaymentGateway />*/
                    }
                ) : (
                    <Calendar />
                )}
            </div>
        </div>
    );
}

export default Home;
