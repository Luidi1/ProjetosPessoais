// src/controllers/PedidoController.js
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
      // ⬇️ pega do corpo da requisição
      const { formaPagamento, enderecoEntrega } = req.body;
  
      // 1) Busca o carrinho do usuário
      const carrinho = await Carrinho
        .findOne({ usuario: usuarioId })
        .populate('itens.produto');
  
      if (!carrinho || carrinho.itens.length === 0) {
        throw new ErroRequisicao('Carrinho vazio. Não é possível criar pedido.');
      }
  
      // 2) Monta itens do pedido e calcula valorTotal
      const itensDoPedido = carrinho.itens.map(item => ({
        produto: item.produto._id,
        quantidade: item.quantidade,
        precoUnitario: item.produto.preco,
        precoItem: item.quantidade * item.produto.preco
      }));
      const valorTotal = itensDoPedido
        .reduce((sum, i) => sum + i.precoItem, 0);
  
      // 3) Verifica estoque e reduz
      for (const linha of itensDoPedido) {
        const produto = await Produto.findById(linha.produto);
        if (!produto) {
          throw new NaoEncontrado(`Produto com id ${linha.produto} não encontrado.`);
        }
        if (produto.estoque < linha.quantidade) {
          throw new ErroRequisicao(
            `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}, solicitado: ${linha.quantidade}`
          );
        }
        produto.estoque -= linha.quantidade;
        await produto.save();
      }
  
      // 4) Cria o pedido COM TODOS OS CAMPOS OBRIGATÓRIOS
      const pedido = new Pedido({
        usuario: usuarioId,
        itens: itensDoPedido,
        valorTotal,          // nome correto
        formaPagamento,      // vindo de req.body
        enderecoEntrega      // vindo de req.body
      });
      const pedidoSalvo = await pedido.save();
  
      // 5) Limpa o carrinho
      await Carrinho.findOneAndUpdate(
        { usuario: usuarioId },
        { $set: { itens: [], atualizadoEm: Date.now() } }
      );
  
      res.status(201).json({
        message: 'Pedido criado com sucesso!',
        pedido: pedidoSalvo
      });
    } catch (erro) {
      next(erro);
    }
  };
  

  // MÉTODO AUXILIAR: conta quantos pedidos este usuário tem
  static contarPedidosDoUsuario = async (usuarioId) => {
    return Pedido.countDocuments({ usuario: usuarioId });
  }

  // GET /pedido → lista todos os pedidos do usuário autenticado, com total
  static listarPedidos = async (req, res, next) => {
    try {
      const usuarioId = req.user.id;

      // 1) Busca os pedidos
      const pedidos = await Pedido
        .find({ usuario: usuarioId })
        .populate('itens.produto');

      // 2) Conta quantos pedidos esse usuário tem
      const total = await PedidoController.contarPedidosDoUsuario(usuarioId);

      // 3) Retorna o total e a lista
      res.status(200).json({ total, pedidos });
    } catch (erro) {
      next(erro);
    }
  };

  // GET /pedido/:id → busca um pedido por ID
  static listarPedidoPorId = async (req, res, next) => {
    try {
      const { id } = req.params;
      const pedido = await Pedido
        .findOne({ _id: id, usuario: req.user.id })
        .populate('itens.produto');

      if (!pedido) {
        throw new NaoEncontrado(`Pedido com id ${id} não encontrado para este usuário.`);
      }
      res.status(200).json(pedido);
    } catch (erro) {
      next(erro);
    }
  };

  // PUT /pedido/:id/cancelar → cancela um pedido (apenas usuário ou admin)
  static cancelarPedido = async (req, res, next) => {
    try {
      const { id } = req.params;
      const pedido = await Pedido.findOneAndUpdate(
        { _id: id, usuario: req.user.id, status: { $in: ['PENDENTE'] } },
        { $set: { status: 'CANCELADO', atualizadoEm: Date.now() } },
        { new: true }
      ).populate('itens.produto');

      if (!pedido) {
        throw new NaoEncontrado(`Pedido não encontrado ou não pode ser cancelado.`);
      }
      res.status(200).json(pedido);
    } catch (erro) {
      next(erro);
    }
  };

  // DELETE /pedido/:id → hard-delete de um pedido (apenas admin)
  static deletarPedido = async (req, res, next) => {
    try {
      const { id } = req.params;
      const pedido = await Pedido.findByIdAndDelete(id);

      if (!pedido) {
        throw new NaoEncontrado(`Pedido com id ${id} não encontrado.`);
      }
      res.status(200).json({ mensagem: 'Pedido deletado com sucesso.' });
    } catch (erro) {
      next(erro);
    }
  };

  // DELETE /pedido → hard-delete de todos os pedidos (apenas admin)
  static deletarTodosPedidos = async (req, res, next) => {
    try {
      await Pedido.deleteMany();
      res.status(200).json({ mensagem: 'Todos os pedidos foram deletados.' });
    } catch (erro) {
      next(erro);
    }
  };
}

export default PedidoController;
