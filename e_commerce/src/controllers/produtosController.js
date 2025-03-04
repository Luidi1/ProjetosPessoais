import NaoEncontrado from "../erros/NaoEncontrado.js";
import produtos from "../models/Produto.js"
import formatarMensagens from "../utils/formatarMensagens.js";

class ProdutoController{
    static listarProdutos = async(req, res, next) =>{
        try{
            const resultadoProdutos = await produtos.find()

            res.status(200).json(resultadoProdutos);
        } catch(erro){
            console.error(erro);
        }
    }

    static listarProdutoPorFiltro = async (req, res, next) => {
        try {
          // 1. Executa verificações individuais
          const [erroNome, erroPreco, erroEstoque] = await Promise.all([
            verificarFiltroNome(req.query),
            verificarFiltroPreco(req.query),
            verificarFiltroEstoque(req.query)
          ]);
    
          // 2. Se qualquer filtro isolado não tiver resultado, retorna o erro
          const erros = [erroNome, erroPreco, erroEstoque].filter(msg => msg !== null);
          if (erros.length > 0) {
            // Formata a mensagem unindo com "; " e finalizando com "."
            const mensagemFinal = formatarMensagens(erros);
            throw new NaoEncontrado(mensagemFinal);
          }
          
          // 3. Se todas as verificações passarem, constrói a busca combinada
          const busca = await processaBusca(req.query);
          const resultadoProdutos = await produtos.find(busca);
          return res.status(200).json(resultadoProdutos);
          
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
                throw new NaoEncontrado(`produto com id igual a ${id} não encontrado`);
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
                    message: `Livro com id igual a ${id} foi deletado com sucesso.`,
                    data: produtoResultado
                });
            } else{
                throw new NaoEncontrado(`produto com id igual a ${id} não encontrado`);
            }
        } catch(erro){
            next(erro);
        }
    }   
}

export async function verificarFiltroNome(queryParams) {
    const { nome } = queryParams;
    if (!nome) return null; // Se não houver filtro, não retorna erro
    const resultado = await produtos.find({ nome: { $regex: nome, $options: "i" } });
    if (resultado.length === 0) {
      return `Nenhum produto com o NOME igual a ${nome.toUpperCase()} encontrado.`;
    }
    return null;
}

export async function verificarFiltroPreco(queryParams) {
  const { minPreco, maxPreco } = queryParams;
  if (!minPreco && !maxPreco) return null; // Se não houver filtro, não retorna erro
  
  const busca = {};
  if (minPreco) busca.preco = { $gte: Number(minPreco) };
  if (maxPreco) {
    busca.preco = busca.preco || {};
    busca.preco.$lte = Number(maxPreco);
  }
  
  const resultado = await produtos.find(busca);
  if (resultado.length === 0) {
    if (minPreco && maxPreco) {
      return `Nenhum produto com PREÇO entre ${minPreco} e ${maxPreco} encontrado.`;
    } else if (minPreco) {
      return `Nenhum produto com PREÇO MÍNIMO igual a ${minPreco} encontrado.`;
    } else if (maxPreco) {
      return `Nenhum produto com PREÇO MÁXIMO igual a ${maxPreco} encontrado.`;
    }
  }
  return null;
}

export async function verificarFiltroEstoque(queryParams) {
  const { minEstoque, maxEstoque } = queryParams;
  if (!minEstoque && !maxEstoque) return null; // Se não houver filtro, não retorna erro
  
  const busca = {};
  if (minEstoque) busca.estoque = { $gte: Number(minEstoque) };
  if (maxEstoque) {
    busca.estoque = busca.estoque || {};
    busca.estoque.$lte = Number(maxEstoque);
  }
  
  const resultado = await produtos.find(busca);
  if (resultado.length === 0) {
    if (minEstoque && maxEstoque) {
      return `Nenhum produto com ESTOQUE entre ${minEstoque} e ${maxEstoque} encontrado.`;
    } else if (minEstoque) {
      return `Nenhum produto com ESTOQUE MÍNIMO igual a ${minEstoque} encontrado.`;
    } else if (maxEstoque) {
      return `Nenhum produto com ESTOQUE MÁXIMO igual a ${maxEstoque} encontrado.`;
    }
  }
  return null;
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