const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Rutas de pagos
router.post("/stripe/charge", paymentController.processStripePayment);
router.post("/paypal/verify", paymentController.verifyPayPalPayment);

module.exports = router;
