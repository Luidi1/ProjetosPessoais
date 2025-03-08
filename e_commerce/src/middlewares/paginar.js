import ErroRequisicao from "../erros/ErroRequisicao.js";
import formatarMensagens from "../utils/formatarMensagens.js";

export const PARAMS_PAGINACAO = [
    "limite",
    "pagina",
    "ordenacao"
];

async function paginar(req, res, next){
  try {
    let { limite = 5, pagina = 1, ordenacao = "_id:-1" } = req.query;

    // Converte para números
    limite = parseInt(limite);
    pagina = parseInt(pagina);

    let [campoOrdenacao, ordem] = ordenacao.split(":");
    ordem = parseInt(ordem);

    // Cria um array para acumular erros
    const erros = [];

    // Valida "limite"
    if (isNaN(limite) || limite <= 0) {
      erros.push("Valor informado para LIMITE é inválido");
    }
    // Valida "pagina"
    if (isNaN(pagina) || pagina <= 0) {
      erros.push("Valor informado para PÁGINA é inválido");
    }
    // Valida "ordenacao"
    if (!campoOrdenacao || isNaN(ordem) || (ordem !== 1 && ordem !== -1)) {
      erros.push("O formato do parâmetro 'ordenacao' está inválido. Formato esperado: 'ordenacao=campo:1' ou 'ordenacao=campo:-1'");
    } else {
      // Valida se campoOrdenacao existe no modelo
      const resultado = req.resultado;
      const camposPermitidos = Object.keys(resultado.schema.paths);
      if (!camposPermitidos.includes(campoOrdenacao)) {
        erros.push(`Campo de ordenação ${campoOrdenacao} inválido. Campos permitidos: ${camposPermitidos.join(", ")}`);
      }
    }

    // Se houver erros, lance o erro de requisição
    if (erros.length > 0) {
      // Supondo que seu formatarMensagens une com "; " e finaliza com "."
      const mensagemFinal = formatarMensagens(erros);
      return next(new ErroRequisicao(mensagemFinal));
    }

    // Se todas as validações passaram, executa a consulta paginada
    const resultado = req.resultado;
    const resultadoPaginado = await resultado.find()
      .sort({ [campoOrdenacao]: ordem })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .exec();

    res.status(200).json(resultadoPaginado);
  } catch (erro) {
    next(erro);
  }
}

export default paginar;
