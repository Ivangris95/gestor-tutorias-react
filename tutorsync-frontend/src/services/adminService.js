// 1. GESTIÓN DE SLOTS DISPONIBLES
// -------------------------------

// Obtener todos los slots disponibles
export const getAvailableSlots = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/admin/slots");

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error(`Error al obtener slots: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en getAvailableSlots:", error);
        return [];
    }
};

// Añadir un nuevo slot disponible
export const addAvailableSlot = async (slotData) => {
    try {
        const response = await fetch("http://localhost:5000/api/admin/slots", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(slotData),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al crear slot disponible");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en addAvailableSlot:", error);
        throw error;
    }
};

// Eliminar un slot disponible
export const deleteAvailableSlot = async (slotId) => {
    try {
        const response = await fetch(
            `http://localhost:5000/api/admin/slots/${slotId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al eliminar slot disponible");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en deleteAvailableSlot:", error);
        throw error;
    }
};

// 2. GESTIÓN DE HORAS DESHABILITADAS (NUEVA FUNCIONALIDAD)
// --------------------------------------------------------

// Obtener horas deshabilitadas para una fecha específica
export const getDisabledHoursForDate = async (date) => {
    try {
        const url = `http://localhost:5000/api/disabled-hours/${date}`;
        console.log("Llamando a getDisabledHoursForDate - URL:", url);

        const response = await fetch(url);
        console.log("Status respuesta:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error(
                `Error al obtener horas deshabilitadas: ${response.status}`
            );
        }

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (jsonError) {
            console.error("Error al parsear JSON:", jsonError);
            throw new Error("La respuesta no es un JSON válido");
        }
    } catch (error) {
        console.error("Error en getDisabledHoursForDate:", error);
        return { success: false, disabledHours: [] };
    }
};

// Deshabilitar una hora específica
export const disableHour = async (date, timeId, adminId) => {
    try {
        console.log("Intentando deshabilitar hora:", { date, timeId, adminId });
        const response = await fetch(
            "http://localhost:5000/api/disabled-hours",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ date, timeId, adminId }),
            }
        );

        console.log("Respuesta del servidor:", response);

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al deshabilitar hora");
        }

        const data = await response.json();
        console.log("Datos de respuesta:", data);
        return data;
    } catch (error) {
        console.error("Error en disableHour:", error);
        throw error;
    }
};

// Habilitar una hora previamente deshabilitada
export const enableHour = async (date, timeId) => {
    try {
        console.log("Intentando habilitar hora:", { date, timeId });
        const response = await fetch(
            "http://localhost:5000/api/disabled-hours",
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ date, timeId }),
            }
        );

        console.log("Respuesta del servidor:", response);

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al habilitar hora");
        }

        const data = await response.json();
        console.log("Datos de respuesta:", data);
        return data;
    } catch (error) {
        console.error("Error en enableHour:", error);
        throw error;
    }
};

// 3. GESTIÓN DE HORAS POR FECHA (COMPATIBILIDAD CON CÓDIGO ANTERIOR)
// -----------------------------------------------------------------

// Obtener horas disponibles para una fecha específica
export const getAvailableHoursForDate = async (date) => {
    try {
        // Obtener todas las horas predefinidas
        const predefinedTimesData = await getPredefinedTimes();

        if (!predefinedTimesData.success) {
            throw new Error("Error al obtener horarios predefinidos");
        }

        const predefinedTimes = predefinedTimesData.times;

        // Obtener las horas deshabilitadas para esta fecha
        let disabledTimeIds = [];
        try {
            const disabledData = await getDisabledHoursForDate(date);
            if (disabledData.success) {
                disabledTimeIds = disabledData.disabledHours;
            }
        } catch (err) {
            console.warn(
                "Error al obtener horas deshabilitadas, asumiendo ninguna:",
                err
            );
        }

        // Filtrar las horas predefinidas que no están deshabilitadas
        const availableHours = predefinedTimes.filter(
            (time) => !disabledTimeIds.includes(time.time_id)
        );

        return availableHours;
    } catch (error) {
        console.error("Error en getAvailableHoursForDate:", error);
        return [];
    }
};

// Habilitar una hora para una fecha específica (compatibilidad)
export const addAvailableHour = async (date, timeId, createdBy) => {
    try {
        // Ahora usamos la nueva funcionalidad de habilitar (eliminar de deshabilitadas)
        return await enableHour(date, timeId);
    } catch (error) {
        console.error("Error en addAvailableHour:", error);
        throw error;
    }
};

// Deshabilitar una hora para una fecha específica (compatibilidad)
export const removeAvailableHour = async (date, timeId) => {
    try {
        // Obtenemos el ID del admin del localStorage
        const userString = localStorage.getItem("user");
        const user = JSON.parse(userString);

        // Ahora usamos la nueva funcionalidad de deshabilitar
        return await disableHour(date, timeId, user.id);
    } catch (error) {
        console.error("Error en removeAvailableHour:", error);
        throw error;
    }
};

// 4. GESTIÓN DE HORARIOS PREDEFINIDOS
// ----------------------------------

// Obtener todos los horarios predefinidos
export const getPredefinedTimes = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/predefined-times"
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al obtener horarios predefinidos");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en getPredefinedTimes:", error);
        return { success: false, times: [] };
    }
};

// 5. GESTIÓN DE RESERVAS
// ----------------------

// Obtener todas las reservas
export const getBookings = async (filterDate = null) => {
    try {
        let url = "http://localhost:5000/api/admin/bookings";
        if (filterDate) {
            url += `?date=${filterDate}`;
        }

        console.log("Llamando a getBookings - URL:", url);

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "GET",
        });

        console.log("Status respuesta bookings:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor (bookings):", text);
            throw new Error(`Error al obtener reservas: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en getBookings:", error);
        return [];
    }
};

// Cambiar el estado de una reserva
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const response = await fetch(
            `http://localhost:5000/api/admin/bookings/${bookingId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al actualizar estado de reserva");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en updateBookingStatus:", error);
        throw error;
    }
};

// Obtener detalles de una reserva específica
export const getBookingDetails = async (bookingId) => {
    try {
        const response = await fetch(
            `http://localhost:5000/api/admin/bookings/${bookingId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "GET",
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Respuesta del servidor:", text);
            throw new Error("Error al obtener detalles de la reserva");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en getBookingDetails:", error);
        throw error;
    }
};
