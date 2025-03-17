/**
 * Middleware para verificar si el usuario está autenticado
 */
exports.protect = (req, res, next) => {
    // Para implementar después. Por ahora todos los endpoints son públicos
    next();
};

/**
 * Middleware para verificar si el usuario es administrador
 */
exports.restrictTo = (req, res, next) => {
    // Para implementar después si es necesario
    next();
};
