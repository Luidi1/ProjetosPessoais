import produtos from "../../models/Produto.js";

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
    const resultado = await produtos.find({ nome: { $regex: nome, $options: "i" } });
    if (resultado.length === 0) {
      return `Nenhum produto com o NOME igual a '${nome.toUpperCase()}' encontrado.`;
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
      return `Nenhum produto com PREÇO entre ${minPreco} e ${maxPreco} encontrado.`;
    } else if (minPreco) {
      return `Nenhum produto com PREÇO MÍNIMO igual a ${minPreco} encontrado.`;
    } else if (maxPreco) {
      return `Nenhum produto com PREÇO MÁXIMO igual a ${maxPreco} encontrado.`;
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
      return `Nenhum produto com ESTOQUE entre ${minEstoque} e ${maxEstoque} encontrado.`;
    } else if (minEstoque) {
      return `Nenhum produto com ESTOQUE MÍNIMO igual a ${minEstoque} encontrado.`;
    } else if (maxEstoque) {
      return `Nenhum produto com ESTOQUE MÁXIMO igual a ${maxEstoque} encontrado.`;
    }
  }
  return null;
}

export async function processaBusca(parametros){
    const {nome, minPreco, maxPreco, minEstoque, maxEstoque} = parametros;

    const busca = {};

    if(nome) busca.nome = {$regex: nome, $options: "i"};

    if(minPreco || maxPreco) busca.preco = {};

    if(minPreco) busca.preco.$gte = minPreco;
    if(maxPreco) busca.preco.$lte = maxPreco;

    if(minEstoque || maxEstoque) busca.estoque = {};

    if(minEstoque) busca.estoque.$gte = minEstoque;
    if(maxEstoque) busca.estoque.$lte = maxEstoque;

    return busca;

}