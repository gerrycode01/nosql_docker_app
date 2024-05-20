const Grupo = require('../models/grupo');
const Alumno = require('../models/alumno');

// Obtener todos los grupos
exports.getAllGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find().populate('materia docente alumnos aula');
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un grupo por ID
exports.getGrupoById = async (req, res) => {
    try {
        const grupo = await Grupo.findOne({ id: req.params.id }).populate('materia docente alumnos aula');
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
        const updatedGrupo = await Grupo.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).populate('materia docente alumnos aula');
        res.status(200).json(updatedGrupo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar un grupo por ID
exports.deleteGrupo = async (req, res) => {
    try {
        const deletedGrupo = await Grupo.findOneAndDelete({ id: req.params.id });
        if (!deletedGrupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }
        res.status(200).json({ message: 'Grupo eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAlumnosPorMateriaGrupo = async (req, res) => {
    try {
        // Supongamos que `materiaId` y `grupoId` son pasados como parte del request
        const { materiaId, grupoId } = req.params;

        // Encuentra el grupo que coincide con el grupoId y materiaId
        const grupo = await Grupo.findOne({ id: grupoId, 'materia.id': materiaId });

        if (!grupo) {
            return res.status(404).json({ message: 'Grupo con la materia especificada no encontrado' });
        }

        // Ahora, obtener detalles de los alumnos
        const alumnosCurp = grupo.alumnos.map(est => est.curp); // Asume que alumnos es una lista de objetos con id
        const alumnos = await Alumno.find({ 'curp': { $in: alumnosCurp } });

        res.status(200).json({
            grupo: grupoId,
            materia: materiaId,
            alumnos: alumnos
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
