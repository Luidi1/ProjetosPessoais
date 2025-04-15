import ErroBase from "./erroBase.js";

class ErroCampoDuplicado extends ErroBase {
  constructor(erroCampoDuplicado) {
    super("Erro de campo duplicado", 400);
    this.erroCampoDuplicado = erroCampoDuplicado;
  }

  enviarResposta(res) {
    const campo = Object.keys(this.erroCampoDuplicado.keyPattern)[0];
    const valor = Object.values(this.erroCampoDuplicado.keyValue)[0];

    // Resposta personalizada para e-mail duplicado na coleção de usuários
    if (this.erroCampoDuplicado.message.includes("usuarios") && campo === "email") {
      return res.status(this.status).json({
        mensagem: `Já existe um usuário com o e-mail {${valor}} cadastrado no sistema.`
      });
    }

    // Mensagem genérica para outros campos/coleções
    return res.status(this.status).json({
      mensagem: `Já existe um registro com o valor {${valor}} no campo {${campo}}.`
    });
  }
}

export default ErroCampoDuplicado;
