const Docente = require('../models/docente');

// Obtener todos los docentes
exports.getAllDocentes = async (req, res) => {
    try {
        const docentes = await Docente.find();
        res.status(200).json(docentes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un docente por RFC
exports.getDocenteByRFC = async (req, res) => {
    try {
        const docente = await Docente.findOne({ rfc: req.params.rfc });
        if (!docente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }
        res.status(200).json(docente);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear un nuevo docente
exports.createDocente = async (req, res) => {
    const docente = new Docente(req.body);
    try {
        const savedDocente = await docente.save();
        res.status(201).json(savedDocente);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar un docente por RFC
exports.updateDocente = async (req, res) => {
    try {
        const updatedDocente = await Docente.findOneAndUpdate({ rfc: req.params.rfc }, req.body, { new: true });
        res.status(200).json(updatedDocente);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar un docente por RFC
exports.deleteDocente = async (req, res) => {
    try {
        const deletedDocente = await Docente.findOneAndDelete({ rfc: req.params.rfc });
        if (!deletedDocente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }
        res.status(200).json({ message: 'Docente eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
