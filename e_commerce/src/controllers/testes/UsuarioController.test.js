process.env.NODE_ENV = 'test'; // ⬅ ANTES de importar qualquer coisa
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import request from 'supertest';
import app from '../../app.js'; // certifique-se de exportar seu app principal
import mongoose from 'mongoose';
import Usuario from '../../models/Usuario.js';
import { verificarFiltroNome } from '../../controllers/utils/usuariosHelpers.js';

describe('Controller: UsuarioController', () => {

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    // Garante que a conexão está pronta
    await new Promise(resolve => mongoose.connection.once('open', resolve));
  });
  

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Usuario.deleteMany(); // Limpa a coleção após cada teste
  });

  it('deve cadastrar um novo usuário com sucesso', async () => {
    const res = await request(app)
      .post('/usuarios')
      .send({ email: 'test1@email.com', senha: '123456' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('email', 'test1@email.com');
  });

  it('deve rejeitar email duplicado com mensagem personalizada', async () => {
    await Usuario.create({ email: 'duplicado@email.com', senha: '123456' });

    const res = await request(app)
      .post('/usuarios')
      .send({ email: 'duplicado@email.com', senha: '654321' });

    expect(res.statusCode).toBe(400);
    expect(res.body.mensagem).toMatch(/já existe/i);
  });

  it('deve listar usuários existentes', async () => {
    await Usuario.create({ email: 'listar@email.com', senha: '123456' });

    const res = await request(app).get('/usuarios');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve buscar um usuário por ID', async () => {
    const user = await Usuario.create({ email: 'id@email.com', senha: '123456' });

    const res = await request(app).get(`/usuarios/${user._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('id@email.com');
  });

  it('deve retornar erro 404 para ID inexistente', async () => {
    const idFake = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/usuarios/${idFake}`);
    expect(res.statusCode).toBe(404);
  });

  it('deve atualizar um usuário com sucesso', async () => {
    const user = await Usuario.create({ email: 'atualizar@email.com', senha: '123456' });

    const res = await request(app)
      .put(`/usuarios/${user._id}`)
      .send({ email: 'novo@email.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('novo@email.com');
  });

  it('deve deletar um usuário com sucesso', async () => {
    const user = await Usuario.create({ email: 'deletar@email.com', senha: '123456' });

    const res = await request(app).delete(`/usuarios/${user._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deletado com sucesso/i);
  });

  it('deve realizar login com sucesso e retornar token', async () => {
    await request(app).post('/usuarios').send({ email: 'login@email.com', senha: '123456' });

    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'login@email.com', senha: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('deve rejeitar login com senha incorreta', async () => {
    await Usuario.create({ email: 'erro@email.com', senha: '123456' });

    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'erro@email.com', senha: 'errada' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/senha incorreta/i);
  });

  it('deve listar usuários por filtro de nome', async () => {
    await Usuario.create([
      { email: 'ana@email.com', senha: '123456', nome: 'Ana Clara' },
      { email: 'joao@email.com', senha: '123456', nome: 'João Silva' }
    ]);
  
    const res = await request(app).get('/usuarios/busca?nome=ana');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toMatch(/ana/i);
  });
  
  it('deve retornar erro se nenhum usuário for encontrado pelo filtro', async () => {
    const filtro = { nome: 'inexistente' };
    const res = await request(app).get('/usuarios/busca?nome=inexistente');
    // obtém a mensagem esperada diretamente do helper
    const mensagemEsperada = await verificarFiltroNome(filtro);

    expect(res.statusCode).toBe(404);
    expect(res.body.mensagem).toBe(mensagemEsperada);
  });
});



