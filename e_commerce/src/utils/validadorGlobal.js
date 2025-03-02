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
