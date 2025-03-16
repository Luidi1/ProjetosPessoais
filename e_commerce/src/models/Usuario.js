import mongoose from "mongoose";
import { enderecoSchema, anexarUsuarioHooks } from './utils/UsuarioHelpers.js';
import TipoData from "./utils/tipoData.js";

export const usuarioSchema = new mongoose.Schema({
  nome: { type: String },
  data_nascimento: {
    type: TipoData,
    min: [new Date('1900-01-01'), 'A data deve ser a partir de 01/01/1900.'],
    validate: {
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
  },
  endereco: enderecoSchema,
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\S+@\S+\.\S+$/,
      'Por favor, insira um e-mail válido'
    ]
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatório'],
  }
});

anexarUsuarioHooks(usuarioSchema);

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;