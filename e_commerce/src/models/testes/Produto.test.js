// produto.test.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Produto from '../Produto.js'; // Ajuste o caminho conforme seu projeto

let mongoServer;

describe('Testes do Schema de Produto', () => {
  // Sobe o Mongo em memória antes de todos os testes
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // Limpa a base de dados após cada teste, para isolar cenários
  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // Desconecta e para o servidor em memória após todos os testes
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Deve criar um produto com campos obrigatórios válidos', async () => {
    const produto = new Produto({
      nome: 'Produto Teste',
      preco: 9.99,
      estoque: 10,
    });
    const savedProduto = await produto.save();

    expect(savedProduto._id).toBeDefined();
    expect(savedProduto.nome).toBe('Produto Teste');
    expect(savedProduto.preco).toBe(9.99);
    expect(savedProduto.estoque).toBe(10);
  });

  it('Deve dar erro se o nome não for informado', async () => {
    const produtoSemNome = new Produto({
      preco: 9.99,
      estoque: 10,
    });
    let error;
    try {
      await produtoSemNome.validate(); // ou produtoSemNome.save()
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.errors.nome).toBeDefined();
    expect(error.errors.nome.message).toBe('O nome do produto é obrigatório.');
  });

  it('Deve dar erro se o preco não for informado', async () => {
    const produtoSemPreco = new Produto({
      nome: 'Produto Teste',
      estoque: 5,
    });
    let error;
    try {
      await produtoSemPreco.validate();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.errors.preco).toBeDefined();
    expect(error.errors.preco.message).toBe('O preço do produto é obriagatório.');
  });

  it('Deve dar erro se o estoque não for informado', async () => {
    const produtoSemEstoque = new Produto({
      nome: 'Produto Teste',
      preco: 9.99,
    });
    let error;
    try {
      await produtoSemEstoque.validate();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.errors.estoque).toBeDefined();
    expect(error.errors.estoque.message).toBe('O estoque do produto é obrigatório');
  });

  it('Deve aceitar campos opcionais (descricao, categoria, imagem, marca)', async () => {
    const produtoCompleto = new Produto({
      nome: 'Produto Completo',
      preco: 19.99,
      estoque: 5,
      descricao: 'Uma descrição de teste',
      categoria: 'Categoria Teste',
      imagem: 'http://url-imagem.com/foto.png',
      marca: 'Marca Teste',
    });
    const savedProduto = await produtoCompleto.save();

    expect(savedProduto.descricao).toBe('Uma descrição de teste');
    expect(savedProduto.categoria).toBe('Categoria Teste');
    expect(savedProduto.imagem).toBe('http://url-imagem.com/foto.png');
    expect(savedProduto.marca).toBe('Marca Teste');
  });

  it('Deve usar Date.now como default para dataCriacao e dataAtualizacao', async () => {
    const produto = new Produto({
      nome: 'Produto Data',
      preco: 10,
      estoque: 2,
    });
    const savedProduto = await produto.save();

    expect(savedProduto.dataCriacao).toBeInstanceOf(Date);
    expect(savedProduto.dataAtualizacao).toBeInstanceOf(Date);

    // Verifica se a data está próxima ao "agora"
    const now = Date.now();
    const createdTime = savedProduto.dataCriacao.getTime();
    expect(Math.abs(now - createdTime)).toBeLessThan(2000); // diferença < 2s
  });

  it('Não atualiza automaticamente dataAtualizacao ao atualizar o produto', async () => {
    // Por padrão, sem "timestamps: true", o campo dataAtualizacao não muda sozinho
    const produto = new Produto({
      nome: 'Produto Atualizado',
      preco: 15,
      estoque: 3,
    });
    const savedProduto = await produto.save();
    const oldUpdatedAt = savedProduto.dataAtualizacao;

    // Espera um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Altera algo
    savedProduto.nome = 'Produto Atualizado 2';
    const updatedProduto = await savedProduto.save();

    // dataAtualizacao não muda, pois não há hook configurado para isso
    expect(updatedProduto.dataAtualizacao.getTime()).toBe(oldUpdatedAt.getTime());
  });

  it('Permite definir manualmente dataAtualizacao, se desejado', async () => {
    const produto = new Produto({
      nome: 'Produto Manual',
      preco: 50,
      estoque: 10,
    });
    const savedProduto = await produto.save();
    const oldUpdatedAt = savedProduto.dataAtualizacao;

    // Define manualmente
    const newDate = new Date('2030-01-01');
    savedProduto.dataAtualizacao = newDate;
    const updatedProduto = await savedProduto.save();

    expect(updatedProduto.dataAtualizacao.getTime()).toBe(newDate.getTime());
    expect(updatedProduto.dataAtualizacao.getTime()).not.toBe(oldUpdatedAt.getTime());
  });
});