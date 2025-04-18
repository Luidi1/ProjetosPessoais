import sobreescreverFormatoDateDoJson from "./config/sobreescreverFormatoDateDoJson.js";
sobreescreverFormatoDateDoJson();
import express from "express";
import dbConnect from "./config/dbConnect.js";
import produtos from "./routes/produtosRoutes.js";
import manipuladorDeErros from "./middlewares/manipuladorDeErros.js";
import manipulador404 from "./middlewares/manipulador404.js";
import usuario from "./routes/usuariosRoutes.js";
import carrinho from "./routes/carrinhoRoutes.js";
import reordenaJson from './middlewares/reordenaJson.js';

dbConnect();
const app = express();
app.use(express.json());
app.use(reordenaJson);

app.use(produtos);
app.use(usuario);
app.use(carrinho);
app.use(manipulador404);
app.use(manipuladorDeErros);

export default app;