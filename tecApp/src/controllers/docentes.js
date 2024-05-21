const Docente = require('../models/docente');
const Materia = require('../models/materia');
const Grupo = require('../models/grupo');
const Alumno = require('../models/alumno');

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

// Ajustando la consulta para evitar la mezcla de inclusión y exclusión
exports.getMateriasDocenteConAlumnos = async (req, res) => {
    try {
        const rfc = req.params.rfc;
        // Buscar el docente específico por RFC
        const docente = await Docente.findOne({ rfc });
        if (!docente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }

        // Buscar los grupos que este docente imparte
        const grupos = await Grupo.find({ 'docente.rfc': rfc });

        // Recuperar detalles para cada grupo
        const resultados = await Promise.all(grupos.map(async grupo => {
            const materia = await Materia.findOne({ id: grupo.materia.id });
            const alumnos = await Alumno.find({ 'curp': { $in: grupo.alumnos.map(al => al.curp) } })
                                        .select('curp nc nombre carrera tecnologico -_id');  // Solo incluir los campos necesarios
            return {
                materia: materia,
                alumnos: alumnos,
                horario: grupo.horario
            };
        }));

        res.status(200).json({
            docente: {
                rfc: docente.rfc,
                nombre: docente.nombre,
                carrera: docente.carrera,
                tecnologico: docente.tecnologico
            },
            materiasImpartidas: resultados
        });
    } catch (error) {
        res.status(500).json({ message: "Error al procesar la solicitud: " + error.message });
    }
};