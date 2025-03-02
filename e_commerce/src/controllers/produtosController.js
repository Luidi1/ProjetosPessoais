import produtos from "../models/Produto.js"

class ProdutoController{
    static listarProdutos = async(req, res, next) =>{
        try{
            const resultadoProdutos = await produtos.find()

            res.status(200).json(resultadoProdutos);
        } catch(erro){
            console.error(erro);
        }
    }

    static listarProdutoPorFiltro = async(req, res, next) =>{
        try{
            const busca = await processaBusca(req.query);
            if(busca && Object.keys(busca).length > 0){
                const produtoResultado = await produtos.find(busca);
                if(produtoResultado.length > 0){
                    res.status(200).json(produtoResultado);
                } else{
                    res.status(404).send({
                        message: Object.keys(req.query).length === 1 
                            ? `Nenhum resultado encontrado com o parâmetro igual a ${Object.keys(req.query)}.`
                            : `Nenhum resultado encontrado com os parâmetros iguais a ${Object.keys(req.query).join(", ")}.`
                    }); /*Não consegui deixar as mensagens nesse formato: onde os parâmetros ficam em caixa alta, 
                        entre aspas duplas e no penúltimo para o último elemento apareça um "e" em vez de vírgula*/                 
                }
                
            } else{
                res.status(404).send({message: `O parâmetro de busca não foi informado.`});
            }
        } catch(erro){
            console.error(erro);
        }
    }

    static listarProdutoPorId = async(req, res, next) =>{
        try{
            const id = req.params.id;

            const produtoResultado = await produtos.findById(id);

            if(produtoResultado !== null){
                res.status(200).json(produtoResultado);
            } else{
                res.status(404).send({message: `produto com id igual a ${id} não encontrado`});
            }
        } catch(erro){
            console.error(erro);
        }
    }

    static cadastrarProduto = async(req, res, next) =>{
        try{
            let produto = new produtos(req.body);

            const produtoResultado = await produto.save();

            res.status(201).json(produtoResultado);
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
                    message: `Livro com id igual a ${id} atualizado com sucesso`,
                    data: produtoResultado});
            } else{
                res.status(404).send({message: `produto com id igual a ${id} não encontrado`});
            }
        } catch(erro){
            console.error(erro);
        }
    }

    static deletarProduto = async(req, res, next) =>{
        try{
            const id = req.params.id;
    
            const produtoResultado = await produtos.findByIdAndDelete(id);
    
            if(produtoResultado !== null){
                res.status(200).json({
                    message: `Livro com id igual a ${id} foi deletado com sucesso.`,
                    data: produtoResultado
                });
            } else{
                res.status(400).send({message: `produto com id igual a ${id} não encontrado`});
            }
        } catch(erro){
            console.error(erro);
        }
    }   
}

async function processaBusca(parametros){
    const {nome, minPreco, maxPreco, minEstoque, maxEstoque} = parametros;

    const busca = {};

    if(nome) busca.nome = {$regex: nome, $options: "i"};

    if(minPreco || maxPreco) busca.preco = {};

    if(minPreco) busca.preco.$gte = minPreco;
    if(maxPreco) busca.preco.$lte = maxPreco;

    if(minEstoque || maxEstoque) busca.estoque = {};

    if(minEstoque) busca.estoque.$gte = minEstoque;
    if(maxEstoque) busca.estoque.$lte = maxEstoque;

    return busca;

}

export default ProdutoController;