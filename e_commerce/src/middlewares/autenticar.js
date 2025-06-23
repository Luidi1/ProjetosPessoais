// src/middlewares/autenticar.js
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export default async function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'Token não fornecido.' });
  }

  // formata: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res
      .status(401)
      .json({ message: 'Formato de token inválido.' });
  }

  const token = parts[1];
  try {
    // Usa fallback para 'testsecret' quando JWT_SECRET não estiver definido em test
    const secret  = process.env.JWT_SECRET || 'testsecret';
    const payload = jwt.verify(token, secret);

    // Busca o usuário no banco para checar verificação de e-mail
    const usuario = await Usuario.findById(payload.id);
    if (!usuario) {
      return res
        .status(401)
        .json({ message: 'Usuário não encontrado.' });
    }
    if (!usuario.isVerified) {
      return res
        .status(403)
        .json({ message: 'Você precisa confirmar seu e-mail antes de logar.' });
    }

    // coloca o ID, email e perfil do usuário no request
    req.user = {
      id:     payload.id,
      email:  payload.email,
      perfil: payload.perfil
    };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Token inválido ou expirado.' });
  }
}
