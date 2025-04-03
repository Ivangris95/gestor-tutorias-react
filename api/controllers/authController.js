const db = require("../config/db");

/**
 * Controlador para iniciar sesión
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar el usuario en la base de datos
        const users = await db.query(
            "SELECT user_id, username, user_password, is_admin FROM users WHERE username = ?",
            [username]
        );

        // Si no se encuentra el usuario
        if (users.length === 0) {
            return res
                .status(401)
                .json({ message: "Credenciales incorrectas" });
        }

        const user = users[0];

        // TODO: Comparar el hash de la contraseña
        if (user.user_password !== password) {
            return res
                .status(401)
                .json({ message: "Credenciales incorrectas" });
        }

        // Actualizar last_login
        await db.query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
            [user.user_id]
        );

        // Enviar respuesta exitosa
        res.json({
            success: true,
            user: {
                id: user.user_id,
                username: user.username,
                isAdmin: user.is_admin,
            },
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

/**
 * Controlador para registrar un nuevo usuario
 */

// TODO: Verficar que el email sea válido
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Verificar si el usuario ya existe
        const existingUsers = await db.query(
            "SELECT * FROM users WHERE username = ? OR email_address = ?",
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: "El nombre de usuario o email ya está en uso",
            });
        }

        // Insertar el nuevo usuario
        const result = await db.query(
            "INSERT INTO users (username, email_address, user_password, registration_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            [username, email, password]
        );

        // Obtener el ID del usuario recién insertado
        const userId = result.insertId;

        // Enviar respuesta exitosa
        res.status(201).json({
            success: true,
            user: {
                id: userId,
                username: username,
                isAdmin: false,
            },
        });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
