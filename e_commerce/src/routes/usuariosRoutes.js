import express from "express";
import UsuarioController from "../controllers/usuariosController.js";
import paginar, { PARAMS_PAGINACAO } from "../middlewares/paginar.js";
import { PARAMS_USUARIOS } from "../controllers/utils/usuariosHelpers.js";
import gerarVerificadorParametros from "../middlewares/gerarVerificadorParametros.js";

const router = express.Router();

router
    .get("/usuarios/busca", gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_USUARIOS), UsuarioController.listarUsuariosPorFiltro, paginar)
    .get("/usuarios/:id", UsuarioController.lsitarUsuarioPorid)
    .get("/usuarios", gerarVerificadorParametros(PARAMS_PAGINACAO), UsuarioController.listarUsuarios, paginar)
    .post("/usuarios/login", UsuarioController.logarUsuario)
    .post("/usuarios", UsuarioController.cadastrarUsuario)
    .put("/usuarios/:id", UsuarioController.atualizarUsuario)
    .delete("/usuarios/:id", UsuarioController.deletarUsuario);
    
export default router;