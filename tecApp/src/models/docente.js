const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  rfc: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  tecnologico: String,
  materias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }]
});

module.exports = mongoose.model('Docente', docenteSchema);
