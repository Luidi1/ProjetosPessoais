class ErroConversaoDeTipo extends ErroBase{
    constructor(erroCast){
        super("Erro de conversão de tipo", 400);
        this.erroCast = erroCast;
    }

    enviarResposta(res) {
        return res.status(this.status).json({
          message: `O campo "${this.erroCast.path}" recebeu um valor inválido.`
        });
    }
}