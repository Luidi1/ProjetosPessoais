// <<< 1) Defina ambiente e carregue .env **antes** de qualquer import do app
process.env.NODE_ENV = 'test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import request from 'supertest';
import mongoose from 'mongoose';
// ⚠️ NÃO importe o app aqui; faremos import dinâmico depois do dotenv
// import app from '../../app.js';

jest.setTimeout(20000);

// Endereço padrão exigido pelo schema de Usuario
const ENDERECO_FIXO = {
  rua: 'Rua Teste',
  numero: 1,
  complemento: 'Sem complemento',
  bairro: 'Centro',
  cidade: 'Cidade X',
  estado: 'SP',
  cep: '00000-000',
  pais: 'Brasil'
};

describe('CarrinhoController', () => {
  let token;      // token do usuário comum
  let produtoId;  // produto criado pelo admin para usar no carrinho
  let app;        // app carregado dinamicamente

  beforeAll(async () => {
    // importa o app **depois** de setar NODE_ENV e carregar .env.test
    const mod = await import('../../app.js');
    app = mod.default;

    // aguarda a conexão iniciada por app.js
    await mongoose.connection.asPromise();

    // cria usuário comum e faz login para obter token (AGORA com endereço)
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Teste Carrinho',
        data_nascimento: '1990-01-01',
        email: 'carrinho@test.com',
        senha: 'senha123',
        endereco: ENDERECO_FIXO
      });

    const loginRes = await request(app)
      .post('/usuarios/login')
      .send({
        email: 'carrinho@test.com',
        senha: 'senha123'
      });
    token = loginRes.body.token;

    // cria usuário administrador e faz login para obter adminToken (AGORA com endereço)
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Admin Carrinho',
        data_nascimento: '1980-01-01',
        email: 'admin.carrinho@test.com',
        senha: 'senha123',
        perfil: 'ADMINISTRADOR',
        endereco: ENDERECO_FIXO
      });

    const loginAdminRes = await request(app)
      .post('/usuarios/login')
      .send({
        email: 'admin.carrinho@test.com',
        senha: 'senha123'
      });
    const adminToken = loginAdminRes.body.token;

    // cria um produto para usar no carrinho com token de admin
    const prodRes = await request(app)
      .post('/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Produto Test', preco: 100, estoque: 10 });

    produtoId = prodRes.body?.data?._id; // agora deve existir
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
      // espera '0,00' em vez de undefined
      expect(res.body.precoTotal).toBe('0,00');
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
