const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  materia: { id: String },
  docente: { rfc: String },
  alumnos: [{ curp: String }],
  aula: { id: String },
  horario: String
}, { timestamps: true });

module.exports = mongoose.model('Grupo', grupoSchema);
