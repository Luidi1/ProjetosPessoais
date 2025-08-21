// src/models/Usuario.js
import mongoose from "mongoose";
import { enderecoSchema, anexarUsuarioHooks } from "./utils/UsuarioHelpers.js";
import { concatenarItensComVirgulaAndE } from "../utils/formatarMensagens.js";
import { EhEmailValido } from "../utils/validacoes/emailValidacao.js";
import { erroCampoObrigatorio } from "../utils/mensagensErroUsuario.js";
import * as crypto from "crypto";

const PERFIS = ["CLIENTE", "ADMINISTRADOR"];

// ✅ obrigatório em PROD e TEST; opcional só em DEVELOPMENT
const isDev = process.env.NODE_ENV === "development";

export const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: !isDev ? [true, erroCampoObrigatorio("Nome")] : false,
    },
    data_nascimento: {
      type: Date,
      required: !isDev
        ? [true, erroCampoObrigatorio("Data de Nascimento")]
        : false,
      validate: [
        {
          validator: function (value) {
            return value >= new Date("1900-01-01");
          },
          message: "A data deve ser a partir de 1900-01-01.",
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
          message: "O usuário deve ter pelo menos 18 anos.",
        },
      ],
    },
    endereco: {
      type: enderecoSchema,
      required: !isDev ? [true, erroCampoObrigatorio("Endereço")] : false,
    },
    email: {
      type: String,
      required: !isDev ? [true, erroCampoObrigatorio("Email")] : false,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [
        {
          validator: EhEmailValido,
          message: "Por favor, insira um e-mail válido",
        },
      ],
    },
    senha: {
      type: String,
      required: !isDev ? [true, erroCampoObrigatorio("Senha")] : false,
    },
    perfil: {
      type: String,
      uppercase: true,
      enum: {
        values: PERFIS,
        message: (props) =>
          `Perfil inválido. Os valores permitidos são: ${concatenarItensComVirgulaAndE(
            PERFIS
          )}.`,
      },
      default: PERFIS[0],
    },
    isVerified: {
      type: Boolean,
      default: process.env.NODE_ENV === "test" ? true : false,
    },
    // token de confirmação gerado automaticamente
    verifyToken: {
      type: String,
      default: () => crypto.randomBytes(16).toString("hex"),
      select: false, // não retorna por padrão nas consultas
    },
  },
  {
    id: false,
  }
);

anexarUsuarioHooks(usuarioSchema);

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
