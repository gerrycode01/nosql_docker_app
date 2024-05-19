const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  rfc: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  tecnologico: String,
  materias: [{ id: String }]
}, { timestamps: true });

module.exports = mongoose.model('Docente', docenteSchema);
