# 💜🧡 Meninas Digitais

### Sistema de Gerenciamento de Eventos

Projeto desenvolvido pelo **Grupo 01 — Certificadora de Competências 3**, para apoiar a organização e a participação em eventos do projeto Meninas Digitais da UTFPR.

---

## 🎯 Objetivo

Desenvolver uma aplicação web para cadastrar, divulgar e gerenciar eventos, permitindo a inscrição de participantes e o gerenciamento por administradores.

## ✨ Funcionalidades

| Participantes | Administradores |
|---|---|
| Cadastro e login | Cadastro de eventos |
| Visualização de eventos | Edição de eventos |
| Consulta do perfil | Exclusão de eventos |
| Inscrição em eventos | Controle administrativo |
| Consulta e cancelamento de inscrições | Gerenciamento dos eventos |

**Validações implementadas:** autenticação JWT, controle de acesso, prevenção de inscrições duplicadas e controle de vagas.

## 🛠️ Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | [React](https://react.dev/), [Vite](https://vite.dev/), JavaScript e CSS |
| Backend | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) |
| Banco de dados | [MongoDB](https://www.mongodb.com/try/download/community), [Mongoose](https://mongoosejs.com/) |
| Segurança | [JWT](https://www.npmjs.com/package/jsonwebtoken), [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| Administração do banco | [MongoDB Compass](https://www.mongodb.com/products/tools/compass) |

**Versões:** consulte os arquivos `backend/package.json` e `frontend/package.json` para as versões das dependências. Registre também as versões de Node.js e MongoDB utilizadas no ambiente de execução.

## 📂 Estrutura

```text
Certificadora_3/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Instalação e execução

### 1. Obter o código

```bash
git clone https://github.com/Leticia11M/Certificadora-3.git
cd Certificadora-3
```

### 2. Preparar o banco de dados

Instale e inicie o MongoDB Community Server. A aplicação utiliza o banco local:

```text
mongodb://127.0.0.1:27017/meninas_digitais
```

O banco e as coleções serão utilizados pela aplicação por meio do Mongoose. O MongoDB Compass é opcional para visualizar os registros.

### 3. Iniciar o backend

```bash
cd backend
npm install
```

Crie um arquivo `backend/.env` e configure uma chave secreta própria:

```env
JWT_SECRET=substitua_por_uma_chave_secreta_forte
```

Inicie o servidor:

```bash
npm start
```

Backend: http://localhost:3001

### 4. Iniciar o frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente http://localhost:5173.

**Importante:** MongoDB, backend e frontend devem estar funcionando simultaneamente.

## 🧪 Roteiro de testes

1. Acesse a aplicação pelo navegador.
2. Crie uma conta de participante.
3. Faça login com a conta criada.
4. Acesse a listagem de eventos.
5. Inscreva-se em um evento com vagas disponíveis.
6. Confira a inscrição na tela Minhas inscrições.
7. Tente se inscrever novamente no mesmo evento para verificar o bloqueio de duplicidade.
8. Cancele uma inscrição e confira o resultado.
9. Teste um evento que tenha atingido o limite de vagas.
10. Entre com uma conta de administrador e teste o cadastro, a edição e a exclusão de um evento.

### Contas de acesso

**Participante:** crie uma conta pela tela de cadastro.

**Administrador:** em um ambiente local de testes, um responsável autorizado pode alterar o campo `perfil` de uma conta de teste para `administrador` no MongoDB. Saia da aplicação e faça login novamente para atualizar as permissões.

Não são disponibilizadas senhas reais no repositório.

## 🗃️ Modelagem do banco

- **Usuário:** informações cadastrais e perfil de acesso.
- **Evento:** informações e vagas dos eventos.
- **Inscrição:** vínculo entre participante e evento.

## 🎥 Vídeo de instalação e execução

▶️ **[Assistir ao vídeo de instalação e execução do sistema](https://youtu.be/dppv3sFJ7tY)**

## 👥 Equipe

| Integrante | Área principal |
|---|---|
| Letícia | Banco de dados |
| Gabriel | Backend |
| Leonardo | Frontend |

## 📌 Estado do projeto

Versão de entrega parcial: cadastro, autenticação, gerenciamento de eventos, inscrições, cancelamentos e controle de vagas implementados e integrados.

---

**Projeto acadêmico — UTFPR | Meninas Digitais**
