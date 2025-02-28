import express from "express";
import dbConnect from "./config/dbConnect.js";
import produtos from "./routes/produtosRoutes.js";

await dbConnect();
const app = express();
app.use(express.json());

app.use(produtos);

export default app;