const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  curp: { type: String, required: true, unique: true },
  nc: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  tecnologico: String,
  materiasC: [{
    id: String,  // Utilizando un identificador personalizado
    cal: Number
  }],
  materiasA: [{ id: String }],  // Utilizando un identificador personalizado
  materiasP: [{ id: String }]  // Utilizando un identificador personalizado
}, { timestamps: true });

module.exports = mongoose.model('Alumno', alumnoSchema);
