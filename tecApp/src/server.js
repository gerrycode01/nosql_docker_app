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

const alumnosRoutes = require('./routes/alumnos');
const materiasRoutes = require('./routes/materias');
const aulasRoutes = require('./routes/aulas');
const docentesRoutes = require('./routes/docentes');
const gruposRoutes = require('./routes/grupos');

app.use('/api/alumnos', alumnosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/docentes', docentesRoutes);
app.use('/api/grupos', gruposRoutes);

// Agregar esto en tu archivo server.js o donde configures tus rutas
app.get('/', (req, res) => {
  res.send('Bienvenido a mi aplicación!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
