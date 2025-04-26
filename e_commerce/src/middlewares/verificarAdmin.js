import pularNoTeste from "../utils/pularNoTeste.js";

// src/middlewares/verificarAdmin.js
export function verificarAdmin(req, res, next) {
  const perfil = (req.user.perfil || '').toString();

  // Compara em lowercase para aceitar qualquer combinação de caixa
  if (perfil.toLowerCase() !== 'administrador') {
    return res
      .status(403)
      .json({ mensagem: 'Acesso negado: apenas administradores.' });
  }

  next();
}

export default pularNoTeste(verificarAdmin);
