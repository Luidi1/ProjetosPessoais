import ErroBase from "./erroBase.js"

class NaoEncontrado extends ErroBase{
    constructor(mensagem = "Recurso não encontrado.", status = 404){
        super(mensagem, status);
    }
}

export default NaoEncontrado;