import mongoose from "mongoose";

async function connectDB() {
  try {
    const db = mongoose.connection;

    db.on("error", () =>
      console.log.bind(console, "Erro de conexão com o banco de dados")
    );
    db.once("open", () =>
      console.log("Conexão com o banco feita com sucesso")
    );

  const uri =
    process.env.NODE_ENV === "test"
      ? process.env.MONGO_URI_TEST
      : process.env.NODE_ENV === "production"
        ? process.env.STRING_CONEXAO_PROD   // definido no .env.prod
        : process.env.STRING_CONEXAO_DB;    // definido no .env (dev)


    await mongoose.connect(uri);
    return db;
  } catch (erro) {
    console.error("Erro na conexão com o banco de dados", erro);
  }
}

export default connectDB;
