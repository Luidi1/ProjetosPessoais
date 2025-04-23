import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';

describe('PedidoController', () => {
  let token;        // usuário comum
  let adminToken;   // usuário administrador
  let produtoId;

  // Cria usuário, obtém token e produto para usar nos testes
  beforeAll(async () => {
    await mongoose.connection.dropDatabase();

    // 1) Cria usuário comum e faz login
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Teste Pedido',
        data_nascimento: '1990-01-01',
        email: 'pedido@test.com',
        senha: 'senha123'
      });
    const loginRes = await request(app)
      .post('/usuarios/login')
      .send({ email: 'pedido@test.com', senha: 'senha123' });
    token = loginRes.body.token;

    // 2) Cria usuário administrador via API
    await request(app)
      .post('/usuarios')
      .send({
        nome: 'Admin Teste',
        data_nascimento: '1980-01-01',
        email: 'admin@test.com',
        senha: 'senha123',
        perfil: 'ADMINISTRADOR'
      });
    const loginAdminRes = await request(app)
      .post('/usuarios/login')
      .send({ email: 'admin@test.com', senha: 'senha123' });
    adminToken = loginAdminRes.body.token;

    // 3) Cria produto
    const prodRes = await request(app)
      .post('/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'ProdutoPedido', preco: 50, estoque: 5 });
    produtoId = prodRes.body.data._id;
  });

  // Fecha conexão
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
      // Garante ao menos um pedido existente
      const pedidos = await request(app)
        .get('/pedido')
        .set('Authorization', `Bearer ${token}`);
      primeiroPedidoId = pedidos.body.pedidos[0]._id;
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
      // Cria um novo pedido para cancelar
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
      // Cria um novo pedido para exclusão
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
      // Cria alguns pedidos adicionais
      await request(app).post('/carrinho').set('Authorization', `Bearer ${token}`).send({ produto: produtoId, quantidade: 1 });
      await request(app).post('/pedido').set('Authorization', `Bearer ${token}`).send({
        formaPagamento: 'PIX',
        enderecoEntrega: { rua: 'Rua', numero: '2', bairro: 'B', cidade: 'C', uf: 'SP', cep: '22222-222' }
      });

      const res = await request(app)
        .delete('/pedido')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensagem', 'Todos os pedidos foram deletados.');

      // Confirma que não há pedidos
      const lista = await request(app)
        .get('/pedido')
        .set('Authorization', `Bearer ${token}`);
      expect(lista.body.total).toBe(0);
      expect(lista.body.pedidos).toHaveLength(0);
    });
  });
});
