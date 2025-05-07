const express = require("express");
const authController = require("../controllers/authController");
const axios = require("axios");
const db = require("../config/db");

const router = express.Router();

// Rutas de autenticación
router.post("/login", authController.login);
router.post("/register", authController.register);

router.get("/auth/zoom", (req, res) => {
    const zoomClientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = `${req.protocol}://${req.get(
        "host"
    )}/api/auth/zoom/callback`;

    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}`;

    res.redirect(authUrl);
});

router.get("/auth/zoom/callback", async (req, res) => {
    console.log("⭐ Callback de Zoom recibido. Código:", req.query.code);
    try {
        const { code } = req.query;
        if (!code) {
            return res
                .status(400)
                .send("The authorization code was not received.");
        }

        // Obtener tokens
        const zoomClientId = process.env.ZOOM_CLIENT_ID;
        const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
        const redirectUri = `${req.protocol}://${req.get(
            "host"
        )}/api/auth/zoom/callback`;

        const credentials = Buffer.from(
            `${zoomClientId}:${zoomClientSecret}`
        ).toString("base64");
        const response = await axios.post("https://zoom.us/oauth/token", null, {
            params: {
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credentials}`,
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Calcular fecha de expiración
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

        // Intentar actualizar primero
        const updateResult = await db.query(
            "UPDATE app_settings SET zoom_access_token = ?, zoom_refresh_token = ?, zoom_token_expiry = ? WHERE id = 1",
            [access_token, refresh_token, expiryDate]
        );

        // Si no hay filas afectadas, intentar insertar
        if (updateResult.affectedRows === 0) {
            await db.query(
                "INSERT INTO app_settings (id, zoom_access_token, zoom_refresh_token, zoom_token_expiry) VALUES (1, ?, ?, ?)",
                [access_token, refresh_token, expiryDate]
            );
        }

        // Enviar respuesta de éxito
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>¡Authorization completed.!</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { padding: 50px; }
            .success-container { max-width: 600px; margin: 0 auto; text-align: center; }
          </style>
        </head>
        <body>
          <div class="success-container">
            <div class="alert alert-success mb-4">
              <h4 class="alert-heading">¡Authorization completed.!</h4>
              <p>The integration with Zoom has been set up correctly.</p>
            </div>
            <p>You can close this window and go back to your application.</p>
            <button class="btn btn-primary" onclick="window.close()">Close window.</button>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
        console.error("Error en callback de Zoom:", error);
        res.status(500).send(
            "There was an error when processing the authorization with Zoom."
        );
    }
});

// Endpoint para verificar el estado de la integración con Zoom
router.get("/zoom/status", async (req, res) => {
    try {
        console.log("⭐ Endpoint zoom/status accedido");

        // Obtener los registros
        const rows = await db.query("SELECT * FROM app_settings LIMIT 1");

        console.log("Resultado de la consulta:", rows);

        // Verificar si hay registros y si tienen tokens
        if (
            rows &&
            rows.length > 0 &&
            rows[0].zoom_access_token &&
            rows[0].zoom_refresh_token
        ) {
            // Si hay tokens, enviar estado conectado
            return res.json({
                success: true,
                status: {
                    connected: true,
                    expiryDate: rows[0].zoom_token_expiry,
                },
            });
        } else {
            // Si no hay registros o no tienen tokens, enviar estado desconectado
            return res.json({
                success: true,
                status: {
                    connected: false,
                    message: "There is no valid Zoom configuration.",
                },
            });
        }
    } catch (error) {
        console.error("Error al verificar el estado de Zoom:", error);
        return res.status(500).json({
            success: false,
            message:
                "There was an error when checking the Zoom integration status.",
            error: error.message,
        });
    }
});

module.exports = router;
