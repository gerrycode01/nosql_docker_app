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
  materiasP: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
  // Configuración de opciones del esquema: timestamps agrega createdAt y updatedAt automáticamente
  timestamps: true
});

module.exports = mongoose.model('Alumno', alumnoSchema);
