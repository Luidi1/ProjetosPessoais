// src/utils/mensagensErro.js

// Parâmetros duplicados
export const erroParamDuplicado = (param) =>
    `O parâmetro {${param}} foi informado várias vezes.`;
  
// Parâmetro inexistente (1)
export const erroParamInexistente = (param, validosStr) =>
`O parâmetro {${param}} informado não existe. Parâmetros válidos: ${validosStr}.`;

// Parâmetros inexistentes (vários)
export const erroParamsInexistentes = (paramsStr, validosStr) =>
`Os parâmetros {${paramsStr}} informados não existem. Parâmetros válidos: ${validosStr}.`;

// Formato de data
export const erroFormatoData = (param) =>
`O parâmetro {${param}} está em formato incorreto. O formato correto é AAAA-MM-DD.`;

// Intervalo de datas com min > max
export const erroIntervaloData = () =>
`O parâmetro {minData_nascimento} não pode ser maior que {maxData_nascimento}.`;

// Nome não encontrado
export const erroNomeNaoEncontrado = (nome) =>
`Nenhum usuário com NOME igual a {${nome.toUpperCase()}} encontrado.`;

// Email não encontrado
export const erroEmailNaoEncontrado = (email) =>
`Nenhum usuário com EMAIL começando por {${email.toLowerCase()}} encontrado.`;

// Nenhum usuário no intervalo de datas
export const erroDataNascimentoEntreNaoEncontrado = (min, max) =>
`Nenhum usuário com DATA DE NASCIMENTO entre ${min} e ${max} encontrado.`;

// Nenhum usuário a partir da data mínima
export const erroDataNascimentoMinNaoEncontrado = (min) =>
`Nenhum usuário com DATA DE NASCIMENTO a partir de ${min} encontrado.`;

// Nenhum usuário até a data máxima
export const erroDataNascimentoMaxNaoEncontrado = (max) =>
`Nenhum usuário com DATA DE NASCIMENTO até ${max} encontrado.`;

// Perfil inválido
export const erroPerfilInexistente = (perfil, validosStr) =>
`O perfil {${perfil}} informado não existe. Perfis válidos: ${validosStr}.`;

// Nenhum usuário com perfil específico
export const erroPerfilNaoEncontrado = (perfil) =>
`Nenhum usuário com PERFIL igual a {${perfil.toUpperCase()}} encontrado.`;

// Formato de ID inválido
export const erroFormatoIdInvalido = (id) =>
    `Formato de ID inválido: {${id}}`;
  
// Usuário por ID não encontrado
export const erroUsuarioIdNaoEncontrado = (id) =>
`Usuário com id igual a {${id}} não encontrado.`;
