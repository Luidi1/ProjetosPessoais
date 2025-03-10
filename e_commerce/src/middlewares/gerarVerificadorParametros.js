import ErroRequisicao from "../erros/ErroRequisicao.js";
import {concatenarItensComVirgulaAndE} from "../utils/formatarMensagens.js";

/**
 * Gera um middleware que verifica se existem parâmetros
 * fora dos arrays passados como argumentos.
 * Exemplo de uso:
 *    router.get("/produtos",
 *      gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_PRODUTOS),
 *      ProdutoController.listarProdutoPorFiltro,
 *      paginar
 *    );
 */
function gerarVerificadorParametros(...listasDeParametros) {
    const todosParametros = new Set();
    for (const lista of listasDeParametros) {
      for (const param of lista) {
        todosParametros.add(param);
      }
    }
  
    return (req, res, next) => {
      const recebidos = Object.keys(req.query);
      const desconhecidos = recebidos.filter(param => !todosParametros.has(param));
  
      if (desconhecidos.length === 1) {
        return next(new ErroRequisicao(
          `O parâmetro {${desconhecidos[0]}} informado não existe.`
        ));
      } else if (desconhecidos.length > 1) {
        // Aqui, usamos a função juntarComE
        const parametrosStr = concatenarItensComVirgulaAndE(desconhecidos.map(p => `${p}`));
        return next(new ErroRequisicao(
          `Os parâmetros {${parametrosStr}} informados não existem.`
        ));
      }
      next();
    };
}
  
export default gerarVerificadorParametros;