
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================
// IMPORTAR MODELOS
// =====================================

const Evento = require("./models/Evento");
const Usuario = require("./models/Usuario");
const Inscricao = require("./models/Inscricao");

// =====================================
// IMPORTAR ROTAS
// =====================================

const rotasAuth = require("./routes/auth");
const rotasInscricoes = require("./routes/inscricoes");

// =====================================
// CONFIGURACAO DO SERVIDOR
// =====================================

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.use("/auth", rotasAuth);
app.use("/inscricoes", rotasInscricoes);

// =====================================
// VERIFICAR ADMINISTRADOR
// =====================================

async function verificarAdministrador(req, res, next) {
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

    if (usuario.perfil !== "administrador") {
      return res.status(403).json({
        mensagem: "Acesso permitido apenas a administradores."
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

// =====================================
// VALIDACAO DOS EVENTOS
// =====================================

const camposPermitidos = [
  "nome",
  "descricao",
  "tipo",
  "data",
  "horario",
  "local",
  "vagas"
];

const tiposPermitidos = [
  "Palestra",
  "Minicurso",
  "Oficina",
  "Roda de conversa"
];

function validarDadosEvento(dados, completo = false) {
  if (
    !dados ||
    typeof dados !== "object" ||
    Array.isArray(dados)
  ) {
    return false;
  }

  if (
    Object.keys(dados).some(
      campo => !camposPermitidos.includes(campo)
    )
  ) {
    return false;
  }

  if (
    completo &&
    ["nome", "data", "horario", "local", "vagas"].some(
      campo => dados[campo] === undefined
    )
  ) {
    return false;
  }

  for (const campo of [
    "nome",
    "data",
    "horario",
    "local"
  ]) {
    if (
      dados[campo] !== undefined &&
      (
        typeof dados[campo] !== "string" ||
        !dados[campo].trim()
      )
    ) {
      return false;
    }
  }

  if (
    dados.descricao !== undefined &&
    typeof dados.descricao !== "string"
  ) {
    return false;
  }

  if (
    dados.tipo !== undefined &&
    !tiposPermitidos.includes(dados.tipo)
  ) {
    return false;
  }

  if (
    dados.vagas !== undefined &&
    (
      !Number.isInteger(dados.vagas) ||
      dados.vagas <= 0
    )
  ) {
    return false;
  }

  return true;
}

// =====================================
// VALIDACAO DOS USUARIOS
// =====================================

function validarDadosUsuario(dados) {
  if (
    !dados ||
    typeof dados !== "object" ||
    Array.isArray(dados)
  ) {
    return false;
  }

  if (
    Object.keys(dados).some(
      campo => !["nome", "email", "senha"].includes(campo)
    )
  ) {
    return false;
  }

  const { nome, email, senha } = dados;

  if (
    typeof nome !== "string" ||
    nome.trim().length < 2 ||
    nome.trim().length > 100
  ) {
    return false;
  }

  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return false;
  }

  if (
    typeof senha !== "string" ||
    senha.length < 8 ||
    Buffer.byteLength(senha, "utf8") > 72
  ) {
    return false;
  }

  return true;
}

// =====================================
// TRATAMENTO DE ERROS
// =====================================

function erroServidor(res, erro) {
  console.error(erro);

  return res.status(500).json({
    mensagem: "Erro interno do servidor."
  });
}

// =====================================
// ROTA INICIAL
// =====================================

app.get("/", (req, res) => {
  return res.json({
    mensagem: "Servidor Meninas Digitais funcionando!",
    versao: "5.1",
    status: "online"
  });
});

// =====================================
// LISTAR EVENTOS
// =====================================

app.get("/eventos", async (req, res) => {
  try {
    const eventos = await Evento.find().sort({
      createdAt: -1
    });

    return res.json(eventos);

  } catch (erro) {
    return erroServidor(res, erro);
  }
});

// =====================================
// BUSCAR EVENTO POR ID
// =====================================

app.get("/eventos/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensagem: "ID inválido."
      });
    }

    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({
        mensagem: "Evento não encontrado."
      });
    }

    return res.json(evento);

  } catch (erro) {
    return erroServidor(res, erro);
  }
});

// =====================================
// CADASTRAR EVENTO - ADMINISTRADOR
// =====================================

app.post(
  "/eventos",
  verificarAdministrador,
  async (req, res) => {
    try {
      if (!validarDadosEvento(req.body, true)) {
        return res.status(400).json({
          mensagem: "Dados obrigatórios inválidos."
        });
      }

      const evento = await Evento.create(req.body);

      return res.status(201).json({
        mensagem: "Evento cadastrado com sucesso!",
        evento
      });

    } catch (erro) {
      if (erro.name === "ValidationError") {
        return res.status(400).json({
          mensagem: "Dados inválidos."
        });
      }

      return erroServidor(res, erro);
    }
  }
);

// =====================================
// EDITAR EVENTO - ADMINISTRADOR
// =====================================

app.put(
  "/eventos/:id",
  verificarAdministrador,
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          mensagem: "ID inválido."
        });
      }

      if (
        !validarDadosEvento(req.body) ||
        Object.keys(req.body).length === 0
      ) {
        return res.status(400).json({
          mensagem: "Dados inválidos."
        });
      }

      const evento = await Evento.findByIdAndUpdate(
        id,
        { $set: req.body },
        {
          new: true,
          runValidators: true
        }
      );

      if (!evento) {
        return res.status(404).json({
          mensagem: "Evento não encontrado."
        });
      }

      return res.json({
        mensagem: "Evento atualizado com sucesso!",
        evento
      });

    } catch (erro) {
      if (erro.name === "ValidationError") {
        return res.status(400).json({
          mensagem: "Dados inválidos."
        });
      }

      return erroServidor(res, erro);
    }
  }
);

// =====================================
// EXCLUIR EVENTO - ADMINISTRADOR
// =====================================

app.delete(
  "/eventos/:id",
  verificarAdministrador,
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          mensagem: "ID inválido."
        });
      }

      const evento = await Evento.findByIdAndDelete(id);

      if (!evento) {
        return res.status(404).json({
          mensagem: "Evento não encontrado."
        });
      }

      return res.json({
        mensagem: "Evento excluído com sucesso!",
        evento
      });

    } catch (erro) {
      return erroServidor(res, erro);
    }
  }
);

// =====================================
// CADASTRAR USUARIO
// =====================================

app.post("/usuarios", async (req, res) => {
  try {
    if (!validarDadosUsuario(req.body)) {
      return res.status(400).json({
        mensagem:
          "Informe nome, e-mail válido e senha de pelo menos 8 caracteres."
      });
    }

    const nome = req.body.nome.trim();
    const email = req.body.email.trim().toLowerCase();
    const senha = req.body.senha;

    const usuarioExistente = await Usuario.findOne({
      email
    });

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await Usuario.create({
      nome,
      email,
      senhaHash,
      perfil: "participante"
    });

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });

  } catch (erro) {
    if (erro.code === 11000) {
      return res.status(409).json({
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    if (erro.name === "ValidationError") {
      return res.status(400).json({
        mensagem: "Dados de usuário inválidos."
      });
    }

    return erroServidor(res, erro);
  }
});

// =====================================
// INICIAR BANCO DE DADOS E SERVIDOR
// =====================================

async function iniciarServidor() {
  try {
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "Configure JWT_SECRET no arquivo backend/.env."
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/meninas_digitais"
    );

    await Usuario.init();
    await Inscricao.init();

    console.log("MongoDB conectado com sucesso!");

    app.listen(PORT, () => {
      console.log("=================================");
      console.log("MENINAS DIGITAIS - BACK-END");
      console.log("Versao: 5.1");
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log("Status: funcionando");
      console.log("=================================");
    });

  } catch (erro) {
    console.error(
      "Erro ao iniciar o servidor:",
      erro.message
    );

    process.exit(1);
  }
}

iniciarServidor();
