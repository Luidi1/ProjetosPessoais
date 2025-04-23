import Carrinho from '../models/Carrinho.js';
import Produto        from '../models/Produto.js';
import ErroRequisicao from '../erros/ErroRequisicao.js';
import NaoEncontrado  from '../erros/NaoEncontrado.js';

class CarrinhoController {
  // GET /carrinho
  static listarCarrinho = async (req, res, next) => {
    try {
      const carrinho = await Carrinho
        .findOne({ usuario: req.user.id })
        .populate('itens.produto');
      res.status(200).json(carrinho || { usuario: req.user.id, itens: [] });
    } catch (erro) {
      next(erro);
    }
  }

  // POST /carrinho
  static adicionarItem = async (req, res, next) => {
    try {
      const { produto, quantidade } = req.body;
      const usuarioId = req.user.id;
  
      // 1) Encontra (ou cria) o carrinho
      let carrinho = await Carrinho.findOne({ usuario: usuarioId });
      if (!carrinho) {
        carrinho = new Carrinho({ usuario: usuarioId, itens: [] });
      }
  
      // 2) Verifica estoque antes de adicionar
      const produtoDoc = await Produto.findById(produto);
      if (!produtoDoc) {
        throw new NaoEncontrado(`Produto com id ${produto} não encontrado.`);
      }
      // quantidade já existente no carrinho (se houver)
      const subdocExistente = carrinho.itens.find(i => i.produto.toString() === produto);
      const quantidadeAtual = subdocExistente ? subdocExistente.quantidade : 0;
      if (produtoDoc.estoque < quantidadeAtual + quantidade) {
        throw new ErroRequisicao(
          `Estoque insuficiente. Disponível: ${produtoDoc.estoque}, solicitado: ${quantidadeAtual + quantidade}.`
        );
      }
  
      // 3) Encontra ou adiciona o item
      let subdoc = subdocExistente;
      if (subdoc) {
        subdoc.quantidade += quantidade;
      } else {
        subdoc = { produto, quantidade };
        carrinho.itens.push(subdoc);
      }
  
      // 4) Salva e repopula
      carrinho.atualizadoEm = Date.now();
      await carrinho.save();
      await carrinho.populate('itens.produto');
  
      // 5) Extrai o subdocumento recém-afetado
      const itemAfetado = carrinho.itens.find(i =>
        i.produto._id.toString() === produto
      );
  
      // 6) Responde apenas com ele
      res.status(200).json({
        message: 'Item adicionado ao carrinho com sucesso.',
        item: itemAfetado
      });
    } catch (erro) {
      next(erro);
      }
  };
  
  
  // PUT /carrinho/item/:itemId
  static atualizarItem = async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const { quantidade } = req.body;
      const carrinho = await Carrinho.findOneAndUpdate(
        { usuario: req.user.id, 'itens._id': itemId },
        { $set: { 'itens.$.quantidade': quantidade, atualizadoEm: Date.now() } },
        { new: true }
      ).populate('itens.produto');
      res.status(200).json(carrinho);
    } catch (erro) {
      next(erro);
    }
  }

  // DELETE /carrinho/item/:itemId
  static removerItem = async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const carrinho = await Carrinho.findOneAndUpdate(
        { usuario: req.user.id },
        { $pull: { itens: { _id: itemId } }, atualizadoEm: Date.now() },
        { new: true }
      ).populate('itens.produto');
      res.status(200).json(carrinho);
    } catch (erro) {
      next(erro);
    }
  }

  // DELETE /carrinho
  static limparCarrinho = async (req, res, next) => {
    try {
      const carrinho = await Carrinho.findOneAndUpdate(
        { usuario: req.user.id },
        { $set: { itens: [] }, atualizadoEm: Date.now() },
        { new: true }
      );
      res.status(200).json({ message: 'Carrinho esvaziado.', data: carrinho });
    } catch (erro) {
      next(erro);
    }
  }
}

export default CarrinhoController;