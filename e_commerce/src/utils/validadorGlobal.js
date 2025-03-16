import mongoose from "mongoose";

mongoose.Schema.Types.String.set("validate", {
    validator: (valor) => valor.trim() !== "",
    message: ({ path }) => `O campo ${path} foi fornecido em branco.`
});

mongoose.Schema.Types.Number.set("validate", {
    validator: function (valor) {
      return typeof valor === "number" && !isNaN(valor);
    },
    message: ({ path }) => `O campo "${path}" precisa ser um número válido.`
});

//Inútil, pois a conversão é feita primeiro, e se falhar dispara o erro e nao entrando aqui.
/*mongoose.Schema.Types.Date.set('validate', {
  validator: function (valor) {
    // Se for objeto Date, verifica se é válido
    if (valor instanceof Date) {
      return !isNaN(valor.getTime());
    }

    // Se for string, checa regex e converte
    if (typeof valor === 'string') {
      const padrao = /^\d{4}-\d{2}-\d{2}$/;
      if (!padrao.test(valor)) {
        return false;
      }
      const data = new Date(valor);
      return !isNaN(data.getTime());
    }

    // Se não for string nem Date, falha
    return false;
  },
  message: ({ path, value }) => 
    `O campo "${path}" deve estar no formato YYYY-MM-DD ou ser um objeto Date válido. Recebido: ${value}`
});*/
