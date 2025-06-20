// src/middlewares/verificarAdmin.js
import { erroPermissaoAdmin } from '../utils/mensagensErroPermissao.js';

export default function verificarAdmin(req, res, next) {
  const perfil = (req.user.perfil || '').toString();

  // Compara em lowercase para aceitar qualquer combinação de caixa
  if (perfil.toLowerCase() !== 'administrador') {
    return res
      .status(403)
      .json({ mensagem: erroPermissaoAdmin()});
  }

  next();
}

