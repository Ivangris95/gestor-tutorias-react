const express = require("express");
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Rutas de reservas
router.post("/bookings", bookingController.createBooking);
// router.get("/users/:userId/bookings", bookingController.getUserBookings);
router.get("/bookings/date/:date", bookingController.getBookedSlots);

module.exports = router;
