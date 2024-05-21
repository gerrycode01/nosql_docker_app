const { redisClient } = require('../config/db');

module.exports = (req, res, next) => {
  res.on('finish', () => {
    console.log(`Log: Processing ${req.method} ${req.originalUrl}`);  // Log de diagnóstico

    if (!redisClient.isOpen) {
      console.error('Redis client -->> No conectado.');
      return;
    }

    const key = `${req.method}:${Date.now()}:${req.originalUrl}`;
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

    redisClient.set(key, logEntry, 'EX', 60 * 60 * 24, (err) => {
      if (err) {
        console.error('Error al salvar en Redis:', err);
      } else {
        console.log(`Log saved: ${key}`);  // Confirmación de que el log fue guardado
      }
    });
  });

  next();
};
