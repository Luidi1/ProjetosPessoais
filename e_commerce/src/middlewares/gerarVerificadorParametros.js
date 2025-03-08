import ErroRequisicao from "../erros/ErroRequisicao.js";

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
        const parametrosStr = juntarComE(desconhecidos.map(p => `${p}`));
        return next(new ErroRequisicao(
          `Os parâmetros {${parametrosStr}} informados não existem.`
        ));
      }
      next();
    };
}
  
  // Função auxiliar para formatar array com vírgulas e " e " antes do último
function juntarComE(lista) {
    if (lista.length === 0) return "";
    if (lista.length === 1) return lista[0];
    if (lista.length === 2) return lista.join(" e ");
    
    const ultimo = lista.pop();
    return lista.join(", ") + " e " + ultimo;
}
  
export default gerarVerificadorParametros;