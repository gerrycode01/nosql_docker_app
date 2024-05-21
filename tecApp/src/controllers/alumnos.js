// En src/controllers/alumnos.js
const Alumno = require('../models/alumno');
const Materia = require('../models/materia');

// Obtener todos los alumnos
exports.getAllAlumnos = async (req, res) => {
  try {
    const alumnos = await Alumno.find();
    res.status(200).json(alumnos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un alumno por CURP
exports.getAlumnoByCURP = async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ curp: req.params.curp });
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json(alumno);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo alumno
exports.createAlumno = async (req, res) => {
  const alumno = new Alumno(req.body);
  try {
    const savedAlumno = await alumno.save();
    res.status(201).json(savedAlumno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar un alumno por CURP
exports.updateAlumno = async (req, res) => {
  try {
    const updatedAlumno = await Alumno.findOneAndUpdate({ curp: req.params.curp }, req.body, { new: true });
    if (updatedAlumno == null) {
      return res.status(404).json({ message: "No se encontró el alumno" });
    }
    res.status(200).json(updatedAlumno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar un alumno por CURP
exports.deleteAlumno = async (req, res) => {
  try {
    const deletedAlumno = await Alumno.findOneAndDelete({ curp: req.params.curp });
    if (!deletedAlumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json({ message: 'Alumno eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMateriasCursadas = async (req, res) => {
  try {
    const alumnoConMaterias = await Alumno.aggregate([
      // Filtrar para obtener el alumno específico
      { $match: { curp: req.params.curp } },
      // Agregar información sobre las materias
      {
        $lookup: {
          from: Materia.collection.name,
          localField: 'materiasC.id',
          foreignField: 'id',
          as: 'materiasCursadas'
        }
      },
      {
        $project: {
          curp: 1,
          nc: 1,
          nombre: 1,
          carrera: 1,
          tecnologico: 1,
          materiasCursadas: 1
        }
      }
    ]);

    if (alumnoConMaterias.length === 0) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    res.status(200).json(alumnoConMaterias[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las materias cursadas del alumno: " + error.message });
  }
};

// Listar las calificaciones de un alumno en todas sus materias cursadas
exports.getCalificacionesAlumno = async (req, res) => {
  try {
      const { curp } = req.params;

      // Encuentra el alumno y realiza una búsqueda para las materias
      const alumno = await Alumno.findOne({ curp: curp });
      if (!alumno) {
          return res.status(404).json({ message: "Alumno no encontrado" });
      }

      // Extrayendo los IDs de materias cursadas
      const materiasIds = alumno.materiasC.map(m => m.id);

      // Obteniendo la información de las materias con esos IDs
      const materias = await Materia.find({ id: { $in: materiasIds } });

      // Construyendo la respuesta con las calificaciones
      const materiasConCalificaciones = alumno.materiasC.map(mc => {
          const materiaInfo = materias.find(m => m.id === mc.id);
          return {
              materia: materiaInfo,
              calificacion: mc.cal
          };
      });

      res.status(200).json({
          alumno: {
              curp: alumno.curp,
              nombre: alumno.nombre,
              carrera: alumno.carrera,
              materiasCursadas: materiasConCalificaciones
          }
      });
  } catch (error) {
      res.status(500).json({ message: "Error al obtener las calificaciones del alumno: " + error.message });
  }
};

// Listar los alumnos que han obtenido una calificación superior a 90 en una materia específica
exports.getAlumnosCalificacionAlta = async (req, res) => {
  const materiaId = req.params.materiaId;

  try {
      // Encuentra la materia específica por su ID
      const materia = await Materia.findOne({ id: materiaId });
      if (!materia) {
          return res.status(404).json({ message: 'Materia no encontrada' });
      }

      // Encuentra los alumnos con calificaciones superiores a 90 en esa materia
      const alumnos = await Alumno.find({
          materiasC: {
              $elemMatch: { id: materiaId, cal: { $gt: 90 } }
          }
      }, {
          curp: 1,
          nc: 1,
          nombre: 1,
          carrera: 1,
          tecnologico: 1,
          'materiasC.$': 1  // Proyecta solo el elemento coincidente en materiasC
      });

      res.status(200).json({
          materia: materia,
          alumnos: alumnos.map(alumno => ({
              curp: alumno.curp,
              nc: alumno.nc,
              nombre: alumno.nombre,
              carrera: alumno.carrera,
              tecnologico: alumno.tecnologico,
              calificacion: alumno.materiasC[0].cal  // Asumiendo que siempre habrá un elemento coincidente
          }))
      });
  } catch (error) {
      res.status(500).json({ message: "Error al obtener los datos: " + error.message });
  }
};