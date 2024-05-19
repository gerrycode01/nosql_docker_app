const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  descripcion: String,
  planestudios: String
});

module.exports = mongoose.model('Materia', materiaSchema);
