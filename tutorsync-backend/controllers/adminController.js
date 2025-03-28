const db = require("../config/db");

/**
 * Controlador para obtener todos los horarios disponibles
 */
exports.getAvailableSlots = async (req, res) => {
    try {
        // Consulta modificada para incluir información del usuario que reservó (si está reservado)
        const availableSlots = await db.query(
            `SELECT 
                a.slot_id, 
                a.slot_date, 
                a.start_time, 
                a.end_time, 
                a.is_booked, 
                a.created_by,
                a.slot_duration,
                u.username as created_by_username,
                b.user_id as booking_user_id,
                s.username as student_name
            FROM 
                available_slots a
            JOIN 
                users u ON a.created_by = u.user_id
            LEFT JOIN 
                bookings b ON a.slot_id = b.slot_id
            LEFT JOIN 
                users s ON b.user_id = s.user_id
            ORDER BY 
                a.slot_date ASC, 
                a.start_time ASC`
        );

        res.json(availableSlots);
    } catch (error) {
        console.error("Error al obtener horarios:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

/**
 * Controlador para crear un nuevo horario disponible
 */
exports.addAvailableSlot = async (req, res) => {
    try {
        const {
            slotDate,
            startTime,
            endTime,
            createdBy,
            slotDuration = 60,
        } = req.body;

        // Validaciones básicas
        if (!slotDate || !startTime || !endTime || !createdBy) {
            return res
                .status(400)
                .json({ message: "Todos los campos son obligatorios" });
        }

        // Usar una conexión para poder manejar transacciones
        const connection = await db.getConnection();

        try {
            // Iniciar transacción
            await connection.beginTransaction();

            // 1. Insertar en available_slots
            const [resultSlot] = await connection.query(
                `INSERT INTO available_slots 
                (slot_date, start_time, end_time, created_by, slot_duration) 
                VALUES (?, ?, ?, ?, ?)`,
                [slotDate, startTime, endTime, createdBy, slotDuration]
            );

            const slotId = resultSlot.insertId;

            // 2. Verificar si este horario ya existe en predefined_times
            const [existingTimes] = await connection.query(
                `SELECT * FROM predefined_times 
                WHERE start_time = ? AND end_time = ?`,
                [startTime, endTime]
            );

            // Solo insertar si no existe
            if (existingTimes.length === 0) {
                const [resultTime] = await connection.query(
                    `INSERT INTO predefined_times 
                    (start_time, end_time, is_active) 
                    VALUES (?, ?, 1)`,
                    [startTime, endTime]
                );
                console.log(
                    "Horario añadido a predefined_times con ID:",
                    resultTime.insertId
                );
            } else {
                console.log("El horario ya existe en predefined_times");
            }

            // Confirmar transacción
            await connection.commit();

            // Liberar conexión
            connection.release();

            // Devolver el slot creado
            const createdSlot = {
                slot_id: slotId,
                slot_date: slotDate,
                start_time: startTime,
                end_time: endTime,
                is_booked: 0,
                created_by: createdBy,
                slot_duration: slotDuration,
            };

            res.status(201).json(createdSlot);
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error("Error al crear horario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
/**
 * Controlador para eliminar un horario disponible
 */
exports.deleteAvailableSlot = async (req, res) => {
    try {
        const { slotId } = req.params;

        // Usar una conexión para poder manejar transacciones
        const connection = await db.getConnection();

        try {
            // Iniciar transacción
            await connection.beginTransaction();

            // 1. Obtener la información del slot antes de eliminarlo
            const [slots] = await connection.query(
                "SELECT start_time, end_time, is_booked FROM available_slots WHERE slot_id = ?",
                [slotId]
            );

            if (slots.length === 0) {
                await connection.rollback();
                connection.release();
                return res
                    .status(404)
                    .json({ message: "Horario no encontrado" });
            }

            const slot = slots[0];

            if (slot.is_booked) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    message: "No se puede eliminar un horario ya reservado",
                });
            }

            // 2. Eliminar el slot de available_slots
            await connection.query(
                "DELETE FROM available_slots WHERE slot_id = ?",
                [slotId]
            );

            // 3. Verificar si hay otros slots con el mismo horario antes de eliminarlo de predefined_times
            const [otherSlots] = await connection.query(
                "SELECT COUNT(*) as count FROM available_slots WHERE start_time = ? AND end_time = ?",
                [slot.start_time, slot.end_time]
            );

            // Si no hay otros slots con el mismo horario, también lo eliminamos de predefined_times
            if (otherSlots[0].count === 0) {
                await connection.query(
                    "DELETE FROM predefined_times WHERE start_time = ? AND end_time = ?",
                    [slot.start_time, slot.end_time]
                );
                console.log("Horario eliminado también de predefined_times");
            } else {
                console.log(
                    "Hay otros slots con el mismo horario, no se elimina de predefined_times"
                );
            }

            // Confirmar transacción
            await connection.commit();
            connection.release();

            res.json({ message: "Horario eliminado correctamente", slotId });
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error("Error al eliminar horario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
/**
 * Controlador para obtener todas las reservas
 */
exports.getBookings = async (req, res) => {
    try {
        // Obtener fecha de filtro si existe
        const { date } = req.query;

        let query = `
            SELECT 
                b.booking_id,
                b.user_id,
                u.username as student_name,
                b.slot_id,
                a.slot_date,
                a.start_time,
                a.end_time,
                b.tokens_used,
                b.zoom_link,
                b.booking_date,
                b.status,
                b.notes
            FROM 
                bookings b
            JOIN 
                users u ON b.user_id = u.user_id
            JOIN 
                available_slots a ON b.slot_id = a.slot_id
        `;

        const queryParams = [];

        // Añadir filtro por fecha si se proporciona
        if (date) {
            query += " WHERE a.slot_date = ?";
            queryParams.push(date);
        }

        // Ordenar por fecha y hora
        query += " ORDER BY a.slot_date ASC, a.start_time ASC";

        const bookings = await db.query(query, queryParams);

        res.json(bookings);
    } catch (error) {
        console.error("Error al obtener reservas:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

/**
 * Controlador para actualizar el estado de una reserva
 */
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        // Validar estado
        const validStatuses = ["upcoming", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Estado no válido" });
        }

        // Verificar si la reserva existe
        const [booking] = await db.query(
            "SELECT * FROM bookings WHERE booking_id = ?",
            [bookingId]
        );

        if (!booking) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Actualizar estado
        await db.query("UPDATE bookings SET status = ? WHERE booking_id = ?", [
            status,
            bookingId,
        ]);

        // Si se cancela, liberar el slot
        if (status === "cancelled") {
            await db.query(
                "UPDATE available_slots SET is_booked = 0 WHERE slot_id = ?",
                [booking.slot_id]
            );
        }

        res.json({
            message: "Estado actualizado correctamente",
            bookingId,
            status,
        });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

/**
 * Controlador para obtener detalles de una reserva específica
 */
exports.getBookingDetails = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Obtener detalles completos de la reserva
        const [booking] = await db.query(
            `SELECT 
                b.booking_id,
                b.user_id,
                u.username as student_name,
                u.email_address as student_email,
                b.slot_id,
                a.slot_date,
                a.start_time,
                a.end_time,
                b.tokens_used,
                b.zoom_link,
                b.meeting_id,
                b.meeting_password,
                b.booking_date,
                b.status,
                b.notes,
                a.created_by,
                c.username as tutor_name
            FROM 
                bookings b
            JOIN 
                users u ON b.user_id = u.user_id
            JOIN 
                available_slots a ON b.slot_id = a.slot_id
            JOIN
                users c ON a.created_by = c.user_id
            WHERE 
                b.booking_id = ?`,
            [bookingId]
        );

        if (!booking) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        res.json(booking);
    } catch (error) {
        console.error("Error al obtener detalles de la reserva:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
