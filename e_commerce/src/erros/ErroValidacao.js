// src/erros/ErroValidacao.js
import mongoose from "mongoose";
import ErroBase from "./erroBase.js";
import {
  erroCampoObrigatorio,
  erroCamposObrigatorios
} from "../utils/mensagensErroUsuario.js";
import { formatarListaDeMensagens } from "../utils/formatarMensagens.js";

export default class ErroValidacao extends ErroBase {
  constructor(erroValidacao) {
    super("Erro de validação", 400);
    this.erroValidacao = erroValidacao;
  }

  enviarResposta(res) {
    // 1) Descobre nome do modelo (útil para ordernar campos do schema)
    const modelName = getModelNameFromError(this.erroValidacao);

    // 2) Pega campos na ordem do schema
    let schemaFields = [];
    if (modelName && mongoose.models[modelName]) {
      schemaFields = getFieldsInSchemaOrder(
        mongoose.models[modelName].schema
      );
    }

    // 3) Qualquer campo adicional que esteja em erro, mas não no schema
    const extraFields = Object.keys(this.erroValidacao.errors).filter(
      f => !schemaFields.includes(f)
    );
    const allFields = [...schemaFields, ...extraFields];

    // 4) Separa labels de required de outras mensagens
    const requiredLabels = [];
    const otherMsgs = [];

    allFields.forEach(field => {
      const subErro = this.erroValidacao.errors[field];
      if (!subErro) return;

      if (subErro.kind === "required") {
        requiredLabels.push(mapFieldLabel(field));
      } else {
        otherMsgs.push(formatarSubErro(field, subErro));
      }
    });

    // 5) Gera a parte de campos obrigatórios
    let mensagemFinal = "";
    if (requiredLabels.length > 1) {
      mensagemFinal = erroCamposObrigatorios(requiredLabels);
    } else if (requiredLabels.length === 1) {
      mensagemFinal = erroCampoObrigatorio(requiredLabels[0]);
    }

    // 6) Anexa outras mensagens, se existirem
    if (otherMsgs.length) {
      const resto =
        otherMsgs.length > 1
          ? formatarListaDeMensagens(otherMsgs)
          : otherMsgs[0];
      mensagemFinal = mensagemFinal
        ? `${mensagemFinal}; ${resto}`
        : resto;
    }

    return res.status(this.status).json({ message: mensagemFinal });
  }
}

// ==== helpers ====

function mapFieldLabel(campo) {
  switch (campo) {
    case "nome":
      return "Nome";
    case "data_nascimento":
      return "Data de Nascimento";
    case "endereco":
      return "Endereço";
    case "email":
      return "Email";
    case "senha":
      return "Senha";
    default:
      // fallback genérico (sem acentos nem “de”)
      return campo
        .replace(/_/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());
  }
}

function getModelNameFromError(validationError) {
  if (validationError._message) {
    return validationError._message.replace(" validation failed", "");
  }
  return null;
}

function getFieldsInSchemaOrder(schema) {
  return Object.keys(schema.paths).filter(
    p => !["_id", "__v"].includes(p)
  );
}

function formatarSubErro(field, subErro) {
  if (subErro.name === "CastError") {
    return `O campo ${mapFieldLabel(
      field
    )} recebeu tipo inválido (valor: ${subErro.value}).`;
  }
  return subErro.message;
}
