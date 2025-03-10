import express from "express";
import UsuarioController from "../controllers/usuariosController.js";
import paginacao, { PARAMS_PAGINACAO } from "../middlewares/paginar.js";
import gerarVerificadorParametros from "../middlewares/gerarVerificadorParametros.js";

const router = express.Router();

router
    .get("/usuarios/:id", UsuarioController.lsitarUsuarioPorid)
    .get("/usuarios", gerarVerificadorParametros(PARAMS_PAGINACAO), UsuarioController.listarUsuarios, paginacao)
    .post("/usuarios/login", UsuarioController.logarUsuario)
    .post("/usuarios", UsuarioController.cadastrarUsuario)
    .put("/usuarios/:id", UsuarioController.atualizarUsuario);
    

export default router;