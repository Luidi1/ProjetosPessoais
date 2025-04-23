// src/routes/pedidoRoutes.js
import { Router } from 'express';
import PedidoController from '../controllers/PedidoController.js';
import autenticar from '../middlewares/autenticar.js';
import verificarDonoOuAdmin from '../middlewares/verificarDonoOuAdmin.js';
import verificarAdmin from '../middlewares/verificarAdmin.js'

const router = Router();

// → 1) Aplica autenticação a todas as rotas
router.use(autenticar);

// → 2) Cria e lista **seus** pedidos (qualquer usuário logado)
router.get('/pedido', PedidoController.listarPedidos);
router.post('/pedido', PedidoController.criarPedido);

// → 3) Só dono ou admin podem ver/cancelar um pedido específico
router.get('/pedido/:id', verificarDonoOuAdmin, PedidoController.listarPedidoPorId);
router.put('/pedido/:id/cancelar', verificarDonoOuAdmin, PedidoController.cancelarPedido);

// → 4) Só admin faz **hard‑delete**
router.delete('/pedido/:id', verificarAdmin, PedidoController.deletarPedido);
router.delete('/pedido', verificarAdmin, PedidoController.deletarTodosPedidos);

export default router;
