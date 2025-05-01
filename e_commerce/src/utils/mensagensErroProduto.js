// src/utils/mensagensErroProduto.js

// Produto não encontrado pelo nome
export const erroProdutoNaoEncontrado = (nome) =>
    `Nenhum produto com NOME igual a {${nome.toUpperCase()}} encontrado.`;
  
  // Nenhum produto encontrado dentro do intervalo de preço
  export const erroPrecoEntreNaoEncontrado = (min, max) =>
    `Nenhum produto com PREÇO entre ${min} e ${max} encontrado.`;
  
  // Nenhum produto encontrado a partir do preço mínimo
  export const erroPrecoMinNaoEncontrado = (min) =>
    `Nenhum produto com PREÇO MÍNIMO igual a ${min} encontrado.`;
  
  // Nenhum produto encontrado até o preço máximo
  export const erroPrecoMaxNaoEncontrado = (max) =>
    `Nenhum produto com PREÇO MÁXIMO igual a ${max} encontrado.`;
  
  // Nenhum produto encontrado dentro do intervalo de estoque
  export const erroEstoqueEntreNaoEncontrado = (min, max) =>
    `Nenhum produto com ESTOQUE entre ${min} e ${max} encontrado.`;
  
  // Nenhum produto encontrado a partir do estoque mínimo
  export const erroEstoqueMinNaoEncontrado = (min) =>
    `Nenhum produto com ESTOQUE MÍNIMO igual a ${min} encontrado.`;
  
  // Nenhum produto encontrado até o estoque máximo
  export const erroEstoqueMaxNaoEncontrado = (max) =>
    `Nenhum produto com ESTOQUE MÁXIMO igual a ${max} encontrado.`;
  