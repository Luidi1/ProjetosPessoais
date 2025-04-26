import express from "express";
import ProdutoController from "../controllers/produtosController.js";
import paginar, { PARAMS_PAGINACAO } from "../middlewares/paginar.js";
import { PARAMS_PRODUTOS } from "../controllers/utils/produtosHelpers.js";
import gerarVerificadorParametros from "../middlewares/gerarVerificadorParametros.js";
import autenticar from '../middlewares/autenticar.js';
import verificarAdmin from '../middlewares/verificarAdmin.js';

const router = express.Router();

router
.get("/produtos", gerarVerificadorParametros(PARAMS_PAGINACAO), ProdutoController.listarProdutos, paginar)
.get("/produtos/busca", gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_PRODUTOS), ProdutoController.listarProdutoPorFiltro, paginar)
.get("/produtos/:id", ProdutoController.listarProdutoPorId);

router
    .use(autenticar)

    .post("/produtos", verificarAdmin, ProdutoController.cadastrarProduto)
    .put("/produtos/:id", verificarAdmin, ProdutoController.atualizarProduto)
    .delete("/produtos/:id", verificarAdmin, ProdutoController.deletarProduto)
    .delete("/produtos", verificarAdmin, ProdutoController.deletarTodosProdutos);
    
export default router;