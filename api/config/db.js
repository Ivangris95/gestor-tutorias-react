const mysql = require("mysql2/promise");

// Creación del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Función para obtener una conexión del pool
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error("Error al obtener conexión a la base de datos:", error);
        throw error;
    }
};

// Función auxiliar para ejecutar consultas
const query = async (sql, params) => {
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (error) {
        console.error("Error al ejecutar consulta:", error);
        throw error;
    }
};

module.exports = {
    pool,
    getConnection,
    query,
};
