const { redisClient } = require('../config/db');

module.exports = (req, res, next) => {
  res.on('finish', () => {
    // Verificar si el cliente de Redis está conectado
    if (!redisClient.isOpen) {
      console.error('Redis client -->> No conectado.');
      return;
    }

    // Crear una clave única para cada log
    const key = `${req.method}:${Date.now()}:${req.originalUrl}`;

    // Construir el objeto de entrada del log
    const logEntry = JSON.stringify({
      time: new Date(),
      req: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body
      },
      res: {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      }
    });

    // Guardar el log en Redis con una expiración de 24 horas
    redisClient.set(key, logEntry, 'EX', 60 * 60 * 24, (err) => {
      if (err) {
        console.error('Error al salvar en Redis:', err);
      }
    });
  });

  next();
};
