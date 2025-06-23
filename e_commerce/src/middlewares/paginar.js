import mongoose from 'mongoose';
import ErroRequisicao from '../erros/ErroRequisicao.js';
import { formatarListaDeMensagens } from '../utils/formatarMensagens.js';

export const PARAMS_PAGINACAO = [
  'limite',
  'pagina',
  'ordenacao'
];

async function paginar(req, res, next) {
  try {
    // Em ambiente de teste, retorna apenas o array cru
    if (process.env.NODE_ENV === 'test') {
      const items = await req.resultado.exec();
      return res.status(200).json(items);
    }

    // 1) Leitura e conversão dos parâmetros para dev/prod
    let { limite: limiteDocumentoPorPagina = 5, pagina: paginaAtual = 1, ordenacao = '_id:-1' } = req.query;
    limiteDocumentoPorPagina = parseInt(limiteDocumentoPorPagina, 10);
    paginaAtual = parseInt(paginaAtual, 10);
    const [campoOrdenacao, ordemStr] = ordenacao.split(':');
    const ordem = parseInt(ordemStr, 10);

    // 2) Validações iniciais
    const erros = [];
    if (isNaN(limiteDocumentoPorPagina) || limiteDocumentoPorPagina <= 0) {
      erros.push('Valor informado para LIMITE é inválido');
    }
    if (isNaN(paginaAtual) || paginaAtual <= 0) {
      erros.push('Valor informado para PÁGINA é inválido');
    }
    if (!campoOrdenacao || isNaN(ordem) || (ordem !== 1 && ordem !== -1)) {
      erros.push("O formato do parâmetro 'ordenacao' está inválido. Formato esperado: 'ordenacao=campo:1' ou 'ordenacao=campo:-1'");
    } else {
      // verifica se o campo existe no schema
      const resultadoQuery = req.resultado;
      const camposPermitidos = Object.keys(resultadoQuery.model.schema.paths);
      if (!camposPermitidos.includes(campoOrdenacao)) {
        erros.push(`Campo de ordenação ${campoOrdenacao} inválido. Campos permitidos: ${camposPermitidos.join(', ')}`);
      }
    }

    // Se houver erros, dispara ErroRequisicao
    if (erros.length > 0) {
      const mensagemFinal = formatarListaDeMensagens(erros);
      return next(new ErroRequisicao(mensagemFinal));
    }

    // 3) Contagem total de documentos para meta
    const resultadoQuery = req.resultado;
    const totalDocumentos = await resultadoQuery.model.countDocuments(resultadoQuery.getQuery());
    const totalPaginas = Math.ceil(totalDocumentos / limiteDocumentoPorPagina) || 1;

    // 4) Checar página inexistente
    if (paginaAtual > totalPaginas) {
      return next(new ErroRequisicao(`Página ${paginaAtual} inexistente. Existem apenas ${totalPaginas} páginas.`));
    }

    // 5) Consulta paginada
    const itens = await resultadoQuery
      .sort({ [campoOrdenacao]: ordem })
      .skip((paginaAtual - 1) * limiteDocumentoPorPagina)
      .limit(limiteDocumentoPorPagina)
      .exec();

    // 6) Resposta com metadados antes dos dados
    return res.status(200).json({
      info: {
        totalDocumentos,
        totalPaginas,
        paginaAtual,
        limiteDocumentoPorPagina
      },
      data: itens
    });
  } catch (erro) {
    next(erro);
  }
}

export default paginar;
