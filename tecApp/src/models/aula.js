const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  edificio: String,
  grupos: [{ id: String }],
  descripcion: String
}, { timestamps: true });

module.exports = mongoose.model('Aula', aulaSchema);
