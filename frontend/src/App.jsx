
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3001";

const eventoVazio = {
  nome: "",
  descricao: "",
  tipo: "Palestra",
  data: "",
  horario: "",
  local: "",
  vagas: ""
};

function formatarData(data) {
  if (!data) return "Não informada";

  const partes = String(data).slice(0, 10).split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function App() {
  const [tela, setTela] = useState("eventos");
  const [token, setToken] = useState("");
  const [usuario, setUsuario] = useState(null);

  const [eventos, setEventos] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  const [login, setLogin] = useState({
    email: "",
    senha: ""
  });

  const [cadastro, setCadastro] = useState({
    nome: "",
    email: "",
    senha: ""
  });

  const [formEvento, setFormEvento] = useState({
    ...eventoVazio
  });

  const [eventoEmEdicao, setEventoEmEdicao] = useState(null);

  const administrador = usuario?.perfil === "administrador";

  function avisar(texto, ehErro = false) {
    setMensagem(texto);
    setErro(ehErro);
  }

  function navegar(destino) {
    avisar("");

    if (
      (destino === "minhas" || destino === "perfil") &&
      !token
    ) {
      setTela("entrar");
      return;
    }

    if (destino === "admin" && !administrador) {
      setTela("eventos");
      return;
    }

    setTela(destino);
    window.scrollTo(0, 0);
  }

  async function requisicao(caminho, opcoes = {}) {
    const headers = { ...opcoes.headers };

    if (opcoes.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let resposta;

    try {
      resposta = await fetch(API + caminho, {
        ...opcoes,
        headers
      });
    } catch {
      throw new Error(
        "Não foi possível conectar ao backend. " +
        "Verifique se o servidor da porta 3001 está ligado."
      );
    }

    const resultado = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        resultado.mensagem || `Erro HTTP ${resposta.status}`
      );
    }

    return resultado;
  }

  async function listarEventos() {
    setCarregando(true);

    try {
      const dados = await requisicao("/eventos");

      if (!Array.isArray(dados)) {
        throw new Error("Resposta inválida do servidor.");
      }

      setEventos(dados);
    } catch (e) {
      avisar(e.message, true);
    } finally {
      setCarregando(false);
    }
  }

  async function listarMinhas() {
    if (!token) return;

    setCarregando(true);

    try {
      const dados = await requisicao("/inscricoes/minhas");

      if (!Array.isArray(dados)) {
        throw new Error("Resposta inválida do servidor.");
      }

      setInscricoes(dados);
    } catch (e) {
      avisar(e.message, true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (tela === "eventos") {
      listarEventos();
    }

    if (tela === "minhas" && token) {
      listarMinhas();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tela, token]);

  async function entrar(e) {
    e.preventDefault();

    setCarregando(true);
    avisar("");

    try {
      const resultado = await requisicao("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: login.email.trim(),
          senha: login.senha
        })
      });

      if (!resultado.token || !resultado.usuario) {
        throw new Error("Resposta de login incompleta.");
      }

      setToken(resultado.token);
      setUsuario(resultado.usuario);
      setLogin({ email: "", senha: "" });

      navegar("eventos");
    } catch (e) {
      avisar(e.message, true);
    } finally {
      setCarregando(false);
    }
  }

  async function criarConta(e) {
    e.preventDefault();

    setCarregando(true);
    avisar("");

    try {
      const resultado = await requisicao("/usuarios", {
        method: "POST",
        body: JSON.stringify({
          nome: cadastro.nome.trim(),
          email: cadastro.email.trim(),
          senha: cadastro.senha
        })
      });

      setCadastro({
        nome: "",
        email: "",
        senha: ""
      });

      setTela("entrar");

      avisar(
        (resultado.mensagem || "Conta criada!") +
        " Agora faça login."
      );
    } catch (e) {
      avisar(e.message, true);
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    setToken("");
    setUsuario(null);
    setInscricoes([]);
    setTela("eventos");
    avisar("");
  }

  async function inscrever(eventoId) {
    if (!token) {
      navegar("entrar");
      return;
    }

    if (!window.confirm("Confirmar inscrição neste evento?")) {
      return;
    }

    try {
      const resultado = await requisicao("/inscricoes", {
        method: "POST",
        body: JSON.stringify({ eventoId })
      });

      window.alert(
        resultado.mensagem || "Inscrição realizada!"
      );

      navegar("minhas");
    } catch (e) {
      window.alert(e.message);
    }
  }

  async function cancelarInscricao(id) {
    if (!window.confirm("Deseja cancelar sua inscrição?")) {
      return;
    }

    try {
      const resultado = await requisicao(
        `/inscricoes/${id}/cancelar`,
        { method: "PATCH" }
      );

      await listarMinhas();

      avisar(
        resultado.mensagem || "Inscrição cancelada."
      );
    } catch (e) {
      avisar(e.message, true);
    }
  }

  function limparFormulario() {
    setFormEvento({ ...eventoVazio });
    setEventoEmEdicao(null);
  }

  function editarEvento(evento) {
    if (!administrador) return;

    setEventoEmEdicao(evento._id);

    setFormEvento({
      nome: evento.nome || "",
      descricao: evento.descricao || "",
      tipo: evento.tipo || "Palestra",
      data: String(evento.data || "").slice(0, 10),
      horario: evento.horario || "",
      local: evento.local || "",
      vagas: evento.vagas ?? ""
    });

    navegar("admin");
  }

  async function salvarEvento(e) {
    e.preventDefault();

    if (!administrador) return;

    setCarregando(true);
    avisar("");

    const dados = {
      ...formEvento,
      nome: formEvento.nome.trim(),
      local: formEvento.local.trim(),
      vagas: Number(formEvento.vagas)
    };

    try {
      const editando = Boolean(eventoEmEdicao);

      const resultado = await requisicao(
        editando
          ? `/eventos/${eventoEmEdicao}`
          : "/eventos",
        {
          method: editando ? "PUT" : "POST",
          body: JSON.stringify(dados)
        }
      );

      limparFormulario();

      avisar(
        resultado.mensagem || "Evento salvo!"
      );
    } catch (e) {
      avisar(e.message, true);
    } finally {
      setCarregando(false);
    }
  }

  async function excluirEvento(id) {
    if (!administrador) return;

    if (
      !window.confirm(
        "Deseja realmente excluir este evento?"
      )
    ) {
      return;
    }

    try {
      const resultado = await requisicao(
        `/eventos/${id}`,
        { method: "DELETE" }
      );

      window.alert(
        resultado.mensagem || "Evento excluído."
      );

      await listarEventos();
    } catch (e) {
      window.alert(e.message);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormEvento(anterior => ({
      ...anterior,
      [campo]: valor
    }));
  }

  return (
    <>
      <header>
        <h1>
          Meninas <span>Digitais</span>
        </h1>

        <p>Sistema de Gerenciamento de Eventos</p>
      </header>

      <nav>
        <button
          className="roxo"
          onClick={() => navegar("eventos")}
        >
          Eventos
        </button>

        {!token && (
          <>
            <button
              className="roxo"
              onClick={() => navegar("entrar")}
            >
              Entrar
            </button>

            <button
              className="roxo"
              onClick={() => navegar("cadastro")}
            >
              Criar conta
            </button>
          </>
        )}

        {token && (
          <>
            <button
              className="roxo"
              onClick={() => navegar("perfil")}
            >
              Meu perfil
            </button>

            <button
              className="roxo"
              onClick={() => navegar("minhas")}
            >
              Minhas inscrições
            </button>
          </>
        )}

        {administrador && (
          <button
            className="roxo"
            onClick={() => navegar("admin")}
          >
            Gerenciar eventos
          </button>
        )}

        {token && (
          <button className="cinza" onClick={sair}>
            Sair
          </button>
        )}
      </nav>

      {usuario && (
        <div id="usuarioAtual">
          Conectado: {usuario.nome} | Perfil: {usuario.perfil}
        </div>
      )}

      <main>
        {mensagem && (
          <p
            className={`mensagem ${
              erro ? "erro" : "sucesso"
            }`}
          >
            {mensagem}
          </p>
        )}

        {/* =====================================
            TELA DE EVENTOS
        ===================================== */}

        {tela === "eventos" && (
          <section>
            <h2>Eventos disponíveis</h2>

            <p>
              Conheça nossas palestras, oficinas e minicursos.
            </p>

            <button
              className="roxo"
              onClick={listarEventos}
            >
              Atualizar eventos
            </button>

            <div className="cards lista-conteudo">
              {carregando && (
                <p>Carregando eventos...</p>
              )}

              {!carregando && eventos.length === 0 && (
                <p>Nenhum evento cadastrado.</p>
              )}

              {!carregando &&
                eventos.map(evento => (
                  <article
                    className="card"
                    key={evento._id}
                  >
                    <span className="tipo">
                      {evento.tipo || "Evento"}
                    </span>

                    <h3>{evento.nome}</h3>

                    {evento.descricao && (
                      <p>{evento.descricao}</p>
                    )}

                    <p>
                      Data: {formatarData(evento.data)}
                    </p>

                    <p>Horário: {evento.horario}</p>
                    <p>Local: {evento.local}</p>
                    <p>Vagas totais: {evento.vagas}</p>

                    <div className="acoes">
                      {token ? (
                        <button
                          onClick={() =>
                            inscrever(evento._id)
                          }
                        >
                          Inscrever-me
                        </button>
                      ) : (
                        <button
                          className="roxo"
                          onClick={() =>
                            navegar("entrar")
                          }
                        >
                          Entrar para se inscrever
                        </button>
                      )}

                      {administrador && (
                        <>
                          <button
                            className="roxo"
                            onClick={() =>
                              editarEvento(evento)
                            }
                          >
                            Editar
                          </button>

                          <button
                            className="vermelho"
                            onClick={() =>
                              excluirEvento(evento._id)
                            }
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        )}

        {/* =====================================
            NOVA TELA: MEU PERFIL
        ===================================== */}

        {tela === "perfil" && usuario && (
          <section>
            <h2>Meu perfil</h2>

            <p>
              Confira as informações da sua conta
              no Meninas Digitais.
            </p>

            <div className="cards lista-conteudo">
              <article className="card">
                <h3>Dados pessoais</h3>

                <p>
                  <strong>Nome:</strong>{" "}
                  {usuario.nome}
                </p>

                <p>
                  <strong>E-mail:</strong>{" "}
                  {usuario.email}
                </p>

                <p>
                  <strong>Tipo de conta:</strong>{" "}
                  {usuario.perfil === "administrador"
                    ? "Administrador"
                    : "Participante"}
                </p>

                <div className="acoes">
                  <button
                    className="roxo"
                    onClick={() =>
                      navegar("eventos")
                    }
                  >
                    Ver eventos
                  </button>

                  <button
                    onClick={() =>
                      navegar("minhas")
                    }
                  >
                    Minhas inscrições
                  </button>
                </div>
              </article>
            </div>
          </section>
        )}

        {/* =====================================
            TELA DE LOGIN
        ===================================== */}

        {tela === "entrar" && (
          <section>
            <h2>Entrar na minha conta</h2>

            <form onSubmit={entrar}>
              <div className="campo">
                <label htmlFor="loginEmail">
                  E-mail
                </label>

                <input
                  id="loginEmail"
                  type="email"
                  required
                  value={login.email}
                  onChange={e =>
                    setLogin({
                      ...login,
                      email: e.target.value
                    })
                  }
                />
              </div>

              <div className="campo">
                <label htmlFor="loginSenha">
                  Senha
                </label>

                <input
                  id="loginSenha"
                  type="password"
                  required
                  value={login.senha}
                  onChange={e =>
                    setLogin({
                      ...login,
                      senha: e.target.value
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
              >
                Entrar
              </button>
            </form>
          </section>
        )}

        {/* =====================================
            TELA DE CADASTRO
        ===================================== */}

        {tela === "cadastro" && (
          <section>
            <h2>Criar conta</h2>

            <form onSubmit={criarConta}>
              <div className="campo">
                <label htmlFor="cadNome">
                  Nome completo
                </label>

                <input
                  id="cadNome"
                  required
                  value={cadastro.nome}
                  onChange={e =>
                    setCadastro({
                      ...cadastro,
                      nome: e.target.value
                    })
                  }
                />
              </div>

              <div className="campo">
                <label htmlFor="cadEmail">
                  E-mail
                </label>

                <input
                  id="cadEmail"
                  type="email"
                  required
                  value={cadastro.email}
                  onChange={e =>
                    setCadastro({
                      ...cadastro,
                      email: e.target.value
                    })
                  }
                />
              </div>

              <div className="campo">
                <label htmlFor="cadSenha">
                  Senha (mínimo 8 caracteres)
                </label>

                <input
                  id="cadSenha"
                  type="password"
                  minLength="8"
                  required
                  value={cadastro.senha}
                  onChange={e =>
                    setCadastro({
                      ...cadastro,
                      senha: e.target.value
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
              >
                Criar conta
              </button>
            </form>
          </section>
        )}

        {/* =====================================
            MINHAS INSCRICOES
        ===================================== */}

        {tela === "minhas" && (
          <section>
            <h2>Minhas inscrições</h2>

            <button
              className="roxo"
              onClick={listarMinhas}
            >
              Atualizar
            </button>

            <div className="cards lista-conteudo">
              {carregando && (
                <p>Carregando inscrições...</p>
              )}

              {!carregando &&
                inscricoes.length === 0 && (
                  <p>
                    Você ainda não tem inscrições.
                  </p>
                )}

              {!carregando &&
                inscricoes.map(inscricao => {
                  const evento = inscricao.evento;

                  return (
                    <article
                      className="card"
                      key={inscricao._id}
                    >
                      <h3>
                        {evento?.nome ||
                          "Evento indisponível"}
                      </h3>

                      <p>
                        Status: {inscricao.status}
                      </p>

                      {evento && (
                        <>
                          <p>
                            Data:{" "}
                            {formatarData(
                              evento.data
                            )}
                          </p>

                          <p>
                            Horário: {evento.horario}
                          </p>

                          <p>
                            Local: {evento.local}
                          </p>
                        </>
                      )}

                      {inscricao.status ===
                        "confirmada" && (
                        <button
                          className="vermelho"
                          onClick={() =>
                            cancelarInscricao(
                              inscricao._id
                            )
                          }
                        >
                          Cancelar inscrição
                        </button>
                      )}
                    </article>
                  );
                })}
            </div>
          </section>
        )}

        {/* =====================================
            AREA ADMINISTRATIVA
        ===================================== */}

        {tela === "admin" && administrador && (
          <section>
            <h2>
              {eventoEmEdicao
                ? "Editar evento"
                : "Cadastrar evento"}
            </h2>

            <p className="aviso">
              Área administrativa. Somente
              administradores podem cadastrar,
              editar ou excluir eventos.
            </p>

            <form onSubmit={salvarEvento}>
              <div className="grade">
                <div className="campo total">
                  <label htmlFor="nome">
                    Nome do evento
                  </label>

                  <input
                    id="nome"
                    required
                    value={formEvento.nome}
                    onChange={e =>
                      atualizarCampo(
                        "nome",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="campo total">
                  <label htmlFor="descricao">
                    Descrição
                  </label>

                  <textarea
                    id="descricao"
                    value={formEvento.descricao}
                    onChange={e =>
                      atualizarCampo(
                        "descricao",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="tipo">
                    Tipo de evento
                  </label>

                  <select
                    id="tipo"
                    value={formEvento.tipo}
                    onChange={e =>
                      atualizarCampo(
                        "tipo",
                        e.target.value
                      )
                    }
                  >
                    <option>Palestra</option>
                    <option>Minicurso</option>
                    <option>Oficina</option>
                    <option>Roda de conversa</option>
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="vagas">
                    Quantidade de vagas
                  </label>

                  <input
                    id="vagas"
                    type="number"
                    min="1"
                    required
                    value={formEvento.vagas}
                    onChange={e =>
                      atualizarCampo(
                        "vagas",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="data">
                    Data
                  </label>

                  <input
                    id="data"
                    type="date"
                    required
                    value={formEvento.data}
                    onChange={e =>
                      atualizarCampo(
                        "data",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="horario">
                    Horário
                  </label>

                  <input
                    id="horario"
                    type="time"
                    required
                    value={formEvento.horario}
                    onChange={e =>
                      atualizarCampo(
                        "horario",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="campo total">
                  <label htmlFor="local">
                    Local
                  </label>

                  <input
                    id="local"
                    required
                    value={formEvento.local}
                    onChange={e =>
                      atualizarCampo(
                        "local",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="acoes">
                <button
                  type="submit"
                  disabled={carregando}
                >
                  {eventoEmEdicao
                    ? "Salvar alterações"
                    : "Cadastrar evento"}
                </button>

                {eventoEmEdicao && (
                  <button
                    type="button"
                    className="cinza"
                    onClick={() => {
                      limparFormulario();
                      avisar(
                        "Edição cancelada."
                      );
                    }}
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </main>

      <footer>
        Meninas Digitais | Sistema de
        Gerenciamento de Eventos
      </footer>
    </>
  );
}

export default App;
