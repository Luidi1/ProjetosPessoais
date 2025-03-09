import Usuario from "../models/Usuario.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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