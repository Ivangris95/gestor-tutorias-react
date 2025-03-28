const express = require("express");
const router = express.Router();
const disabledHoursController = require("../controllers/disabledHoursController");
const db = require("../config/db");

// Al principio de tu archivo de rutas
router.get("/disabled-hours-test", (req, res) => {
    res.json({
        success: true,
        message: "Ruta de prueba funcionando correctamente",
    });
});

router.get(
    "/disabled-hours/:date",
    disabledHoursController.getDisabledHoursForDate
);
router.post("/disabled-hours", disabledHoursController.disableHour);
router.delete("/disabled-hours", disabledHoursController.enableHour);

module.exports = router;
