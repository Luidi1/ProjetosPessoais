process.env.NODE_ENV = 'test'; // antes de qualquer import
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import request from 'supertest';
// ⚠️ NÃO importe app aqui estaticamente; vamos carregar dinamicamente no beforeAll
// import app from '../../app.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Usuario from '../../models/Usuario.js';
import Produto from '../../models/Produto.js';
import { erroProdutoNaoEncontrado } from '../../utils/mensagensErroProduto.js';

// endereço obrigatório pelo schema de Usuario
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

describe('Controller: ProdutoController', () => {
  let adminToken;
  let app; // receberá o app carregado dinamicamente

  beforeAll(async () => {
    // Carrega o app AGORA, depois de NODE_ENV e dotenv já setados
    const mod = await import('../../app.js');
    app = mod.default;

    // Garante que a conexão aberta pelo app.js esteja pronta
    await mongoose.connection.asPromise();

    // Cria um usuário administrador para autenticar as rotas de produto
    await Usuario.deleteMany({});
    const admin = await Usuario.create({
      nome: 'AdminProd',
      email: 'admin.prod@example.com',
      senha: 'Pass123!',
      perfil: 'ADMINISTRADOR',
      data_nascimento: '1990-01-01',
      endereco: ENDERECO_FIXO
    });
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    adminToken = jwt.sign(
      { id: admin._id.toString(), perfil: admin.perfil },
      JWT_SECRET
    );
  });

  beforeEach(async () => {
    // Limpa apenas a coleção de produtos
    await Produto.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('deve atualizar um produto com sucesso', async () => {
    const p = await Produto.create({ nome: 'D', preco: 4, estoque: 40 });
    const res = await request(app)
      .put(`/produtos/${p._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ preco: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/atualizado com sucesso/i);
    // agora esperamos a string formatada:
    expect(res.body.data.preco).toBe('5,00');
  });

  it('deve listar todos os produtos', async () => {
    await Produto.create([
      { nome: 'A', preco: 1, estoque: 10 },
      { nome: 'B', preco: 2, estoque: 20 }
    ]);

    const res = await request(app)
      .get('/produtos')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('deve buscar um produto por ID', async () => {
    const p = await Produto.create({ nome: 'C', preco: 3, estoque: 30 });
    const res = await request(app)
      .get(`/produtos/${p._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe('C');
  });

  it('deve retornar 404 se produto não existir (por ID)', async () => {
    const res = await request(app)
      .get('/produtos/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toMatch(/não encontrado/i);
  });

  it('deve atualizar um produto com sucesso', async () => {
    const p = await Produto.create({ nome: 'D', preco: 4, estoque: 40 });
    const res = await request(app)
      .put(`/produtos/${p._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ preco: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/atualizado com sucesso/i);
    expect(res.body.data.preco).toBe('5,00');
  });

  it('deve retornar 404 ao atualizar ID inexistente', async () => {
    const res = await request(app)
      .put('/produtos/507f191e810c19729de860ea')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ preco: 5 });
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toMatch(/não encontrado/i);
  });

  it('deve deletar um produto com sucesso', async () => {
    const p = await Produto.create({ nome: 'E', preco: 6, estoque: 60 });
    const res = await request(app)
      .delete(`/produtos/${p._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deletado com sucesso/i);
  });

  it('deve retornar 404 ao deletar ID inexistente', async () => {
    const res = await request(app)
      .delete('/produtos/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toMatch(/não encontrado/i);
  });

  it('deve filtrar produtos por nome', async () => {
    await Produto.create([
      { nome: 'AAA', preco: 1, estoque: 10 },
      { nome: 'BBB', preco: 2, estoque: 20 }
    ]);
    const res = await request(app)
      .get('/produtos/busca?nome=AAA')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toMatch(/AAA/i);
  });

  it('deve retornar 404 ao filtrar por nome inexistente', async () => {
    const res = await request(app)
      .get('/produtos/busca?nome=ZZZ')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem)
      .toBe(erroProdutoNaoEncontrado('ZZZ'));
  });

  it('deve retornar 400 para parâmetro inválido', async () => {
    const res = await request(app)
      .get('/produtos?invalido=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.mensagem).toMatch(/não existe/i);
  });
});
