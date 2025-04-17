import express from "express";
import ProdutoController from "../controllers/produtosController.js";
import paginar, { PARAMS_PAGINACAO } from "../middlewares/paginar.js";
import { PARAMS_PRODUTOS } from "../controllers/utils/produtosHelpers.js";
import gerarVerificadorParametros from "../middlewares/gerarVerificadorParametros.js";

const router = express.Router();

router
    .get("/produtos", gerarVerificadorParametros(PARAMS_PAGINACAO), ProdutoController.listarProdutos, paginar)
    .get("/produtos/busca", gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_PRODUTOS), ProdutoController.listarProdutoPorFiltro, paginar)
    .get("/produtos/:id", ProdutoController.listarProdutoPorId)
    .post("/produtos", ProdutoController.cadastrarProduto)
    .put("/produtos/:id", ProdutoController.atualizarProduto)
    .delete("/produtos/:id", ProdutoController.deletarProduto)
    .delete("/produtos", ProdutoController.deletarTodosProdutos);
export default router;