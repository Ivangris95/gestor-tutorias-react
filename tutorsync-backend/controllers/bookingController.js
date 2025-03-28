const db = require("../config/db");

exports.createBooking = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { userId, timeId, slotDate } = req.body;

        console.log("Datos recibidos:", { userId, timeId, slotDate });

        // Validación de datos
        if (!userId || !timeId || !slotDate) {
            return res.status(400).json({
                success: false,
                message: "Faltan datos necesarios para la reserva",
            });
        }

        // Comenzar transacción
        await connection.beginTransaction();

        // 1. Verificar si el usuario tiene tokens disponibles
        const [tokenRows] = await connection.execute(
            "SELECT tokens_available FROM tokens WHERE user_id = ?",
            [userId]
        );

        // Si no tiene tokens o son insuficientes
        if (tokenRows.length === 0 || tokenRows[0].tokens_available < 1) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message:
                    "No tienes suficientes tokens para realizar esta reserva",
                needTokens: true,
            });
        }

        // 2. Obtener información del horario predefinido
        const [timeInfo] = await connection.execute(
            "SELECT * FROM predefined_times WHERE time_id = ? AND is_active = 1",
            [timeId]
        );

        if (timeInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message:
                    "El horario seleccionado no existe o no está disponible",
            });
        }

        // 3. Verificar si ya existe una reserva para esa fecha y horario
        const [existingBookings] = await connection.execute(
            `SELECT b.* FROM bookings b
             JOIN available_slots s ON b.slot_id = s.slot_id
             WHERE s.slot_date = ? AND s.start_time = ? AND b.status != 'cancelled'`,
            [slotDate, timeInfo[0].start_time]
        );

        if (existingBookings.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Este horario ya ha sido reservado",
            });
        }

        // 4. Crear un slot disponible para esta fecha y horario
        const [slotResult] = await connection.execute(
            `INSERT INTO available_slots 
            (slot_date, start_time, end_time, is_booked, created_by, slot_duration) 
            VALUES (?, ?, ?, 1, ?, 60)`,
            [slotDate, timeInfo[0].start_time, timeInfo[0].end_time, userId]
        );

        const slotId = slotResult.insertId;

        // 5. Crear la reserva
        const [bookingResult] = await connection.execute(
            `INSERT INTO bookings 
            (user_id, slot_id, tokens_used, booking_date, status) 
            VALUES (?, ?, 1, NOW(), 'upcoming')`,
            [userId, slotId]
        );

        // 6. Restar un token al usuario
        await connection.execute(
            "UPDATE tokens SET tokens_available = tokens_available - 1, tokens_used = tokens_used + 1 WHERE user_id = ?",
            [userId]
        );

        // 7. Obtener los tokens restantes
        const [updatedTokens] = await connection.execute(
            "SELECT tokens_available FROM tokens WHERE user_id = ?",
            [userId]
        );

        // Confirmar transacción
        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Reserva creada correctamente",
            bookingId: bookingResult.insertId,
            tokensRemaining: updatedTokens[0].tokens_available,
        });
    } catch (error) {
        console.error("Error al crear reserva:", error);
        await connection.rollback();

        res.status(500).json({
            success: false,
            message: "Error al procesar la reserva",
            error: error.message,
        });
    } finally {
        connection.release();
    }
};

/**
 * Obtiene los horarios reservados para una fecha específica
 */
exports.getBookedSlots = async (req, res) => {
    try {
        const { date } = req.params;

        // Validar formato de fecha (YYYY-MM-DD)
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: "Formato de fecha inválido. Usa YYYY-MM-DD",
            });
        }

        const [bookedSlots] = await db.pool.query(
            `SELECT s.slot_id, s.start_time, s.end_time
            FROM available_slots s
            JOIN bookings b ON s.slot_id = b.slot_id
            WHERE s.slot_date = ? AND b.status != 'cancelled'`,
            [date]
        );

        res.json({
            success: true,
            date,
            bookedSlots,
        });
    } catch (error) {
        console.error("Error al obtener horarios reservados:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener horarios reservados",
            error: error.message,
        });
    }
};

/**
 * Obtener las horas disponibles para una fecha específica
 */
exports.getAvailableHoursForDate = async (req, res) => {
    try {
        const { date } = req.params;

        // Validar formato de fecha
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: "Formato de fecha inválido. Use YYYY-MM-DD",
            });
        }

        // Obtener las horas disponibles para esta fecha
        // Solo mostramos los horarios que NO estén reservados
        const availableHours = await db.query(
            `
            SELECT 
                a.slot_id, 
                a.slot_date, 
                a.start_time, 
                a.end_time, 
                a.is_booked,
                p.time_id
            FROM 
                available_slots a
            JOIN 
                predefined_times p ON a.start_time = p.start_time AND a.end_time = p.end_time
            WHERE 
                a.slot_date = ?
            ORDER BY 
                a.start_time ASC
        `,
            [date]
        );

        res.json(availableHours);
    } catch (error) {
        console.error("Error al obtener horas disponibles:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor",
        });
    }
};
