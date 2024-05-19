const express = require('express');
const router = express.Router();
const {
    getAllAulas,
    getAulaById,
    createAula,
    updateAula,
    deleteAula
} = require('../controllers/aulas');

// Ruta para obtener todas las aulas
router.get('/', getAllAulas);

// Ruta para obtener una aula específica por ID
router.get('/:id', getAulaById);

// Ruta para crear una nueva aula
router.post('/', createAula);

// Ruta para actualizar una aula por ID
router.put('/:id', updateAula);

// Ruta para eliminar una aula por ID
router.delete('/:id', deleteAula);

module.exports = router;
