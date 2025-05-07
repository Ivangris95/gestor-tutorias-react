const db = require("../config/db");
const querystring = require("querystring");
const axios = require("axios");

const zoomApiUrl = "https://api.zoom.us/v2";
const zoomOAuthUrl = "https://zoom.us/oauth/token";
const zoomClientId = process.env.ZOOM_CLIENT_ID;
const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;

async function getZoomRefreshToken() {
    console.log("Obteniendo refresh token de Zoom");
    try {
        const results = await db.query("SELECT * FROM app_settings LIMIT 1");

        console.log("Resultado de la consulta:", results);

        // Verificar si hay resultados y si el primer resultado tiene el token
        if (
            results &&
            results.length > 0 &&
            results[0] &&
            results[0].zoom_refresh_token
        ) {
            return results[0].zoom_refresh_token;
        }

        console.log("No se encontró refresh token en la base de datos");
        return null;
    } catch (error) {
        console.error(
            "Error al obtener el refresh token de la base de datos:",
            error
        );
        return null;
    }
}

async function saveNewZoomTokens(newAccessToken, newRefreshToken) {
    console.log(
        "Llamando a saveNewZoomTokens - ¡IMPLEMENTAR!",
        newAccessToken,
        newRefreshToken
    );
    try {
        await db.query(
            "UPDATE app_settings SET zoom_access_token = ?, zoom_refresh_token = ?",
            [newAccessToken, newRefreshToken]
        );
        return true;
    } catch (error) {
        console.error(
            "Error al guardar los nuevos tokens en la base de datos:",
            error
        );
        return false;
    }
}

async function getCurrentZoomAccessToken() {
    console.log("Obteniendo token de acceso de Zoom actual");
    try {
        const results = await db.query("SELECT * FROM app_settings LIMIT 1");

        console.log("Resultado de la consulta:", results);

        // Verificar si hay resultados y si el primer resultado tiene el token
        if (
            results &&
            results.length > 0 &&
            results[0] &&
            results[0].zoom_access_token
        ) {
            return results[0].zoom_access_token;
        }

        console.log("No se encontró token de acceso en la base de datos");
        return null;
    } catch (error) {
        console.error(
            "Error al obtener el access token de la base de datos:",
            error
        );
        return null;
    }
}

async function refreshZoomAccessToken() {
    try {
        const refreshToken = await getZoomRefreshToken();
        if (!refreshToken) {
            throw new Error("No se encontró refresh token.");
        }

        const credentials = Buffer.from(
            `${zoomClientId}:${zoomClientSecret}`
        ).toString("base64");
        const response = await axios.post(
            zoomOAuthUrl,
            querystring.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${credentials}`,
                },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        await saveNewZoomTokens(access_token, refresh_token);
        return access_token;
    } catch (error) {
        console.error(
            "Error al refrescar el token de acceso de Zoom:",
            error.response ? error.response.data : error.message
        );
        throw new Error("No se pudo refrescar el token de acceso de Zoom.");
    }
}

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
 * Cancela una reserva existente y devuelve el token al usuario
 */
exports.cancelBooking = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { bookingId } = req.params;
        const { userId } = req.body;

        // Validación básica
        if (!bookingId || !userId) {
            return res.status(400).json({
                success: false,
                message: "Se requiere el ID de reserva y el ID de usuario",
            });
        }

        // Comenzar transacción
        await connection.beginTransaction();

        // 1. Verificar que la reserva existe y pertenece al usuario
        const [bookings] = await connection.execute(
            `SELECT b.*, a.slot_date, a.slot_id, a.start_time
             FROM bookings b
             JOIN available_slots a ON b.slot_id = a.slot_id
             WHERE b.booking_id = ? AND b.user_id = ?`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Reserva no encontrada o no pertenece al usuario",
            });
        }

        const booking = bookings[0];

        // 2. Verificar que la reserva no haya pasado ya
        const bookingDate = new Date(booking.slot_date);
        const [hours, minutes] = booking.start_time.split(":");
        bookingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const now = new Date();

        // Verificar si falta menos de una hora para la tutoría
        const diffMs = bookingDate - now;
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes < 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "No se puede cancelar una reserva que ya ha pasado",
            });
        }

        if (diffMinutes < 60) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message:
                    "No se puede cancelar una reserva cuando falta menos de 1 hora para comenzar",
            });
        }

        // 3. ELIMINAR la reserva en lugar de solo marcarla como cancelada
        await connection.execute("DELETE FROM bookings WHERE booking_id = ?", [
            bookingId,
        ]);

        // 4. Marcar el slot como disponible nuevamente
        await connection.execute(
            "UPDATE available_slots SET is_booked = 0 WHERE slot_id = ?",
            [booking.slot_id]
        );

        // 5. Devolver el token al usuario
        await connection.execute(
            "UPDATE tokens SET tokens_available = tokens_available + 1, tokens_used = tokens_used - 1 WHERE user_id = ?",
            [userId]
        );

        // 6. Obtener los tokens actualizados
        const [tokenResult] = await connection.execute(
            "SELECT tokens_available FROM tokens WHERE user_id = ?",
            [userId]
        );

        const tokensAvailable = tokenResult[0]?.tokens_available || 0;

        // Confirmar transacción
        await connection.commit();

        res.json({
            success: true,
            message: "The booking was cancelled successfully.",
            tokensReturned: 1,
            tokensAvailable: tokensAvailable,
        });
    } catch (error) {
        console.error("Error al cancelar reserva:", error);
        await connection.rollback();

        res.status(500).json({
            success: false,
            message: "There was an error cancelling the booking",
            error: error.message,
        });
    } finally {
        connection.release();
    }
};

/**
 * Elimina completamente una reserva (solo para administradores)
 */
exports.deleteBookingAdmin = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { bookingId } = req.params;

        // Verificar que el usuario que realiza la acción es un administrador
        const adminId = req.user.user_id;

        // Verificar que es un administrador
        const [adminCheck] = await connection.execute(
            "SELECT is_admin FROM users WHERE user_id = ?",
            [adminId]
        );

        if (adminCheck.length === 0 || adminCheck[0].is_admin !== 1) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para realizar esta acción",
            });
        }

        // Comenzar transacción
        await connection.beginTransaction();

        // 1. Obtener información de la reserva
        const [bookings] = await connection.execute(
            `SELECT b.*, a.slot_id 
         FROM bookings b
         JOIN available_slots a ON b.slot_id = a.slot_id
         WHERE b.booking_id = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Reserva no encontrada",
            });
        }

        const booking = bookings[0];

        // 2. ELIMINAR la reserva
        await connection.execute("DELETE FROM bookings WHERE booking_id = ?", [
            bookingId,
        ]);

        // 3. Liberar el slot
        await connection.execute(
            "UPDATE available_slots SET is_booked = 0 WHERE slot_id = ?",
            [booking.slot_id]
        );

        // 4. Devolver el token al estudiante
        if (booking.user_id && booking.tokens_used > 0) {
            await connection.execute(
                "UPDATE tokens SET tokens_available = tokens_available + ?, tokens_used = tokens_used - ? WHERE user_id = ?",
                [booking.tokens_used, booking.tokens_used, booking.user_id]
            );
        }

        // Confirmar transacción
        await connection.commit();

        res.json({
            success: true,
            message: "Reserva eliminada correctamente por el administrador",
        });
    } catch (error) {
        console.error("Error al eliminar reserva (admin):", error);
        await connection.rollback();

        res.status(500).json({
            success: false,
            message: "Error al eliminar la reserva",
            error: error.message,
        });
    } finally {
        connection.release();
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
                message: "User ID is required.",
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
            message: "There was an error getting the user's tutorials.",
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
        let accessToken = await getCurrentZoomAccessToken();

        // Verificar si hay un token de acceso válido
        if (!accessToken) {
            console.log("No se obtuvo un token de acceso válido para Zoom");
            return {
                zoomLink: null,
                meetingId: null,
                meetingPassword: null,
                zoomNotConfigured: true,
                instructions:
                    "El administrador debe configurar la integración con Zoom antes de poder generar enlaces.",
            };
        }

        const response = await axios.post(
            `${zoomApiUrl}/users/me/meetings`,
            {
                topic: `Tutorial for booking ${booking.booking_id}`,
                type: 2,
                settings: {
                    join_before_host: true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const { id, join_url, password } = response.data;
        return {
            zoomLink: join_url,
            meetingId: id.toString(),
            meetingPassword: password || "",
            instructions:
                "Haz clic en el enlace para unirte a la reunión de Zoom.",
        };
    } catch (error) {
        if (
            error.response &&
            error.response.data &&
            error.response.data.code === 124
        ) {
            console.warn("Token de acceso inválido, intentando refrescar...");
            try {
                const newAccessToken = await refreshZoomAccessToken();

                if (!newAccessToken) {
                    console.error(
                        "No se pudo obtener un nuevo token de acceso"
                    );
                    return {
                        zoomLink: null,
                        meetingId: null,
                        meetingPassword: null,
                        zoomNotConfigured: true,
                        instructions:
                            "No se pudo refrescar el token de Zoom. El administrador debe reconfigurar la integración.",
                    };
                }

                // Reintentar generar la reunión con el nuevo token
                const response = await axios.post(
                    `${zoomApiUrl}/users/me/meetings`,
                    {
                        topic: `Tutorial for booking ${booking.booking_id}`,
                        type: 2,
                        settings: {
                            join_before_host: true,
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${newAccessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const { id, join_url, password } = response.data;
                return {
                    zoomLink: join_url,
                    meetingId: id.toString(),
                    meetingPassword: password || "",
                    instructions:
                        "Haz clic en el enlace para unirte a la reunión de Zoom.",
                };
            } catch (refreshError) {
                console.error(
                    "Error al refrescar el token y reintentar:",
                    refreshError
                );
                // En lugar de lanzar un error, devolver un objeto que indique el problema
                return {
                    zoomLink: null,
                    meetingId: null,
                    meetingPassword: null,
                    error: true,
                    errorMessage: `No se pudo refrescar el token de Zoom: ${refreshError.message}`,
                };
            }
        } else {
            console.error(
                "Error al generar la reunión de Zoom:",
                error.response ? error.response.data : error.message
            );
            // En lugar de lanzar un error, devolver un objeto que indique el problema
            return {
                zoomLink: null,
                meetingId: null,
                meetingPassword: null,
                error: true,
                errorMessage: `No se pudo generar la reunión de Zoom: ${
                    error.response
                        ? JSON.stringify(error.response.data)
                        : error.message
                }`,
            };
        }
    }
};

exports.generateZoomLink = async (req, res) => {
    const connection = await db.getConnection(); // Obtener una conexión para esta solicitud

    try {
        const { bookingId } = req.params;

        const [bookings] = await connection.execute(
            "SELECT booking_id, zoom_link, meeting_id, meeting_password FROM bookings WHERE booking_id = ?",
            [bookingId]
        );

        if (!bookings || bookings.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Reserva no encontrada" });
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

        // Generar un nuevo enlace de Zoom utilizando la API (la función generateZoomMeeting manejará la autenticación)
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
                `UPDATE bookings SET zoom_link = ?, meeting_id = ?, meeting_password = ? WHERE booking_id = ?`,
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
        if (connection) connection.release(); // Liberar la conexión para esta solicitud
    }
};
