const Materia = require('../models/materia');

// Obtener todas las materias
exports.getAllMaterias = async (req, res) => {
    try {
        const materias = await Materia.find();
        res.status(200).json(materias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una materia por ID
exports.getMateriaById = async (req, res) => {
    try {
        const materia = await Materia.findById(req.params.id);
        if (!materia) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }
        res.status(200).json(materia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear una nueva materia
exports.createMateria = async (req, res) => {
    const materia = new Materia(req.body);
    try {
        const savedMateria = await materia.save();
        res.status(201).json(savedMateria);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar una materia por ID
exports.updateMateria = async (req, res) => {
    try {
        const updatedMateria = await Materia.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedMateria);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar una materia por ID
exports.deleteMateria = async (req, res) => {
    try {
        const deletedMateria = await Materia.findByIdAndDelete(req.params.id);
        if (!deletedMateria) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }
        res.status(200).json({ message: 'Materia eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
