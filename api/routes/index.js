const express = require("express");
const authRoutes = require("./authRoutes");
const tokenRoutes = require("./tokenRoutes");
const paymentRoutes = require("./paymentRoutes");
const timesRoutes = require("./timesRoutes");
const bookingRoutes = require("./bookingRoutes");
const disabledHoursRoutes = require("./disabledHoursRoutes");

const router = express.Router();

// Combinar todas las rutas
router.use(authRoutes);
router.use(tokenRoutes);
router.use(paymentRoutes);
router.use(timesRoutes);
router.use(bookingRoutes);
router.use(disabledHoursRoutes);

// Ruta de prueba
router.get("/health", (req, res) => {
    res.json({
        status: "success",
        message: "API funcionando correctamente",
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
