const db = require("../config/db");
const axios = require("axios");

const getServerToServerToken = async () => {
    try {
        console.log("Generando nuevo token OAuth para Zoom");

        // Validar que las credenciales existen
        if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
            throw new Error("Faltan credenciales de Zoom en .env");
        }

        const authString = Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString("base64");

        const response = await axios.post(
            "https://zoom.us/oauth/token",
            new URLSearchParams({
                grant_type: "client_credentials",
            }).toString(),
            {
                headers: {
                    Authorization: `Basic ${authString}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 5000,
            }
        );

        if (!response.data.access_token) {
            throw new Error("Zoom no devolvió un token válido");
        }

        console.log("Token OAuth generado con éxito");
        return response.data.access_token;
    } catch (error) {
        console.error("Error al generar token OAuth:", {
            message: error.message,
            response: error.response?.data,
            config: {
                url: error.config?.url,
                auth: error.config?.auth,
            },
        });
        throw new Error(
            `Falló la generación del token: ${
                error.response?.data?.error || error.message
            }`
        );
    }
};

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

/**
 * Obtiene las tutorías del usuario filtradas por estado
 */
exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        // Validar userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Se requiere el ID del usuario",
            });
        }

        // Construir la consulta base
        const query = `
        SELECT 
          b.booking_id,
          b.user_id,
          b.slot_id,
          b.tokens_used,
          b.zoom_link,
          b.meeting_id,
          b.meeting_password,
          b.booking_date,
          b.status,
          b.notes,
          a.slot_date,
          a.start_time,
          a.end_time,
          a.created_by,
          u.username as tutor_name
        FROM 
          bookings b
        JOIN 
          available_slots a ON b.slot_id = a.slot_id
        JOIN 
          users u ON a.created_by = u.user_id
        WHERE 
          b.user_id = ?
          ${status ? " AND b.status = ?" : ""}
        ORDER BY 
          a.slot_date ASC, a.start_time ASC
      `;

        const queryParams = status ? [userId, status] : [userId];

        const bookings = await db.query(query, queryParams);

        // Para cada tutoría próxima sin enlace de Zoom, generar uno si está cerca del inicio
        for (const booking of bookings) {
            // Solo procesar tutorías próximas sin enlaces de Zoom
            if (booking.status === "upcoming" && !booking.zoom_link) {
                // Verificar si la tutoría está próxima (dentro de 24 horas)
                const tutorDate = new Date(booking.slot_date);
                const [hours, minutes] = booking.start_time.split(":");
                tutorDate.setHours(parseInt(hours, 10));
                tutorDate.setMinutes(parseInt(minutes, 10));

                const now = new Date();
                const diffMs = tutorDate - now;
                const diffMinutes = Math.floor(diffMs / 60000);

                // Si faltan menos de 24 horas (1440 minutos) o ya ha comenzado (hasta 1 hora después), generar enlace de Zoom
                if (diffMinutes <= 1440 && diffMinutes >= -60) {
                    try {
                        // Generar un enlace de Zoom
                        const zoomResponse = await exports.generateZoomMeeting(
                            booking
                        );

                        // Actualizar en la base de datos
                        await db.query(
                            `UPDATE bookings 
                            SET zoom_link = ?, meeting_id = ?, meeting_password = ? 
                            WHERE booking_id = ?`,
                            [
                                zoomResponse.zoomLink,
                                zoomResponse.meetingId,
                                zoomResponse.meetingPassword,
                                booking.booking_id,
                            ]
                        );

                        // Actualizar el objeto de respuesta
                        booking.zoom_link = zoomResponse.zoomLink;
                        booking.meeting_id = zoomResponse.meetingId;
                        booking.meeting_password = zoomResponse.meetingPassword;
                    } catch (err) {
                        console.error(
                            `Error al generar enlace de Zoom para reserva ${booking.booking_id}:`,
                            err
                        );
                    }
                }
            }
        }

        res.json({
            success: true,
            userId,
            status: status || "all",
            count: bookings.length,
            bookings,
        });
    } catch (error) {
        console.error("Error al obtener tutorías del usuario:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener tutorías del usuario",
            error: error.message,
        });
    }
};

/**
 * Marca como leídas las notificaciones de tutorías
 */
exports.markBookingNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validar userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Se requiere el ID del usuario",
            });
        }

        // Actualizar notificaciones relacionadas con tutorías
        await db.query(
            `UPDATE notifications 
         SET is_read = 1 
         WHERE user_id = ? AND notification_type = 'reminder'`,
            [userId]
        );

        res.json({
            success: true,
            message: "Notificaciones marcadas como leídas",
        });
    } catch (error) {
        console.error("Error al marcar notificaciones como leídas:", error);
        res.status(500).json({
            success: false,
            message: "Error al marcar notificaciones como leídas",
            error: error.message,
        });
    }
};

/**
 * Función para generar una reunión de Zoom utilizando la API REST directamente
 */
exports.generateZoomMeeting = async (booking) => {
    try {
        const pmiMeetingId = "6277351083";

        const zoomLink = `https://zoom.us/j/${pmiMeetingId}`;

        const meetingInfo = {
            zoomLink: zoomLink,
            meetingId: pmiMeetingId,
            meetingPassword: "",
            instructions:
                "Al hacer clic en el enlace, es posible que se solicite un código de acceso. El anfitrión deberá admitir a los participantes.",
        };

        return meetingInfo;
    } catch (error) {
        console.error("Error en generateZoomMeeting:", error);
        throw new Error(
            "No se pudo generar el enlace de Zoom: " + error.message
        );
    }
};

/**
 * Genera un enlace de Zoom real para una reserva
 */
exports.generateZoomLink = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { bookingId } = req.params;

        // Validar bookingId
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Se requiere el ID de la reserva",
            });
        }

        // Verificar si la reserva existe y obtener sus detalles
        const [bookings] = await connection.execute(
            `SELECT 
              b.*, 
              a.slot_date, 
              a.start_time, 
              a.end_time,
              u.username as student_name,
              t.username as tutor_name,
              t.user_id as tutor_id
            FROM 
              bookings b
            JOIN 
              available_slots a ON b.slot_id = a.slot_id
            JOIN 
              users u ON b.user_id = u.user_id
            JOIN 
              users t ON a.created_by = t.user_id
            WHERE 
              b.booking_id = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reserva no encontrada",
            });
        }

        const booking = bookings[0];

        // Si ya tiene enlace de Zoom, devolverlo
        if (
            booking.zoom_link &&
            booking.meeting_id &&
            booking.meeting_password
        ) {
            return res.json({
                success: true,
                booking_id: bookingId,
                zoom_link: booking.zoom_link,
                meeting_id: booking.meeting_id,
                meeting_password: booking.meeting_password,
            });
        }

        // Generar un nuevo enlace de Zoom
        try {
            const zoomResponse = await exports.generateZoomMeeting(booking);

            if (!zoomResponse) {
                return res.status(500).json({
                    success: false,
                    message:
                        "No se pudo generar el enlace de Zoom. La API de Zoom no devolvió una respuesta válida.",
                });
            }

            // Actualizar la reserva con los datos de Zoom
            await connection.execute(
                `UPDATE bookings 
                SET zoom_link = ?, meeting_id = ?, meeting_password = ? 
                WHERE booking_id = ?`,
                [
                    zoomResponse.zoomLink,
                    zoomResponse.meetingId,
                    zoomResponse.meetingPassword,
                    bookingId,
                ]
            );

            res.json({
                success: true,
                booking_id: bookingId,
                zoom_link: zoomResponse.zoomLink,
                meeting_id: zoomResponse.meetingId,
                meeting_password: zoomResponse.meetingPassword,
            });
        } catch (error) {
            console.error("Error al generar enlace de Zoom:", error);

            return res.status(500).json({
                success: false,
                message: "No se pudo generar el enlace de Zoom",
                error: error.message,
            });
        }
    } catch (error) {
        console.error("Error general en generateZoomLink:", error);
        res.status(500).json({
            success: false,
            message: "Error al generar enlace de Zoom",
            error: error.message,
        });
    } finally {
        connection.release();
    }
};
