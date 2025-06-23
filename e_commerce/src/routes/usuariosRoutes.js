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
    .post("/login", UsuarioController.logarUsuario)
    .post("/", UsuarioController.cadastrarUsuario)
    .get('/confirmar/:token', UsuarioController.confirmarUsuario);
      

//Rotas autenticadas
router
    
    .get("/busca", autenticar, gerarVerificadorParametros(PARAMS_PAGINACAO, PARAMS_USUARIOS), verificarAdmin, UsuarioController.listarUsuariosPorFiltro, paginar)
    .get("/:id", autenticar, verificarDonoOuAdmin(Usuario, 'usuário'), UsuarioController.listarUsuarioPorId)
    .get("/", autenticar, gerarVerificadorParametros(PARAMS_PAGINACAO), verificarAdmin, UsuarioController.listarUsuarios, paginar)
    .put("/:id", autenticar, verificarDonoOuAdmin(Usuario, "usuário"), UsuarioController.atualizarUsuario)
    .delete("/:id", autenticar, verificarDonoOuAdmin(Usuario, "usuário"), UsuarioController.deletarUsuario)
    .delete("/", autenticar, verificarAdmin, UsuarioController.deletarTodosUsuarios);
    
export default router;