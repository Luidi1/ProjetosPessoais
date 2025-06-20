// src/utils/mensagensErroValidacao.js

/**
 * Gera mensagem de erro quando o formato de um campo de validação está incorreto.
 * @param {string} campo — nome do campo (ex.: 'Email')
 * @returns {string}
 */
export function erroFormatoEmail(campo) {
    return `O formato do campo ${campo} é inválido.`;
}