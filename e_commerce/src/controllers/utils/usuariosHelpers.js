import Usuario from "../../models/Usuario.js";

// Parâmetros que a função processaBusca aceita
export const PARAMS_USUARIOS = [
    "nome",
    "minData_nascimento",
    "maxData_nascimento"
];

export async function verificarFiltroNome(queryParams) {
    const { nome } = queryParams;
    if (!nome) return null; // Se não houver filtro, não retorna erro
    const resultado = await Usuario.find({ nome: { $regex: `^${nome}`, $options: "i" } });
    if (resultado.length === 0) {
      return `Nenhum usuário com o NOME igual a {${nome.toUpperCase()}} encontrado.`;
    }
    return null;
}

export async function processaBusca(parametros){
    const {nome, minData_nascimento, maxData_nascimento} = parametros;

    const busca = {};

    if(nome) busca.nome = {$regex: `^${nome}`, $options: "i"};

    /*if(minPreco || maxPreco) busca.preco = {};

    if(minPreco) busca.preco.$gte = minPreco;
    if(maxPreco) busca.preco.$lte = maxPreco;

    if(minEstoque || maxEstoque) busca.estoque = {};

    if(minEstoque) busca.estoque.$gte = minEstoque;
    if(maxEstoque) busca.estoque.$lte = maxEstoque;*/

    return busca;
}