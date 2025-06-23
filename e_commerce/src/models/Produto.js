import mongoose from "mongoose";
import "../utils/validadorGlobal.js"

const produtoSchema = new mongoose.Schema({
    id: {type: String},
    nome: {
        type: String,
        required: [true, "O nome do produto é obrigatório."]
    },
    descricao: {type: String},
    preco: {
        type: Number,
        required: [true, "O preço do produto é obriagatório."]
    },
    estoque: {
        type: Number,
        required: [true, "O estoque do produto é obrigatório"]
    },
    categoria: {type: String},
    imagem: {type: String},
    marca: {type: String},
    dataCriacao: {type: Date, default: Date.now},
    dataAtualizacao: {type: Date, default: Date.now},
    
});

const Produto = mongoose.model("Produto", produtoSchema);

export default Produto;