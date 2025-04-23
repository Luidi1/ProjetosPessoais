// src/middlewares/verificarDonoOuAdmin.js
import mongoose from 'mongoose';
import Pedido   from '../models/Pedido.js';
import NaoEncontrado from '../erros/NaoEncontrado.js';

export default async function verificarDonoOuAdmin(req, res, next) {
  try {
    const { id } = req.params;

    // 1) Se não for um ObjectId válido, já lança NaoEncontrado
    if (!mongoose.isValidObjectId(id)) {
      throw new NaoEncontrado(`Pedido com id ${id} não encontrado.`);
    }

    // 2) Busca o pedido
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      throw new NaoEncontrado(`Pedido com id ${id} não encontrado.`);
    }

    // 3) Se não for dono, responde 403
    if (pedido.usuario.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ mensagem: 'Acesso negado: você não é dono deste pedido.' });
    }

    // 4) Tudo correto, segue em frente
    next();
  } catch (err) {
    // manda esse NaoEncontrado (ou outro erro) para o handler global
    next(err);
  }
}
