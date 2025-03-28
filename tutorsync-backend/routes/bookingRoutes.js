const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Rutas de reservas
router.post("/bookings", bookingController.createBooking);
router.get("/bookings/date/:date", bookingController.getBookedSlots);
router.get(
    "/available-hours/:date",
    bookingController.getAvailableHoursForDate
);

module.exports = router;
