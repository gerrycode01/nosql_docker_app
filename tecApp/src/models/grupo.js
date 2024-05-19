const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
  materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia' },
  docente: { type: mongoose.Schema.Types.ObjectId, ref: 'Docente' },
  estudiantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alumno' }],
  aula: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula' },
  horario: String,
  timestamps: true
});

module.exports = mongoose.model('Grupo', grupoSchema);
