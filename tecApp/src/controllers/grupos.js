const Grupo = require('../models/grupo');

// Obtener todos los grupos
exports.getAllGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find().populate('materia docente estudiantes aula');
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un grupo por ID
exports.getGrupoById = async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id).populate('materia docente estudiantes aula');
        if (!grupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }
        res.status(200).json(grupo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear un nuevo grupo
exports.createGrupo = async (req, res) => {
    const grupo = new Grupo(req.body);
    try {
        const savedGrupo = await grupo.save();
        res.status(201).json(savedGrupo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar un grupo por ID
exports.updateGrupo = async (req, res) => {
    try {
        const updatedGrupo = await Grupo.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('materia docente estudiantes aula');
        res.status(200).json(updatedGrupo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar un grupo por ID
exports.deleteGrupo = async (req, res) => {
    try {
        const deletedGrupo = await Grupo.findByIdAndDelete(req.params.id);
        if (!deletedGrupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }
        res.status(200).json({ message: 'Grupo eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
