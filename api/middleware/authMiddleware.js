/**
 * Middleware para verificar si el usuario está autenticado
 */

const authMiddleware = async (req, res, next) => {
    // Versión de desarrollo/prototipo que no verifica realmente la autenticación
    req.user = {
        user_id: 1,
        username: "admin_user",
        email_address: "admin@example.com",
        is_admin: 1, // Es administrador
    };
    next();
};

module.exports = authMiddleware;
