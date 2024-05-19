require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./middleware/logger');
const { mongoose, redisClient } = require('./config/db');

const app = express();

// Middleware para parsear solicitudes JSON
app.use(express.json());

// Middleware para permitir solicitudes de recursos cruzados
app.use(cors());

// Middleware para registrar solicitudes HTTP
app.use(morgan('dev'));

// Middleware personalizado para registrar solicitudes en Redis
app.use(logger);

//TODO:
// Aquí irán las rutas de tu aplicación
// Ejemplo: app.use('/api/oficinas', require('./routes/oficinas'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
