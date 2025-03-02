import express from "express";
import dbConnect from "./config/dbConnect.js";
import produtos from "./routes/produtosRoutes.js";
import manipuladorDeErros from "./middlewares/manipuladorDeErros.js";

await dbConnect();
const app = express();
app.use(express.json());

app.use(produtos);
app.use(manipuladorDeErros);

export default app;