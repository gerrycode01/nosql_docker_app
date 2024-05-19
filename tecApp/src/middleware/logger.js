const { redisClient } = require('../config/db');

const logger = (req, res, next) => {
    // Capta el objeto de respuesta original
    const originalSend = res.send;

    // Modifica la función send de la respuesta para capturar los datos antes de enviarlos
    res.send = function(data) {
        // Asegura que el originalSend sigue siendo llamado con el contexto y argumentos correctos
        originalSend.apply(res, arguments);

        // Registra la respuesta y la petición en Redis
        const logEntry = {
            method: req.method,
            timestamp: new Date(),
            endpoint: req.originalUrl,
            requestData: req.body, // Asegúrate de que la solicitud usa express.json() o bodyParser para parsear el body
            responseData: data instanceof Buffer ? data.toString() : data
        };

        // Convertir el objeto logEntry a string para almacenarlo en Redis
        const logString = JSON.stringify(logEntry);

        // Almacenar el log en Redis, usando una lista de Redis
        redisClient.rpush('api_logs', logString, (err) => {
            if (err) {
                console.error('Error al guardar en Redis:', err);
            }
        });
    };

    next();
};

module.exports = logger;
