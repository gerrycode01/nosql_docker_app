const Alumno = require('../models/alumno');

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
