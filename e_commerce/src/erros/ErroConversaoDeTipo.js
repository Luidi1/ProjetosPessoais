import ErroBase from "./ErroBase.js";

class ErroConversaoDeTipo extends ErroBase{
    constructor(erroCast){
        super("Erro de conversão de tipo", 400);
        this.erroCast = erroCast;
    }

    enviarResposta(res) {
        return res.status(this.status).json({
          mensagem: `O campo {${this.erroCast.path}} recebeu um valor inválido.`
        });
    }
}

export default ErroConversaoDeTipo;