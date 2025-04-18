import express from 'express';
import CarrinhoController from '../controllers/carrinhoController.js';
import autenticar from '../middlewares/autenticar.js';

const router = express.Router();

router
  // força autenticação para todas as rotas de carrinho
  .use(autenticar)

  // GET  /carrinho               → lista o carrinho do usuário
  .get('/carrinho', CarrinhoController.listarCarrinho)

  // POST /carrinho               → adiciona item (ou cria carrinho)
  .post('/carrinho', CarrinhoController.adicionarItem)

  // PUT  /carrinho/item/:itemId  → atualiza quantidade do item
  .put('/carrinho/:itemId', CarrinhoController.atualizarItem)

  // DELETE /carrinho/item/:itemId→ remove um item do carrinho
  .delete('/carrinho/:itemId', CarrinhoController.removerItem)

  // DELETE /carrinho             → esvazia o carrinho
  .delete('/carrinho', CarrinhoController.limparCarrinho);

export default router;
