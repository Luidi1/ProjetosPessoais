import request from 'supertest';
import app from '../../app.js';
import mongoose from 'mongoose';
import Usuario from '../../models/Usuario.js';
import jwt from 'jsonwebtoken';
import { concatenarItensComVirgulaAndE } from '../../utils/formatarMensagens.js';
import { PARAMS_USUARIOS } from '../utils/usuariosHelpers.js';
import { PARAMS_PAGINACAO } from '../../middlewares/paginar.js';
import {
  erroParamDuplicado,
  erroParamInexistente,
  erroFormatoData,
  erroIntervaloData,
  erroNomeNaoEncontrado,
  erroDataNascimentoEntreNaoEncontrado,
  erroPerfilInexistente,
  erroEmailNaoEncontrado,
  erroFormatoIdInvalido,
  erroUsuarioIdNaoEncontrado

} from '../../utils/mensagensErroUsuario.js';

// Ajuste conforme sua configuração de segredo JWT
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
const JWT_SECRET = process.env.JWT_SECRET;

// String de parâmetros válidos para testes de inexistente (paginação + usuários)
const validParamsStr = concatenarItensComVirgulaAndE([
  ...PARAMS_PAGINACAO,
  ...PARAMS_USUARIOS
]);

let adminToken;
let userToken;
let otherToken;
let userId;
let otherUserId;

beforeAll(async () => {
  await Usuario.deleteMany({});
  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin@example.com',
    senha: 'Pass123!',
    perfil: 'administrador',
    data_nascimento: new Date('2000-01-01')
  });
  const user = await Usuario.create({
    nome: 'User',
    email: 'user@example.com',
    senha: 'Pass123!',
    perfil: 'cliente',
    data_nascimento: new Date('1990-05-05')
  });
  const other = await Usuario.create({
    nome: 'Other',
    email: 'other@example.com',
    senha: 'Pass123!',
    perfil: 'cliente',
    data_nascimento: new Date('1995-06-06')
  });

  userId = user._id.toString();
  otherUserId = other._id.toString();

  adminToken = jwt.sign({ id: admin._id, perfil: admin.perfil }, JWT_SECRET);
  userToken  = jwt.sign({ id: user._id,  perfil: user.perfil  }, JWT_SECRET);
  otherToken = jwt.sign({ id: other._id, perfil: other.perfil }, JWT_SECRET);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Rota: GET /usuarios (listarUsuarios)', () => {
  test('Listar os usuários', async () => {
    const res = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  test.todo('Enviar mensagem de verificação de email');
  test.todo('Validar senha do usuário');
});

describe('Rota: GET /usuarios/:id (listarUsuariosPorId)', () => {
  test('Administrador pode listar qualquer usuário', async () => {
    const res = await request(app)
      .get(`/usuarios/${otherUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(otherUserId);
  });

  test('Dono pode listar seu próprio usuário', async () => {
    const res = await request(app)
      .get(`/usuarios/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId);
  });

  test('Usuário comum não pode listar outro usuário', async () => {
    const res = await request(app)
      .get(`/usuarios/${otherUserId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('ID em formato inválido retorna ErroRequisicao', async () => {
    const res = await request(app)
      .get('/usuarios/123')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroFormatoIdInvalido('123'));
  });

  test('ID inexistente retorna NaoEncontrado', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/usuarios/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensagem).toBe(erroUsuarioIdNaoEncontrado(fakeId));
  });
});

describe('Rota: GET /usuarios/busca (listarUsuariosPorBusca)', () => {
  test('Sem parâmetros retorna todos os usuários', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test('Filtro por nome (prefix-search)', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ nome: 'Use' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('User');
  });

  test('Filtro por nome exato', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ nome: 'User' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body[0].nome).toBe('User');
  });

  test('Nome sem correspondência retorna mensagem adequada', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ nome: 'zzz' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensagem).toBe(erroNomeNaoEncontrado('zzz'));
  });

  test('Filtro por minData_nascimento', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ minData_nascimento: '1990-05-05' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test('minData_nascimento em formato incorreto retorna erro', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ minData_nascimento: '05-05-1990' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroFormatoData('minData_nascimento'));
  });

  test('Filtro por maxData_nascimento', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ maxData_nascimento: '1995-01-01' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('User');
  });

  test('maxData_nascimento em formato incorreto retorna erro', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ maxData_nascimento: '05-05-1990' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroFormatoData('maxData_nascimento'));
  });

  test('Filtro entre min e max de data', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ minData_nascimento: '1980-01-01', maxData_nascimento: '1995-12-31' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('minData_nascimento maior que maxData_nascimento retorna erro', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({
        minData_nascimento: '2000-01-22',
        maxData_nascimento: '2000-01-21'
      })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroIntervaloData());
  });

  test('Nenhum usuário entre minData_nascimento e maxData_nascimento retorna erro', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({
        minData_nascimento: '1980-01-01',
        maxData_nascimento: '1980-01-02'
      })
      .set('Authorization', `Bearer ${adminToken}`);
  
    expect(res.status).toBe(404);
    expect(res.body.mensagem)
      .toBe(erroDataNascimentoEntreNaoEncontrado('1980-01-01', '1980-01-02'));
  });

  test('Filtro por perfil válido', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ perfil: 'cliente' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('Perfil inválido retorna erro com perfis válidos', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ perfil: 'inexistente' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensagem)
      .toBe(erroPerfilInexistente('inexistente', 'cliente, administrador e admin'));
  });

  test('Filtro por email prefixo', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ email: 'us' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toMatch(/^user@/i);
  });

  test('Email sem correspondência retorna mensagem adequada', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ email: 'zzz' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensagem)
      .toBe(erroEmailNaoEncontrado('zzz'));
  });

  test('Filtro por nome + minData_nascimento', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ nome: 'Oth', minData_nascimento: '1980-01-01' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('Other');
  });

  test('Filtro por nome + maxData_nascimento', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ nome: 'Oth', maxData_nascimento: '1995-12-31' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('Other');
  });

  test('Filtro por nome + perfil', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ nome: 'Oth', perfil: 'cliente' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('Other');
  });

  test('Filtro por nome + email', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({
        nome: 'Use',
        email: 'us'
      })
      .set('Authorization', `Bearer ${adminToken}`);
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    // Verifica tanto o nome quanto o email do único resultado
    expect(res.body[0].nome).toBe('User');
    expect(res.body[0].email).toMatch(/^user@/i);
  });
  
  test('Filtro por nome + data mínima + data máxima + perfil + email', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({
        nome: 'Use',
        email: 'us',
        minData_nascimento: '1980-01-01',
        maxData_nascimento: '1995-12-31',
        perfil: 'cliente'
      })
      .set('Authorization', `Bearer ${adminToken}`);
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('User');
    expect(res.body[0].email).toMatch(/^user@/i);
  });
  

  test('Parâmetro inexistente retorna erro com lista de válidos', async () => {
    const res = await request(app)
      .get('/usuarios/busca')
      .query({ apelido: 'x' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem)
      .toBe(erroParamInexistente('apelido', validParamsStr));
  });

  test('Parâmetro duplicado retorna erro', async () => {
    const res = await request(app)
      .get('/usuarios/busca?nome=Use&nome=Use')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem)
      .toBe(erroParamDuplicado('nome'));
  });
});
