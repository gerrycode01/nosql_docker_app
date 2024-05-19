const mongoose = require('mongoose');
const redis = require('redis');

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log('Error al conectar con MongoDB:', err));

// Conexión a Redis
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
redisClient.on('connect', () => console.log('Redis conectado'));
redisClient.on('error', (err) => console.error('Error en Redis:', err));

module.exports = { mongoose, redisClient };
