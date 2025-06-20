// <<< 1) DEFINA O AMBIENTE ANTES DE QUALQUER IMPORT
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });
process.env.MONGO_URI = process.env.MONGO_URI_TEST;

import request from 'supertest';
import app     from '../../app.js';             // só para GET e criação-prod
import mongoose from 'mongoose';
import Usuario  from '../../models/Usuario.js';
import jwt      from 'jsonwebtoken';
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
  erroUsuarioIdNaoEncontrado,
  erroCampoObrigatorio,
  erroCamposObrigatorios,
  erroCampoInvalido
} from '../../utils/mensagensErroUsuario.js';
import { erroFormatoEmail } from '../../utils/validacoes/mensagensErroValidacao.js';
import { erroAcessoNegado, erroPermissaoAdmin } from '../../utils/mensagensErroPermissao.js'

// JWT
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
const JWT_SECRET = process.env.JWT_SECRET;

// Lista de parâmetros válidos
const validParamsStr = concatenarItensComVirgulaAndE([
  ...PARAMS_PAGINACAO,
  ...PARAMS_USUARIOS
]);

// ——— Conecta e desconecta uma vez —————————————
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true
  });
});
afterAll(async () => {
  await mongoose.connection.close();
});

// ——— Suítes de GET (mantidas iguais) ————————————

let adminToken, userToken, otherToken;
let userId, otherUserId;

describe('Rota: GET /usuarios (listarUsuarios)', () => {
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

    userId      = user._id.toString();
    otherUserId = other._id.toString();
    adminToken  = jwt.sign({ id: admin._id, perfil: admin.perfil }, JWT_SECRET);
    userToken   = jwt.sign({ id: user._id,  perfil: user.perfil  }, JWT_SECRET);
    otherToken  = jwt.sign({ id: other._id, perfil: other.perfil }, JWT_SECRET);
  });

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
      .query({ nome: 'Use', email: 'us' })
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

// ——— Suíte de criação em produção ————————————
describe('Rota: POST /usuarios — criação e validação de campos obrigatórios', () => {
  let prodApp, adminTokenProd;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    require('dotenv').config({ path: '.env.test' });
    process.env.MONGO_URI = process.env.MONGO_URI_TEST;

    jest.resetModules();
    prodApp = require('../../app.js').default;

    const UsuarioProd = require('../../models/Usuario.js').default;
    await UsuarioProd.deleteMany({});

    const fixtureEndereco = {
      rua: 'Rua Teste',
      numero: 1,
      complemento: 'Sem complemento',
      bairro: 'Centro',
      cidade: 'Cidade X',
      estado: 'SP',
      cep: '00000-000',
      pais: 'Brasil'
    };

    const admin = await UsuarioProd.create({
      nome: 'AdminTeste',
      data_nascimento: '1990-01-01',
      email: 'admin@teste.com',
      senha: 'Senha123!',
      perfil: 'ADMINISTRADOR',
      endereco: fixtureEndereco
    });

    adminTokenProd = jwt.sign(
      { id: admin._id.toString(), perfil: admin.perfil },
      process.env.JWT_SECRET
    );
  });

  const basePayload = {
    nome: 'Teste Usuário',
    data_nascimento: '1995-01-01',
    endereco: {
      rua: 'Rua A',
      numero: 1,
      complemento: 'Sem complemento',
      bairro: 'Bairro X',
      cidade: 'Cidade Y',
      estado: 'SP',
      cep: '00000-000',
      pais: 'Brasil'
    },
    email: 'teste@exemplo.com',
    senha: 'Senha123!'
  };

  const fieldLabels = {
    nome: 'Nome',
    data_nascimento: 'Data de Nascimento',
    endereco: 'Endereço',
    email: 'Email',
    senha: 'Senha'
  };

  const casosErro = [
    ['nome',            { ...basePayload, nome: undefined }],
    ['data_nascimento', { ...basePayload, data_nascimento: undefined }],
    ['endereco',        { ...basePayload, endereco: undefined }],
    ['email',           { ...basePayload, email: undefined }],
    ['senha',           { ...basePayload, senha: undefined }],
    ['nome e data_nascimento', { ...basePayload, nome: undefined, data_nascimento: undefined }],
    ['nome e endereco',        { ...basePayload, nome: undefined, endereco: undefined }],
    ['nome e email',           { ...basePayload, nome: undefined, email: undefined }],
    ['nome e senha',           { ...basePayload, nome: undefined, senha: undefined }],
    ['todos os campos obrigatórios', {}]
  ];

  test('Cadastrar um usuário com sucesso, passando todos os campos de usuário', async () => {
    const res = await request(prodApp)
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminTokenProd}`)
      .send(basePayload)
      .expect(201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.nome).toBe(basePayload.nome);
    expect(res.body.data.email).toBe(basePayload.email);
  });

  test.each(casosErro)(
    'Deve aparecer mensagem de erro se não informar o campo(s) %s',
    async (campos, payload) => {
      const res = await request(prodApp)
        .post('/usuarios')
        .set('Authorization', `Bearer ${adminTokenProd}`)
        .send(payload)
        .expect(400);
      if (campos === 'todos os campos obrigatórios') {
        expect(res.body.message).toContain(
          erroCamposObrigatorios(Object.values(fieldLabels))
        );
      } else {
        const keys = campos.split(' e ');
        const labels = keys.map(k => fieldLabels[k]);
        expect(res.body.message).toContain(
          keys.length > 1
            ? erroCamposObrigatorios(labels)
            : erroCampoObrigatorio(labels[0])
        );
      }
    }
  );
});

// ——— Suíte de LOGIN usando hook anexarUsuarioHooks ——————————
describe('Rota: POST /usuarios/login', () => {
  const userEmail    = 'user@example.com';
  const userPassword = 'Pass123!';
  let loginUserId;    // ← declaração adicionada

  beforeAll(async () => {
    // garante que esse usuário exista e com senha válida
    await Usuario.deleteMany({});
    const u = await Usuario.create({
      nome: 'User',
      email: userEmail,
      senha: userPassword,
      perfil: 'cliente',
      data_nascimento: '1990-01-01'
      // o hook anexarUsuarioHooks vai injetar `endereco` automaticamente
    });
    loginUserId = u._id.toString();  // ← captura o ID para o teste
  });

  test('Login com sucesso, passando email e senha corretos', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: userEmail, senha: userPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.message).toBe('Login realizado com sucesso.');
  });

  test('Token JWT válido e decodificável', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: userEmail, senha: userPassword });
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('id', loginUserId);
    expect(decoded).toHaveProperty('perfil', 'CLIENTE');
    expect(typeof decoded.iat).toBe('number');
    // apenas verifica exp se ele estiver presente
    if (decoded.exp !== undefined) {
      expect(typeof decoded.exp).toBe('number');
    }
  });

  test('Campo "email" ausente, deve retornar erro de campo obrigatório', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ senha: userPassword });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(erroCampoObrigatorio('Email'));
  });

  test('Formato de "email" incorreto, deve retornar erro de formato inválido', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'email-invalido', senha: userPassword });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(erroFormatoEmail('email'));
  });

  test('Email não cadastrado retorna 401 e mensagem adequada', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'naoexiste@example.com', senha: userPassword });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email não encontrado no sistema.');
  });

  test('Campo "senha" ausente, deve retornar erro de campo obrigatório', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: userEmail });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(erroCampoObrigatorio('Senha'));
  });

  test('Senha inválida retorna 401 e mensagem adequada', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: userEmail, senha: 'SenhaErrada!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Senha incorreta.');
  });

  test.todo('Validar formato de senha (ex.: mínimo de caracteres, mix de tipos)');

  test('Campos "email" e "senha" ausentes, deve agrupar ambos na mensagem', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message)
      .toBe(erroCamposObrigatorios(['Email', 'Senha']));
  });
});

// ... (imports no topo do arquivo)

const camposParciais = [
  ['nome', 'AlteradoNome',           'campo-nome@teste.com'],
  ['email', 'alterado@usuario.com',  'campo-email@teste.com'],
  ['perfil', 'ADMINISTRADOR',        'campo-perfil@teste.com'],
  ['data_nascimento', '1999-09-09',  'campo-data@teste.com'],
  ['endereco',
    {
      rua: 'Rua X',
      numero: 10,
      complemento: 'Comp X',
      bairro: 'Bairro X',
      cidade: 'Cidade X',
      estado: 'SP',
      cep: '11111-111',
      pais: 'Brasil'
    },
    'campo-endereco@teste.com'
  ]
];

describe('Rota: PUT /usuarios/:id (atualizarUsuario)', () => {
  const userPassword = 'Pass123!';
  let adminToken, userToken, otherToken, userId, otherUserId;

  beforeAll(async () => {
    await Usuario.deleteMany({});
    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@teste.com',
      senha: userPassword,
      perfil: 'ADMINISTRADOR',
      data_nascimento: '1990-01-01'
    });
    const user = await Usuario.create({
      nome: 'User',
      email: 'user@teste.com',
      senha: userPassword,
      perfil: 'CLIENTE',
      data_nascimento: '1990-01-01'
    });
    const other = await Usuario.create({
      nome: 'Other',
      email: 'other@teste.com',
      senha: userPassword,
      perfil: 'CLIENTE',
      data_nascimento: '1990-01-01'
    });

    const JWT_SECRET = process.env.JWT_SECRET;
    adminToken  = jwt.sign({ id: admin._id.toString(),  perfil: admin.perfil },  JWT_SECRET);
    userToken   = jwt.sign({ id: user._id.toString(),   perfil: user.perfil },   JWT_SECRET);
    otherToken  = jwt.sign({ id: other._id.toString(),  perfil: other.perfil },  JWT_SECRET);
    userId      = user._id.toString();
    otherUserId = other._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Admin atualiza todos os campos com sucesso', async () => {
    const payload = {
      nome: 'NovoOther',
      email: 'novo@other.com',
      perfil: 'ADMINISTRADOR',
      data_nascimento: '1985-05-05',
      endereco: {
        rua: 'Rua Nova',
        numero: 99,
        complemento: 'Apto 1',
        bairro: 'Centro Novo',
        cidade: 'Cidade Z',
        estado: 'RJ',
        cep: '12345-678',
        pais: 'Brasil'
      }
    };

    const res = await request(app)
      .put(`/usuarios/${otherUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message)
      .toBe(`Usuário com id igual a {${otherUserId}} atualizado com sucesso.`);
    const u = res.body.data;

    expect(u.nome).toBe(payload.nome);
    expect(u.email).toBe(payload.email);
    expect(u.perfil).toBe(payload.perfil);
    expect(u.data_nascimento).toBe(payload.data_nascimento);
    expect(u.endereco).toEqual(
      expect.objectContaining(payload.endereco)
    );
  });

  test('Dono atualiza todos os campos com sucesso', async () => {
    const payload = {
      nome: 'MeuNome',
      email: 'meu@teste.com',
      perfil: 'CLIENTE',
      data_nascimento: '1991-02-02'
    };

    const res = await request(app)
      .put(`/usuarios/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    const u = res.body.data;
    expect(u.nome).toBe(payload.nome);
    expect(u.email).toBe(payload.email);
    expect(u.perfil).toBe(payload.perfil);
    expect(u.data_nascimento).toBe(payload.data_nascimento);
  });

  test('Usuário comum não pode atualizar outro usuário', async () => {
    const res = await request(app)
      .put(`/usuarios/${otherUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(403);
    expect(res.body.mensagem)
      .toBe(erroAcessoNegado('usuário'));
  });

  test('ID em formato inválido retorna ErroRequisicao', async () => {
    const invalidId = '123';
    const res = await request(app)
      .put(`/usuarios/${invalidId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroFormatoIdInvalido(invalidId));
  });

  test('ID inexistente retorna NaoEncontrado', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/usuarios/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
    expect(res.body.mensagem).toBe(erroUsuarioIdNaoEncontrado(fakeId));
  });

  test('Campo inexistente retorna ErroRequisicao', async () => {
    const res = await request(app)
      .put(`/usuarios/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ apelido: 'X' });

    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroCampoInvalido('apelido'));
  });

  test.each(camposParciais)(
    'Atualizar somente o campo %s e manter os demais iguais',
    async (_campo, valor, emailUnico) => {
      // prepara um registro isolado com email único
      await Usuario.deleteMany({ email: emailUnico });
      const u0 = await Usuario.create({
        nome: 'Orig',
        email: emailUnico,
        senha: userPassword,
        perfil: 'CLIENTE',
        data_nascimento: '1990-01-01'
      });
      const orig = await Usuario.findById(u0._id).lean();

      // aplica o patch só no campo atual
      const res = await request(app)
        .put(`/usuarios/${u0._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ [_campo]: valor });

      expect(res.status).toBe(200);
      const up = res.body.data;

      // validação específica para endereço
      if (_campo === 'endereco') {
        expect(up.endereco).toMatchObject(valor);
      } else {
        expect(up[_campo]).toEqual(valor);
      }

      // garante que os demais campos permaneceram iguais
      Object.keys(Usuario.schema.obj)
        .filter(k => k !== _campo)
        .forEach(other => {
          if (other === 'data_nascimento') {
            const dataOrig = new Date(orig[other]).toISOString().split('T')[0];
            expect(up[other]).toBe(dataOrig);
          } else {
            expect(String(up[other])).toEqual(String(orig[other]));
          }
        });
    }
  );
});

describe('Rota: DELETE /usuarios/:id (deletarUsuario)', () => {
  let adminToken, userToken;
  let adminId, userId, otherUserId;

  beforeAll(async () => {
    // Conecta ao banco
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true
    });

    // Limpa coleção
    await Usuario.deleteMany({});

    // Cria três usuários: admin, user e other
    const admin = await Usuario.create({
      nome: 'AdminDel',
      email: 'admin.del@example.com',
      senha: 'Pass123!',
      perfil: 'ADMINISTRADOR',
      data_nascimento: '1990-01-01'
    });
    const user = await Usuario.create({
      nome: 'UserDel',
      email: 'user.del@example.com',
      senha: 'Pass123!',
      perfil: 'CLIENTE',
      data_nascimento: '1991-02-02'
    });
    const other = await Usuario.create({
      nome: 'OtherDel',
      email: 'other.del@example.com',
      senha: 'Pass123!',
      perfil: 'CLIENTE',
      data_nascimento: '1992-03-03'
    });

    adminId     = admin._id.toString();
    userId      = user._id.toString();
    otherUserId = other._id.toString();

    // Gera tokens JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    adminToken = jwt.sign({ id: adminId, perfil: admin.perfil }, JWT_SECRET);
    userToken  = jwt.sign({ id: userId,  perfil: user.perfil  }, JWT_SECRET);
  });

  afterAll(async () => {
    // Fecha conexão
    await mongoose.connection.close();
  });

  test('Admin pode deletar qualquer usuário', async () => {
    const res = await request(app)
      .delete(`/usuarios/${otherUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    // Confirma que o usuário realmente foi removido
    const existe = await Usuario.findById(otherUserId);
    expect(existe).toBeNull();
  });

  test('Dono pode deletar a si mesmo', async () => {
    const res = await request(app)
      .delete(`/usuarios/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);

    const existe = await Usuario.findById(userId);
    expect(existe).toBeNull();
  });

  test('Usuário comum não pode deletar outro usuário', async () => {
    const res = await request(app)
      .delete(`/usuarios/${adminId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.mensagem).toBe(erroAcessoNegado('usuário'));
  });

  describe('Autenticação (falha)', () => {
    const url = `/usuarios/${adminId}`;

    test.each([
      ['sem token', undefined],
      ['token inválido', 'Bearer abc.def.ghi']
    ])('%s → 401 Unauthorized', async (_, auth) => {
      let req = request(app).delete(url);
      if (auth) req = req.set('Authorization', auth);

      const res = await req;
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token/i);
    });
  });

  test('ID em formato inválido retorna 400', async () => {
    const invalidId = '123';
    const res = await request(app)
      .delete(`/usuarios/${invalidId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensagem).toBe(erroFormatoIdInvalido(invalidId));
  });

  test('ID inexistente retorna 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/usuarios/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensagem).toBe(erroUsuarioIdNaoEncontrado(fakeId));
  });

  describe('Rota: DELETE /usuarios (deletarTodosUsuarios)', () => {
    let adminToken, userToken;
    let adminId, user1Id, user2Id;
  
    // Conecta ao banco antes de tudo
    beforeAll(async () => {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser:    true,
        useUnifiedTopology: true
      });
    });
  
    // Fecha conexão ao final
    afterAll(async () => {
      await mongoose.connection.close();
    });
  
    // Função para preparar 3 usuários (admin, user e other) e seus tokens
    const setupUsuarios = async () => {
      await Usuario.deleteMany({});
      const admin = await Usuario.create({
        nome: 'AdminAll',
        email: 'admin.all@example.com',
        senha: 'Pass123!',
        perfil: 'ADMINISTRADOR',
        data_nascimento: '1990-01-01'
      });
      const u1 = await Usuario.create({
        nome: 'UserOne',
        email: 'user.one@example.com',
        senha: 'Pass123!',
        perfil: 'CLIENTE',
        data_nascimento: '1991-02-02'
      });
      const u2 = await Usuario.create({
        nome: 'UserTwo',
        email: 'user.two@example.com',
        senha: 'Pass123!',
        perfil: 'CLIENTE',
        data_nascimento: '1992-03-03'
      });
  
      adminId  = admin._id.toString();
      user1Id  = u1._id.toString();
      user2Id  = u2._id.toString();
  
      const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
      adminToken = jwt.sign({ id: adminId, perfil: admin.perfil }, JWT_SECRET);
      userToken  = jwt.sign({ id: user1Id, perfil: u1.perfil    }, JWT_SECRET);
    };
  
    beforeEach(async () => {
      await setupUsuarios();
    });
  
    test('Deletar todos usuários sendo administrador', async () => {
      const res = await request(app)
        .delete('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
  
      expect(res.status).toBe(200);
      expect(res.body.data.totalUsuariosDeletados).toBe(3);
  
      // Verifica que não sobrou nenhum usuário
      const count = await Usuario.countDocuments();
      expect(count).toBe(0);
    });
  
    test('Negar a permissão de deletar um usuário que não seja administrador', async () => {
      const res = await request(app)
        .delete('/usuarios')
        .set('Authorization', `Bearer ${userToken}`);
  
      expect(res.status).toBe(403);
      expect(res.body.mensagem).toBe(erroPermissaoAdmin());
  
      // Verifica que os usuários continuam existindo
      const count = await Usuario.countDocuments();
      expect(count).toBe(3);
    });
  
    test('Deletar todos usuários exceto os IDs informados', async () => {
      const res = await request(app)
        .delete('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ excecoes: [ user1Id ] });
  
      expect(res.status).toBe(200);
      // Deve deletar admin e user2, sobrando apenas user1
      expect(res.body.data.totalUsuariosDeletados).toBe(2);
  
      const remaining = await Usuario.find();
      const remainingIds = remaining.map(u => u._id.toString());
      expect(remainingIds).toEqual([ user1Id ]);
    });
  });
});
