import express from "express";
import UsuarioController from "../controllers/usuariosController.js";
import paginar, { PARAMS_PAGINACAO } from "../middlewares/paginar.js";
import { PARAMS_USUARIOS } from "../controllers/utils/usuariosHelpers.js";
import gerarVerificadorParametros from "../middlewares/gerarVerificadorParametros.js";
import autenticar from '../middlewares/autenticar.js';
import verificarAdmin from '../middlewares/verificarAdmin.js';
import verificarDonoOuAdmin from "../middlewares/verificarDonoOuAdmin.js"
import Usuario from "../models/Usuario.js";

const router = express.Router();

//Rotoas públicas
router
    .post("/usuarios/login", UsuarioController.logarUsuario)
    .post("/usuarios", UsuarioController.cadastrarUsuario);

//Rotas autenticadas
router
    .use(autenticar)
    .get("/usuarios/busca", gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_USUARIOS), verificarAdmin, UsuarioController.listarUsuariosPorFiltro, paginar)
    .get("/usuarios/:id", verificarDonoOuAdmin(Usuario, 'usuário'), UsuarioController.listarUsuarioPorId)
    .get("/usuarios", gerarVerificadorParametros(PARAMS_PAGINACAO), verificarAdmin, UsuarioController.listarUsuarios, paginar)
    .put("/usuarios/:id", verificarDonoOuAdmin(Usuario, "usuário"), UsuarioController.atualizarUsuario)
    .delete("/usuarios/:id", verificarDonoOuAdmin(Usuario, "usuário"), UsuarioController.deletarUsuario)
    .delete("/usuarios", verificarAdmin, UsuarioController.deletarTodosUsuarios);
    
export default router;