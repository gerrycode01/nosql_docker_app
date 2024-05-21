const Docente = require('../models/docente');
const Materia = require('../models/materia');
const Grupo = require('../models/grupo');

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

// Listar detalles de una materia y los docentes que la imparten
exports.getMateriaConDocentes = async (req, res) => {
    const materiaId = req.params.materiaId;

    try {
        // Primero, encontrar la materia específica por su ID
        const materia = await Materia.findOne({ id: materiaId });
        if (!materia) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }

        // Segundo, encontrar todos los docentes que imparten esa materia
        const docentes = await Docente.find({ 'materias.id': materiaId })
            .select('-materias');  // Excluyendo el campo 'materias'

        // Construir el resultado combinando los datos de la materia con los docentes
        const resultado = {
            materia: materia,
            docentes: docentes.map(doc => ({
                rfc: doc.rfc,
                nombre: doc.nombre,
                carrera: doc.carrera,
                tecnologico: doc.tecnologico
                // puedes agregar más campos según necesites
            }))
        };

        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos: ' + error.message });
    }
};

// Listar las materias que imparte un docente específico, y los alumnos en esas materias
exports.getMateriasDocenteConAlumnos = async (req, res) => {
    try {
        const rfc = req.params.rfc;
        const docente = await Docente.findOne({ rfc: rfc }).select('-materias');
        if (!docente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }

        // Obtener todos los grupos donde este docente imparte clases
        const grupos = await Grupo.find({ 'docente.rfc': rfc }).populate({
            path: 'alumnos.curp',
            select: 'curp nc nombre carrera tecnologico -_id'  // Suponiendo que estos son los campos en el modelo Alumno
        });

        // Mapear los IDs de materias de estos grupos para obtener detalles de las materias
        const materiasIds = grupos.map(grupo => grupo.materia.id);
        const materias = await Materia.find({ id: { $in: materiasIds } });

        // Crear una lista de materias con detalles de los alumnos inscritos
        const materiasConAlumnos = materias.map(materia => {
            const gruposMateria = grupos.filter(gr => gr.materia.id === materia.id);
            const alumnos = gruposMateria.flatMap(gr => gr.alumnos);  // Aplanar la lista de alumnos de todos los grupos de esta materia
            return {
                id: materia.id,
                nombre: materia.nombre,
                descripcion: materia.descripcion,
                carrera: materia.carrera,
                planestudios: materia.planestudios,
                alumnos: alumnos
            };
        });

        res.status(200).json({
            docente: {
                rfc: docente.rfc,
                nombre: docente.nombre,
                carrera: docente.carrera,
                tecnologico: docente.tecnologico
            },
            materias: materiasConAlumnos
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las materias y alumnos: " + error.message });
    }
};