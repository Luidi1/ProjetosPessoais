// src/middlewares/verificarDonoOuAdmin.js
import mongoose from 'mongoose';
import NaoEncontrado from '../erros/NaoEncontrado.js';
import ErroRequisicao from '../erros/ErroRequisicao.js';
import { erroFormatoIdInvalido, erroUsuarioIdNaoEncontrado } from '../utils/mensagensErroUsuario.js';
import { erroAcessoNegado } from '../utils/mensagensErroPermissao.js'

export default function verificarDonoOuAdmin(Model, nomeRecurso) {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      // 1) Valida formato do ID
      if (!mongoose.isValidObjectId(id)) {
        throw new ErroRequisicao(
          erroFormatoIdInvalido(id)
        );
      }

      // 2) Busca recurso
      const doc = await Model.findById(id);
      if (!doc) {
        throw new NaoEncontrado(
          erroUsuarioIdNaoEncontrado(id)
        );
      }

      // 3) Só dono ou admin podem acessar
      const ownerId = (doc.usuario ?? doc._id).toString();
      const perfilReq = String(req.user.perfil || '').toLowerCase();
      if (req.user.id !== ownerId
          && perfilReq !== 'administrador'
          && perfilReq !== 'admin') {
        return res.status(403).json({
          mensagem: erroAcessoNegado(nomeRecurso)
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
