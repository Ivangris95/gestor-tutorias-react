const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminTimesController = require("../controllers/adminTimesController");
const authMiddleware = require("../middleware/authMiddleware");

// Middleware para verificar si el usuario es administrador (opcional)
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.is_admin !== 1) {
        return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
};

// Rutas para la gestión de horas (del nuevo controlador)
router.post("/available-hours", adminTimesController.addAvailableHour);
router.delete("/available-hours", adminTimesController.removeAvailableHour);
router.get(
    "/disabled-hours/:date",
    adminTimesController.getDisabledHoursForDate
);

// Rutas existentes
router.get("/slots", adminController.getAvailableSlots);
router.post("/slots", adminController.addAvailableSlot);
router.delete("/slots/:slotId", adminController.deleteAvailableSlot);

// Rutas para gestión de reservas
router.get("/bookings", adminController.getBookings);
router.put("/bookings/:bookingId/status", adminController.updateBookingStatus);
router.get("/bookings/:bookingId", adminController.getBookingDetails);

module.exports = router;
