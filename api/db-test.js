const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, "./.env") });

// Configuración de la conexión
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Intentar conectar
connection.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
        return;
    }
    console.log("¡Conexión exitosa a la base de datos MySQL!");

    // Realizar una consulta de prueba simple
    connection.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.error("Error al ejecutar la consulta:", err);
            return;
        }

        console.log("Resultados de la consulta:");
        console.log(results);

        // Cerrar la conexión
        connection.end((err) => {
            if (err) {
                console.error("Error al cerrar la conexión:", err);
                return;
            }
            console.log("Conexión cerrada correctamente");
        });
    });
});
