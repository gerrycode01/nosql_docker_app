const express = require('express');
const router = express.Router();
const {
    getAllMaterias,
    getMateriaById,
    createMateria,
    updateMateria,
    deleteMateria
} = require('../controllers/materias');

// Ruta para obtener todas las materias
router.get('/', getAllMaterias);

// Ruta para obtener una materia específica por ID
router.get('/:id', getMateriaById);

// Ruta para crear una nueva materia
router.post('/', createMateria);

// Ruta para actualizar una materia por ID
router.put('/:id', updateMateria);

// Ruta para eliminar una materia por ID
router.delete('/:id', deleteMateria);

module.exports = router;
