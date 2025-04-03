import { useState } from "react";
import axios from "axios";

function Singup({ onAuthenticate }) {
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/register",
                {
                    username: userName,
                    email: email,
                    password: password,
                }
            );

            localStorage.setItem("user", JSON.stringify(response.data.user));

            if (onAuthenticate) {
                onAuthenticate();
            }
        } catch (error) {
            setError(
                error.response?.data?.message || "Error al registrar usuario"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="d-flex flex-column px-lg-2">
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            <div className="form-group mb-3">
                <label htmlFor="name" className="mb-2 fw-semibold">
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
            <div className="form-group mb-3">
                <label
                    htmlFor="exampleInputEmail1"
                    className="mb-2 fw-semibold"
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
            </div>
            <div className="form-group mb-3">
                <label
                    htmlFor="exampleInputPassword1"
                    className="mb-2 fw-semibold"
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
            <div className="form-group mb-3">
                <label htmlFor="confirmPassword" className="mb-2 fw-semibold">
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
            <div className="form-group text-center mt-3">
                <button type="submit" className="btn btn-primary w-100">
                    {loading ? "Processing..." : "Sign up"}
                </button>
            </div>
        </form>
    );
}

export default Singup;
