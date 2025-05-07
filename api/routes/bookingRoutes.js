const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

// Rutas de reservas
router.post("/bookings", bookingController.createBooking);
router.get("/bookings/date/:date", bookingController.getBookedSlots);
router.get(
    "/available-hours/:date",
    bookingController.getAvailableHoursForDate
);

router.get("/users/:userId/bookings", bookingController.getUserBookings);
router.put(
    "/users/:userId/notifications/read",
    bookingController.markBookingNotificationsAsRead
);

router.get("/bookings/:bookingId/zoom", bookingController.generateZoomLink);

router.delete("/bookings/:bookingId/cancel", bookingController.cancelBooking);

router.delete(
    "/bookings/:bookingId",
    authMiddleware,
    bookingController.deleteBookingAdmin
);

module.exports = router;
