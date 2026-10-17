
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  senhaHash: {
    type: String,
    required: true,
    select: false
  },

  perfil: {
    type: String,
    enum: ["participante", "administrador"],
    default: "participante"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Usuario",
  usuarioSchema,
  "usuarios"
);
