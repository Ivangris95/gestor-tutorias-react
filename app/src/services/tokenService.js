// Función para actualizar los tokens del usuario en la base de datos
export const updateUserTokens = async (tokensToAdd, orderId) => {
    try {
        // Obtener el ID del usuario del almacenamiento local
        const userData = JSON.parse(localStorage.getItem("user"));

        if (!userData || !userData.id) {
            throw new Error(
                "No hay información de usuario. Por favor inicia sesión."
            );
        }

        // Hacer una llamada a tu API para actualizar los tokens del usuario
        const response = await fetch(
            `${
                import.meta.env.VITE_API_URL || "http://localhost:5000"
            }/api/users/tokens`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userData.id,
                    tokensToAdd,
                    orderId,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al actualizar tokens");
        }

        const data = await response.json();
        console.log("Tokens actualizados correctamente:", data);
        return data;
    } catch (error) {
        console.error("Error en updateUserTokens:", error);
        throw error;
    }
};

// Función para obtener los tokens disponibles del usuario
export const getUserTokens = async () => {
    try {
        const userData = JSON.parse(localStorage.getItem("user"));

        if (!userData || !userData.id) {
            return 0;
        }

        const response = await fetch(
            `${
                import.meta.env.VITE_API_URL || "http://localhost:5000"
            }/api/users/${userData.id}/tokens`
        );

        if (!response.ok) {
            throw new Error("Error al obtener tokens");
        }

        const data = await response.json();
        return data.tokensAvailable || 0;
    } catch (error) {
        console.error("Error al obtener tokens:", error);
        return 0;
    }
};
