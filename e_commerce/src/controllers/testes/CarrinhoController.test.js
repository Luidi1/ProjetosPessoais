import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';

describe('CarrinhoController', () => {
  let token;
  let produtoId;

  beforeAll(async () => {
    // limpa o banco totalmente
    await mongoose.connection.dropDatabase();

    // cria usuário e faz login para obter o token
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
    produtoId = prodRes.body.data._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('sem itens no carrinho', () => {
    beforeEach(async () => {
      await request(app)
        .delete('/carrinho')
        .set('Authorization', `Bearer ${token}`);
    });

    it('GET /carrinho deve retornar carrinho vazio inicialmente', async () => {
      const res = await request(app)
        .get('/carrinho')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.itens).toEqual([]);
      expect(res.body.precoTotal).toBeUndefined();
    });

    it('POST /carrinho não deve permitir quantidade acima do estoque', async () => {
      const res = await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 11 });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'mensagem',
        'Estoque insuficiente. Disponível: 10, solicitado: 11.'
      );
    });
  });

  describe('com item no carrinho', () => {
    let itemId;

    beforeEach(async () => {
      // limpa e adiciona um item de quantidade 2
      await request(app)
        .delete('/carrinho')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 2 });
      itemId = res.body.item._id;
    });

    it('POST /carrinho deve adicionar item e retornar apenas ele com precoItem', async () => {
      const res = await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message', 'Item adicionado ao carrinho com sucesso.'
      );
      const item = res.body.item;
      expect(item).toHaveProperty('quantidade', 4);
      expect(item).toHaveProperty('precoItem', '400,00');
    });

    it('GET /carrinho deve listar o carrinho com precoTotal correto', async () => {
      const res = await request(app)
        .get('/carrinho')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.itens).toHaveLength(1);
      expect(res.body.precoTotal).toBe('200,00');
    });

    it('PUT /carrinho/:itemId deve atualizar apenas a quantidade', async () => {
      const res = await request(app)
        .put(`/carrinho/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantidade: 5 });

      expect(res.statusCode).toBe(200);
      const updatedItem = res.body.itens.find(i => i._id === itemId);
      expect(updatedItem.quantidade).toBe(5);
    });

    it('DELETE /carrinho/:itemId deve remover o item', async () => {
      const res = await request(app)
        .delete(`/carrinho/${itemId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.itens.find(i => i._id === itemId)).toBeUndefined();
    });

    it('DELETE /carrinho deve esvaziar o carrinho', async () => {
      const res = await request(app)
        .delete('/carrinho')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Carrinho esvaziado.');
      expect(res.body.data.itens).toEqual([]);
    });
  });
});
