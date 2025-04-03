const db = require("../config/db");
const { calculatePrice } = require("../utils/priceCalculator");

/**
 * Actualiza los tokens de un usuario después de una compra
 */
exports.updateTokens = async (req, res) => {
    try {
        const { userId, tokensToAdd, orderId } = req.body;

        console.log("Actualizando tokens:", { userId, tokensToAdd, orderId });

        // Validación básica
        if (!userId || !tokensToAdd) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario y cantidad de tokens son requeridos",
            });
        }

        // Iniciar una conexión
        const connection = await db.getConnection();

        try {
            // Comenzar transacción para garantizar integridad de datos
            await connection.beginTransaction();

            console.log("Transacción iniciada");

            // 1. Verificar si el usuario ya tiene tokens
            const [tokenRows] = await connection.execute(
                "SELECT * FROM tokens WHERE user_id = ?",
                [userId]
            );

            console.log("Tokens existentes:", tokenRows);

            if (tokenRows.length > 0) {
                // 2a. Si tiene tokens, actualizar
                await connection.execute(
                    "UPDATE tokens SET tokens_available = tokens_available + ?, last_updated = NOW() WHERE user_id = ?",
                    [tokensToAdd, userId]
                );
                console.log("Tokens actualizados");
            } else {
                // 2b. Si no tiene tokens, crear un nuevo registro
                await connection.execute(
                    "INSERT INTO tokens (user_id, tokens_available) VALUES (?, ?)",
                    [userId, tokensToAdd]
                );
                console.log("Nuevo registro de tokens creado");
            }

            // 3. Registrar la compra en token_purchases
            await connection.execute(
                "INSERT INTO token_purchases (user_id, tokens_amount, payment_amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, 'completed')",
                [
                    userId,
                    tokensToAdd,
                    calculatePrice(tokensToAdd),
                    "paypal",
                    orderId || "manual",
                ]
            );

            console.log("Compra registrada");

            // Confirmar la transacción
            await connection.commit();
            console.log("Transacción confirmada");

            // Consultar tokens disponibles después de la actualización
            const [updatedTokens] = await connection.execute(
                "SELECT tokens_available FROM tokens WHERE user_id = ?",
                [userId]
            );

            console.log(
                "Tokens disponibles después de actualización:",
                updatedTokens
            );

            // Enviar respuesta exitosa
            res.json({
                success: true,
                message: "Tokens actualizados correctamente",
                tokensAvailable:
                    updatedTokens[0]?.tokens_available || tokensToAdd,
            });
        } catch (error) {
            // Si hay un error, revertir la transacción
            await connection.rollback();
            console.error("Error en la transacción:", error);
            throw error;
        } finally {
            // Liberar la conexión
            connection.release();
            console.log("Conexión liberada");
        }
    } catch (error) {
        console.error("Error al actualizar tokens:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar tokens",
            error: error.message,
        });
    }
};

/**
 * Obtiene los tokens disponibles de un usuario
 */
exports.getUserTokens = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Validar que userId sea un número
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario inválido",
            });
        }

        // Obtener tokens del usuario
        const rows = await db.query(
            "SELECT tokens_available FROM tokens WHERE user_id = ?",
            [userId]
        );

        // Si el usuario no tiene tokens, devolver 0
        if (rows.length === 0) {
            return res.json({
                success: true,
                tokensAvailable: 0,
            });
        }

        // Devolver los tokens disponibles
        res.json({
            success: true,
            tokensAvailable: rows[0].tokens_available,
        });
    } catch (error) {
        console.error("Error al obtener tokens:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener tokens",
            error: error.message,
        });
    }
};
