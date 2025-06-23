// src/controllers/PedidoController.js
import mongoose from 'mongoose';
import Carrinho from '../models/Carrinho.js';
import Pedido from '../models/Pedido.js';
import Produto from '../models/Produto.js';
import ErroRequisicao from '../erros/ErroRequisicao.js';
import NaoEncontrado from '../erros/NaoEncontrado.js';

class PedidoController {
  // POST /pedido → cria um novo pedido a partir do carrinho
  static criarPedido = async (req, res, next) => {
    try {
      const usuarioId = req.user.id;
      const { formaPagamento, enderecoEntrega } = req.body;

      // 1) Busca o carrinho do usuário
      const carrinho = await Carrinho
        .findOne({ usuario: usuarioId })
        .populate('itens.produto');

      if (!carrinho || carrinho.itens.length === 0) {
        return res.status(400).json({ mensagem: 'Carrinho vazio. Não é possível criar pedido.' });
      }

      // 2) Monta itens do pedido e calcula valorTotal
      const itensDoPedido = carrinho.itens.map(item => ({
        produto: item.produto._id,
        quantidade: item.quantidade,
        precoUnitario: item.produto.preco,
        precoItem: item.quantidade * item.produto.preco
      }));
      const valorTotal = itensDoPedido.reduce((sum, i) => sum + i.precoItem, 0);

      // 3) Verifica estoque e reduz
      for (const linha of itensDoPedido) {
        const produtoDoc = await Produto.findById(linha.produto);
        if (!produtoDoc) {
          return res.status(404).json({ mensagem: `Produto com id ${linha.produto} não encontrado.` });
        }
        if (produtoDoc.estoque < linha.quantidade) {
          return res.status(400).json({
            mensagem: `Estoque insuficiente para o produto ${produtoDoc.nome}. Disponível: ${produtoDoc.estoque}, solicitado: ${linha.quantidade}`
          });
        }
        produtoDoc.estoque -= linha.quantidade;
        await produtoDoc.save();
      }

      // 4) Cria o pedido
      const pedido = new Pedido({
        usuario: usuarioId,
        itens: itensDoPedido,
        valorTotal,
        formaPagamento,
        enderecoEntrega
      });
      const pedidoSalvo = await pedido.save();

      // 5) Limpa o carrinho (lazy-create se necessário)
      await Carrinho.findOneAndUpdate(
        { usuario: usuarioId },
        { $set: { itens: [], atualizadoEm: Date.now() } },
        { new: true, upsert: true }
      );

      return res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: pedidoSalvo });
    } catch (erro) {
      return next(erro);
    }
  };

  // GET /pedido → lista todos os pedidos do usuário autenticado
  static listarPedidos = async (req, res, next) => {
    try {
      const usuarioId = req.user.id;
      const pedidos = await Pedido.find({ usuario: usuarioId }).populate('itens.produto');
      const total = await Pedido.countDocuments({ usuario: usuarioId });
      return res.status(200).json({ total, pedidos });
    } catch (erro) {
      return next(erro);
    }
  };

  // GET /pedido/:id → busca um pedido por ID
  static listarPedidoPorId = async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ mensagem: `ID em formato inválido: ${id}` });
      }

      const pedido = await Pedido
        .findOne({ _id: id, usuario: req.user.id })
        .populate('itens.produto');
      if (!pedido) {
        return res.status(404).json({ mensagem: `Pedido com id ${id} não encontrado para este usuário.` });
      }

      return res.status(200).json(pedido);
    } catch (erro) {
      return next(erro);
    }
  };

  // PUT /pedido/:id/cancelar → cancela um pedido (apenas usuário ou admin)
  static cancelarPedido = async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ mensagem: `ID em formato inválido: ${id}` });
      }

      const pedido = await Pedido.findOneAndUpdate(
        { _id: id, usuario: req.user.id, status: { $in: ['PENDENTE'] } },
        { $set: { status: 'CANCELADO', atualizadoEm: Date.now() } },
        { new: true }
      ).populate('itens.produto');

      if (!pedido) {
        return res.status(404).json({ mensagem: `Pedido não encontrado ou não pode ser cancelado.` });
      }

      return res.status(200).json(pedido);
    } catch (erro) {
      return next(erro);
    }
  };

  // DELETE /pedido/:id → hard-delete de um pedido (apenas admin)
  static deletarPedido = async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ mensagem: `ID em formato inválido: ${id}` });
      }

      const pedidoDeletado = await Pedido.findByIdAndDelete(id);
      if (!pedidoDeletado) {
        return res.status(404).json({ mensagem: `Pedido com id ${id} não encontrado.` });
      }

      return res.status(200).json({ mensagem: 'Pedido deletado com sucesso.' });
    } catch (erro) {
      return next(erro);
    }
  };

  // DELETE /pedido → hard-delete de todos os pedidos (apenas admin)
  static deletarTodosPedidos = async (req, res, next) => {
    try {
      await Pedido.deleteMany({});
      return res.status(200).json({ mensagem: 'Todos os pedidos foram deletados.' });
    } catch (erro) {
      return next(erro);
    }
  };
}

export default PedidoController;
