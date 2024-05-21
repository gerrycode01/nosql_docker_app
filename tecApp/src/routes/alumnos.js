const express = require('express');
const router = express.Router();
const {
    getAllAlumnos,
    getAlumnoByCURP,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    getMateriasCursadas,
    getCalificacionesAlumno,
    getAlumnosCalificacionAlta,
    getMateriasAlumnoConHorario,
    getMateriasPendientes
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

// Ruta para obtener las materias cursadas por un alumno mediante su CURP
router.get('/:curp/materias-cursadas', getMateriasCursadas);

// Ruta para obtener las calificaciones de un alumno
router.get('/:curp/calificaciones', getCalificacionesAlumno);

// Ruta para obtener alumnos por materia con calificaciones superiores a 90
router.get('/calificaciones-altas/:materiaId', getAlumnosCalificacionAlta);

// Ruta para obtener las materias con horarios de un alumno específico
router.get('/:curp/materias-con-horario', getMateriasAlumnoConHorario);

// Ruta para obtener las materias pendientes de un alumno
router.get('/:curp/materias-pendientes', getMateriasPendientes);


module.exports = router;
