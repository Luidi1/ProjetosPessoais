import mongoose from "mongoose";
import ErroValidacao from "../erros/ErroValidacao.js";
import ErroBase from "../erros/ErroBase.js";
import ErroConversaoDeTipo from "../erros/ErroConversaoDeTipo.js"

function manipuladorDeErros(erro, req, res, next) {

  if (erro instanceof SyntaxError && erro.status === 400 && 'body' in erro) {
    return res
      .status(400)
      .json({ mensagem: 'JSON inválido: use aspas duplas em chaves e valores de string.' });
  }
  
  if (erro instanceof mongoose.Error.ValidationError){
    return new ErroValidacao(erro).enviarResposta(res);
  }

  else if (erro instanceof mongoose.Error.CastError) {
    return new ErroConversaoDeTipo(erro).enviarResposta(res);
  }

  else if(erro instanceof ErroBase){
    return erro.enviarResposta(res);
  }

  else{
    return new ErroBase().enviarResposta(res);
  }
}

export default manipuladorDeErros;