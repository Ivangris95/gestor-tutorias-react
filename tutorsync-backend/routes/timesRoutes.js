const express = require("express");
const timesController = require("../controllers/timesController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Rutas para horarios predefinidos
router.get("/predefined-times", timesController.getPredefinedTimes);
router.post("/predefined-times", timesController.createPredefinedTime);
router.put("/predefined-times/:timeId", timesController.updatePredefinedTime);
router.delete(
    "/predefined-times/:timeId",
    timesController.deletePredefinedTime
);

module.exports = router;
