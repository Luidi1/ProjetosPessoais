process.env.NODE_ENV = 'test'; // antes de qualquer import
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import request from 'supertest';
import app from '../../app.js';
import mongoose from 'mongoose';
import Produto from '../../models/Produto.js';

describe('Controller: ProdutoController', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    await new Promise(resolve => mongoose.connection.once('open', resolve));
  });

  beforeEach(async () => {
    await Produto.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('deve cadastrar um novo produto com sucesso', async () => {
    const novo = { nome: 'Produto X', preco: 10.5, estoque: 100 };
    const res = await request(app).post('/produtos').send(novo);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Produto criado com sucesso!');
    expect(res.body.data).toMatchObject(novo);
    expect(res.body.data).toHaveProperty('_id');
  });

  it('deve listar todos os produtos', async () => {
    await Produto.create([
      { nome: 'A', preco: 1, estoque: 10 },
      { nome: 'B', preco: 2, estoque: 20 }
    ]);

    const res = await request(app).get('/produtos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('deve buscar um produto por ID', async () => {
    const p = await Produto.create({ nome: 'C', preco: 3, estoque: 30 });
    const res = await request(app).get(`/produtos/${p._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe('C');
  });

  it('deve retornar 404 se produto não existir (por ID)', async () => {
    const res = await request(app).get('/produtos/507f1f77bcf86cd799439011');
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toMatch(/não encontrado/i);
  });

  it('deve atualizar um produto com sucesso', async () => {
    const p = await Produto.create({ nome: 'D', preco: 4, estoque: 40 });
    const res = await request(app)
      .put(`/produtos/${p._id}`)
      .send({ preco: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/atualizado com sucesso/i);
    expect(res.body.data.preco).toBe(5);
  });

  it('deve retornar 404 ao atualizar ID inexistente', async () => {
    const res = await request(app)
      .put('/produtos/507f191e810c19729de860ea')
      .send({ preco: 5 });
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toMatch(/não encontrado/i);
  });

  it('deve deletar um produto com sucesso', async () => {
    const p = await Produto.create({ nome: 'E', preco: 6, estoque: 60 });
    const res = await request(app).delete(`/produtos/${p._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deletado com sucesso/i);
  });

  it('deve retornar 404 ao deletar ID inexistente', async () => {
    const res = await request(app).delete('/produtos/507f1f77bcf86cd799439012');
    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toMatch(/não encontrado/i);
  });

  it('deve filtrar produtos por nome', async () => {
    await Produto.create([
      { nome: 'AAA', preco: 1, estoque: 10 },
      { nome: 'BBB', preco: 2, estoque: 20 }
    ]);
    const res = await request(app).get('/produtos/busca?nome=AAA');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toMatch(/AAA/i);
  });

  it('deve retornar 404 ao filtrar por nome inexistente', async () => {
    const res = await request(app).get('/produtos/busca?nome=ZZZ');
    expect(res.statusCode).toBe(404);
    // casa exatamente com a string que o helper produz:
    expect(res.body.mensagem)
      .toBe('Nenhum produto com o NOME igual a {ZZZ} encontrado.');
  });
  

  it('deve retornar 400 para parâmetro inválido', async () => {
    const res = await request(app).get('/produtos?invalido=1');
    expect(res.statusCode).toBe(400);
    expect(res.body.mensagem).toMatch(/não existe/i);
  });
});