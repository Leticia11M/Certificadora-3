
const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    default: ""
  },
  tipo: {
    type: String,
    enum: [
      "Palestra",
      "Minicurso",
      "Oficina",
      "Roda de conversa"
    ],
    default: "Palestra"
  },
  data: {
    type: String,
    required: true
  },
  horario: {
    type: String,
    required: true
  },
  local: {
    type: String,
    required: true
  },
  vagas: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Evento",
  eventoSchema,
  "eventos"
);
