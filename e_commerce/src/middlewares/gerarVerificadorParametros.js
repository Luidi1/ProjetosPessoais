import ErroRequisicao from "../erros/ErroRequisicao.js";
import { concatenarItensComVirgulaAndE } from "../utils/formatarMensagens.js";
import {
  erroParamDuplicado,
  erroParamInexistente,
  erroParamsInexistentes,
  erroFormatoData,
  erroIntervaloData
} from "../utils/mensagensErroUsuario.js";

function gerarVerificadorParametros(...listasDeParametros) {
  const todosParametros = new Set(listasDeParametros.flat());
  const validArray     = Array.from(todosParametros);
  const validParamsStr = concatenarItensComVirgulaAndE(validArray);

  return (req, res, next) => {
    // 0) Duplicados
    for (const [param, valor] of Object.entries(req.query)) {
      if (Array.isArray(valor)) {
        return next(new ErroRequisicao(erroParamDuplicado(param)));
      }
    }

    // 1) Inexistentes
    const recebidos     = Object.keys(req.query);
    const desconhecidos = recebidos.filter(p => !todosParametros.has(p));

    if (desconhecidos.length === 1) {
      return next(new ErroRequisicao(
        erroParamInexistente(desconhecidos[0], validParamsStr)
      ));
    } else if (desconhecidos.length > 1) {
      const invalidStr = concatenarItensComVirgulaAndE(desconhecidos);
      return next(new ErroRequisicao(
        erroParamsInexistentes(invalidStr, validParamsStr)
      ));
    }

    // 2) Formato de datas
    const formatoMsg = "AAAA-MM-DD";
    const isoDateRE  = /^\d{4}-\d{2}-\d{2}$/;
    for (const param of ["minData_nascimento","maxData_nascimento"]) {
      const valor = req.query[param];
      if (valor !== undefined && (!isoDateRE.test(valor) || isNaN(Date.parse(valor)))) {
        return next(new ErroRequisicao(erroFormatoData(param)));
      }
    }

    // 3) Min > Max
    const min = req.query.minData_nascimento;
    const max = req.query.maxData_nascimento;
    if (min && max && new Date(min) > new Date(max)) {
      return next(new ErroRequisicao(erroIntervaloData()));
    }

    next();
  };
}

export default gerarVerificadorParametros;
