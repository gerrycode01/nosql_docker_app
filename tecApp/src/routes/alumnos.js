const express = require('express');
const router = express.Router();
const {
    getAllAlumnos,
    getAlumnoByCURP,
    createAlumno,
    updateAlumno,
    deleteAlumno
} = require('../controllers/alumnos');

// Ruta para obtener todos los alumnos
router.get('/', getAllAlumnos);

// Ruta para obtener un alumno específico por CURP
router.get('/:curp', getAlumnoByCURP);

// Ruta para crear un nuevo alumno
router.post('/', createAlumno);

// Ruta para actualizar un alumno por CURP
router.put('/:curp', updateAlumno);

// Ruta para eliminar un alumno por CURP
router.delete('/:curp', deleteAlumno);

module.exports = router;
