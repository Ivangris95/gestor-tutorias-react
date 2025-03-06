import React, { useState } from "react";
import axios from "axios";

function SingIn({ onAuthenticate }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

    return (
        <div>
            <h3 className="mb-4">Iniciar Sesión</h3>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? "Cargando..." : "Iniciar Sesión"}
                </button>
            </form>
        </div>
    );
}

export default SingIn;
