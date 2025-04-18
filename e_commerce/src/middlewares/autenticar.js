// src/middlewares/autenticar.js
import jwt from 'jsonwebtoken';
import ErroRequisicao from '../erros/ErroRequisicao.js';

export default function autenticar(req, res, next) {
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
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // coloca o ID do usuário no request
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Token inválido ou expirado.' });
  }
}