import express from 'express';
import CarrinhoController from '../controllers/carrinhoController.js';
import autenticar from '../middlewares/autenticar.js';

const router = express.Router();

router
  // força autenticação para todas as rotas de carrinho. Somente o dono do carrinho pode mexer nele(nem o admin pode)
  .use(autenticar)

  // GET  /carrinho               → lista o carrinho do usuário
  .get('/', CarrinhoController.listarCarrinho)

  // POST /carrinho               → adiciona item (ou cria carrinho)
  .post('/', CarrinhoController.adicionarItem)

  // PUT  /carrinho/item/:itemId  → atualiza quantidade do item
  .put('/:itemId', CarrinhoController.atualizarItem)

  // DELETE /carrinho/item/:itemId→ remove um item do carrinho
  .delete('/:itemId', CarrinhoController.removerItem)

  // DELETE /carrinho             → esvazia o carrinho
  .delete('/', CarrinhoController.limparCarrinho);

export default router;
