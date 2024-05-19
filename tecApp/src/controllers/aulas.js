const Aula = require('../models/aula');

// Obtener todas las aulas
exports.getAllAulas = async (req, res) => {
    try {
        const aulas = await Aula.find();
        res.status(200).json(aulas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una aula por ID
exports.getAulaById = async (req, res) => {
    try {
        const aula = await Aula.findById(req.params.id);
        if (!aula) {
            return res.status(404).json({ message: 'Aula no encontrada' });
        }
        res.status(200).json(aula);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear una nueva aula
exports.createAula = async (req, res) => {
    const aula = new Aula(req.body);
    try {
        const savedAula = await aula.save();
        res.status(201).json(savedAula);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar una aula por ID
exports.updateAula = async (req, res) => {
    try {
        const updatedAula = await Aula.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedAula);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar una aula por ID
exports.deleteAula = async (req, res) => {
    try {
        const deletedAula = await Aula.findByIdAndDelete(req.params.id);
        if (!deletedAula) {
            return res.status(404).json({ message: 'Aula no encontrada' });
        }
        res.status(200).json({ message: 'Aula eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
