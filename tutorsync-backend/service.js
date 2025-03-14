const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar el usuario en la base de datos
        const [users] = await pool.query(
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
        await pool.query(
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
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.query(
            "SELECT * FROM users WHERE username = ? OR email_address = ?",
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: "El nombre de usuario o email ya está en uso",
            });
        }

        // Insertar el nuevo usuario
        const [result] = await pool.query(
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
});

// Ruta para actualizar tokens después de una compra en PayPal
app.post("/api/users/tokens", async (req, res) => {
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
        const connection = await pool.getConnection();

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
});

// Función para calcular el precio basado en la cantidad de tokens
function calculatePrice(tokenCount) {
    const prices = {
        1: 5.99,
        5: 24.99,
        10: 44.99,
    };

    return prices[tokenCount] || tokenCount * 5.99;
}

// Endpoint para obtener los tokens disponibles de un usuario
app.get("/api/users/:userId/tokens", async (req, res) => {
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
        const [rows] = await pool.query(
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
});

// Endpoint para procesar pagos con Stripe
app.post("/api/stripe/charge", async (req, res) => {
    try {
        const { amount, currency, description, token } = req.body;

        // Validar los datos de entrada
        if (!amount || !currency || !token) {
            return res.status(400).json({
                success: false,
                message: "Se requieren amount, currency y token",
            });
        }

        console.log("Procesando pago con Stripe:", {
            amount,
            currency,
            description,
            token,
        });

        // Crear un cargo en Stripe
        const charge = await stripe.charges.create({
            amount,
            currency,
            description,
            source: token,
        });

        console.log("Pago procesado correctamente:", charge.id);

        // Responder con la confirmación del pago
        res.json({
            success: true,
            id: charge.id,
            amount: charge.amount / 100, // Convertir de centavos a dólares
            created: charge.created,
            status: charge.status,
        });
    } catch (error) {
        console.error("Error al procesar el pago con Stripe:", error);

        // Enviar respuesta de error apropiada
        res.status(500).json({
            success: false,
            message: error.message || "Error al procesar el pago",
            code: error.code,
        });
    }
});
