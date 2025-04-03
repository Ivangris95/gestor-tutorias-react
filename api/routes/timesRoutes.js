const express = require("express");
const router = express.Router();
const timesController = require("../controllers/timesController");

// Rutas de horarios predefinidos
router.get("/predefined-times", timesController.getPredefinedTimes);
router.post("/predefined-times", timesController.createPredefinedTime);
router.put("/predefined-times/:timeId", timesController.updatePredefinedTime);
router.delete(
    "/predefined-times/:timeId",
    timesController.deletePredefinedTime
);
router.get("/predefined-times/:timeId", timesController.getPredefinedTime);

module.exports = router;
