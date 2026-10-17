
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");

const router = express.Router();

// LOGIN DE PARTICIPANTES E ADMINISTRADORES

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      return res.status(400).json({
        mensagem: "Informe e-mail e senha."
      });
    }

    const usuario = await Usuario.findOne({
      email: email.trim().toLowerCase()
    }).select("+senhaHash");

    if (!usuario) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senhaHash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const token = jwt.sign(
      { id: usuario._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });

  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      mensagem: "Erro interno do servidor."
    });
  }
});

module.exports = router;
