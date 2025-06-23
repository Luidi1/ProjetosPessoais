import mongoose from "mongoose";
import { enderecoSchema, anexarUsuarioHooks } from './utils/UsuarioHelpers.js';
import { concatenarItensComVirgulaAndE } from '../utils/formatarMensagens.js';
import { EhEmailValido } from "../utils/validacoes/emailValidacao.js";
import { erroCampoObrigatorio } from '../utils/mensagensErroUsuario.js';
import * as crypto from 'crypto';

const PERFIS = ['CLIENTE', 'ADMINISTRADOR'];
const isProd = process.env.NODE_ENV === 'production';

export const usuarioSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: [true, erroCampoObrigatorio('Nome')]
  },
  data_nascimento: {
    type: Date,
    required: [true, erroCampoObrigatorio('Data de Nascimento')],
    validate: [
      {
        validator: function (value) {
          return value >= new Date('1900-01-01');
        },
        message: 'A data deve ser a partir de 1900-01-01.'
      },
      {
        validator: function (value) {
          const today = new Date();
          const minAgeDate = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
          );
          return value <= minAgeDate;
        },
        message: 'O usuário deve ter pelo menos 18 anos.'
      }
    ]
  },
  endereco: {
    type: enderecoSchema,
    required: isProd 
      ? [true, erroCampoObrigatorio('Endereço')] 
      : false
  },
  email: {
    type: String,
    required: [true, erroCampoObrigatorio('Email')],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [
      {
        validator: EhEmailValido,
        message: 'Por favor, insira um e-mail válido'
      }
    ]
  },
  senha: {
    type: String,
    required: [true, erroCampoObrigatorio('Senha')],
  },
  perfil: {
    type: String,
    uppercase: true,
    enum: {
      values: PERFIS,
      // use a função para montar a string corretamente
      message: props =>
        `Perfil inválido. Os valores permitidos são: ${
          concatenarItensComVirgulaAndE(PERFIS)
        }.`
    },
    default: PERFIS[0]
  },
  isVerified: {
    type: Boolean,
    default: process.env.NODE_ENV === 'test' ? true : false
  },
  // Novo! token de confirmação gerado automaticamente
  verifyToken: {
    type: String,
    default: () => crypto.randomBytes(16).toString('hex'),
    select: false    // não retorna por padrão nas consultas
  }
}, {
  id: false
});

anexarUsuarioHooks(usuarioSchema);

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;