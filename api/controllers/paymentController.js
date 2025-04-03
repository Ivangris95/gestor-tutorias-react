const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Procesa un pago con Stripe
 */
exports.processStripePayment = async (req, res) => {
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
};

/**
 * Verifica un pago de PayPal
 */
exports.verifyPayPalPayment = async (req, res) => {
    // Implementar verificación de pagos PayPal si es necesario
    res.json({
        success: true,
        message: "Verificación de PayPal no implementada",
    });
};
