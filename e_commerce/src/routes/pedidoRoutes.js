import express from 'express';
import PedidoController from '../controllers/PedidoController.js';
import autenticar from '../middlewares/autenticar.js';
import verificarDonoOuAdmin from '../middlewares/verificarDonoOuAdmin.js';
import verificarAdmin from '../middlewares/verificarAdmin.js';
import Pedido from '../models/Pedido.js';

const router = express.Router();

// Aplica autenticação a todas as rotas de pedido
router.use(autenticar);

// → lista todos os pedidos do usuário logado
router.get('/', PedidoController.listarPedidos);

// → cria um novo pedido
router.post('/', PedidoController.criarPedido);

// → só dono ou admin podem ver um pedido específico
router.get('/:id', verificarDonoOuAdmin(Pedido, 'pedido'), PedidoController.listarPedidoPorId);

// → só dono ou admin podem cancelar
router.put('/:id/cancelar', verificarDonoOuAdmin(Pedido, 'pedido'), PedidoController.cancelarPedido);

// → só admin faz hard-delete de um pedido
router.delete('/:id', verificarAdmin, PedidoController.deletarPedido);

// → só admin faz hard-delete de todos os pedidos
router.delete('/', verificarAdmin, PedidoController.deletarTodosPedidos);

export default router;
