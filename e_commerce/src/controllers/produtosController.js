import NaoEncontrado from "../erros/NaoEncontrado.js";
import produtos from "../models/Produto.js"
import {formatarListaDeMensagens} from "../utils/formatarMensagens.js";
import * as produtosHelpers from "./utils/produtosHelpers.js";

class ProdutoController{
    static listarProdutos = async(req, res, next) =>{
        try{
            const resultadoProdutos = produtos.find()

            req.resultado = resultadoProdutos;

            next();
        } catch(erro){
            console.error(erro);
        }
    }

    static listarProdutoPorFiltro = async (req, res, next) => {
        try {
          // 1. Executa verificações individuais
          const [erroNome, erroPreco, erroEstoque] = await Promise.all([
            produtosHelpers.verificarFiltroNome(req.query),
            produtosHelpers.verificarFiltroPreco(req.query),
            produtosHelpers.verificarFiltroEstoque(req.query)
          ]);
    
          // 2. Se qualquer filtro isolado não tiver resultado, retorna o erro
          const erros = [erroNome, erroPreco, erroEstoque].filter(msg => msg !== null);
          if (erros.length > 0) {
            // Formata a mensagem unindo com "; " e finalizando com "."
            const mensagemFinal = formatarListaDeMensagens(erros);
            throw new NaoEncontrado(mensagemFinal);
          }
          
          // 3. Se todas as verificações passarem, constrói a busca combinada
          const busca = await produtosHelpers.processaBusca(req.query);
          const resultadoProdutos = produtos.find(busca);
          req.resultado = resultadoProdutos;

          next();
        } catch (erro) {
          console.error(erro);
          next(erro);
        }
    }

    static listarProdutoPorId = async(req, res, next) =>{
        try{
            const id = req.params.id;

            const produtoResultado = await produtos.findById(id);

            if(produtoResultado !== null){
                res.status(200).json(produtoResultado);
            } else{
              throw new NaoEncontrado(`Produto com id igual a ${id} não encontrado`);
            }
        } catch(erro){
            next(erro);
        }
    }

    static cadastrarProduto = async(req, res, next) =>{
        try{
            let produto = new produtos(req.body);

            const produtoResultado = await produto.save();

            res.status(201).json({
                message: 'Produto criado com sucesso!',
                data: produtoResultado});
        } catch(erro){
            console.error(erro);
            next(erro);
        }
    }

    static atualizarProduto = async(req, res, next) =>{
        try{
            const id = req.params.id;

            const produtoResultado = await produtos.findByIdAndUpdate(id, {$set: req.body}, {new: true});

            if(produtoResultado !== null){
                res.status(200).json({
                    message: `Produto com id igual a {${id}} atualizado com sucesso.`,
                    data: produtoResultado
                });
            } else{
                throw new NaoEncontrado(`Produto com id igual a {${id}} não encontrado.`);
            }
        } catch(erro){
            next(erro);
        }
    }

    static deletarProduto = async(req, res, next) =>{
        try{
            const id = req.params.id;
    
            const produtoResultado = await produtos.findByIdAndDelete(id);
    
            if(produtoResultado !== null){
                res.status(200).json({
                    message: `Produto com id igual a ${id} foi deletado com sucesso.`,
                    data: produtoResultado
                });
            } else{
                throw new NaoEncontrado(`Produto com id igual a ${id} não encontrado`);
            }
        } catch(erro){
            next(erro);
        }
    }   
}

export default ProdutoController;