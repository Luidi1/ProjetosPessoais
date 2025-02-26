import mongoose from "mongoose";

async function connectDB(){
    try{
       
        const db = mongoose.connection;

        db.on("error", () => console.log.bind(console, "Erro de conexão com o banco de dados"));
        db.once("open", () => console.log("conexão com o banco feita com sucesso"));
        await mongoose.connect(process.env.STRING_CONEXAO_DB);
        return db;
    } catch(erro){
        console.error("Erro na conexão com o banco de dados", erro);
    }
}

export default connectDB;