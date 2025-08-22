// <<< 1) Defina ambiente e carregue .env **antes** de qualquer import do app
process.env.NODE_ENV = 'test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import request from 'supertest';
import mongoose from 'mongoose';
// ⚠️ NÃO importe o app aqui; faremos import dinâmico depois do dotenv
// import app from '../../app.js';

jest.setTimeout(30000);

// Endereço exigido pelo schema de Usuario
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

describe('PedidoController', () => {
  let token;        // usuário comum
  let adminToken;   // usuário administrador
  let produtoId;
  let app;          // app carregado dinamicamente

  beforeAll(async () => {
    // Importa o app **depois** de setar NODE_ENV e carregar .env.test
    const mod = await import('../../app.js');
    app = mod.default;

    // Aguarda a conexão aberta pelo app.js
    await mongoose.connection.asPromise();

    // 1) Cria usuário comum e faz login (AGORA com endereço)
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Teste Pedido',
        data_nascimento: '1990-01-01',
        email: 'pedido@test.com',
        senha: 'senha123',
        endereco: ENDERECO_FIXO
      });
    const loginRes = await request(app)
      .post('/usuarios/login')
      .send({ email: 'pedido@test.com', senha: 'senha123' });
    token = loginRes.body.token;

    // 2) Cria usuário administrador e faz login (AGORA com endereço)
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Admin Teste',
        data_nascimento: '1980-01-01',
        email: 'admin@test.com',
        senha: 'senha123',
        perfil: 'ADMINISTRADOR',
        endereco: ENDERECO_FIXO
      });
    const loginAdminRes = await request(app)
      .post('/usuarios/login')
      .send({ email: 'admin@test.com', senha: 'senha123' });
    adminToken = loginAdminRes.body.token;

    // 3) Cria produto como admin
    const prodRes = await request(app)
      .post('/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'ProdutoPedido', preco: 50, estoque: 5 });
    produtoId = prodRes.body.data._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Criar pedido', () => {
    it('POST /pedido deve retornar 400 se carrinho vazio', async () => {
      // Garante carrinho limpo
      await request(app)
        .delete('/carrinho')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/pedido')
        .set('Authorization', `Bearer ${token}`)
        .send({
          formaPagamento: 'PIX',
          enderecoEntrega: {
            rua: 'Rua A',
            numero: '1',
            bairro: 'B',
            cidade: 'C',
            uf: 'SP',
            cep: '00000-000'
          }
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('mensagem');
    });

    it('POST /pedido cria pedido com sucesso e limpa carrinho', async () => {
      // Limpa e adiciona item no carrinho
      await request(app)
        .delete('/carrinho')
        .set('Authorization', `Bearer ${token}`);
      await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 2 });

      // DEBUG opcional
      const cartRes = await request(app)
        .get('/carrinho')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/pedido')
        .set('Authorization', `Bearer ${token}`)
        .send({
          formaPagamento: 'CARTAO_CREDITO',
          enderecoEntrega: {
            rua: 'Rua A',
            numero: '1',
            bairro: 'B',
            cidade: 'C',
            uf: 'SP',
            cep: '00000-000'
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Pedido criado com sucesso!');
      expect(res.body).toHaveProperty('pedido');
      const pedido = res.body.pedido;
      expect(pedido).toHaveProperty('usuario');
      expect(Array.isArray(pedido.itens)).toBe(true);
      expect(pedido.itens).toHaveLength(1);
      expect(pedido).toHaveProperty('valorTotal', '100,00');

      // Carrinho deve estar vazio após criação
      const cart = await request(app)
        .get('/carrinho')
        .set('Authorization', `Bearer ${token}`);
      expect(cart.body.itens).toEqual([]);
    });
  });

  describe('Listar e contar pedidos', () => {
    let primeiroPedidoId;

    beforeAll(async () => {
      const res = await request(app)
        .get('/pedido')
        .set('Authorization', `Bearer ${token}`);
      primeiroPedidoId = res.body.pedidos[0]._id;
    });

    it('GET /pedido deve retornar total e lista de pedidos', async () => {
      const res = await request(app)
        .get('/pedido')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pedidos');
      expect(res.body.pedidos).toHaveLength(res.body.total);
    });

    it('GET /pedido/:id retorna pedido específico', async () => {
      const res = await request(app)
        .get(`/pedido/${primeiroPedidoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', primeiroPedidoId);
    });

    it('GET /pedido/:id com id inválido retorna 404', async () => {
      const res = await request(app)
        .get('/pedido/000000000000000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Cancelar pedido', () => {
    let pendenteId;

    beforeAll(async () => {
      await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 1 });
      const resCriar = await request(app)
        .post('/pedido')
        .set('Authorization', `Bearer ${token}`)
        .send({
          formaPagamento: 'PIX',
          enderecoEntrega: { rua: 'X', numero: '1', bairro: 'Y', cidade: 'Z', uf: 'SP', cep: '11111-111' }
        });
      pendenteId = resCriar.body.pedido._id;
    });

    it('PUT /pedido/:id/cancelar muda status para CANCELADO', async () => {
      const res = await request(app)
        .put(`/pedido/${pendenteId}/cancelar`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'CANCELADO');
    });

    it('PUT /pedido/:id/cancelar de um já cancelado retorna 404', async () => {
      const res = await request(app)
        .put(`/pedido/${pendenteId}/cancelar`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Deletar pedidos (só ADMIN)', () => {
    let tempId;

    beforeAll(async () => {
      await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 1 });
      const res = await request(app)
        .post('/pedido')
        .set('Authorization', `Bearer ${token}`)
        .send({
          formaPagamento: 'PIX',
          enderecoEntrega: { rua: 'X', numero: '1', bairro: 'Y', cidade: 'Z', uf: 'SP', cep: '11111-111' }
        });
      tempId = res.body.pedido._id;
    });

    it('DELETE /pedido/:id com USER deve retornar 403', async () => {
      const resUser = await request(app)
        .delete(`/pedido/${tempId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(resUser.statusCode).toBe(403);
    });

    it('DELETE /pedido/:id com ADMIN apaga o pedido', async () => {
      const res = await request(app)
        .delete(`/pedido/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensagem', 'Pedido deletado com sucesso.');
    });

    it('DELETE /pedido com USER deve retornar 403', async () => {
      const resUserAll = await request(app)
        .delete('/pedido')
        .set('Authorization', `Bearer ${token}`);
      expect(resUserAll.statusCode).toBe(403);
    });

    it('DELETE /pedido com ADMIN apaga todos os pedidos', async () => {
      await request(app)
        .post('/carrinho')
        .set('Authorization', `Bearer ${token}`)
        .send({ produto: produtoId, quantidade: 1 });
      await request(app)
        .post('/pedido')
        .set('Authorization', `Bearer ${token}`)
        .send({
          formaPagamento: 'PIX',
          enderecoEntrega: { rua: 'Rua', numero: '2', bairro: 'B', cidade: 'C', uf: 'SP', cep: '22222-222' }
        });

      const res = await request(app)
        .delete('/pedido')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensagem', 'Todos os pedidos foram deletados.');

      const lista = await request(app)
        .get('/pedido')
        .set('Authorization', `Bearer ${token}`);
      expect(lista.body.total).toBe(0);
      expect(lista.body.pedidos).toHaveLength(0);
    });
  });
});
