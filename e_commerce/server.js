import dotenv from "dotenv";

// 1) carrega o .env (desenvolvimento por padrão)
dotenv.config();

// 2) se for teste, carrega por cima o .env.test
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
}

import app from "./src/app.js";

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor escutando em http://localhost:${port}`);
});