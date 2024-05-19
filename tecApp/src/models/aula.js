const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema({
  idaula: { type: String, required: true, unique: true },
  edificio: String,
  grupos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' }],
  descripcion: String
});

module.exports = mongoose.model('Aula', aulaSchema);
