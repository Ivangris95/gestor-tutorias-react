const db = require("../config/db");

/**
 * Obtiene todos los horarios predefinidos activos
 */
exports.getPredefinedTimes = async (req, res) => {
    try {
        const times = await db.query(
            "SELECT time_id, start_time, end_time FROM predefined_times WHERE is_active = 1 ORDER BY start_time"
        );

        res.json({
            success: true,
            times,
        });
    } catch (error) {
        console.error("Error al obtener horarios predefinidos:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener horarios predefinidos",
            error: error.message,
        });
    }
};

/**
 * Crea un nuevo horario predefinido
 */
exports.createPredefinedTime = async (req, res) => {
    try {
        const { startTime, endTime, isActive } = req.body;

        // Validar datos de entrada
        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Se requiere hora de inicio y fin",
            });
        }

        // Insertar nuevo horario
        const result = await db.query(
            "INSERT INTO predefined_times (start_time, end_time, is_active) VALUES (?, ?, ?)",
            [startTime, endTime, isActive !== undefined ? isActive : 1]
        );

        res.status(201).json({
            success: true,
            message: "Horario creado correctamente",
            timeId: result.insertId,
        });
    } catch (error) {
        console.error("Error al crear horario predefinido:", error);

        // Si es un error de duplicado (UNIQUE constraint)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                success: false,
                message: "Ya existe un horario con esa hora de inicio",
            });
        }

        res.status(500).json({
            success: false,
            message: "Error al crear horario predefinido",
            error: error.message,
        });
    }
};

/**
 * Actualiza un horario predefinido existente
 */
exports.updatePredefinedTime = async (req, res) => {
    try {
        const { timeId } = req.params;
        const { startTime, endTime, isActive } = req.body;

        // Validar datos de entrada
        if (!timeId || isNaN(timeId)) {
            return res.status(400).json({
                success: false,
                message: "ID de horario inválido",
            });
        }

        // Verificar si el horario existe
        const existingTime = await db.query(
            "SELECT * FROM predefined_times WHERE time_id = ?",
            [timeId]
        );

        if (existingTime.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Horario no encontrado",
            });
        }

        // Construir consulta dinámica según los campos proporcionados
        const updates = [];
        const values = [];

        if (startTime !== undefined) {
            updates.push("start_time = ?");
            values.push(startTime);
        }

        if (endTime !== undefined) {
            updates.push("end_time = ?");
            values.push(endTime);
        }

        if (isActive !== undefined) {
            updates.push("is_active = ?");
            values.push(isActive);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No se proporcionaron datos para actualizar",
            });
        }

        // Añadir el ID al final de los valores
        values.push(timeId);

        // Actualizar horario
        await db.query(
            `UPDATE predefined_times SET ${updates.join(
                ", "
            )} WHERE time_id = ?`,
            values
        );

        res.json({
            success: true,
            message: "Horario actualizado correctamente",
        });
    } catch (error) {
        console.error("Error al actualizar horario predefinido:", error);

        // Si es un error de duplicado (UNIQUE constraint)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                success: false,
                message: "Ya existe un horario con esa hora de inicio",
            });
        }

        res.status(500).json({
            success: false,
            message: "Error al actualizar horario predefinido",
            error: error.message,
        });
    }
};

/**
 * Elimina un horario predefinido
 */
exports.deletePredefinedTime = async (req, res) => {
    try {
        const { timeId } = req.params;

        // Validar datos de entrada
        if (!timeId || isNaN(timeId)) {
            return res.status(400).json({
                success: false,
                message: "ID de horario inválido",
            });
        }

        // Verificar si el horario existe
        const existingTime = await db.query(
            "SELECT * FROM predefined_times WHERE time_id = ?",
            [timeId]
        );

        if (existingTime.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Horario no encontrado",
            });
        }

        // Eliminar horario
        await db.query("DELETE FROM predefined_times WHERE time_id = ?", [
            timeId,
        ]);

        res.json({
            success: true,
            message: "Horario eliminado correctamente",
        });
    } catch (error) {
        console.error("Error al eliminar horario predefinido:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar horario predefinido",
            error: error.message,
        });
    }
};
