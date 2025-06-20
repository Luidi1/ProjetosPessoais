import express from "express";
import ProdutoController from "../controllers/produtosController.js";
import paginar, { PARAMS_PAGINACAO } from "../middlewares/paginar.js";
import { PARAMS_PRODUTOS } from "../controllers/utils/produtosHelpers.js";
import gerarVerificadorParametros from "../middlewares/gerarVerificadorParametros.js";
import autenticar from '../middlewares/autenticar.js';
import verificarAdmin from '../middlewares/verificarAdmin.js';

const router = express.Router();

router
.get("/", gerarVerificadorParametros(PARAMS_PAGINACAO), ProdutoController.listarProdutos, paginar)
.get("/busca", gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_PRODUTOS), ProdutoController.listarProdutoPorFiltro, paginar)
.get("/:id", ProdutoController.listarProdutoPorId);

router
    .use(autenticar)

    .post("/", verificarAdmin, ProdutoController.cadastrarProduto)
    .put("/:id", verificarAdmin, ProdutoController.atualizarProduto)
    .delete("/:id", verificarAdmin, ProdutoController.deletarProduto)
    .delete("/", verificarAdmin, ProdutoController.deletarTodosProdutos);
    
export default router;