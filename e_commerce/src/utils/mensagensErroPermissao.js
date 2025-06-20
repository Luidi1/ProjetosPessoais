// fonte atual
export const erroAcessoNegado = recurso =>
    `Acesso negado: você não é dono deste ${recurso}.`;
  
  // acrescente abaixo:
  export const erroPermissaoAdmin = () =>
    'Acesso negado: apenas administradores.';
  