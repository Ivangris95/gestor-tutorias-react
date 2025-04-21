const db = require("../config/db");

// Obtener horas deshabilitadas para una fecha específica
exports.getDisabledHoursForDate = async (req, res) => {
    const { date } = req.params;

    // Validar formato de fecha
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
            success: false,
            message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
        });
    }

    try {
        const query = `
            SELECT time_id 
            FROM disabled_hours 
            WHERE disabled_date = ?
        `;

        // Usar la función query que devuelve una promesa
        const results = await db.query(query, [date]);

        // Extraer solo los IDs de las horas deshabilitadas
        const disabledHours = results.map((row) => row.time_id);

        res.json({
            success: true,
            disabledHours,
        });
    } catch (err) {
        console.error("Error al consultar horas deshabilitadas:", err);
        res.status(500).json({
            success: false,
            message: "Error al consultar horas deshabilitadas",
            error: err.message,
        });
    }
};

// Deshabilitar una hora para una fecha específica
exports.disableHour = async (req, res) => {
    const { date, timeId, adminId } = req.body;

    // Validar parámetros requeridos
    if (!date || !timeId || !adminId) {
        return res.status(400).json({
            success: false,
            message: "Faltan parámetros requeridos: date, timeId, adminId",
        });
    }

    // Validar formato de fecha
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
            success: false,
            message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
        });
    }

    try {
        // Verificar si la hora ya está deshabilitada para evitar duplicados
        const checkQuery = `
            SELECT id FROM disabled_hours 
            WHERE disabled_date = ? AND time_id = ?
        `;

        const checkResults = await db.query(checkQuery, [date, timeId]);

        // Si ya existe, retornar éxito sin crear duplicado
        if (checkResults && checkResults.length > 0) {
            return res.json({
                success: true,
                message: "La hora ya está deshabilitada",
                disabledHourId: checkResults[0].id,
            });
        }

        // Insertar la hora deshabilitada
        const insertQuery = `
            INSERT INTO disabled_hours (disabled_date, time_id, admin_id, created_at) 
            VALUES (?, ?, ?, NOW())
        `;

        const insertResult = await db.query(insertQuery, [
            date,
            timeId,
            adminId,
        ]);

        res.json({
            success: true,
            message: "Hora deshabilitada correctamente",
            disabledHourId: insertResult.insertId,
        });
    } catch (err) {
        console.error("Error al deshabilitar hora:", err);
        res.status(500).json({
            success: false,
            message: "Error al deshabilitar hora",
            error: err.message,
        });
    }
};

// Habilitar una hora previamente deshabilitada
exports.enableHour = async (req, res) => {
    const { date, timeId } = req.body;

    // Validar parámetros requeridos
    if (!date || !timeId) {
        return res.status(400).json({
            success: false,
            message: "Faltan parámetros requeridos: date, timeId",
        });
    }

    // Validar formato de fecha
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
            success: false,
            message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
        });
    }

    try {
        // Eliminar la hora deshabilitada
        const query = `
            DELETE FROM disabled_hours 
            WHERE disabled_date = ? AND time_id = ?
        `;

        const result = await db.query(query, [date, timeId]);

        if (result.affectedRows === 0) {
            // No se encontró la hora deshabilitada (puede que ya estuviera habilitada)
            return res.json({
                success: true,
                message: "La hora ya estaba habilitada",
                affectedRows: 0,
            });
        }

        res.json({
            success: true,
            message: "Hora habilitada correctamente",
            affectedRows: result.affectedRows,
        });
    } catch (err) {
        console.error("Error al habilitar hora:", err);
        res.status(500).json({
            success: false,
            message: "Error al habilitar hora",
            error: err.message,
        });
    }
};
