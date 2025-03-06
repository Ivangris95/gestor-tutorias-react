import { useState } from "react";

function Singup({ onAuthenticate }) {
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        if (onAuthenticate) {
            onAuthenticate();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="d-flex flex-column">
            <div className="form-group p-2">
                <label htmlFor="name" className="mb-2 fs-5 fw-semibold">
                    Username
                </label>
                <input
                    type="text"
                    className="form-control"
                    id="name"
                    placeholder="Enter your username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                />
            </div>
            <div className="form-group p-2">
                <label
                    htmlFor="exampleInputEmail1"
                    className="mb-2 fs-5 fw-semibold"
                >
                    Email address
                </label>
                <input
                    type="email"
                    className="form-control"
                    id="exampleInputEmail1"
                    aria-describedby="emailHelp"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <small id="emailHelp" className="form-text text-muted">
                    We'll never share your email with anyone else.
                </small>
            </div>
            <div className="form-group p-2">
                <label
                    htmlFor="exampleInputPassword1"
                    className="mb-2 fs-5 fw-semibold"
                >
                    Password
                </label>
                <input
                    type="password"
                    className="form-control"
                    id="exampleInputPassword1"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="form-group p-2">
                <label
                    htmlFor="confirmPassword"
                    className="mb-2 fs-5 fw-semibold"
                >
                    Confirm Password
                </label>
                <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            <div className="form-group text-lg-center p-4 mt-3">
                <button type="submit" className="btn btn-primary w-100">
                    Sign up
                </button>
            </div>
        </form>
    );
}

export default Singup;
