import React, { useState } from "react";
import axios from "axios";

function SingIn({ onAuthenticate }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/login",
                {
                    username,
                    password,
                }
            );

            // Guardar información del usuario en localStorage
            localStorage.setItem("user", JSON.stringify(response.data.user));

            // Llamar a la función que maneja el éxito de autenticación
            onAuthenticate();
        } catch (error) {
            setError(
                error.response?.data?.message || "Error al iniciar sesión"
            );
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="px-lg-4 py-lg-5">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="py-lg-5 ">
                <div className="mb-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-5">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <span
                        onClick={togglePasswordVisibility}
                        style={{
                            position: "absolute",
                            transform: "translateY(-130%)",
                            right: "60px",
                            cursor: "pointer",
                        }}
                    >
                        {showPassword ? (
                            <i className="fa-regular fa-eye-slash"></i>
                        ) : (
                            <i className="fa-regular fa-eye"></i>
                        )}
                    </span>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100 mt-5"
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Iniciar Sesión"}
                </button>
            </form>
        </div>
    );
}

export default SingIn;
