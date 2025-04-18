import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';          // ajuste o caminho, se necessário
import Carrinho from '../../models/Carrinho.js';
import Produto from '../../models/Produto.js';

describe('CarrinhoController', () => {
  let token;
  let produtoId;

  beforeAll(async () => {
    // limpa o banco totalmente
    await mongoose.connection.dropDatabase();

    // cria um usuário e faz login para obter o token
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Teste Carrinho',
        data_nascimento: '1990-01-01',
        email: 'carrinho@test.com',
        senha: 'senha123'
      });

    const loginRes = await request(app)
      .post('/usuarios/login')
      .send({
        email: 'carrinho@test.com',
        senha: 'senha123'
      });
    token = loginRes.body.token;

    // cria um produto para usar no carrinho
    const prodRes = await request(app)
      .post('/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Produto Test', preco: 100, estoque: 10 });
    // no seu controller de produtos você devolve em data: { … }
    produtoId = prodRes.body.data._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /carrinho deve retornar carrinho vazio inicialmente', async () => {
    const res = await request(app)
      .get('/carrinho')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.itens).toEqual([]);
    expect(res.body.precoTotal).toBeUndefined();
  });

  it('POST /carrinho deve adicionar item e retornar apenas ele com precoItem', async () => {
    const res = await request(app)
      .post('/carrinho')
      .set('Authorization', `Bearer ${token}`)
      .send({ produto: produtoId, quantidade: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 
      'Item adicionado ao carrinho com sucesso.');
    expect(res.body).toHaveProperty('item');
    const item = res.body.item;
    expect(item).toHaveProperty('_id');
    expect(item).toHaveProperty('produto');
    expect(item.produto).toHaveProperty('_id', produtoId);
    expect(item).toHaveProperty('quantidade', 2);
    expect(item).toHaveProperty('precoItem', 200);
  });

  it('GET /carrinho deve listar o carrinho com precoTotal correto', async () => {
    const res = await request(app)
      .get('/carrinho')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.itens)).toBe(true);
    expect(res.body.itens).toHaveLength(1);
    // 2 unidades de R$100 = R$200
    expect(res.body.precoTotal).toBe(200);
  });

  it('PUT /carrinho/:itemId deve atualizar apenas a quantidade', async () => {
    // pega o itemId do carrinho atual
    const cart = await request(app)
      .get('/carrinho')
      .set('Authorization', `Bearer ${token}`);
    const itemId = cart.body.itens[0]._id;

    const res = await request(app)
      .put(`/carrinho/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantidade: 5 });

    expect(res.statusCode).toBe(200);
    const updatedItem = res.body.itens.find(i => i._id === itemId);
    expect(updatedItem.quantidade).toBe(5);
  });

  it('DELETE /carrinho/:itemId deve remover o item', async () => {
    // adiciona outro para testar remoção
    await request(app)
      .post('/carrinho')
      .set('Authorization', `Bearer ${token}`)
      .send({ produto: produtoId, quantidade: 1 });

    // agora são 2 itens (mesmo produto aparece acumulado)
    const cartBefore = await request(app)
      .get('/carrinho')
      .set('Authorization', `Bearer ${token}`);
    const itemId = cartBefore.body.itens[0]._id;

    const res = await request(app)
      .delete(`/carrinho/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.itens.find(i => i._id === itemId)).toBeUndefined();
  });

  it('DELETE /carrinho deve esvaziar o carrinho', async () => {
    // garante que há pelo menos um item
    await request(app)
      .post('/carrinho')
      .set('Authorization', `Bearer ${token}`)
      .send({ produto: produtoId, quantidade: 3 });

    const res = await request(app)
      .delete('/carrinho')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Carrinho esvaziado.');
    // data retorna o documento resultante
    expect(res.body.data.itens).toEqual([]);
  });
});