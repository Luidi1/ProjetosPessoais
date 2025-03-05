import ErroBase from "./erroBase.js";

class ErroRequisicao extends ErroBase{
    constructor(mensagem = "Erro na requisição.", status = 400){
        super(mensagem, status);
    }
}

export default ErroRequisicao;