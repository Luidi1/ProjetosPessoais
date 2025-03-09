import Usuario from "../models/Usuario.js";

class UsuarioController{
    static cadastrarUsuario = async(req, res, next) =>{
        try{
            let usuario = new Usuario(req.body);

            const usuarioResultado = await usuario.save();

            res.status(201).json({
                message: 'Usuário criado com sucesso',
                data: usuarioResultado
            });
        } catch(erro){
            next(erro);
        }
    }
}

export default UsuarioController;