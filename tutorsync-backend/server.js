const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Configurar variables de entorno
dotenv.config({ path: path.resolve(__dirname, "./.env") });

// Importar rutas
const routes = require("./routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rutas
app.use("/api", routes);

// Puerto del servidor
const port = process.env.PORT || 5000;

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});
