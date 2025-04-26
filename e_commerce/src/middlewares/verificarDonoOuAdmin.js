// src/middlewares/verificarDonoOuAdmin.js
import mongoose   from 'mongoose';
import NaoEncontrado from '../erros/NaoEncontrado.js';
import ErroRequisicao from '../erros/ErroRequisicao.js';
import pularNoTeste  from '../utils/pularNoTeste.js';

export default function verificarDonoOuAdmin(Model, nomeRecurso) {
  return pularNoTeste(async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        throw new ErroRequisicao(`Formato de ID inválido: {${id}}`);
      }

      const doc = await Model.findById(id);
      if (!doc) {
        throw new NaoEncontrado(`${nomeRecurso} com id igual a {${id}} não encontrado.`);
      }

      // dono ou admin?
      const ownerId = (doc.usuario ?? doc._id).toString();
      const perfil  = (req.user.perfil || '').toString().toLowerCase();
      if (req.user.id !== ownerId
          && perfil !== 'administrador'
          && perfil !== 'admin') {
        return res.status(403).json({
          mensagem: `Acesso negado: você não é dono deste ${nomeRecurso}.`
        });
      }

      next();
    } catch (err) {
      // passe o erro para o seu handler global (que vai extrair status e mensagem)
      next(err);
    }
  });
}
