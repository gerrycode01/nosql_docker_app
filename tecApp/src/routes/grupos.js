const express = require('express');
const router = express.Router();
const {
    getAllGrupos,
    getGrupoById,
    createGrupo,
    updateGrupo,
    deleteGrupo
} = require('../controllers/grupos');

// Ruta para obtener todos los grupos
router.get('/', getAllGrupos);

// Ruta para obtener un grupo específico por ID
router.get('/:id', getGrupoById);

// Ruta para crear un nuevo grupo
router.post('/', createGrupo);

// Ruta para actualizar un grupo por ID
router.put('/:id', updateGrupo);

// Ruta para eliminar un grupo por ID
router.delete('/:id', deleteGrupo);

module.exports = router;
