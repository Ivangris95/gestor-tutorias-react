const db = require("../config/db");

/**
 * Añadir una hora disponible para una fecha específica desde el panel admin
 */
exports.addAvailableHour = async (req, res) => {
    try {
        const { date, timeId, createdBy } = req.body;
        console.log("Datos recibidos:", { date, timeId, createdBy });

        // Validaciones
        if (!date || !timeId || !createdBy) {
            return res.status(400).json({
                message: "Faltan datos requeridos",
                received: { date, timeId, createdBy },
            });
        }

        // Obtener la información de la hora predefinida - CON MEJOR MANEJO DE ERRORES
        try {
            const times = await db.query(
                "SELECT * FROM predefined_times WHERE time_id = ?",
                [timeId]
            );

            console.log("Resultado consulta:", times);

            // Verificar si times es undefined
            if (!times) {
                return res.status(500).json({
                    message: "Error en consulta a base de datos",
                    debug: "times is undefined",
                });
            }

            // Verificar si times es un array vacío
            if (times.length === 0) {
                return res.status(404).json({
                    message: "Hora predefinida no encontrada",
                    debug: "times length is 0",
                });
            }

            // Verificar si times[0] está definido
            if (!times[0]) {
                return res.status(500).json({
                    message: "Formato de respuesta inesperado",
                    debug: "times[0] is undefined",
                });
            }

            const predefinedTime = times[0];

            // Verificar si predefinedTime.start_time y predefinedTime.end_time están definidos
            if (!predefinedTime.start_time || !predefinedTime.end_time) {
                return res.status(500).json({
                    message: "Datos de hora predefinida incompletos",
                    debug: "start_time or end_time is undefined",
                    time: predefinedTime,
                });
            }

            // Verificar si ya existe este slot para esta fecha
            const existingSlots = await db.query(
                "SELECT * FROM available_slots WHERE slot_date = ? AND start_time = ? AND end_time = ?",
                [date, predefinedTime.start_time, predefinedTime.end_time]
            );

            if (existingSlots && existingSlots.length > 0) {
                return res.status(400).json({
                    message: "Esta hora ya está habilitada para esta fecha",
                });
            }

            // Insertar nuevo slot disponible
            const result = await db.query(
                `INSERT INTO available_slots 
                (slot_date, start_time, end_time, created_by, slot_duration, is_booked) 
                VALUES (?, ?, ?, ?, 60, 0)`,
                [
                    date,
                    predefinedTime.start_time,
                    predefinedTime.end_time,
                    createdBy,
                ]
            );

            console.log("Resultado inserción:", result);

            // Determinar el ID insertado
            let slotId = null;
            if (result && typeof result === "object") {
                if (result.insertId) {
                    slotId = result.insertId;
                } else if (
                    Array.isArray(result) &&
                    result[0] &&
                    result[0].insertId
                ) {
                    slotId = result[0].insertId;
                }
            }

            res.status(201).json({
                success: true,
                message: "Hora habilitada correctamente",
                slotId: slotId,
            });
        } catch (dbError) {
            console.error("Error en operación de base de datos:", dbError);
            return res.status(500).json({
                message: "Error en operación de base de datos",
                error: dbError.message,
            });
        }
    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({
            message: "Error en el servidor",
            error: error.message,
        });
    }
};

/**
 * Eliminar una hora disponible para una fecha específica desde el panel admin
 */
exports.removeAvailableHour = async (req, res) => {
    try {
        const { date, timeId } = req.body;
        console.log("Recibiendo solicitud de eliminar hora:", { date, timeId });

        // Validaciones
        if (!date || !timeId) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        // Obtener la información de la hora predefinida
        const times = await db.query(
            "SELECT * FROM predefined_times WHERE time_id = ?",
            [timeId]
        );

        if (!times || times.length === 0) {
            return res
                .status(404)
                .json({ message: "Hora predefinida no encontrada" });
        }

        const predefinedTime = times[0];

        // Verificar si existe un slot para esta fecha y hora
        const slots = await db.query(
            "SELECT * FROM available_slots WHERE slot_date = ? AND start_time = ? AND end_time = ?",
            [date, predefinedTime.start_time, predefinedTime.end_time]
        );

        if (!slots || slots.length === 0) {
            return res.status(404).json({
                message: "Esta hora no está habilitada para esta fecha",
            });
        }

        // Verificar que no esté reservada
        if (slots[0].is_booked) {
            return res.status(400).json({
                message: "No se puede deshabilitar una hora ya reservada",
            });
        }

        // Eliminar el slot
        await db.query("DELETE FROM available_slots WHERE slot_id = ?", [
            slots[0].slot_id,
        ]);

        res.json({
            success: true,
            message: "Hora deshabilitada correctamente",
        });
    } catch (error) {
        console.error("Error completo:", error);
        res.status(500).json({
            message: "Error en el servidor",
            error: error.message,
        });
    }
};

/**
 * Obtener las horas deshabilitadas para una fecha específica
 */
exports.getDisabledHoursForDate = async (req, res) => {
    try {
        const { date } = req.params;

        // Obtener todos los horarios predefinidos
        const predefinedTimes = await db.query(
            "SELECT time_id, start_time, end_time FROM predefined_times WHERE is_active = 1"
        );

        // Obtener los slots disponibles para esta fecha
        const availableSlots = await db.query(
            `SELECT 
                a.slot_id, 
                a.start_time, 
                a.end_time,
                p.time_id
            FROM 
                available_slots a
            JOIN 
                predefined_times p ON a.start_time = p.start_time AND a.end_time = p.end_time
            WHERE 
                a.slot_date = ?`,
            [date]
        );

        // Extraer los IDs de tiempo habilitados
        const enabledTimeIds = availableSlots.map((slot) =>
            Number(slot.time_id)
        );

        // Filtrar los horarios deshabilitados
        const disabledTimes = predefinedTimes.filter(
            (time) => !enabledTimeIds.includes(Number(time.time_id))
        );

        console.log(
            "Horarios predefinidos:",
            predefinedTimes.map((t) => ({
                id: t.time_id,
                tipo: typeof t.time_id,
            }))
        );
        console.log(
            "IDs habilitados:",
            enabledTimeIds.map((id) => ({ id, tipo: typeof id }))
        );

        res.json(disabledTimes);
    } catch (error) {
        console.error("Error al obtener horas deshabilitadas:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor",
        });
    }
};
