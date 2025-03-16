// tipoData.js
import mongoose from "mongoose";

class TipoData extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, "TipoData");
  }

  cast(val) {
    // Se não for string, lança CastError custom
    if (typeof val !== "string") {
      // Passa os 3 primeiros parâmetros (tipo, valor, path)
      const err = new mongoose.SchemaType.CastError("TipoData", val, this.path);
      // Agora, sobrescreve a mensagem
      err.message = `O campo {${this.path}} deve ser uma string no formato {YYYY-MM-DD}. Recebido: ${val}`;
      throw err;
    }

    // Regex para o formato "YYYY-MM-DD"
    const padrao = /^\d{4}-\d{2}-\d{2}$/;
    if (!padrao.test(val)) {
      const err = new mongoose.SchemaType.CastError("TipoData", val, this.path);
      err.message = `O campo {${this.path}} deve estar no formato {YYYY-MM-DD}. Recebido: ${val}`;
      throw err;
    }

    // Tenta converter para objeto Date
    const data = new Date(val);
    if (isNaN(data.getTime())) {
      const err = new mongoose.SchemaType.CastError("TipoData", val, this.path);
      err.message = `Data inválida: ${val}`;
      throw err;
    }

    return data;
  }
}

mongoose.Schema.Types.TipoData = TipoData;
export default TipoData;
