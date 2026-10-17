
const mongoose = require("mongoose");

// =====================================
// MODELO DE INSCRICOES
// =====================================

const inscricaoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },

  evento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Evento",
    required: true
  },

  status: {
    type: String,
    enum: ["confirmada", "cancelada"],
    default: "confirmada"
  },

  dataInscricao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// =====================================
// IMPEDIR INSCRICOES DUPLICADAS
// =====================================

inscricaoSchema.index(
  { usuario: 1, evento: 1 },
  { unique: true }
);

// =====================================
// EXPORTAR MODELO
// =====================================

module.exports = mongoose.model(
  "Inscricao",
  inscricaoSchema,
  "inscricoes"
);
