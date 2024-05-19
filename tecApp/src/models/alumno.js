const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  curp: { type: String, required: true, unique: true },
  nc: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  tecnologico: String,
  materiasC: [{
    materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia' },
    calificacion: Number
  }],
  materiasA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
  materiasP: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }]
}, { timestamps: true });

module.exports = mongoose.model('Alumno', alumnoSchema);
