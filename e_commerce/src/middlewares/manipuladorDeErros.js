import mongoose from "mongoose";
import ErroValidacao from "../erros/ErroValidacao.js";

function manipuladorDeErros(erro, req, res, next) {
  if (erro instanceof mongoose.Error.ValidationError){
    return new ErroValidacao(erro).enviarResposta(res);
  }

  else if (erro instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `O campo "${erro.path}" recebeu um valor inválido.`
    });
  }

  // Outros erros
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

export default manipuladorDeErros;