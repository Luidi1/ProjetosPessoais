import express from "express";
import UsuarioController from "../controllers/usuariosController.js";

const router = express.Router();

router
    .post("/usuarios", UsuarioController.cadastrarUsuario);

export default router;