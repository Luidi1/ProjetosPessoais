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

/**
 * Verifica se há usuários dentro do intervalo de data de nascimento.
 * Se nenhum usuário for encontrado, retorna uma mensagem de erro; 
 * caso contrário, retorna null.
 * 
 * @param {object} queryParams - Os parâmetros da query, contendo
 *        minData_nascimento e/ou maxData_nascimento.
 * @returns {string|null} Mensagem de erro se nenhum usuário for encontrado, ou null.
 */
export async function verificarFiltroData_nascimento(queryParams) {
    const { minData_nascimento, maxData_nascimento } = queryParams;
    // Se nenhum filtro de data for informado, não retorna erro
    if (!minData_nascimento && !maxData_nascimento) return null;
  
    // Monta a query de busca para data_nascimento
    const busca = {};
    if (minData_nascimento) {
      // Converte a string para Date e busca usuários com data de nascimento maior ou igual
      busca.data_nascimento = { $gte: new Date(minData_nascimento) };
    }
    if (maxData_nascimento) {
      // Se já existe filtro para minData_nascimento, adiciona a condição para maxData_nascimento
      busca.data_nascimento = busca.data_nascimento || {};
      busca.data_nascimento.$lte = new Date(maxData_nascimento);
    }
  
    // Executa a busca
    const resultado = await Usuario.find(busca);
  
    if (resultado.length === 0) {
      if (minData_nascimento && maxData_nascimento) {
        return `Nenhum usuário com DATA DE NASCIMENTO entre ${minData_nascimento} e ${maxData_nascimento} encontrado.`;
      } else if (minData_nascimento) {
        return `Nenhum usuário com DATA DE NASCIMENTO a partir de ${minData_nascimento} encontrado.`;
      } else if (maxData_nascimento) {
        return `Nenhum usuário com DATA DE NASCIMENTO até ${maxData_nascimento} encontrado.`;
      }
    }
    return null;
}

export async function processaBusca(parametros){
    const {nome, minData_nascimento, maxData_nascimento} = parametros;

    const busca = {};

    if(nome) busca.nome = {$regex: `^${nome}`, $options: "i"};

    if(minData_nascimento || maxData_nascimento) busca.data_nascimento = {};

    if(minData_nascimento) busca.data_nascimento.$gte = minData_nascimento;
    if(maxData_nascimento) busca.data_nascimento.$lte = maxData_nascimento;

    /*if(minEstoque || maxEstoque) busca.estoque = {};

    if(minEstoque) busca.estoque.$gte = minEstoque;
    if(maxEstoque) busca.estoque.$lte = maxEstoque;*/

    return busca;
}