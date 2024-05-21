const express = require('express');
const router = express.Router();
const {
    getAllDocentes,
    getDocenteByRFC,
    createDocente,
    updateDocente,
    deleteDocente,
    getMateriaConDocentes
} = require('../controllers/docentes');

// Ruta para obtener todos los docentes
router.get('/', getAllDocentes);

// Ruta para obtener un docente específico por RFC
router.get('/:rfc', getDocenteByRFC);

// Ruta para crear un nuevo docente
router.post('/', createDocente);

// Ruta para actualizar un docente por RFC
router.put('/:rfc', updateDocente);

// Ruta para eliminar un docente por RFC
router.delete('/:rfc', deleteDocente);

// Ruta para obtener una materia con sus docentes
router.get('/:materiaId/detalles', getMateriaConDocentes);

module.exports = router;
