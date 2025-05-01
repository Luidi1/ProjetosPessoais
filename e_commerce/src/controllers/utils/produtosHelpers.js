// src/utils/produtosHelpers.js

import produtos from "../../models/Produto.js";
import {
  erroProdutoNaoEncontrado,
  erroPrecoEntreNaoEncontrado,
  erroPrecoMinNaoEncontrado,
  erroPrecoMaxNaoEncontrado,
  erroEstoqueEntreNaoEncontrado,
  erroEstoqueMinNaoEncontrado,
  erroEstoqueMaxNaoEncontrado
} from "../../utils/mensagensErroProduto.js";

// Parâmetros que a função processaBusca aceita
export const PARAMS_PRODUTOS = [
  "nome",
  "minPreco",
  "maxPreco",
  "minEstoque",
  "maxEstoque"
];

export async function verificarFiltroNome(queryParams) {
  const { nome } = queryParams;
  if (!nome) return null; // Se não houver filtro, não retorna erro
  const resultado = await produtos.find({ nome: { $regex: `^${nome}`, $options: "i" } });
  if (resultado.length === 0) {
    return erroProdutoNaoEncontrado(nome);
  }
  return null;
}

export async function verificarFiltroPreco(queryParams) {
  const { minPreco, maxPreco } = queryParams;
  if (!minPreco && !maxPreco) return null; // Se não houver filtro, não retorna erro

  const busca = {};
  if (minPreco) busca.preco = { $gte: Number(minPreco) };
  if (maxPreco) {
    busca.preco = busca.preco || {};
    busca.preco.$lte = Number(maxPreco);
  }

  const resultado = await produtos.find(busca);
  if (resultado.length === 0) {
    if (minPreco && maxPreco) {
      return erroPrecoEntreNaoEncontrado(minPreco, maxPreco);
    } else if (minPreco) {
      return erroPrecoMinNaoEncontrado(minPreco);
    } else {
      return erroPrecoMaxNaoEncontrado(maxPreco);
    }
  }
  return null;
}

export async function verificarFiltroEstoque(queryParams) {
  const { minEstoque, maxEstoque } = queryParams;
  if (!minEstoque && !maxEstoque) return null; // Se não houver filtro, não retorna erro

  const busca = {};
  if (minEstoque) busca.estoque = { $gte: Number(minEstoque) };
  if (maxEstoque) {
    busca.estoque = busca.estoque || {};
    busca.estoque.$lte = Number(maxEstoque);
  }

  const resultado = await produtos.find(busca);
  if (resultado.length === 0) {
    if (minEstoque && maxEstoque) {
      return erroEstoqueEntreNaoEncontrado(minEstoque, maxEstoque);
    } else if (minEstoque) {
      return erroEstoqueMinNaoEncontrado(minEstoque);
    } else {
      return erroEstoqueMaxNaoEncontrado(maxEstoque);
    }
  }
  return null;
}

export async function processaBusca(parametros) {
  const { nome, minPreco, maxPreco, minEstoque, maxEstoque } = parametros;
  const busca = {};

  if (nome) busca.nome = { $regex: `^${nome}`, $options: "i" };

  if (minPreco || maxPreco) busca.preco = {};
  if (minPreco) busca.preco.$gte = Number(minPreco);
  if (maxPreco) busca.preco.$lte = Number(maxPreco);

  if (minEstoque || maxEstoque) busca.estoque = {};
  if (minEstoque) busca.estoque.$gte = Number(minEstoque);
  if (maxEstoque) busca.estoque.$lte = Number(maxEstoque);

  return busca;
}
