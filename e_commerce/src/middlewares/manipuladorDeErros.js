import mongoose from "mongoose";
import formatarMensagens from "../utils/formatarMensagens.js";

function manipuladorDeErros(erro, req, res, next) {
  // Se for ValidationError, vamos ordenar as mensagens de acordo com a ordem do schema
  if (erro instanceof mongoose.Error.ValidationError) {
    // 1. Descobre o nome do modelo a partir de erro._message (ex.: "Produto validation failed")
    const modelName = getModelNameFromError(erro);

    // 2. Obtém o schema do modelo, se existir
    let schemaFields = [];
    if (modelName && mongoose.models[modelName]) {
      const schema = mongoose.models[modelName].schema;
      // 3. Extrai os campos na ordem em que foram definidos
      schemaFields = getFieldsInSchemaOrder(schema);
    }

    // 4. Monta as mensagens nessa ordem
    const mensagensCampos = [];

    // 4.1. Primeiro, percorre os campos do schema na ordem definida
    schemaFields.forEach((campo) => {
      const subErro = erro.errors[campo];
      if (subErro) {
        mensagensCampos.push(formatarSubErro(campo, subErro));
      }
    });

    // 4.2. Depois, se houver erros em campos não listados no schema (ex.: subdocs extras)
    for (const [campo, subErro] of Object.entries(erro.errors)) {
      if (!schemaFields.includes(campo)) {
        mensagensCampos.push(formatarSubErro(campo, subErro));
      }
    }

    // 5. Aplica sua formatação de pontuação (ponto-e-vírgula etc.)
    const mensagemFinal = formatarMensagens(mensagensCampos);

    return res.status(400).json({ message: mensagemFinal });
  }

  // Se for CastError "isolado"
  else if (erro instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `O campo "${erro.path}" recebeu um valor inválido.`
    });
  }


  // Outros erros
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

/**
 * Extrai o nome do modelo a partir de `erro._message`,
 * que costuma vir como "Produto validation failed".
 */
function getModelNameFromError(validationError) {
  if (validationError._message) {
    // Remove a parte " validation failed"
    return validationError._message.replace(' validation failed', '');
  }
  return null;
}

/**
 * Retorna os campos na ordem em que foram definidos no schema.
 * Filtra _id e __v, se não quiser exibi-los.
 */
function getFieldsInSchemaOrder(schema) {
  const allPaths = Object.keys(schema.paths); // Tende a refletir a ordem de definição
  return allPaths.filter(path => !['_id', '__v'].includes(path));
}

/**
 * Formata cada subErro de acordo com CastError, required, etc.
 * Mantém a mesma lógica que você já usa no map(subErro => {...}).
 */
function formatarSubErro(campo, subErro) {
  if (subErro.name === 'CastError') {
    return `O campo ${campo} recebeu o tipo ${typeof subErro.value} (valor: ${subErro.value}), mas espera receber ${subErro.kind}.`;
  } else if (subErro.kind === 'required') {
    return subErro.message; // "O nome do produto é obrigatório."
  } else {
    return subErro.message; // Outros tipos de validação
  }
}

export default manipuladorDeErros;

/*function manipuladorDeErros(erro, req, res, next) {
    if (erro instanceof mongoose.Error.ValidationError) {
      const mensagensCampos = Object.values(erro.errors).map(subErro => {
        if (subErro.name === 'CastError') {
          return `O campo ${subErro.path} recebeu o tipo ${typeof subErro.value} (valor: ${subErro.value}), mas espera receber ${subErro.kind}.`;
        } else if (subErro.kind === 'required') {
          return subErro.message;
        } else {
          return subErro.message;
        }
      });
  
      // Usa a função de formatação
      const mensagemFinal = formatarMensagens(mensagensCampos);

      return res.status(400).json({ message: mensagemFinal });
    }
  
    if (erro instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        message: `O campo "${erro.path}" recebeu um valor inválido.`
      });
    }
  
    return res.status(500).json({ message: 'Erro interno do servidor.' });
}*/
