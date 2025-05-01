// src/utils/usuariosHelpers.js

import Usuario from "../../models/Usuario.js";
import { concatenarItensComVirgulaAndE } from "../../utils/formatarMensagens.js";
import {
  erroNomeNaoEncontrado,
  erroEmailNaoEncontrado,
  erroDataNascimentoEntreNaoEncontrado,
  erroDataNascimentoMinNaoEncontrado,
  erroDataNascimentoMaxNaoEncontrado,
  erroPerfilInexistente,
  erroPerfilNaoEncontrado
} from "../../utils/mensagensErroUsuario.js";

// Parâmetros que a função processaBusca aceita
export const PARAMS_USUARIOS = [
  "nome",
  "email",
  "minData_nascimento",
  "maxData_nascimento",
  "perfil"
];

// Lista de perfis que o sistema reconhece
const PERFIS_VALIDOS = ["cliente", "administrador", "admin"];

export async function verificarFiltroNome(queryParams) {
  const { nome } = queryParams;
  if (!nome) return null;
  const resultado = await Usuario.find({ nome: { $regex: `^${nome}`, $options: "i" } });
  if (resultado.length === 0) {
    return erroNomeNaoEncontrado(nome);
  }
  return null;
}

export async function verificarFiltroEmail(queryParams) {
  const { email } = queryParams;
  if (!email) return null;
  const resultado = await Usuario.find({ email: { $regex: `^${email}`, $options: "i" } });
  if (resultado.length === 0) {
    return erroEmailNaoEncontrado(email);
  }
  return null;
}

export async function verificarFiltroData_nascimento(queryParams) {
  const { minData_nascimento, maxData_nascimento } = queryParams;
  if (!minData_nascimento && !maxData_nascimento) return null;

  const busca = {};
  if (minData_nascimento) {
    busca.data_nascimento = { $gte: new Date(minData_nascimento) };
  }
  if (maxData_nascimento) {
    busca.data_nascimento = busca.data_nascimento || {};
    busca.data_nascimento.$lte = new Date(maxData_nascimento);
  }

  const resultado = await Usuario.find(busca);
  if (resultado.length === 0) {
    if (minData_nascimento && maxData_nascimento) {
      return erroDataNascimentoEntreNaoEncontrado(minData_nascimento, maxData_nascimento);
    } else if (minData_nascimento) {
      return erroDataNascimentoMinNaoEncontrado(minData_nascimento);
    } else {
      return erroDataNascimentoMaxNaoEncontrado(maxData_nascimento);
    }
  }
  return null;
}

export async function verificarFiltroPerfil(queryParams) {
  const { perfil } = queryParams;
  if (!perfil) return null;

  if (!PERFIS_VALIDOS.includes(perfil)) {
    const perfisStr = concatenarItensComVirgulaAndE(PERFIS_VALIDOS);
    return erroPerfilInexistente(perfil, perfisStr);
  }

  const resultado = await Usuario.find({ perfil });
  if (resultado.length === 0) {
    return erroPerfilNaoEncontrado(perfil);
  }
  return null;
}

export async function processaBusca(parametros) {
  const { nome, email, minData_nascimento, maxData_nascimento, perfil } = parametros;
  const busca = {};

  if (nome) busca.nome = { $regex: `^${nome}`, $options: "i" };
  if (email) busca.email = { $regex: `^${email}`, $options: "i" };

  if (minData_nascimento || maxData_nascimento) {
    busca.data_nascimento = {};
    if (minData_nascimento) busca.data_nascimento.$gte = minData_nascimento;
    if (maxData_nascimento) busca.data_nascimento.$lte = maxData_nascimento;
  }

  if (perfil) busca.perfil = perfil;

  return busca;
}
