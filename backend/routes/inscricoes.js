
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Evento = require("../models/Evento");
const Usuario = require("../models/Usuario");
const Inscricao = require("../models/Inscricao");

const router = express.Router();

// =====================================
// VERIFICAR SE O USUARIO ESTA LOGADO
// =====================================

async function verificarLogin(req, res, next) {
  try {
    const autorizacao = req.headers.authorization || "";
    const partes = autorizacao.split(" ");

    if (
      partes.length !== 2 ||
      partes[0] !== "Bearer" ||
      !partes[1]
    ) {
      return res.status(401).json({
        mensagem: "Faça login para continuar."
      });
    }

    const dados = jwt.verify(
      partes[1],
      process.env.JWT_SECRET
    );

    if (!mongoose.isValidObjectId(dados.id)) {
      return res.status(401).json({
        mensagem: "Token inválido."
      });
    }

    const usuario = await Usuario.findById(dados.id);

    if (!usuario) {
      return res.status(401).json({
        mensagem: "Usuário não encontrado."
      });
    }

    req.usuario = usuario;
    next();
  } catch (erro) {
    return res.status(401).json({
      mensagem: "Login inválido ou expirado."
    });
  }
}

// Todas as rotas abaixo exigem login.
router.use(verificarLogin);

// =====================================
// REALIZAR INSCRICAO
// =====================================

router.post("/", async (req, res) => {
  try {
    const { eventoId } = req.body || {};

    if (!mongoose.isValidObjectId(eventoId)) {
      return res.status(400).json({
        mensagem: "ID do evento inválido."
      });
    }

    const evento = await Evento.findById(eventoId);

    if (!evento) {
      return res.status(404).json({
        mensagem: "Evento não encontrado."
      });
    }

    const inscricaoExistente = await Inscricao.findOne({
      usuario: req.usuario._id,
      evento: evento._id
    });

    if (
      inscricaoExistente &&
      inscricaoExistente.status === "confirmada"
    ) {
      return res.status(409).json({
        mensagem: "Você já está inscrito neste evento."
      });
    }

    const quantidadeInscritos =
      await Inscricao.countDocuments({
        evento: evento._id,
        status: "confirmada"
      });

    if (quantidadeInscritos >= evento.vagas) {
      return res.status(409).json({
        mensagem: "Não há vagas disponíveis."
      });
    }

    let inscricao;

    if (inscricaoExistente) {
      inscricaoExistente.status = "confirmada";
      inscricaoExistente.dataInscricao = new Date();

      inscricao = await inscricaoExistente.save();
    } else {
      inscricao = await Inscricao.create({
        usuario: req.usuario._id,
        evento: evento._id,
        status: "confirmada"
      });
    }

    return res.status(201).json({
      mensagem: "Inscrição realizada com sucesso!",
      inscricao
    });
  } catch (erro) {
    if (erro.code === 11000) {
      return res.status(409).json({
        mensagem: "Já existe uma inscrição neste evento."
      });
    }

    console.error("Erro ao inscrever:", erro);

    return res.status(500).json({
      mensagem: "Erro ao realizar inscrição."
    });
  }
});

// =====================================
// CONSULTAR MINHAS INSCRICOES
// =====================================

router.get("/minhas", async (req, res) => {
  try {
    const inscricoes = await Inscricao.find({
      usuario: req.usuario._id
    })
      .populate(
        "evento",
        "nome descricao tipo data horario local vagas"
      )
      .sort({ createdAt: -1 });

    return res.json(inscricoes);
  } catch (erro) {
    console.error("Erro ao consultar inscrições:", erro);

    return res.status(500).json({
      mensagem: "Erro ao consultar inscrições."
    });
  }
});

// =====================================
// CANCELAR INSCRICAO
// =====================================

router.patch("/:id/cancelar", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensagem: "ID da inscrição inválido."
      });
    }

    const inscricao = await Inscricao.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!inscricao) {
      return res.status(404).json({
        mensagem: "Inscrição não encontrada."
      });
    }

    if (inscricao.status === "cancelada") {
      return res.status(409).json({
        mensagem: "Esta inscrição já foi cancelada."
      });
    }

    inscricao.status = "cancelada";
    await inscricao.save();

    return res.json({
      mensagem: "Inscrição cancelada com sucesso!",
      inscricao
    });
  } catch (erro) {
    console.error("Erro ao cancelar inscrição:", erro);

    return res.status(500).json({
      mensagem: "Erro ao cancelar inscrição."
    });
  }
});

// =====================================
// EXPORTAR AS ROTAS
// =====================================

module.exports = router;
