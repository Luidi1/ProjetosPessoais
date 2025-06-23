import Usuario from "../models/Usuario.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import NaoEncontrado from "../erros/NaoEncontrado.js";
import ErroRequisicao from "../erros/ErroRequisicao.js";
import { concatenarItensComVirgulaAndE, formatarListaDeMensagens } from "../utils/formatarMensagens.js";
import mongoose from "mongoose";
import * as usuariosHelpers from "./utils/usuariosHelpers.js";
import ErroCampoDuplicado from "../erros/ErroCampoDuplicado.js";
import { erroCampoObrigatorio, erroCamposObrigatorios, erroCampoInvalido, erroCamposInvalidos } from '../utils/mensagensErroUsuario.js';
import EhEmailValido from '../utils/validacoes/emailValidacao.js'
import { erroFormatoEmail } from '../utils/validacoes/mensagensErroValidacao.js'
import { sendVerificationEmail } from "../servicos/ServicoEmail.js";

class UsuarioController {

  static listarUsuarios = (req, res, next) => {
    try {
      // Em vez de Usuario.find(), passe o Model puro
      req.resultado = Usuario.find();
      return next();
    } catch (erro) {
      return next(erro);
    }
  }


  static listarUsuarioPorId = async (req, res, next) => {

    try {
      const id = req.params.id;

      const usuarioResultado = await Usuario.findById(id);

      if (usuarioResultado) {
        res.status(200).json(usuarioResultado);
      } else {
        throw new NaoEncontrado(`Usuário com id igual a {${id}} não encontrado`);
      }
    } catch (erro) {
      next(erro);
    }
  }

  static listarUsuariosPorFiltro = async (req, res, next) => {
    try {
      // 1. Executa verificações individuais (agora incluindo perfil e email)
      const [erroNome, erroDataNascimento, erroPerfil, erroEmail] = await Promise.all([
        usuariosHelpers.verificarFiltroNome(req.query),
        usuariosHelpers.verificarFiltroData_nascimento(req.query),
        usuariosHelpers.verificarFiltroPerfil(req.query),
        usuariosHelpers.verificarFiltroEmail(req.query)
      ]);

      // 2. Se qualquer filtro isolado não tiver resultado, retorna o erro
      const erros = [erroNome, erroDataNascimento, erroPerfil, erroEmail].filter(msg => msg !== null);
      if (erros.length > 0) {
        const mensagemFinal = formatarListaDeMensagens(erros);
        throw new NaoEncontrado(mensagemFinal);
      }

      // 3. Se todas as verificações passarem, constrói a busca combinada
      const busca = await usuariosHelpers.processaBusca(req.query);
      req.resultado = Usuario.find(busca);

      next();
    } catch (erro) {
      next(erro);
    }
  }

  static cadastrarUsuario = async (req, res, next) => {
    try {
      // 1) Cria e salva o usuário
      const usuario = new Usuario(req.body);
      const usuarioResultado = await usuario.save();
  
      // 2) Dispara o e-mail (não bloqueia testes)
      await sendVerificationEmail(
        usuarioResultado.email,
        usuarioResultado.verifyToken
      );
  
      // 3) Constrói o objeto de retorno:
      //    - base: todos os campos salvos (inclui _id)
      //    - em test: adiciona o verifyToken para facilitar Postman/Jest
      const base = usuarioResultado.toObject();
      const data = process.env.NODE_ENV === 'test'
        ? { ...base, verifyToken: usuarioResultado.verifyToken }
        : base;
  
      // 4) Retorna 201 com o objeto completo
      return res.status(201).json({
        message: 'Usuário criado com sucesso.',
        data
      });
    } catch (erro) {
      if (erro.code === 11000) {
        return next(new ErroCampoDuplicado(erro));
      }
      next(erro);
    }
  };
  

  static confirmarUsuario = async (req, res, next) => {
    try {
      const { token } = req.params;
      // precisa do select para pegar o verifyToken escondido
      const usuario = await Usuario.findOne({ verifyToken: token }).select('+verifyToken');
      if (!usuario) {
        throw new ErroRequisicao('Token inválido ou expirado.');
      }
      usuario.isVerified  = true;
      usuario.verifyToken = undefined;
      await usuario.save();
      return res.status(200).json({ message: 'E-mail confirmado com sucesso!' });
    } catch (erro) {
      next(erro);
    }
  }
  

  static atualizarUsuario = async (req, res, next) => {
    try {
      const id = req.params.id;
      // 1) Verifica se o ID é válido (ObjectId)
      if (!mongoose.isValidObjectId(id)) {
        throw new ErroRequisicao(`O ID {${id}} não é um ObjectId válido.`);
      }

      // 2) Verifica se o documento existe
      const usuarioExistente = await Usuario.findById(id);
      if (!usuarioExistente) {
        throw new NaoEncontrado(`Usuário com id igual a {${id}} não encontrado.`);
      }

      // 3) Checa se há campos inválidos
      const camposValidos = Object.keys(Usuario.schema.obj);
      const camposEnviados = Object.keys(req.body);
      const camposInvalidos = camposEnviados.filter(
        c => !camposValidos.includes(c)
      );

      if (camposInvalidos.length > 0) {
        if (camposInvalidos.length === 1) {
          // só um campo inválido
          throw new ErroRequisicao(
            erroCampoInvalido(camposInvalidos[0])
          );
        } else {
          // mais de um campo inválido
          throw new ErroRequisicao(
            erroCamposInvalidos(camposInvalidos)
          );
        }
      }


      // 4) Atualiza o usuário com validações de schema
      const usuarioResultado = await Usuario.findByIdAndUpdate(
        id,
        { $set: req.body },
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      );

      res.status(200).json({
        message: `Usuário com id igual a {${id}} atualizado com sucesso.`,
        data: usuarioResultado
      });
    } catch (erro) {
      next(erro);
    }
  };



  static deletarUsuario = async (req, res, next) => {
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

  static deletarTodosUsuarios = async (req, res, next) => {
    try {
      // Obter lista de IDs de exceção do corpo da requisição
      const { excecoes } = req.body; // espera um array de strings

      // Construir filtro para exclusão
      const filtro = {};
      if (Array.isArray(excecoes) && excecoes.length > 0) {
        // Validar formato de cada ID
        const invalidos = excecoes.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidos.length > 0) {
          // Mensagem de ID inválido
          return res.status(400).json({ mensagem: erroFormatoIdInvalido(invalidos.join(",")) });
        }
        // Filtrar _id que NÃO estejam nas exceções
        filtro._id = { $nin: excecoes };
      }

      // Executa remoção
      const resultado = await Usuario.deleteMany(filtro);

      // Preparar dados de resposta
      const responseData = { totalUsuariosDeletados: resultado.deletedCount };
      if (Array.isArray(excecoes) && excecoes.length > 0) {
        if (excecoes.length === 1) {
          responseData['Exceção'] = 1;
        } else {
          responseData['Exceções'] = excecoes.length;
        }
      }

      // Responde com status 200 e detalhes
      return res.status(200).json({
        message: 'Todos os usuários foram deletados com sucesso.',
        data: responseData
      });
    } catch (erro) {
      return next(erro);
    }
  }

  // Função para login
  static logarUsuario = async (req, res, next) => {
    try {
      const { email, senha } = req.body;

      // 1) Validação de campos obrigatórios
      const camposFaltando = [];
      if (!email) camposFaltando.push('Email');
      if (!senha) camposFaltando.push('Senha');

      if (camposFaltando.length > 0) {
        const mensagem = camposFaltando.length > 1
          ? erroCamposObrigatorios(camposFaltando)
          : erroCampoObrigatorio(camposFaltando[0]);
        return res.status(400).json({ message: mensagem });
      }

      // 2) Validação de formato de e-mail
      if (!EhEmailValido(email)) {
        return res.status(400).json({ message: erroFormatoEmail('email') });
      }

      // 3) Procura o usuário pelo e-mail
      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res
          .status(401)
          .json({ message: 'Email não encontrado no sistema.' });
      }

      // 4) Verifica se a senha está correta
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res
          .status(401)
          .json({ message: 'Senha incorreta.' });
      }

      // 5) Gera o token JWT
      const token = jwt.sign(
        { id: usuario._id, email: usuario.email, perfil: usuario.perfil },
        process.env.JWT_SECRET
      );

      // 6) Retorna sucesso
      res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
      });
    } catch (erro) {
      console.error(erro);
      next(erro);
    }
  };
}

export default UsuarioController;