import Usuario from "../models/Usuario.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import NaoEncontrado from "../erros/NaoEncontrado.js";
import ErroRequisicao from "../erros/ErroRequisicao.js";
import { concatenarItensComVirgulaAndE } from "../utils/formatarMensagens.js";
import mongoose from "mongoose";

class UsuarioController{

    static listarUsuarios = async(req, res, next) =>{
        try{
            const usuarioResultado = Usuario.find();

            req.resultado = usuarioResultado;

            next();
        } catch(erro){
            next(erro);
        }
    }

    static lsitarUsuarioPorid = async(req, res, next) =>{

        try{
            const id = req.params.id;
    
            const usuarioResultado = await Usuario.findById(id);
    
            if(usuarioResultado){
                res.status(200).json(usuarioResultado);
            } else{
                throw new NaoEncontrado(`Usuário com id igual a {${id}} não encontrado`);
            }
        } catch(erro){
            next(erro);
        }
    }

    static cadastrarUsuario = async(req, res, next) =>{
        try{
            let usuario = new Usuario(req.body);

            const usuarioResultado = await usuario.save();

            res.status(201).json({
                message: 'Usuário criado com sucesso.',
                data: usuarioResultado
            });
        } catch(erro){
            next(erro);
        }
    }

    static atualizarUsuario = async (req, res, next) => {
      try {
        const id = req.params.id;
  
        // 1. Verifica se o ID é válido (ObjectId)
        if (!mongoose.isValidObjectId(id)) {
          throw new ErroRequisicao(`O ID {${id}} não é um ObjectId válido.`);
        }
  
        // 2. Verifica se o documento existe
        const usuarioExistente = await Usuario.findById(id);
        if (!usuarioExistente) {
          throw new NaoEncontrado(`Usuário com id igual a {${id}} não encontrado.`);
        }
  
        // 3. Agora, checa se há campos inválidos
        const camposValidos = Object.keys(Usuario.schema.obj);
        const camposEnviados = Object.keys(req.body);
        const camposInvalidos = camposEnviados.filter(
          (campo) => !camposValidos.includes(campo)
        );
  
        if (camposInvalidos.length > 0) {
          const camposInvalidosStr = concatenarItensComVirgulaAndE(camposInvalidos);
          if (camposInvalidos.length === 1) {
            throw new ErroRequisicao(`Campo inválido: {${camposInvalidosStr}}`);
          } else {
            throw new ErroRequisicao(`Campos inválidos: {${camposInvalidosStr}}`);
          }
        }
  
        // 4. Se chegou aqui, o ID é válido, o documento existe e os campos são válidos
        const usuarioResultado = await Usuario.findByIdAndUpdate(
          id,
          { $set: req.body },
          { new: true }
        );
  
        res.status(200).json({
          message: `Usuário com id igual a {${id}} atualizado com sucesso.`,
          data: usuarioResultado,
        });
  
      } catch (erro) {
        next(erro);
      }
    }

  static deletarUsuario = async(req, res, next) =>{
    try {
      const id = req.params.id;

      // 1. Verifica se o ID é válido (ObjectId)
      if (!mongoose.isValidObjectId(id)) {
        throw new ErroRequisicao(`O ID {${id}} não é um ObjectId válido.`);
      }

      // 2. Verifica se o documento existe
      const usuarioExistente = await Usuario.findById(id);
      if (!usuarioExistente) {
        throw new NaoEncontrado(`Usuário com id igual a {${id}} não encontrado.`);
      }

      // 4. Se chegou aqui, o ID é válido, o documento existe
      const usuarioResultado = await Usuario.findByIdAndDelete(id);

      res.status(200).json({
        message: `Usuário com id igual a {${id}} deletado com sucesso.`,
        data: usuarioResultado,
      });

    } catch (erro) {
      next(erro);
    }
  }

  // Função para login
  static logarUsuario = async (req, res, next) => {
    try {
      const { email, senha } = req.body;

      // Procura o usuário pelo email
      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res.status(401).json({ message: "Email não encontrado no sistema." });
      }

      // Verifica se a senha está correta (compara o hash)
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ message: "Senha incorreta." });
      }

      // Se o login for bem-sucedido, gera um token JWT
      // Certifique-se de definir uma chave secreta (JWT_SECRET) em suas variáveis de ambiente
      const token = jwt.sign(
        { id: usuario._id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "Login realizado com sucesso.",
        token,
      });
    } catch (erro) {
      console.error(erro);
      next(erro);
    }
  }
}

export default UsuarioController;