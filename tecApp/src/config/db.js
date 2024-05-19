const mongoose = require("mongoose"); // Módulo para interactuar con MongoDB
const redis = require("redis"); // Módulo para interactuar con Redis

console.log("URI de MongoDB:", process.env.MONGO_URI);
console.log("Host de Redis:", process.env.REDIS_HOST);
console.log("Puerto de Redis:", process.env.REDIS_PORT);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Conectado a MongoDB"); // Mensaje de éxito en la conexión
  })
  .catch((error) => {
    console.error("Error al conectar a MongoDB:", error); // Mensaje de error en la conexión
  });

// Configuración de Redis
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redisClient.on("error", (err) => {
  console.error("Error en la conexión a Redis:", err); // Mensaje de error en la conexión a Redis
});
redisClient
  .connect()
  .then(() => {
    console.log("Conectado a Redis");
  })
  .catch((err) => {
    console.error("No se pudo conectar a Redis:", err);
  });

// Exportamos las instancias de mongoose y redisClient para usarlas en otras partes de
// la aplicación
module.exports = { mongoose, redisClient };